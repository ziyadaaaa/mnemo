import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  let documentId: string | null = null;

  try {
    // ---------------------------------------------------------
    // ENVIRONMENT CHECK
    // ---------------------------------------------------------

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            'OpenAI is not configured. Add OPENAI_API_KEY to the server environment.',
        },
        { status: 500 }
      );
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        {
          error:
            'Supabase server configuration is incomplete.',
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // AUTHENTICATE USER
    // ---------------------------------------------------------

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(
                ({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                }
              );
            } catch {
              // Cookie writes can fail in some server contexts.
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'Not authenticated.',
        },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // FILE SIZE LIMIT
    // ---------------------------------------------------------

    const MAX_FILE_SIZE = 50 * 1024 * 1024;

    // ---------------------------------------------------------
    // ADMIN CLIENT
    // ---------------------------------------------------------

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // ---------------------------------------------------------
    // RESOLVE USER WORKSPACE
    // ---------------------------------------------------------

    const {
      data: membership,
      error: membershipError,
    } = await admin
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error(
        'INGEST MEMBERSHIP ERROR:',
        membershipError
      );

      return NextResponse.json(
        {
          error: membershipError.message,
          code: membershipError.code,
          details: membershipError.details,
          hint: membershipError.hint,
        },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        {
          error:
            'No workspace found for this account. Complete workspace setup first.',
        },
        { status: 404 }
      );
    }

    const workspaceId = membership.workspace_id;

    // ---------------------------------------------------------
    // VALIDATE REQUEST
    // ---------------------------------------------------------

    const contentType =
      req.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        {
          error:
            'Please upload a document using multipart/form-data.',
        },
        { status: 400 }
      );
    }

    const formData = await req.formData();

    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: 'No valid file was provided.',
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            'This file is too large. Mnemo currently supports files up to 50 MB.',
        },
        { status: 413 }
      );
    }

    const category =
      String(
        formData.get('category') || 'General'
      ).trim() || 'General';

    const title = file.name;

    const extension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase() || '';

   // Supported upload formats.
if (!['md', 'txt', 'csv', 'pdf'].includes(extension)) {
  return NextResponse.json(
    {
      error:
        'Mnemo currently supports Markdown (.md), TXT (.txt), CSV (.csv), and PDF (.pdf) uploads.',
    },
    { status: 400 }
  );
}
    // ---------------------------------------------------------
    // READ FILE
    // ---------------------------------------------------------

    const buffer = Buffer.from(
  await file.arrayBuffer()
);

let content = '';

if (extension === 'pdf') {
  try {
    const { PDFParse } = await import('pdf-parse');

    const parser = new PDFParse({
      data: buffer,
    });

    const result = await parser.getText();
    content = result.text.trim();

    await parser.destroy();
  } catch (pdfError) {
    console.error('PDF parsing failed:', pdfError);

    return NextResponse.json(
      {
        error: 'Mnemo could not read this PDF.',
      },
      { status: 400 }
    );
  }
} else {
  content = buffer
    .toString('utf-8')
    .trim();
}

    if (!content) {
      return NextResponse.json(
        {
          error:
            'The uploaded document contains no readable text.',
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // STORE ORIGINAL FILE
    // ---------------------------------------------------------

    const safeFileName = file.name.replace(
  /[^a-zA-Z0-9._-]/g,
  '-'
);

const filePath =
  `${workspaceId}/${crypto.randomUUID()}-${safeFileName}`;

    const { error: storageError } = await admin.storage
      .from('workspace-documents')
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (storageError) {
      console.error(
        'Storage upload error:',
        storageError
      );

      return NextResponse.json(
        {
          error:
            storageError.message ||
            'Could not store the original file.',
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // CREATE DOCUMENT
    // ---------------------------------------------------------

    const {
      data: document,
      error: documentError,
    } = await admin
      .from('documents')
      .insert({
        workspace_id: workspaceId,
        title,
        category,
        source_type: 'upload',
        file_path: filePath,
        status: 'processing',
      })
      .select()
      .single();

    if (documentError || !document) {
      console.error(
        'Document creation error:',
        documentError
      );

      return NextResponse.json(
        {
          error:
            documentError?.message ||
            'Could not create document.',
        },
        { status: 500 }
      );
    }

    documentId = document.id;

    // ---------------------------------------------------------
    // CHUNK DOCUMENT
    // ---------------------------------------------------------

    const chunks = chunkText(
      content,
      1200
    );

    if (!chunks.length) {
      await admin
        .from('documents')
        .update({
          status: 'error',
        })
        .eq('id', document.id)
        .eq('workspace_id', workspaceId);

      return NextResponse.json(
        {
          error:
            'The document could not be divided into chunks.',
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // CREATE DOCUMENT-LEVEL EMBEDDING
    // ---------------------------------------------------------

    const documentEmbeddingResponse =
      await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: content,
      });

    const documentEmbedding =
      documentEmbeddingResponse.data[0]?.embedding;

    if (!documentEmbedding) {
      throw new Error(
        'No document embedding was returned.'
      );
    }

    // ---------------------------------------------------------
    // CREATE MEMORY LIBRARY ENTRY
    // ---------------------------------------------------------

    const {
      data: memory,
      error: memoryError,
    } = await admin
      .from('memories')
.insert({
  workspace_id: String(workspaceId),
  document_id: document.id,
  title,
  content,
  source_type: 'upload',
  category,
  memory_type: 'knowledge',
  confidence: 1.0,
  embedding: documentEmbedding,
})
      .select('id, title')
      .single();

    if (memoryError || !memory) {
      throw new Error(
        memoryError?.message ||
          'Could not create Memory Library entry.'
      );
    }

    // ---------------------------------------------------------
    // CREATE CHUNK EMBEDDINGS + SAVE CHUNKS
    // ---------------------------------------------------------

    for (
      let index = 0;
      index < chunks.length;
      index++
    ) {
      const chunk = chunks[index];

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
      } = await admin
        .from('document_chunks')
        .insert({
          document_id: document.id,
          workspace_id: workspaceId,
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

    // ---------------------------------------------------------
    // MARK DOCUMENT AS READY
    // ---------------------------------------------------------

    const {
      error: updateError,
    } = await admin
      .from('documents')
      .update({
        status: 'indexed',
      })
      .eq('id', document.id)
      .eq('workspace_id', workspaceId);

    if (updateError) {
      throw new Error(
        `Document was indexed but could not be marked as ready: ${updateError.message}`
      );
    }

    // ---------------------------------------------------------
    // SUCCESS
    // ---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        documentId: document.id,
        memoryId: memory.id,
        title,
        chunksCount: chunks.length,
        workspaceId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      'INGESTION ERROR:',
      error
    );

    // ---------------------------------------------------------
    // MARK FAILED DOCUMENT
    // ---------------------------------------------------------

    if (documentId) {
      try {
        const admin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await admin
          .from('documents')
          .update({
            status: 'error',
          })
          .eq('id', documentId);
      } catch (statusError) {
        console.error(
          'Could not mark document as error:',
          statusError
        );
      }
    }

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Internal server error during ingestion.',
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------
// TEXT CHUNKING
// ---------------------------------------------------------

function chunkText(
  text: string,
  maxChunkLength = 1200
): string[] {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  if (!normalized) {
    return [];
  }

  const paragraphs =
    normalized.split(/\n{2,}/);

  const chunks: string[] = [];

  let current = '';

  for (const paragraph of paragraphs) {
    const clean = paragraph.trim();

    if (!clean) continue;

    const combined = current
      ? `${current}\n\n${clean}`
      : clean;

    if (
      combined.length <=
      maxChunkLength
    ) {
      current = combined;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = '';
    }

    if (
      clean.length <=
      maxChunkLength
    ) {
      current = clean;
      continue;
    }

    for (
      let start = 0;
      start < clean.length;
      start += maxChunkLength
    ) {
      chunks.push(
        clean.slice(
          start,
          start + maxChunkLength
        )
      );
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.filter(Boolean);
}