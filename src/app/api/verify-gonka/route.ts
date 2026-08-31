import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  const apiKey = process.env.GONKA_API_KEY;

  if (!apiKey || apiKey === 'your_gonka_api_key_here') {
    return NextResponse.json(
      { error: 'GONKA_API_KEY is not configured in .env.local' },
      { status: 500 }
    );
  }

  try {
    const openai = new OpenAI({
      baseURL: 'https://api.gonkarouter.io/v1',
      apiKey: apiKey,
    });

    // We use deepseek-ai/DeepSeek-V4-Flash-0731 as specified by the user's provider-prefixed model list
    const response = await openai.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V4-Flash-0731',
      messages: [
        { role: 'user', content: 'Say hello and confirm you are Gonka' }
      ],
    });

    const text = response.choices[0]?.message?.content || '';
    const requestId = response.id;

    return NextResponse.json({ text, requestId });
  } catch (error: any) {
    console.error('Error verifying Gonka:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error during verification' },
      { status: 500 }
    );
  }
}
