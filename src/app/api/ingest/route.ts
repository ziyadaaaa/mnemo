import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, workspaceId, sourceType } = body;

    if (!content || !workspaceId) {
      return NextResponse.json(
        { error: 'Content and workspaceId are required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API Key on server.' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    // Sanitize and truncate content to avoid token overflow limits on embedding
    const cleanContent = content.trim().slice(0, 8000);

    // 1. Generate vector embedding using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: cleanContent,
    });
    const vectorEmbedding = embeddingResponse.data[0].embedding;

    // 2. Insert into Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase environment variables.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await supabase
      .from('memories')
      .insert([
        {
          workspace_id: workspaceId,
          content: cleanContent,
          source_type: sourceType || 'document',
          embedding: vectorEmbedding,
          created_at: new Date().toISOString(),
        }
      ])
      .select();

    if (error) {
      console.error('Supabase write error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error('Ingestion route server crash:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
