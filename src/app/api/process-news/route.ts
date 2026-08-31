import { NextResponse } from 'next/server';
import OpenAI from 'openai';

async function callWithHedge(
  openai: OpenAI,
  model: string,
  messages: any[],
  temperature: number,
  fallbackModel?: string
) {
  const runHedgedRequest = async (targetModel: string) => {
    const primaryController = new AbortController();
    const duplicateController = new AbortController();
    
    let isResolved = false;
    let primaryTimeoutId: NodeJS.Timeout | null = null;
    let globalTimeoutId: NodeJS.Timeout | null = null;

    const makeRequest = async (controller: AbortController) => {
      const response = await openai.chat.completions.create(
        {
          model: targetModel,
          messages,
          temperature,
          max_tokens: 1500, // 1500 max tokens to avoid CJK truncation
        },
        {
          signal: controller.signal,
          headers: {
            'X-Gonka-No-Fallback': 'true', // Pin the model identity, prevent upstream fallback substitution
          },
        }
      ).asResponse(); // Access raw response to extract headers
      
      const devshardId = response.headers.get('x-devshard-id') || 'unknown-node';
      const data = await response.json();
      return { data, devshardId };
    };

    return new Promise<{ data: any; devshardId: string; modelUsed: string }>(async (resolve, reject) => {
      let primaryFailed = false;
      let duplicateStarted = false;
      let duplicateFailed = false;
      let primaryError: any = null;
      let duplicateError: any = null;

      // Global 20s timeout limit
      globalTimeoutId = setTimeout(() => {
        primaryController.abort();
        duplicateController.abort();
        reject(new Error(`Timeout: both requests for ${targetModel} failed to respond within 20s.`));
      }, 20000);

      // Function to trigger the duplicate tied request
      const startDuplicate = () => {
        duplicateStarted = true;
        console.log(`Launching duplicate hedged request for ${targetModel}`);
        makeRequest(duplicateController)
          .then((res) => {
            if (isResolved) return;
            isResolved = true;
            if (globalTimeoutId) clearTimeout(globalTimeoutId);
            primaryController.abort();
            resolve({ ...res, modelUsed: targetModel });
          })
          .catch((err) => {
            duplicateFailed = true;
            duplicateError = err;
            console.warn(`Duplicate request failed for ${targetModel}:`, err.message);
            if (primaryFailed) {
              if (globalTimeoutId) clearTimeout(globalTimeoutId);
              reject(primaryError || duplicateError);
            }
          });
      };

      // Execute primary request
      makeRequest(primaryController)
        .then((res) => {
          if (isResolved) return;
          isResolved = true;
          if (primaryTimeoutId) clearTimeout(primaryTimeoutId);
          if (globalTimeoutId) clearTimeout(globalTimeoutId);
          duplicateController.abort();
          resolve({ ...res, modelUsed: targetModel });
        })
        .catch((err) => {
          primaryFailed = true;
          primaryError = err;
          console.warn(`Primary request failed for ${targetModel}:`, err.message);
          // If duplicate hasn't started yet, spawn it immediately without waiting for the 1.8s timer
          if (!duplicateStarted) {
            if (primaryTimeoutId) clearTimeout(primaryTimeoutId);
            startDuplicate();
          } else if (duplicateFailed) {
            if (globalTimeoutId) clearTimeout(globalTimeoutId);
            reject(primaryError || duplicateError);
          }
        });

      // Deferred hedge timer: 1.8 seconds delay
      primaryTimeoutId = setTimeout(() => {
        if (!isResolved && !primaryFailed && !duplicateStarted) {
          startDuplicate();
        }
      }, 1800);
    });
  };

  try {
    const res = await runHedgedRequest(model);
    return { ...res, usedFallback: false };
  } catch (err: any) {
    console.warn(`Both hedged calls failed with primary model ${model}:`, err.message);
    if (fallbackModel) {
      console.log(`Attempting fallback model ${fallbackModel} with hedging...`);
      try {
        const res = await runHedgedRequest(fallbackModel);
        return { ...res, usedFallback: true };
      } catch (fallbackErr: any) {
        console.error(`Both hedged calls failed on fallback model ${fallbackModel}:`, fallbackErr.message);
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
  
  try {
    return JSON.parse(cleaned);
  } catch (parseError) {
    console.warn("JSON.parse failed, attempting regex recovery for text:", cleaned);
    try {
      // Try resolving trailing commas in object or array definitions
      const fixedCleaned = cleaned
        .replace(/,\s*}/g, '}')
        .replace(/,\s*\]/g, ']');
      return JSON.parse(fixedCleaned);
    } catch (secondError) {
      // Regex-based robust data extraction fallback
      const result: any = {};
      
      // Parse preliminary/independent scores
      const scoreMatch = cleaned.match(/"(?:independentScore|preliminaryScore|independent_score|preliminary_score)"\s*:\s*"?(\d+)"?/i);
      if (scoreMatch) {
        const val = parseInt(scoreMatch[1], 10);
        result.independentScore = val;
        result.preliminaryScore = val;
      }
      
      // Parse scoreLabel
      const labelMatch = cleaned.match(/"(?:scoreLabel|score_label)"\s*:\s*"([^"]+)"/i);
      if (labelMatch) {
        result.scoreLabel = labelMatch[1];
      }
      
      // Parse text blocks
      const analysisMatch = cleaned.match(/"(?:credibilityAnalysis|credibility_analysis)"\s*:\s*"([\s\S]*?)"(?=\s*(?:,|\r?\n|\}))/i);
      if (analysisMatch) {
        result.credibilityAnalysis = analysisMatch[1].replace(/\\"/g, '"');
      }
      const impactMatch = cleaned.match(/"(?:citizenImpact|citizen_impact)"\s*:\s*"([\s\S]*?)"(?=\s*(?:,|\r?\n|\}))/i);
      if (impactMatch) {
        result.citizenImpact = impactMatch[1].replace(/\\"/g, '"');
      }
      const guidanceMatch = cleaned.match(/"(?:actionableGuidance|actionable_guidance)"\s*:\s*"([\s\S]*?)"(?=\s*(?:,|\r?\n|\}))/i);
      if (guidanceMatch) {
        result.actionableGuidance = guidanceMatch[1].replace(/\\"/g, '"');
      }
      const titleMatch = cleaned.match(/"title"\s*:\s*"([\s\S]*?)"(?=\s*(?:,|\r?\n|\}))/i);
      if (titleMatch) {
        result.title = titleMatch[1].replace(/\\"/g, '"');
      }
      const categoryMatch = cleaned.match(/"category"\s*:\s*"([^"]+)"/i);
      if (categoryMatch) {
        result.category = categoryMatch[1];
      }

      // Parse arrays of points or flags
      const keyPointsMatch = cleaned.match(/"(?:keyPoints|key_points)"\s*:\s*\[([\s\S]*?)\]/i);
      if (keyPointsMatch) {
        const itemsText = keyPointsMatch[1];
        result.keyPoints = itemsText
          .split(/",?\s*"/)
          .map(item => item.replace(/^"|"$/g, '').trim())
          .filter(Boolean);
      }
      const redFlagsMatch = cleaned.match(/"(?:redFlags|red_flags)"\s*:\s*\[([\s\S]*?)\]/i);
      if (redFlagsMatch) {
        const itemsText = redFlagsMatch[1];
        result.redFlags = itemsText
          .split(/",?\s*"/)
          .map(item => item.replace(/^"|"$/g, '').trim())
          .filter(Boolean);
      }
      
      if (result.title || result.independentScore || result.preliminaryScore || result.credibilityAnalysis) {
        return result;
      }
      throw parseError;
    }
  }
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
    // Primary: deepseek-ai/DeepSeek-V4-Flash-0731
    // Fallback: moonshotai/Kimi-K2.6
    const model1Promise = callWithHedge(
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
      0.3,
      'moonshotai/Kimi-K2.6'
    );

    // Model 2 (Fact & Credibility Auditor)
    // Primary: MiniMaxAI/MiniMax-M2.7 (Distinct primary from Model 1)
    // Fallback: moonshotai/Kimi-K2.6 (Shared fallback to prevent collision)
    const model2Promise = callWithHedge(
      openai,
      'MiniMaxAI/MiniMax-M2.7',
      [
        {
          role: 'system',
          content: `You are an expert fact-checker, media literacy analyst, and cybersecurity/anti-fraud auditor. Your job is to independently audit the text for factual plausibility, missing official citations, manipulative urgency, or financial red flags.

STRICT FACTUAL & SAFETY VERIFICATION RULES:
1. PLAUSIBILITY IS NOT PROOF: A well-written, professional tone or use of official-sounding terminology (e.g. "Ministry of Transport", "MyKad", "effective Nov 1") does NOT grant credibility.
2. CITATION PENALTY: Only apply this penalty to critical claims (such as new laws, mandatory registration deadlines, cash handouts, or national policy changes). Do NOT penalize general harmless news (like sports reports, entertainment, or cultural articles) for lacking official links or government citations; score general harmless news based on standard consistency and plausibility.
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
2. CITATION PENALTY: Only apply this penalty to critical claims (such as new laws, mandatory registration deadlines, cash handouts, or national policy changes). Do NOT penalize general harmless news (like sports reports, entertainment, or cultural articles) for lacking official links or government citations; score general harmless news based on standard consistency and plausibility.
3. SCORING SCALE:
   - 80-100%: Independently verifiable facts from recognized, cited primary sources.
   - 60-79%: Mixed/nuanced news with minor context omissions.
   - 30-59%: Unsubstantiated, unverified policy claims or suspicious unsourced announcements.
   - 0-29%: Blatant scams, phishing, or proven fabrications.

Content to analyze:\n\n${finalContentPayload}`
        }
      ],
      0.2,
      'moonshotai/Kimi-K2.6'
    );

    // Await parallel promises
    const [res1, res2] = await Promise.all([model1Promise, model2Promise]);

    const res1Text = res1.data.choices[0]?.message?.content || '';
    const res2Text = res2.data.choices[0]?.message?.content || '';

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

    // Consensus notes assembly with localization options
    const consensusNotes: string[] = [];
    if (discrepancyDelta > 25) {
      if (targetLanguage === 'Chinese') {
        consensusNotes.push('模型在判断确定性上存在明显分歧，建议人工核实');
      } else if (targetLanguage === 'Bahasa Melayu') {
        consensusNotes.push('Model menunjukkan perbezaan pendapat mengenai kepastian tuntutan; pengesahan manusia disyorkan');
      } else if (targetLanguage === 'Tamil') {
        consensusNotes.push('உரிமைகோரல் நிச்சயத்தன்மையில் மாதிரிகள் வேறுபாட்டைக் காட்டின; மனித சரிபார்ப்பு பரிந்துரைக்கப்படுகிறது');
      } else {
        consensusNotes.push('Models exhibited divergence on claim certainty; human verification advised');
      }
    }
    if (model1UsedFallback || model2UsedFallback) {
      if (targetLanguage === 'Chinese') {
        consensusNotes.push('置信度有所降低 — 其中一个分析步骤启用了备用AI模型');
      } else if (targetLanguage === 'Bahasa Melayu') {
        consensusNotes.push('Tahap keyakinan dikurangkan — salah satu langkah analisis menggunakan model AI sandaran');
      } else if (targetLanguage === 'Tamil') {
        consensusNotes.push('நம்பிக்கை நிலை குறைக்கப்பட்டது — பகுப்பாய்வு படிகளில் ஒன்று காப்புப்பிரதி AI மாதிரியைப் பயன்படுத்தியது');
      } else {
        consensusNotes.push('Reduced confidence — one analysis step switched to a backup AI model');
      }
    }
    const consensusNote = consensusNotes.join('. ');

    // Verification ID values validation
    const model1IdVerified = !!res1.data?.id;
    const model2IdVerified = !!res2.data?.id;

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
      model1RequestId: res1.data?.id || 'unavailable',
      model2RequestId: res2.data?.id || 'unavailable',
      model1IdVerified,
      model2IdVerified,
      model1UsedFallback,
      model2UsedFallback,
      model1Used: res1.modelUsed,
      model2Used: res2.modelUsed,
      model1DevshardId: res1.devshardId,
      model2DevshardId: res2.devshardId,
    });
  } catch (error: any) {
    console.error('Error in process-news route:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing consensus pipeline' },
      { status: 500 }
    );
  }
}
