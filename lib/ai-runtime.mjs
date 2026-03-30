export function buildPrompt(payload) {
  const resultLines = (payload.topResults || [])
    .map(
      (result, index) =>
        `${index + 1}. ${result.title} | ${result.mediaType} | ${result.score}/100 | ${result.verdict} | ${result.description}`,
    )
    .join('\n');

  return [
    'You are assisting with a media search analyst evaluation.',
    'Write a concise analyst note in plain English with these sections:',
    '1. Query read',
    '2. Why the leading result wins',
    '3. Nearby ambiguity or risk',
    '4. Recommended final label',
    '',
    `Query: ${payload.query}`,
    `Market: ${payload.market}`,
    `Media type: ${payload.mediaType}`,
    `Existing analyst note: ${payload.analystNote || 'None provided'}`,
    '',
    'Top ranked candidates:',
    resultLines,
    '',
    'Keep it under 170 words. Sound like an actual human reviewer, not marketing copy.',
  ].join('\n');
}

function extractOpenAIText(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text;
  }

  if (!Array.isArray(data.output)) {
    return 'No response text returned.';
  }

  const chunks = [];
  for (const item of data.output) {
    if (!Array.isArray(item.content)) {
      continue;
    }

    for (const contentItem of item.content) {
      if (contentItem.type === 'output_text' && typeof contentItem.text === 'string') {
        chunks.push(contentItem.text);
      }
    }
  }

  return chunks.join('\n').trim() || 'No response text returned.';
}

async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const models = Array.from(new Set([process.env.OPENAI_MODEL, 'gpt-4o', 'gpt-4-turbo'].filter(Boolean)));

  for (const model of models) {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: prompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const missingModel = response.status === 403 && errorText.includes('model_not_found');
      if (missingModel) {
        continue;
      }

      throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return {
      provider: 'openai',
      model,
      text: extractOpenAIText(data),
    };
  }

  throw new Error('OpenAI request failed: no accessible fallback model was available for this project');
}

async function callAnthropic(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 320,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text =
    Array.isArray(data.content) && data.content.length
      ? data.content
          .filter((item) => item.type === 'text')
          .map((item) => item.text)
          .join('\n')
      : 'No response text returned.';

  return {
    provider: 'anthropic',
    model,
    text,
  };
}

export async function generateAnalysis(payload) {
  const prompt = buildPrompt(payload);
  const provider = payload.provider === 'anthropic' ? 'anthropic' : 'openai';
  return provider === 'anthropic' ? callAnthropic(prompt) : callOpenAI(prompt);
}

export function getProviderHealth() {
  return {
    openai: Boolean(process.env.OPENAI_API_KEY),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
  };
}
