import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ExtractedMemory = {
  memory_type:
    | 'knowledge'
    | 'decision'
    | 'event'
    | 'change'
    | 'note'
    | 'relationship';

  title: string;
  content: string;
  confidence: number;
  occurred_at: string | null;
  relationship_type?: string | null;

  metadata: {
    people: string[];
    teams: string[];
    projects: string[];
    entities: string[];
    previous_value: string | null;
    new_value: string | null;
    reason: string | null;
  };
};

export async function extractMemories(
  content: string,
  documentTitle: string
): Promise<ExtractedMemory[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: {
      type: 'json_object',
    },
    messages: [
      {
        role: 'system',
        content: `
You are Mnemo's company-memory extraction engine.

Your job is to identify durable pieces of company knowledge from a source document.

Extract only information that is explicitly supported by the document.

Do not invent people, dates, decisions, projects, reasons, or relationships.

Focus especially on:

1. knowledge
General facts that are useful to remember.

2. decisions
A decision that was made or explicitly approved.

3. events
Something that happened.

4. changes
Something that changed from one state to another.

5. notes
Important observations or context that do not fit the other categories.

6. relationships

An explicit relationship between people, teams, projects, customers, products, decisions, events, or other entities.

For relationship memories:
- Only extract relationships explicitly supported by the document.
- Describe what is connected to what.
- Use relationship_type to describe the relationship briefly, such as:
  "caused_by"
  "involves"
  "affects"
  "owned_by"
  "depends_on"
  "replaces"
  "related_to"
- Do not infer relationships that are not explicitly supported.

For changes, capture previous_value and new_value when the document provides them.

For every memory:
- Give it a concise useful title.
- Write a self-contained explanation.
- Give a confidence from 0 to 1 based only on how clearly the document supports it.
- Include an occurred_at date/time when the document explicitly states a date for the memory.
- If the document explicitly says "August 21, 2026", the occurred_at value must be "2026-08-21T00:00:00Z".
- Never invent a year.
- If a date is written without a year, use the year only when the document itself clearly establishes that year.
- If the year cannot be established, use null.
- Preserve the date that belongs to the memory being extracted.
- Do not use the current date, an arbitrary year, or a year from unrelated context.
Return JSON in exactly this shape:

{
  "memories": [
    {
      "memory_type": "knowledge",
"title": "string",
"content": "string",
"confidence": 0.95,
"occurred_at": null,
"relationship_type": null,
"metadata": {
        "people": [],
        "teams": [],
        "projects": [],
        "entities": [],
        "previous_value": null,
        "new_value": null,
        "reason": null
      }
    }
  ]
}

Prefer a small number of meaningful memories over many trivial ones.
        `.trim(),
      },
      {
        role: 'user',
        content: `
Document title:
${documentTitle}

Document content:
${content}
        `.trim(),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;

  if (!raw) {
    throw new Error('Memory extraction returned no result.');
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Memory extraction returned invalid JSON.');
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray(
      (parsed as { memories?: unknown }).memories
    )
  ) {
    throw new Error(
      'Memory extraction returned an invalid structure.'
    );
  }

  const normalizeOccurredAt = (
  occurredAt: unknown,
  sourceContent: string
): string | null => {
  if (typeof occurredAt !== 'string' || !occurredAt) {
    return null;
  }

  const extractedDate = new Date(occurredAt);

  if (Number.isNaN(extractedDate.getTime())) {
    return null;
  }

  const month = extractedDate.toLocaleString('en-US', {
    month: 'long',
    timeZone: 'UTC',
  });

  const day = extractedDate.getUTCDate();

  const datePattern = new RegExp(
    `${month}\\s+${day},?\\s+(\\d{4})`,
    'i'
  );

  const match = sourceContent.match(datePattern);

  if (!match) {
    return null;
  }

  return `${match[1]}-${String(
    extractedDate.getUTCMonth() + 1
  ).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00Z`;
};
  const memories = (
    parsed as { memories: unknown[] }
  ).memories;

  return memories
    .filter(
      (memory): memory is ExtractedMemory =>
        Boolean(
          memory &&
            typeof memory === 'object' &&
            typeof (memory as ExtractedMemory).title ===
              'string' &&
            typeof (memory as ExtractedMemory).content ===
              'string' &&
            typeof (memory as ExtractedMemory).memory_type ===
              'string'
        )
    )
    .map((memory) => ({
      memory_type: memory.memory_type,
      title: memory.title.trim(),
      content: memory.content.trim(),
      confidence: Math.max(
        0,
        Math.min(1, Number(memory.confidence) || 0)
      ),
    occurred_at: normalizeOccurredAt(
  memory.occurred_at,
  content
),
relationship_type:
  typeof memory.relationship_type === 'string'
    ? memory.relationship_type.trim() || null
    : null,
metadata: {
        people: memory.metadata?.people || [],
        teams: memory.metadata?.teams || [],
        projects: memory.metadata?.projects || [],
        entities: memory.metadata?.entities || [],
        previous_value:
          memory.metadata?.previous_value || null,
        new_value:
          memory.metadata?.new_value || null,
        reason: memory.metadata?.reason || null,
      },
    }));
}