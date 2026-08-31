import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GONKA_API_KEY;

  if (!apiKey || apiKey === 'your_gonka_api_key_here') {
    return NextResponse.json(
      { error: 'GONKA_API_KEY is not configured in .env.local' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch('https://api.gonkarouter.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'moonshotai/Kimi-K2.6',
        messages: [
          { role: 'system', content: 'You are Kimi. Respond in exactly one short sentence confirming your identity.' },
          { role: 'user', content: 'Say hello and confirm you are Kimi' }
        ],
        temperature: 0.7,
        max_tokens: 30,
        frequency_penalty: 1.5
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText || 'Verification failed' }, { status: res.status });
    }

    const data = await res.json();
    let text = data.choices[0]?.message?.content || '';

    // Programmatic deduplication of repeated sentences
    text = text.trim();
    if (text) {
      const sentences = text.split(/(?<=\.|\?|\!)\s*/);
      const uniqueSentences = Array.from(new Set(sentences));
      text = uniqueSentences.join(' ').trim();
    }

    const requestId = res.headers.get('x-request-id') || data.id || 'unavailable';

    return NextResponse.json({ text, requestId });
  } catch (error: any) {
    console.error('Error verifying Gonka (Kimi):', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error during verification' },
      { status: 500 }
    );
  }
}
