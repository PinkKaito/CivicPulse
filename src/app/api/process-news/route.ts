import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Per-model hedge deadline. Gonka Router cold-prompt latency was measured at
// 30-60s for every model tried (DeepSeek, MiniMax, Kimi), so the old 20s cap
// fired on nearly every fresh request and forced a fallback. 60s lets a cold
// call finish; a genuinely stuck model still aborts well before Cloudflare's
// ~100s 524.
const HEDGE_TIMEOUT_MS = 60000;

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
      const requestId = response.headers.get('x-request-id') || 'unavailable';
      const data = await response.json();
      return { data, devshardId, requestId };
    };

    return new Promise<{ data: any; devshardId: string; modelUsed: string; requestId: string }>(async (resolve, reject) => {
      let primaryFailed = false;
      let duplicateStarted = false;
      let duplicateFailed = false;
      let primaryError: any = null;
      let duplicateError: any = null;

      // Global hedge timeout
      globalTimeoutId = setTimeout(() => {
        primaryController.abort();
        duplicateController.abort();
        reject(new Error(`Timeout: both requests for ${targetModel} failed to respond within ${HEDGE_TIMEOUT_MS / 1000}s.`));
      }, HEDGE_TIMEOUT_MS);

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
          if (globalTimeoutId) clearTimeout(globalTimeoutId);
          duplicateController.abort();
          resolve({ ...res, modelUsed: targetModel });
        })
        .catch((err) => {
          primaryFailed = true;
          primaryError = err;
          console.warn(`Primary request failed for ${targetModel}:`, err.message);
          if (duplicateStarted) {
            if (duplicateFailed) {
              if (globalTimeoutId) clearTimeout(globalTimeoutId);
              reject(primaryError || duplicateError);
            }
          } else {
            // If primary failed before duplicate started, trigger duplicate immediately
            startDuplicate();
          }
        });

      // Launch hedged duplicate request after 3s delay if primary is taking long
      const duplicateTimer = setTimeout(() => {
        if (!isResolved && !primaryFailed && !duplicateStarted) {
          startDuplicate();
        }
      }, 3000);
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
  
  // 0. Strip <think>...</think> reasoning blocks (including unclosed ones)
  cleaned = cleaned.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').trim();
  
  // 1. Strip markdown code blocks
  cleaned = cleaned.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  
  // 2. Extract content between first '{' and last '}' to strip pre/post conversational text
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 3. Normalize raw unescaped linebreaks inside string quotes
  const normalized = cleaned.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) => {
    return match.replace(/\r?\n/g, ' ');
  });
  
  try {
    return JSON.parse(normalized);
  } catch (parseError) {
    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      console.warn("JSON.parse failed, attempting regex recovery for text:", cleaned);
      try {
        // Try resolving trailing commas in object or array definitions
        const fixedCleaned = normalized
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
          result.scoreLabel = labelMatch[1].toUpperCase();
          if (!result.independentScore) {
            if (result.scoreLabel === 'VERIFIED' || result.scoreLabel === 'SAFE') {
              result.independentScore = 85;
              result.preliminaryScore = 85;
            } else if (result.scoreLabel === 'HIGH RISK' || result.scoreLabel === 'SUSPICIOUS') {
              result.independentScore = 20;
              result.preliminaryScore = 20;
            }
          }
        }
        
        // Parse text blocks
        const analysisMatch = cleaned.match(/"(?:credibilityAnalysis|credibility_analysis)"\s*:\s*"([\s\S]*?)"(?=\s*(?:,|\r?\n|\}))/i);
        if (analysisMatch) {
          result.credibilityAnalysis = analysisMatch[1].replace(/\\"/g, '"').trim();
        }
        const impactMatch = cleaned.match(/"(?:citizenImpact|citizen_impact)"\s*:\s*"([\s\S]*?)"(?=\s*(?:,|\r?\n|\}))/i);
        if (impactMatch) {
          result.citizenImpact = impactMatch[1].replace(/\\"/g, '"').trim();
        }
        const guidanceMatch = cleaned.match(/"(?:actionableGuidance|actionable_guidance)"\s*:\s*"([\s\S]*?)"(?=\s*(?:,|\r?\n|\}))/i);
        if (guidanceMatch) {
          result.actionableGuidance = guidanceMatch[1].replace(/\\"/g, '"').trim();
        }
        const titleMatch = cleaned.match(/"title"\s*:\s*"([\s\S]*?)"(?=\s*(?:,|\r?\n|\}))/i);
        if (titleMatch) {
          result.title = titleMatch[1].replace(/\\"/g, '"').trim();
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
}

async function translateJSONToTargetLanguage(
  openai: OpenAI,
  dataObj: any,
  targetLang: string
): Promise<any> {
  if (!dataObj || targetLang === 'Chinese') return dataObj;
  const jsonStr = JSON.stringify(dataObj);
  // Check if string contains CJK ideographs (\u4e00-\u9fff\u3400-\u4dbf)
  if (!/[\u4e00-\u9fff\u3400-\u4dbf]/.test(jsonStr)) {
    return dataObj;
  }

  console.log(`CJK detected in non-Chinese output (${targetLang}). Running fast translation pass into ${targetLang}...`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000); // 12-second hard timeout cap

  try {
    const res = await openai.chat.completions.create(
      {
        model: 'deepseek-ai/DeepSeek-V4-Flash-0731',
        messages: [
          {
            role: 'system',
            content: `You are an expert civic translator. Translate ALL string values in the provided JSON object strictly and entirely into ${targetLang}. Preserve the exact JSON keys and structure. Do not leave any Chinese or foreign characters untranslated.`
          },
          {
            role: 'user',
            content: `Translate all JSON values entirely into ${targetLang}:\n${jsonStr}\n\nCRITICAL: The output MUST contain ZERO Chinese characters. Translate every single Chinese phrase into ${targetLang}.`
          }
        ],
        temperature: 0.0,
        max_tokens: 1500,
      },
      { signal: controller.signal }
    );
    clearTimeout(timer);
    const text = res.choices[0]?.message?.content || '';
    const parsed = cleanAndParseJSON(text);
    return parsed || dataObj;
  } catch (e) {
    clearTimeout(timer);
    console.warn('Translation fallback pass error or timeout, returning original object:', e);
    return dataObj;
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

    const languageInstruction = `
CRITICAL MANDATORY LANGUAGE RULE:
TARGET OUTPUT LANGUAGE: ${targetLanguage.toUpperCase()} (${targetLanguage})
1. You MUST translate ALL analysis, sentences, entity names, summaries, red flags, and explanations 100% strictly into ${targetLanguage}.
2. REGARDLESS of the language of the input content (even if the input is in Chinese, Tamil, Malay, or English), EVERY SINGLE STRING FIELD IN THE JSON MUST BE WRITTEN IN ${targetLanguage}.
3. DO NOT leave any foreign words, Chinese characters (e.g. "通知", "自己操作", "政府财政部"), or untranslated terms in the output. Translate every single phrase into ${targetLanguage}.
`;

    const provenanceRule = `
CRITICAL PROVENANCE & OFFICIAL DOMAIN RULE:
1. If the text explicitly references a verified official government domain (e.g. .gov.my such as nadma.gov.my, hasil.gov.my, mof.gov.my, malaysia.gov.my) AND warns citizens against sharing passwords/OTPs, assign preliminaryScore / independentScore >= 85 (SAFE or VERIFIED).
2. Do NOT apply citation penalties to legitimate announcements referencing official government portals (.gov.my).
`;

    // Model 1 (Extractor & Context Analyst)
    const model1Promise = callWithHedge(
      openai,
      'deepseek-ai/DeepSeek-V4-Flash-0731',
      [
        {
          role: 'system',
          content: `You are an expert news analyst, civic fact-checker, and media literacy specialist.
Your task is to analyze the provided text and output a structured JSON response ENTIRELY in ${targetLanguage}.

${languageInstruction}

${provenanceRule}

STRICT FACTUAL & SAFETY GUIDELINES:
1. CITATION & PROVENANCE PENALTY: If the text describes specific government policies, cash handouts, or mandatory registration BUT lacks verifiable links or official domains, assign a preliminaryScore <= 45. However, if an official government domain (.gov.my) is provided, assign preliminaryScore >= 85.
2. ADAPTIVE CIVIC GUIDANCE:
   - If the claim is SUSPICIOUS, UNVERIFIED, or HIGH RISK: 
     * "citizenImpact" must explain the potential harm or scam danger to the public (e.g., risk of identity theft, phishing, or financial loss).
     * "actionableGuidance" must explicitly warn the user NOT to click unverified links, NOT to submit bank/e-KYC details, and to verify exclusively via official government domains (e.g., .gov.my).
   - If the claim is VERIFIED / SAFE: Provide standard civic steps and deadlines as described.

Respond ONLY with a valid JSON object matching this schema:
{
  "title": "A concise headline translated into ${targetLanguage}",
  "category": "NEWS_POLICY" | "PUBLIC_HEALTH" | "COMMUNITY_DEVELOPMENT" | "SCAM_PHISHING" | "JOB_INVESTMENT" | "VIRAL_RUMOR",
  "preliminaryScore": 85, // Number 0-100
  "scoreLabel": "VERIFIED" | "SAFE" | "MIXED" | "SUSPICIOUS" | "HIGH RISK",
  "keyPoints": [
    "Key summary point 1 translated into ${targetLanguage}",
    "Key summary point 2 translated into ${targetLanguage}",
    "Key summary point 3 translated into ${targetLanguage}"
  ],
  "citizenImpact": "Explanation of citizen impact or potential scam/misinformation risk translated into ${targetLanguage}.",
  "actionableGuidance": "Safety warning or official verification steps translated into ${targetLanguage}."
}`
        },
        {
          role: 'user',
          content: `Content to analyze:\n\n${finalContentPayload}\n\nCRITICAL MANDATORY LANGUAGE INSTRUCTION:\nYou MUST write your entire JSON response (including title, summary, keyPoints, citizenImpact, actionableGuidance) 100% strictly in ${targetLanguage.toUpperCase()} (${targetLanguage}).\nTranslate ALL entity names, quotes, terms, and explanations into ${targetLanguage}. ABSOLUTELY ZERO CHINESE CHARACTERS OR UNTRANSLATED FOREIGN WORDS ARE PERMITTED.`
        }
      ],
      0.3,
      'MiniMaxAI/MiniMax-M2.7'
    );

    // Model 2 (Fact & Credibility Auditor)
    const model2Promise = callWithHedge(
      openai,
      'MiniMaxAI/MiniMax-M2.7',
      [
        {
          role: 'system',
          content: `You are an expert fact-checker, media literacy analyst, and cybersecurity/anti-fraud auditor. Your job is to independently audit the text for factual plausibility, missing official citations, manipulative urgency, or financial red flags.

${languageInstruction}

${provenanceRule}

STRICT FACTUAL & SAFETY VERIFICATION RULES:
1. PLAUSIBILITY IS NOT PROOF: A well-written, professional tone or use of official-sounding terminology (e.g. "Ministry of Transport", "MyKad", "effective Nov 1") does NOT grant credibility.
2. CITATION PENALTY: Apply citation penalties ONLY when critical policy/handout claims lack official links. If the text cites official .gov.my domains (e.g. nadma.gov.my, hasil.gov.my), assign independentScore >= 85 (SAFE / VERIFIED).
3. SCORING SCALE:
   - 80-100%: Independently verifiable facts from recognized, cited primary sources or official government domains (.gov.my).
   - 60-79%: Mixed/nuanced news with minor context omissions.
   - 30-59%: Unsubstantiated, unverified policy claims or suspicious unsourced announcements.
   - 0-29%: Blatant scams, phishing, or proven fabrications.

You MUST respond ONLY with a valid JSON object in the following format:
{
  "independentScore": 85, // A number between 0 and 100 representing the factual consistency and legitimacy.
  "scoreLabel": "SAFE", // Must be EXACTLY one of: 'VERIFIED' | 'SAFE' | 'MIXED' | 'SUSPICIOUS' | 'HIGH RISK'
  "credibilityAnalysis": "A 1-sentence concise explanation of why this score was given, noting sources, potential bias, manipulative urgency, or financial red flags translated entirely into ${targetLanguage}.",
  "redFlags": [
    "Red flag detection string 1 translated into ${targetLanguage}",
    "Red flag detection string 2 translated into ${targetLanguage}"
  ]
}`
        },
        {
          role: 'user',
          content: `Content to analyze:\n\n${finalContentPayload}\n\nCRITICAL MANDATORY LANGUAGE INSTRUCTION:\nYou MUST write your entire JSON response (including credibilityAnalysis and redFlags) 100% strictly in ${targetLanguage.toUpperCase()} (${targetLanguage}).\nTranslate ALL analysis, terms, quotes, and reasoning traces entirely into ${targetLanguage}. ABSOLUTELY ZERO CHINESE CHARACTERS OR UNTRANSLATED FOREIGN WORDS ARE PERMITTED.`
        }
      ],
      0.2,
      'deepseek-ai/DeepSeek-V4-Flash-0731'
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

    // Run automatic translation fallback pass if CJK characters are detected in non-Chinese outputs
    if (targetLanguage !== 'Chinese') {
      const [translated1, translated2] = await Promise.all([
        translateJSONToTargetLanguage(openai, model1Data, targetLanguage),
        translateJSONToTargetLanguage(openai, model2Data, targetLanguage),
      ]);
      model1Data = translated1;
      model2Data = translated2;
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
    const model1IdVerified = res1.requestId !== 'unavailable';
    const model2IdVerified = res2.requestId !== 'unavailable';

    return NextResponse.json({
      summary: {
        title: model1Data.title || 'Direct Input Analysis',
        contentType: model1Data.category || 'NEWS_POLICY',
        summary_points: (model1Data.keyPoints || []).slice(0, 3),
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
      model1RequestId: res1.requestId,
      model2RequestId: res2.requestId,
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
