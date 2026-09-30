import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NORTHSTAR_WORKSPACE_ID =
  'df2de66f-5d94-4b0e-b758-dba8e91f0186';

export async function POST(req: Request) {
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

    const body = await req.json();

    const query =
      typeof body.query === 'string'
        ? body.query.trim()
        : '';

    const workspaceId =
      typeof body.workspaceId === 'string' &&
      body.workspaceId.trim()
        ? body.workspaceId
        : NORTHSTAR_WORKSPACE_ID;

    if (!query) {
      return NextResponse.json(
        {
          error: 'Query is required.',
        },
        { status: 400 }
      );
    }

    const embeddingResponse =
      await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });

    const queryEmbedding =
      embeddingResponse.data[0]?.embedding;

    if (!queryEmbedding) {
      throw new Error(
        'Could not create an embedding for the question.'
      );
    }

    const { data: matches, error: matchError } =
      await supabase.rpc(
        'match_document_chunks',
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.25,
          match_count: 8,
          workspace_filter: workspaceId,
        }
      );

    if (matchError) {
      console.error(
        'Vector search error:',
        matchError
      );

      return NextResponse.json(
        {
          error:
            `Knowledge search failed: ${matchError.message}`,
        },
        { status: 500 }
      );
    }

    const contextChunks = matches || [];

    const contextText = contextChunks
      .map(
        (match: any) =>
          `Source: ${match.title || 'Untitled document'}\n` +
          `Category: ${match.category || 'General'}\n` +
          `Content:\n${match.content || ''}`
      )
      .join('\n\n---\n\n');

    const systemPrompt = `
You are Mnemo, an AI business-memory assistant.

Your job is to answer questions using the company's stored knowledge.

IMPORTANT RULES:
1. Use ONLY the company knowledge provided in the context below.
2. Do not invent company facts.
3. If the answer is not supported by the context, say clearly that you could not find enough information in the company's memory.
4. When useful, mention the source document name.
5. Give a direct, useful answer rather than dumping the entire context.
6. Treat the provided company documents as the source of truth for this workspace.

COMPANY KNOWLEDGE:
${contextText || 'No matching company knowledge was found.'}
`;

    const completion =
      await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.1,
      });

    const answer =
      completion.choices[0]?.message?.content ||
      'I could not generate an answer from the available company memory.';

    const citations = contextChunks.map(
      (match: any) => ({
        id:
          match.id ||
          Math.random().toString(),
        title:
          match.title ||
          'Untitled Source',
        type:
          match.category ||
          'Document',
        source:
          match.source_type ||
          'Company Memory',
        snippet:
          match.content
            ? match.content.length > 180
              ? `${match.content.substring(0, 180)}...`
              : match.content
            : '',
        similarity:
          typeof match.similarity === 'number'
            ? match.similarity
            : null,
      })
    );

    return NextResponse.json({
      answer,
      citations,
    });
  } catch (error: any) {
    console.error(
      'Ask API error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Internal server error.',
      },
      { status: 500 }
    );
  }
}