import { NextResponse } from 'next/server';
import OpenAI from 'openai';

async function safeCall(
  openai: OpenAI,
  model: string,
  messages: any[],
  temperature: number,
  fallbackModel?: string
) {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: 1000,
    });
    return { response, modelUsed: model };
  } catch (err: any) {
    console.warn(`Failed call with model ${model}:`, err.message);
    if (fallbackModel) {
      console.log(`Retrying call with fallback model ${fallbackModel}`);
      const response = await openai.chat.completions.create({
        model: fallbackModel,
        messages,
        temperature,
        max_tokens: 1000,
      });
      return { response, modelUsed: fallbackModel };
    }
    throw err;
  }
}

function cleanAndParseJSON(text: string) {
  let cleaned = text.trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.articleText) {
      return NextResponse.json(
        { error: 'articleText is required' },
        { status: 400 }
      );
    }

    const { articleText, language } = body;
    const apiKey = process.env.GONKA_API_KEY;
    if (!apiKey || apiKey === 'your_gonka_api_key_here') {
      return NextResponse.json(
        { error: 'GONKA_API_KEY is not configured in .env.local' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      baseURL: 'https://api.gonkarouter.io/v1',
      apiKey: apiKey,
    });

    const targetLanguage = language || 'English';

    // Model 1 (Extractor & Context Analyst)
    const model1Promise = safeCall(
      openai,
      'deepseek-ai/DeepSeek-V4-Flash-0731',
      [
        {
          role: 'system',
          content: `You are a helpful content extractor and context analyst. Your job is to analyze user text (e.g. news article, suspicious SMS, WhatsApp forward, job/investment pitch, or rumor) and categorize it.
You MUST write all values in the JSON object (title, keyPoints, impactOrRiskAssessment, actionableAdvice) strictly and entirely in the ${targetLanguage} language. Under no circumstance should you use any other language.
You MUST respond ONLY with a valid JSON object in the following format:
{
  "title": "A simplified title or subject description of the text in ${targetLanguage}",
  "contentType": "NEWS_POLICY", // Must be EXACTLY one of: 'NEWS_POLICY' | 'SCAM_PHISHING' | 'JOB_INVESTMENT' | 'VIRAL_RUMOR'
  "keyPoints": [
    "Key takeaway point 1 in ${targetLanguage}",
    "Key takeaway point 2 in ${targetLanguage}",
    "Key takeaway point 3 in ${targetLanguage}"
  ],
  "impactOrRiskAssessment": "1-2 sentences explaining either the everyday citizen's daily life/wallet impact (for NEWS_POLICY / VIRAL_RUMOR) OR the security/identity/financial risk to the user (for SCAM_PHISHING / JOB_INVESTMENT) in ${targetLanguage}.",
  "actionableAdvice": "1-2 sentences outlining either the recommended civic/policy action steps (for NEWS_POLICY / VIRAL_RUMOR) OR safety/precaution instructions (for SCAM_PHISHING / JOB_INVESTMENT) in ${targetLanguage}.",
  "preliminaryScore": 85 // A number between 0 and 100 representing the factual credibility or legitimacy (100 means highly legitimate/truthful, 0 means completely fake/malicious/scam).
}

IMPORTANT: Classify, translate and output every string in the JSON object strictly into ${targetLanguage}.`
        },
        {
          role: 'user',
          content: `Analyze this content and output the JSON entirely in ${targetLanguage}:\n\n${articleText}`
        }
      ],
      0.3
    );

    // Model 2 (Fact & Credibility Auditor)
    const model2Promise = safeCall(
      openai,
      'moonshotai/Kimi-K2.6',
      [
        {
          role: 'system',
          content: `You are an expert fact-checker, media literacy analyst, and cybersecurity/anti-fraud auditor. Your job is to independently audit the text for factual plausibility, missing official citations, manipulative urgency, or financial red flags.
You MUST write the "credibilityAnalysis" value strictly and entirely in the ${targetLanguage} language. Under no circumstance should you use any other language.
You MUST respond ONLY with a valid JSON object in the following format:
{
  "independentScore": 80, // A number between 0 and 100 representing the factual consistency and legitimacy. 100 means highly credible/safe, 0 means high risk/fabricated/malicious.
  "scoreLabel": "SAFE", // Must be EXACTLY one of: 'VERIFIED' | 'SAFE' | 'MIXED' | 'SUSPICIOUS' | 'HIGH RISK'
  "credibilityAnalysis": "A 1-sentence concise explanation of why this score was given, noting sources, potential bias, manipulative urgency, or financial red flags in ${targetLanguage}.",
  "redFlags": [
    "Red flag detection string 1 (translated, keep short)",
    "Red flag detection string 2 (translated, keep short)"
  ]
}

IMPORTANT: Analyze the content, translate and output the credibilityAnalysis strictly in ${targetLanguage}.`
        },
        {
          role: 'user',
          content: `Evaluate the factual consistency and source credibility of this article. Output the reasoning trace entirely in ${targetLanguage}:\n\n${articleText}`
        }
      ],
      0.2,
      'deepseek-ai/DeepSeek-V4-Flash-0731' // Fallback to DeepSeek if Kimi is unavailable
    );

    // Await parallel promises
    const [res1, res2] = await Promise.all([model1Promise, model2Promise]);

    const res1Text = res1.response.choices[0]?.message?.content || '';
    const res2Text = res2.response.choices[0]?.message?.content || '';

    let model1Data: any = {};
    let model2Data: any = {};

    try {
      model1Data = cleanAndParseJSON(res1Text);
    } catch (e) {
      console.error('Failed to parse Model 1 output as JSON:', res1Text);
      model1Data = {
        title: 'Universal Analysis',
        contentType: 'NEWS_POLICY',
        keyPoints: [
          'Could not parse analysis details correctly.',
          'Please check the raw input content.',
          'Try processing again.',
        ],
        impactOrRiskAssessment: 'Unable to analyze impact due to parsing failure.',
        actionableAdvice: 'Try processing again.',
        preliminaryScore: 50,
      };
    }

    try {
      model2Data = cleanAndParseJSON(res2Text);
    } catch (e) {
      console.error('Failed to parse Model 2 output as JSON:', res2Text);
      model2Data = {
        independentScore: 50,
        scoreLabel: 'MIXED',
        credibilityAnalysis: 'Analysis trace completed, but JSON details could not be parsed.',
        redFlags: ['Parsing error occurred during auditing.'],
      };
    }

    // Ensure array structure is preserved
    if (!Array.isArray(model1Data.keyPoints)) {
      model1Data.keyPoints = ['Could not extract key points.'];
    }
    if (!Array.isArray(model2Data.redFlags)) {
      model2Data.redFlags = [];
    }

    // Consensus Logic Engine
    const preliminary = typeof model1Data.preliminaryScore === 'number' ? model1Data.preliminaryScore : 50;
    const independent = typeof model2Data.independentScore === 'number' ? model2Data.independentScore : 50;
    
    const finalTruthScore = Math.round((preliminary + independent) / 2);
    const discrepancyDelta = Math.abs(preliminary - independent);
    const consensusNote =
      discrepancyDelta > 25
        ? 'Models exhibited divergence on claim certainty; human verification advised'
        : '';

    return NextResponse.json({
      summary: {
        title: model1Data.title || 'Direct Input Analysis',
        contentType: model1Data.contentType || 'NEWS_POLICY',
        summary_points: model1Data.keyPoints.slice(0, 3),
        citizen_impact: model1Data.impactOrRiskAssessment || '',
        actionable_advice: model1Data.actionableAdvice || '',
        category: model1Data.contentType || 'NEWS_POLICY',
      },
      verification: {
        truth_score: finalTruthScore,
        independent_score: independent,
        score_label: model2Data.scoreLabel || 'MIXED',
        reasoning_trace: model2Data.credibilityAnalysis || '',
        red_flags: model2Data.redFlags || [],
        discrepancy_delta: discrepancyDelta,
        consensus_note: consensusNote,
      },
      model1RequestId: res1.response.id,
      model2RequestId: res2.response.id,
      model1Used: res1.modelUsed,
      model2Used: res2.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in process-news route:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing consensus pipeline' },
      { status: 500 }
    );
  }
}
