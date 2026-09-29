import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const NORTHSTAR_WORKSPACE_ID =
  'df2de66f-5d94-4b0e-b758-dba8e91f0186';

const NORTHSTAR_FOLDER = path.join(
  process.cwd(),
  'northstar-labs-demo'
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function chunkText(text, maxChunkLength = 1200) {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  if (!normalized) {
    return [];
  }

  const paragraphs = normalized.split(/\n{2,}/);
  const chunks = [];
  let current = '';

  for (const paragraph of paragraphs) {
    const clean = paragraph.trim();

    if (!clean) {
      continue;
    }

    const combined = current
      ? `${current}\n\n${clean}`
      : clean;

    if (combined.length <= maxChunkLength) {
      current = combined;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = '';
    }

    if (clean.length <= maxChunkLength) {
      current = clean;
      continue;
    }

    for (
      let start = 0;
      start < clean.length;
      start += maxChunkLength
    ) {
      chunks.push(
        clean.slice(start, start + maxChunkLength)
      );
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

async function main() {
  console.log(
    'Starting Northstar Labs ingestion...\n'
  );

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is missing.'
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is missing.'
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is missing.'
    );
  }

  if (!fs.existsSync(NORTHSTAR_FOLDER)) {
    throw new Error(
      `Northstar folder not found: ${NORTHSTAR_FOLDER}`
    );
  }

  const files = fs
    .readdirSync(NORTHSTAR_FOLDER)
    .filter(
      (file) =>
        file.endsWith('.md') &&
        file !== 'README.md'
    )
    .sort();

  console.log(
    `Found ${files.length} Northstar documents.\n`
  );

  if (files.length === 0) {
    throw new Error(
      'No Northstar Markdown documents were found.'
    );
  }

  for (const filename of files) {
    console.log(`Processing: ${filename}`);

    const filePath = path.join(
      NORTHSTAR_FOLDER,
      filename
    );

    const content = fs
      .readFileSync(filePath, 'utf8')
      .trim();

    if (!content) {
      console.log(
        '  Skipped: empty file.\n'
      );
      continue;
    }

    const {
      data: existingDocuments,
      error: existingError,
    } = await supabase
      .from('documents')
      .select('id,status')
      .eq(
        'workspace_id',
        NORTHSTAR_WORKSPACE_ID
      )
      .eq('title', filename);

    if (existingError) {
      throw new Error(
        `Could not check existing document: ${existingError.message}`
      );
    }

    const alreadyIndexed =
      existingDocuments?.some(
        (document) =>
          document.status === 'indexed'
      );

    if (alreadyIndexed) {
      console.log(
        '  Already indexed. Skipping.\n'
      );
      continue;
    }

    if (existingDocuments?.length) {
      for (const existing of existingDocuments) {
        const { error: deleteChunksError } =
          await supabase
            .from('document_chunks')
            .delete()
            .eq(
              'document_id',
              existing.id
            );

        if (deleteChunksError) {
          throw new Error(
            `Could not clean old chunks: ${deleteChunksError.message}`
          );
        }

        const { error: deleteDocumentError } =
          await supabase
            .from('documents')
            .delete()
            .eq(
              'id',
              existing.id
            );

        if (deleteDocumentError) {
          throw new Error(
            `Could not clean old document: ${deleteDocumentError.message}`
          );
        }
      }
    }

    const {
      data: document,
      error: documentError,
    } = await supabase
      .from('documents')
      .insert({
        workspace_id:
          NORTHSTAR_WORKSPACE_ID,
        title: filename,
        category: 'Northstar Labs',
        source_type: 'upload',
        status: 'processing',
      })
      .select()
      .single();

    if (documentError) {
              throw new Error(
        `Could not create document: ${documentError.message}`
      );
    }

    const chunks = chunkText(content);

    console.log(
      `  Created document with ${chunks.length} chunks.`
    );

    for (
      let index = 0;
      index < chunks.length;
      index++
    ) {
      const chunk = chunks[index];

      console.log(
        `  Embedding chunk ${index + 1}/${chunks.length}...`
      );

      const embeddingResponse =
        await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunk,
        });

      const embedding =
        embeddingResponse.data[0]?.embedding;

      if (!embedding) {
        throw new Error(
          `No embedding returned for chunk ${index + 1}.`
        );
      }

      const {
        error: chunkError,
      } = await supabase
        .from('document_chunks')
        .insert({
          document_id: document.id,
          workspace_id:
            NORTHSTAR_WORKSPACE_ID,
          content: chunk,
          chunk_index: index,
          embedding,
        });

      if (chunkError) {
        throw new Error(
          `Could not save chunk ${index + 1}: ${chunkError.message}`
        );
      }
    }

    const {
      error: updateError,
    } = await supabase
      .from('documents')
      .update({
        status: 'indexed',
      })
      .eq('id', document.id);

    if (updateError) {
      throw new Error(
        `Could not mark document as indexed: ${updateError.message}`
      );
    }

    console.log(
      '  ✓ Indexed successfully.\n'
    );
  }

  console.log(
    '🎉 Northstar Labs ingestion complete!'
  );
}

main().catch((error) => {
  console.error(
    '\n❌ Northstar ingestion failed:'
  );

  console.error(
    error?.message || error
  );

  process.exit(1);
});