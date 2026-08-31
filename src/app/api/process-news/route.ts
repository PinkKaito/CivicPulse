import { NextResponse } from 'next/server';
import OpenAI from 'openai';

async function safeCall(
  openai: OpenAI,
  model: string,
  messages: any[],
  temperature: number,
  fallbackModel?: string
) {
  const runCall = async (targetModel: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 20000); // 20-second timeout

    try {
      const response = await openai.chat.completions.create(
        {
          model: targetModel,
          messages,
          temperature,
          max_tokens: 1500, // Bumped max_tokens to 1500 for CJK density support
        },
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        throw new Error(`Request timed out after 20 seconds on model ${targetModel}`);
      }
      throw err;
    }
  };

  try {
    const response = await runCall(model);
    return { response, modelUsed: model, usedFallback: false };
  } catch (err: any) {
    console.warn(`Failed call with model ${model}:`, err.message);
    if (fallbackModel) {
      console.log(`Retrying call with fallback model ${fallbackModel}`);
      try {
        const response = await runCall(fallbackModel);
        return { response, modelUsed: fallbackModel, usedFallback: true };
      } catch (fallbackErr: any) {
        console.warn(`Failed fallback call with model ${fallbackModel}:`, fallbackErr.message);
        throw fallbackErr;
      }
    }
    throw err;
  }
}

function cleanAndParseJSON(text: string) {
  let cleaned = text.trim();
  
  // 1. Strip markdown code blocks
  cleaned = cleaned.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  
  // 2. Extract content between first '{' and last '}' to strip pre/post conversational text
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

    // Ingest length cap: Truncate input if it exceeds 12,000 characters
    let processedArticleText = articleText;
    let truncationNotice = '';
    if (articleText.length > 12000) {
      processedArticleText = articleText.substring(0, 12000);
      truncationNotice = '\n\n[WARNING: The input text was extremely long and has been truncated to the first 12,000 characters for analysis latency and context limits. Please analyze only this truncated portion and acknowledge the truncation if relevant.]';
    }

    const finalContentPayload = processedArticleText + truncationNotice;

    // Model 1 (Extractor & Context Analyst)
    const model1Promise = safeCall(
      openai,
      'deepseek-ai/DeepSeek-V4-Flash-0731',
      [
        {
          role: 'system',
          content: `You are an expert news analyst, civic fact-checker, and media literacy specialist.
Your task is to analyze the provided text and output a structured JSON response in ${targetLanguage}.

STRICT FACTUAL & SAFETY GUIDELINES:
1. CITATION & PROVENANCE PENALTY: If the text describes specific government policies, cash handouts, deadlines, or mandatory registration but lacks verifiable links/sources/named officials, assign a preliminaryScore <= 45.
2. ADAPTIVE CIVIC GUIDANCE:
   - If the claim is SUSPICIOUS, UNVERIFIED, or HIGH RISK: 
     * "citizenImpact" must explain the potential harm or scam danger to the public (e.g., risk of identity theft, phishing, or financial loss).
     * "actionableGuidance" must explicitly warn the user NOT to click unverified links, NOT to submit bank/e-KYC details, and to verify exclusively via official government domains (e.g., .gov.my).
   - If the claim is VERIFIED / SAFE: Provide standard civic steps and deadlines as described.

Respond ONLY with a valid JSON object matching this schema:
{
  "title": "A concise headline in ${targetLanguage}",
  "category": "NEWS_POLICY" | "PUBLIC_HEALTH" | "COMMUNITY_DEVELOPMENT" | "SCAM_PHISHING" | "JOB_INVESTMENT",
  "preliminaryScore": 50, // Number 0-100
  "scoreLabel": "VERIFIED" | "SAFE" | "MIXED" | "SUSPICIOUS" | "HIGH RISK",
  "keyPoints": [
    "Key summary point 1 in ${targetLanguage}",
    "Key summary point 2 in ${targetLanguage}",
    "Key summary point 3 in ${targetLanguage}"
  ],
  "citizenImpact": "Explanation of citizen impact or potential scam/misinformation risk in ${targetLanguage}.",
  "actionableGuidance": "Safety warning or official verification steps in ${targetLanguage}."
}`
        },
        {
          role: 'user',
          content: `Analyze this content and output the JSON entirely in ${targetLanguage}:\n\n${finalContentPayload}`
        }
      ],
      0.3
    );

    // Model 2 (Fact & Credibility Auditor)
    // Primary model: moonshotai/Kimi-K2.6
    // Fallback model: MiniMaxAI/MiniMax-M2.7 (Distinct model to prevent collision)
    const model2Promise = safeCall(
      openai,
      'moonshotai/Kimi-K2.6',
      [
        {
          role: 'system',
          content: `You are an expert fact-checker, media literacy analyst, and cybersecurity/anti-fraud auditor. Your job is to independently audit the text for factual plausibility, missing official citations, manipulative urgency, or financial red flags.

STRICT FACTUAL & SAFETY VERIFICATION RULES:
1. PLAUSIBILITY IS NOT PROOF: A well-written, professional tone or use of official-sounding terminology (e.g. "Ministry of Transport", "MyKad", "effective Nov 1") does NOT grant credibility.
2. CITATION PENALTY: Any text making specific factual claims about new laws, mandatory registration deadlines, or national policy changes that lacks traceable provenance (no official gazette reference, named minister, or verifiable official URL) must be capped at a Truth Score of MAXIMUM 40%.
3. SCORING SCALE:
   - 80-100%: Independently verifiable facts from recognized, cited primary sources.
   - 60-79%: Mixed/nuanced news with minor context omissions.
   - 30-59%: Unsubstantiated, unverified policy claims or suspicious unsourced announcements.
   - 0-29%: Blatant scams, phishing, or proven fabrications.

You MUST write the "credibilityAnalysis" value strictly and entirely in the ${targetLanguage} language. Under no circumstance should you use any other language.
You MUST respond ONLY with a valid JSON object in the following format:
{
  "independentScore": 80, // A number between 0 and 100 representing the factual consistency and legitimacy. Must strictly follow the scoring scale rules above.
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
          content: `Evaluate the factual consistency and source credibility of this article. Output the reasoning trace entirely in ${targetLanguage}.

STRICT FACTUAL VERIFICATION RULES:
1. PLAUSIBILITY IS NOT PROOF: A well-written, professional tone or use of official-sounding terminology (e.g. "Ministry of Transport", "MyKad", "effective Nov 1") does NOT grant credibility.
2. CITATION PENALTY: Any text making specific factual claims about new laws, mandatory registration deadlines, or national policy changes that lacks traceable provenance (no official gazette reference, named minister, or verifiable official URL) must be capped at a Truth Score of MAXIMUM 40%.
3. SCORING SCALE:
   - 80-100%: Independently verifiable facts from recognized, cited primary sources.
   - 60-79%: Mixed/nuanced news with minor context omissions.
   - 30-59%: Unsubstantiated, unverified policy claims or suspicious unsourced announcements.
   - 0-29%: Blatant scams, phishing, or proven fabrications.

Content to analyze:\n\n${finalContentPayload}`
        }
      ],
      0.2,
      'MiniMaxAI/MiniMax-M2.7' // Distinct fallback model to prevent collision
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
        category: 'NEWS_POLICY',
        keyPoints: [
          'Could not parse analysis details correctly.',
          'Please check the raw input content.',
          'Try processing again.',
        ],
        citizenImpact: 'Unable to analyze impact due to parsing failure.',
        actionableGuidance: 'Try processing again.',
        preliminaryScore: 50,
        scoreLabel: 'MIXED',
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
    const rawPrelim = typeof model1Data.preliminaryScore !== 'undefined' ? model1Data.preliminaryScore : model1Data.preliminary_score;
    const score1 = Number.isFinite(Number(rawPrelim)) ? Math.max(0, Math.min(100, Number(rawPrelim))) : 50;

    const rawIndep = typeof model2Data.independentScore !== 'undefined' ? model2Data.independentScore : model2Data.independent_score;
    const score2 = Number.isFinite(Number(rawIndep)) ? Math.max(0, Math.min(100, Number(rawIndep))) : 50;
    
    const finalTruthScore = Math.round((score1 + score2) / 2);
    const discrepancyDelta = Math.abs(score1 - score2);

    const model1UsedFallback = res1.usedFallback;
    const model2UsedFallback = res2.usedFallback;

    // Consensus notes assembly
    const consensusNotes: string[] = [];
    if (discrepancyDelta > 25) {
      consensusNotes.push('Models exhibited divergence on claim certainty; human verification advised');
    }
    if (model1UsedFallback || model2UsedFallback) {
      consensusNotes.push('Reduced confidence — one model ran on a fallback engine');
    }
    const consensusNote = consensusNotes.join('. ');

    // Verification ID values validation
    const model1IdVerified = !!res1.response.id;
    const model2IdVerified = !!res2.response.id;

    return NextResponse.json({
      summary: {
        title: model1Data.title || 'Direct Input Analysis',
        contentType: model1Data.category || 'NEWS_POLICY',
        summary_points: model1Data.keyPoints.slice(0, 3),
        citizen_impact: model1Data.citizenImpact || '',
        actionable_advice: model1Data.actionableGuidance || '',
        category: model1Data.category || 'NEWS_POLICY',
      },
      verification: {
        truth_score: finalTruthScore,
        independent_score: score2,
        score_label: model2Data.scoreLabel || model1Data.scoreLabel || 'MIXED',
        reasoning_trace: model2Data.credibilityAnalysis || '',
        red_flags: model2Data.redFlags || [],
        discrepancy_delta: discrepancyDelta,
        consensus_note: consensusNote,
      },
      model1RequestId: res1.response.id || 'unavailable', // Replaced fake ID fallback with 'unavailable'
      model2RequestId: res2.response.id || 'unavailable', // Replaced fake ID fallback with 'unavailable'
      model1IdVerified,
      model2IdVerified,
      model1UsedFallback,
      model2UsedFallback,
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
