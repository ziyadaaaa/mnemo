import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
);

export async function POST(req: Request) {
  let memoryId: string | null = null;

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            'OpenAI is not configured. Add OPENAI_API_KEY to the server environment.',
        },
        { status: 500 }
      );
    }

    let title = '';
    let content = '';
    let category = 'General';
    let fileType = 'Text';

    const contentType = req.headers.get('content-type') || '';

    // ---------------------------------------------------------
    // FILE INGESTION
    // ---------------------------------------------------------

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();

      const file = formData.get('file');

      category =
        (formData.get('category') as string) ||
        'General';

      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: 'No valid file was provided.' },
          { status: 400 }
        );
      }

      title = file.name;

      const extension =
        file.name.split('.').pop()?.toLowerCase() || '';

      fileType = extension.toUpperCase() || 'FILE';

      const buffer = Buffer.from(await file.arrayBuffer());

      content = await extractFileText(
        buffer,
        file.name
      );
    }

    // ---------------------------------------------------------
    // MANUAL TEXT INGESTION
    // ---------------------------------------------------------

    else {
      const body = await req.json();

      title = String(body.title || '').trim();
      content = String(body.content || '').trim();
      category = body.category || 'General';
      fileType = body.type || 'Text';
    }

    // ---------------------------------------------------------
    // VALIDATE EXTRACTED CONTENT
    // ---------------------------------------------------------

    if (!title) {
      return NextResponse.json(
        { error: 'A memory title is required.' },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        {
          error:
            'No readable text was found in this file. The document may be scanned, image-only, empty, or unsupported.',
        },
        { status: 400 }
      );
    }

    content = content.trim();

    // ---------------------------------------------------------
    // CREATE MEMORY RECORD
    // ---------------------------------------------------------

    const { data: memoryData, error: memoryError } =
      await supabase
        .from('memories')
        .insert({
          title,
          category,
          type: fileType,
          source: `Direct Ingestion (${fileType})`,
          content,
          status: 'processing',
          dateAdded: new Date()
            .toISOString()
            .split('T')[0],
        })
        .select()
        .single();

    if (memoryError) {
      console.error(
        'Supabase memory insert error:',
        memoryError
      );

      return NextResponse.json(
        {
          error: `Database error: ${memoryError.message}`,
        },
        { status: 500 }
      );
    }

    memoryId = memoryData.id;

    // ---------------------------------------------------------
    // CHUNK CONTENT
    // ---------------------------------------------------------

    const chunks = chunkText(content, 500);

    if (chunks.length === 0) {
      throw new Error(
        'The document could not be divided into readable text chunks.'
      );
    }

    // ---------------------------------------------------------
    // CREATE EMBEDDINGS + STORE CHUNKS
    // ---------------------------------------------------------

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const embeddingResponse =
        await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunk,
        });

      const embedding =
        embeddingResponse.data[0]?.embedding;

      if (!embedding) {
        throw new Error(
          `OpenAI did not return an embedding for chunk ${i + 1}.`
        );
      }

      const { error: chunkError } =
        await supabase
          .from('memory_chunks')
          .insert({
            memory_id: memoryId,
            chunk_index: i,
            content: chunk,
            embedding: JSON.stringify(embedding),
          });

      if (chunkError) {
        throw new Error(
          `Failed to store memory chunk ${i + 1}: ${chunkError.message}`
        );
      }
    }

    // ---------------------------------------------------------
    // MARK MEMORY AS INDEXED
    // ---------------------------------------------------------

    const { error: updateError } =
      await supabase
        .from('memories')
        .update({
          status: 'indexed',
        })
        .eq('id', memoryId);

    if (updateError) {
      console.error(
        'Memory status update error:',
        updateError
      );
    }

    return NextResponse.json({
      success: true,
      memoryId,
      chunksCount: chunks.length,
      title,
      type: fileType,
    });
  } catch (err: any) {
    console.error(
      'Ingestion & Embedding Error:',
      err
    );

    // Mark failed memory as error instead of leaving it
    // pretending to be successfully indexed.
    if (memoryId) {
      await supabase
        .from('memories')
        .update({
          status: 'error',
        })
        .eq('id', memoryId);
    }

    let message =
      err?.message ||
      'Internal server error during ingestion.';

    // Make OpenAI quota/billing problems understandable
    if (
      message.toLowerCase().includes('quota') ||
      message.toLowerCase().includes('billing') ||
      message.toLowerCase().includes('insufficient_quota')
    ) {
      message =
        'OpenAI API billing or quota is not available. The document was read, but Mnemo could not create its AI embeddings.';
    }

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------
// FILE TEXT EXTRACTION
// ---------------------------------------------------------

async function extractFileText(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const extension =
    filename.split('.').pop()?.toLowerCase() || '';

  switch (extension) {
    case 'pdf': {
      const parser = new PDFParse({
        data: buffer,
      });

      try {
        const result = await parser.getText();

        return result.text || '';
      } finally {
        await parser.destroy();
      }
    }

    case 'docx': {
      const result =
        await mammoth.extractRawText({
          buffer,
        });

      return result.value || '';
    }

    case 'xlsx': {
      return extractSpreadsheetText(buffer);
    }

    case 'csv':
    case 'txt':
    case 'md': {
      return buffer.toString('utf-8');
    }

    default:
      throw new Error(
        `Unsupported file type: .${extension}`
      );
  }
}

// ---------------------------------------------------------
// XLSX EXTRACTION
// ---------------------------------------------------------

function extractSpreadsheetText(
  buffer: Buffer
): string {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
  });

  return workbook.SheetNames
    .map((sheetName) => {
      const sheet =
        workbook.Sheets[sheetName];

      const csv =
        XLSX.utils.sheet_to_csv(sheet);

      return `Sheet: ${sheetName}\n${csv}`;
    })
    .join('\n\n');
}

// ---------------------------------------------------------
// TEXT CHUNKING
// ---------------------------------------------------------

function chunkText(
  text: string,
  maxChunkLength = 500
): string[] {
  if (!text.trim()) {
    return [];
  }

  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  const sentences = normalized.split(
    /(?<=[.!?])\s+/
  );

  const chunks: string[] = [];

  let currentChunk = '';

  for (const sentence of sentences) {
    const combined = currentChunk
      ? `${currentChunk} ${sentence}`
      : sentence;

    if (combined.length > maxChunkLength) {
      if (currentChunk) {
        chunks.push(
          currentChunk.trim()
        );
      }

      // Handle a single very long sentence
      if (sentence.length > maxChunkLength) {
        for (
          let start = 0;
          start < sentence.length;
          start += maxChunkLength
        ) {
          chunks.push(
            sentence
              .slice(
                start,
                start + maxChunkLength
              )
              .trim()
          );
        }

        currentChunk = '';
      } else {
        currentChunk = sentence;
      }
    } else {
      currentChunk = combined;
    }
  }

  if (currentChunk) {
    chunks.push(
      currentChunk.trim()
    );
  }

  return chunks.filter(Boolean);
}