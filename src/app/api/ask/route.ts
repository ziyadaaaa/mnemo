import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 1. Generate embedding for the user query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query.trim(),
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. Perform vector similarity search using Supabase RPC
    const { data: matches, error: matchError } = await supabase.rpc('match_memories', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: 4,
    });

    if (matchError) {
      console.error('Vector search error:', matchError);
      // Fallback if RPC function is not yet created
    }

    const contextChunks = matches || [];
    const contextText = contextChunks
      .map((m: any) => `Source: ${m.title}\nContent: ${m.content}`)
      .join('\n\n---\n\n');

    // 3. Generate grounded answer using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Mnemo, an enterprise knowledge assistant. Answer the user's question using ONLY the provided company memory context below. If the answer cannot be found in the context, state clearly that you couldn't find enough information in the company's memory.\n\nContext:\n${contextText}`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.1,
    });

    const answer = completion.choices[0].message.content;

    // 4. Map citations
    const citations = contextChunks.map((m: any) => ({
      id: m.id || Math.random().toString(),
      title: m.title || 'Untitled Source',
      type: m.type || 'Document',
      source: m.source || 'Direct Ingestion',
      snippet: m.content ? m.content.substring(0, 180) + '...' : '',
    }));

    return NextResponse.json({ answer, citations });
  } catch (err: any) {
    console.error('Ask API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
