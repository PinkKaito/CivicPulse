import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const apiKey = process.env.GONKA_API_KEY;

  if (!apiKey || apiKey === 'your_gonka_api_key_here') {
    return NextResponse.json(
      { error: 'GONKA_API_KEY is not configured in .env.local' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const targetLanguage = searchParams.get('language') || 'English';

  try {
    const res = await fetch('https://api.gonkarouter.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V4-Flash-0731',
        messages: [
          { role: 'system', content: `You are Gonka. Respond in exactly one short sentence confirming your identity in ${targetLanguage}.` },
          { role: 'user', content: `Say hello and confirm you are Gonka in ${targetLanguage}` }
        ],
        temperature: 0.3,
        max_tokens: 250,
        frequency_penalty: 0.5
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText || 'Verification failed' }, { status: res.status });
    }

    const data = await res.json();
    let text = data.choices[0]?.message?.content || '';
    
    // Robustly strip <think>...</think> reasoning blocks including unclosed <think> tags
    text = text.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').trim();
    
    // Fallback if empty after stripping thinking blocks
    if (!text) {
      text = 'Hello! I am Gonka Dual-AI Consensus Router.';
    }

    // Programmatic deduplication of repeated sentences
    if (text) {
      const sentences = text.split(/(?<=\.|\?|\!)\s*/);
      const uniqueSentences = Array.from(new Set(sentences));
      text = uniqueSentences.join(' ').trim();
    }

    const requestId = res.headers.get('x-request-id') || data.id || 'unavailable';

    return NextResponse.json({ text, requestId });
  } catch (error: any) {
    console.error('Error verifying Gonka:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error during verification' },
      { status: 500 }
    );
  }
}
