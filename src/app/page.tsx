'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Link as LinkIcon, 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Sparkles, 
  Info,
  ExternalLink,
  RefreshCw,
  Eye,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

interface AnalysisResult {
  summary: {
    title: string;
    summary_points: string[];
    citizen_impact: string;
    actionable_advice?: string;
    category: string;
    contentType?: string;
  };
  verification: {
    truth_score: number;
    independent_score?: number;
    score_label?: string;
    reasoning_trace: string;
    red_flags: string[];
    discrepancy_delta?: number;
    consensus_note?: string;
  };
  model1RequestId: string;
  model2RequestId: string;
  model1Used: string;
  model2Used: string;
}

export default function Home() {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'text' | 'url'>('text');
  const [language, setLanguage] = useState<string>('English');
  const [customLanguage, setCustomLanguage] = useState<string>('');
  
  // Accessibility States
  const [fontSizePercent, setFontSizePercent] = useState<number>(100);
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Inputs
  const [articleText, setArticleText] = useState<string>('');
  const [newsUrl, setNewsUrl] = useState<string>('');
  
  // States
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  // Dev Gonka Test Section Collapse
  const [showDevTest, setShowDevTest] = useState<boolean>(false);
  const [devLoading, setDevLoading] = useState<boolean>(false);
  const [devResult, setDevResult] = useState<{ text?: string; requestId?: string; error?: string } | null>(null);

  // Collapsible Audit Footer
  const [showAudit, setShowAudit] = useState<boolean>(false);

  // Presets Data
  const presets = {
    transit: {
      text: 'KUALA LUMPUR — The Ministry of Transport has announced a new targeted public transit subsidy framework set to take effect starting November 1. Under the revised initiative, eligible tertiary students and senior citizens will receive a 50% flat discount on all rail and rapid bus networks nationwide through their MyKad registration. The ministry confirmed that existing monthly unlimited passes will remain active until the end of the year, after which users must link their identification cards via the central digital portal to continue enjoying subsidized transit fares.',
      title: 'Transit Subsidy Policy'
    },
    phishing: {
      text: 'RM0.00: CIMB Alert! Your bank account has been temporarily frozen due to suspicious login attempts. To restore access and verify your identity immediately, click the secure link to update your details: https://cimb-online-security-verify.com/login. Failure to act within 24 hours will result in permanent account suspension.',
      title: 'Bank Account Freeze SMS'
    },
    cryptoJob: {
      text: "Earn $500 - $1500 daily working from home! We are looking for remote transaction evaluators to process global crypto transfers. No experience required. We guarantee full training and immediate daily payouts. Must have Telegram and a personal crypto wallet. Reply 'START' to begin your registration and claim your $100 sign-up bonus now!",
      title: 'Telegram Crypto Job Offer'
    }
  };

  // Preset Trigger
  const handleApplyPreset = (key: 'transit' | 'phishing' | 'cryptoJob') => {
    setActiveTab('text');
    setArticleText(presets[key].text);
    setError(null);
    setResult(null);
  };

  // Accessibility Font Adjusters
  const handleDecreaseFont = () => {
    setFontSizePercent((prev) => Math.max(80, prev - 10));
  };

  const handleIncreaseFont = () => {
    setFontSizePercent((prev) => Math.min(200, prev + 10));
  };

  // Effect to scale root font size for accessibility
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSizePercent}%`;
  }, [fontSizePercent]);

  // Developer Test Trigger (Step 1 Verification)
  const handleVerifyGonka = async () => {
    setDevLoading(true);
    setDevResult(null);
    try {
      const res = await fetch('/api/verify-gonka');
      const data = await res.json();
      setDevResult(data);
    } catch (err: any) {
      setDevResult({ error: err.message || 'Failed to trigger verification' });
    } finally {
      setDevLoading(false);
    }
  };

  // Main Pipeline processing
  const handleProcessArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      let textToProcess = articleText;

      // Step 2: URL parsing if URL tab is active
      if (activeTab === 'url') {
        if (!newsUrl.trim()) {
          throw new Error('Please enter a valid News URL.');
        }
        setLoadingStep('Ingesting news article and extracting clean text...');
        
        const parseRes = await fetch('/api/parse-news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: newsUrl }),
        });
        
        const parseData = await parseRes.json();
        if (!parseRes.ok || parseData.error) {
          throw new Error(parseData.error || 'Failed to parse news webpage.');
        }
        textToProcess = parseData.bodyText;
      }

      if (!textToProcess || textToProcess.trim().length < 40) {
        throw new Error('Content is too short to analyze. Please provide a longer text or URL.');
      }

      // Truncate to maximum character limit to prevent token overflows and high latency
      if (textToProcess.length > 10000) {
        textToProcess = textToProcess.slice(0, 10000) + '\n\n... [Content truncated for length limit]';
      }

      // Step 3 & 4: Multi-Model Process Pipeline
      setLoadingStep('Analyzing context, fact-checking, and scoring in parallel...');
      const targetLanguage = language === 'Other' ? (customLanguage.trim() || 'English') : language;
      const processRes = await fetch('/api/process-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleText: textToProcess, language: targetLanguage }),
      });

      const processData = await processRes.json();
      if (!processRes.ok || processData.error) {
        throw new Error(processData.error || 'Error processing consensus pipeline.');
      }

      setResult(processData);
    } catch (err: any) {
      console.warn(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  // Helper to dynamically style truth/scam score components
  const getTruthScoreStyles = (score: number, isScam: boolean) => {
    if (highContrast) {
      return { 
        text: 'text-white font-black', 
        badge: 'bg-black text-white border-2 border-white' 
      };
    }
    if (isScam) {
      // For Scam Risk, higher score means more dangerous (red)
      if (score >= 75) return { text: 'text-rose-700 font-bold', badge: 'bg-rose-50 text-rose-850 border border-rose-200' };
      if (score >= 40) return { text: 'text-orange-700 font-bold', badge: 'bg-orange-50 text-orange-850 border border-orange-200' };
      return { text: 'text-amber-800 font-bold', badge: 'bg-amber-50 text-amber-800 border border-amber-250/50' };
    } else {
      // For Truth Score, higher score means more credible (amber/green/warm gold)
      if (score >= 80) return { text: 'text-amber-800 font-bold', badge: 'bg-amber-50 text-amber-800 border border-amber-250/50' };
      if (score >= 50) return { text: 'text-orange-700 font-bold', badge: 'bg-orange-50 text-orange-850 border border-orange-200' };
      return { text: 'text-rose-700 font-bold', badge: 'bg-rose-50 text-rose-850 border border-rose-200' };
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
      highContrast 
        ? 'bg-black text-white selection:bg-white selection:text-black' 
        : 'bg-[#faf6ee] text-[#2c2214] selection:bg-[#eddcb8] selection:text-[#2c2214]'
    }`}>
      
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 transition-colors ${
        highContrast 
          ? 'border-white bg-black' 
          : 'border-[#ebdcb8] bg-[#faf6ee]/90 backdrop-blur-md'
      }`}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
              highContrast ? 'bg-black border-white' : 'bg-[#faf6ee] border-[#ebdcb8]'
            }`}>
              <Sparkles className={`h-4.5 w-4.5 ${highContrast ? 'text-white' : 'text-amber-700'}`} />
            </div>
            <div>
              <span className={`font-bold text-lg tracking-tight ${highContrast ? 'text-white' : 'text-[#2c2214]'}`}>
                CivicPulse
              </span>
              <span className={`text-[9px] block font-semibold tracking-wider uppercase ml-0.5 ${
                highContrast ? 'text-white' : 'text-amber-700'
              }`}>
                Consensus Truth Engine
              </span>
            </div>
          </div>

          {/* Accessibility & Developer Controls */}
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Font Size Adjusters */}
            <div className={`flex items-center gap-1.5 border-r pr-3 ${
              highContrast ? 'border-white' : 'border-[#e6decb]'
            }`}>
              <button 
                onClick={handleDecreaseFont} 
                disabled={fontSizePercent <= 80}
                className={`px-2.5 py-1 text-xs rounded border transition-all cursor-pointer font-bold disabled:opacity-40 disabled:cursor-not-allowed ${
                  highContrast 
                    ? 'bg-black text-white border-white hover:bg-stone-900' 
                    : 'bg-transparent text-[#5c4a36] border-[#e2d5bd] hover:bg-[#f6efe2]'
                }`}
                title="Decrease font size (-10%)"
                aria-label="Decrease font size"
              >
                A-
              </button>
              <span className={`text-[10px] font-bold px-1 ${
                highContrast ? 'text-white' : 'text-[#7c6950]'
              }`}>
                {fontSizePercent}%
              </span>
              <button 
                onClick={handleIncreaseFont} 
                disabled={fontSizePercent >= 200}
                className={`px-2.5 py-1 text-xs rounded border transition-all cursor-pointer font-bold disabled:opacity-40 disabled:cursor-not-allowed ${
                  highContrast 
                    ? 'bg-black text-white border-white hover:bg-[#222]' 
                    : 'bg-transparent text-[#5c4a36] border-[#e2d5bd] hover:bg-[#f6efe2]'
                }`}
                title="Increase font size (+10%)"
                aria-label="Increase font size"
              >
                A+
              </button>
            </div>

            {/* High Contrast Mode Toggle */}
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                highContrast 
                  ? 'bg-white text-black border-white' 
                  : 'bg-[#faf6ee] text-[#5c4a36] border-[#e2d5bd] hover:bg-[#f6efe2]'
              }`}
              aria-label="Toggle High Contrast Mode"
            >
              <Eye className="h-3.5 w-3.5" />
              Contrast
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 space-y-8">

        {/* Search & Paste Inputs */}
        <section className={`border rounded-xl p-6 space-y-6 shadow-sm ${
          highContrast ? 'bg-black border-white' : 'bg-white border-[#e9e2d3]'
        }`}>
          
          {/* Header tabs & Language Selection */}
          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 ${
            highContrast ? 'border-white' : 'border-[#f6efe2]'
          }`}>
            
            {/* Input Method Tabs */}
            <div className={`flex p-1 rounded-lg border w-full sm:w-auto ${
              highContrast ? 'bg-black border-white' : 'bg-[#faf6ee] border-[#e6decb]'
            }`}>
              <button
                onClick={() => { setActiveTab('text'); setError(null); }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'text'
                    ? (highContrast ? 'bg-white text-black' : 'bg-[#3c3020] text-[#faf6ee]')
                    : (highContrast ? 'text-white hover:underline' : 'text-[#5c4a36] hover:text-[#2c2214]')
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Paste Claim
              </button>
              <button
                onClick={() => { setActiveTab('url'); setError(null); }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'url'
                    ? (highContrast ? 'bg-white text-black' : 'bg-[#3c3020] text-[#faf6ee]')
                    : (highContrast ? 'text-white hover:underline' : 'text-[#5c4a36] hover:text-[#2c2214]')
                }`}
              >
                <LinkIcon className="h-3.5 w-3.5" />
                News Link
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <Globe className={`h-3.5 w-3.5 shrink-0 ${highContrast ? 'text-white' : 'text-amber-700'}`} />
              <label htmlFor="language-select" className={`text-xs font-semibold whitespace-nowrap ${highContrast ? 'text-white' : 'text-[#5c4a36]'}`}>Translate To:</label>
              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  id="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`text-xs font-semibold border rounded-lg px-3 py-2 focus:outline-none transition-all cursor-pointer w-full sm:w-auto ${
                    highContrast 
                      ? 'bg-black text-white border-white focus:border-white' 
                      : 'bg-[#faf6ee] text-[#2c2214] border-[#e6decb] focus:border-amber-700'
                  }`}
                >
                  <option value="English">English</option>
                  <option value="Bahasa Melayu">Bahasa Melayu</option>
                  <option value="Chinese">中文 (Chinese)</option>
                  <option value="Tamil">தமிழ் (Tamil)</option>
                  <option value="Other">Other...</option>
                </select>
                {language === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter language"
                    value={customLanguage}
                    onChange={(e) => setCustomLanguage(e.target.value)}
                    className={`text-xs font-semibold border rounded-lg px-3 py-2 focus:outline-none transition-all w-full sm:w-32 ${
                      highContrast 
                        ? 'bg-black text-white border-white focus:border-white' 
                        : 'bg-[#faf6ee] text-[#2c2214] border-[#e6decb] focus:border-amber-700'
                    }`}
                  />
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleProcessArticle} className="space-y-5">
            
            {activeTab === 'text' ? (
              <div className="space-y-1.5">
                <label htmlFor="article-text-area" className={`text-[10px] font-bold uppercase tracking-wider ${
                  highContrast ? 'text-white' : 'text-[#7c6950]'
                }`}>Claim, Message or Investment Pitch</label>
                <textarea
                  id="article-text-area"
                  rows={6}
                  placeholder="Paste any news article URL, suspicious SMS, job/investment pitch, or viral claim..."
                  value={articleText}
                  onChange={(e) => setArticleText(e.target.value)}
                  className={`w-full border rounded-xl p-4 placeholder-[#a89f91] focus:outline-none transition-all font-sans leading-relaxed text-sm resize-y ${
                    highContrast 
                      ? 'bg-black text-white border-white focus:border-white' 
                      : 'bg-[#faf6ee] border-[#ebdcb8] text-[#3c3020] focus:border-amber-700'
                  }`}
                />
                <div className="flex justify-between items-center text-[10px] font-bold mt-1 px-1">
                  <span className={highContrast ? 'text-white' : 'text-[#7c6950]'}>Character Count</span>
                  <span className={articleText.length > 10000 ? "text-rose-500 font-extrabold animate-pulse" : (highContrast ? 'text-white' : 'text-[#7c6950]')}>
                    {articleText.length.toLocaleString()} / 10,000 max limit
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label htmlFor="article-url-input" className={`text-[10px] font-bold uppercase tracking-wider ${
                  highContrast ? 'text-white' : 'text-[#7c6950]'
                }`}>Article URL</label>
                <div className="relative">
                  <input
                    id="article-url-input"
                    type="text"
                    placeholder="https://example.com/news-story"
                    value={newsUrl}
                    onChange={(e) => setNewsUrl(e.target.value)}
                    className={`w-full border rounded-xl py-3.5 pl-4 pr-10 placeholder-[#a89f91] focus:outline-none transition-all text-sm ${
                      highContrast 
                        ? 'bg-black text-white border-white focus:border-white' 
                        : 'bg-[#faf6ee] border-[#ebdcb8] text-[#3c3020] focus:border-amber-700'
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-700">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            )}

            {/* Presets Row */}
            <div className="space-y-1.5">
              <span className={`text-[9px] font-bold uppercase tracking-wider block ${
                highContrast ? 'text-white' : 'text-[#7c6950]'
              }`}>Presets for Testing:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('transit')}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    highContrast 
                      ? 'bg-black text-white border-white hover:bg-[#222]' 
                      : 'bg-[#faf6ee] text-amber-800 border-[#e6decb] hover:bg-[#f6efe2]'
                  }`}
                >
                  🚌 Transit Subsidy Policy
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('phishing')}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    highContrast 
                      ? 'bg-black text-white border-white hover:bg-[#222]' 
                      : 'bg-[#faf6ee] text-amber-800 border-[#e6decb] hover:bg-[#f6efe2]'
                  }`}
                >
                  🏦 Bank Account Freeze SMS
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('cryptoJob')}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    highContrast 
                      ? 'bg-black text-white border-white hover:bg-[#222]' 
                      : 'bg-[#faf6ee] text-amber-800 border-[#e6decb] hover:bg-[#f6efe2]'
                  }`}
                >
                  💼 Telegram Crypto Job Offer
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border ${
                loading
                  ? (highContrast ? 'bg-black text-[#555] border-[#333] cursor-not-allowed' : 'bg-[#faf6ee] text-[#a89f91] border-[#ebdcb8] cursor-not-allowed')
                  : (highContrast ? 'bg-white text-black border-white hover:bg-black hover:text-white' : 'bg-[#3c3020] hover:bg-[#2c2317] text-[#faf6ee] border-transparent active:scale-98')
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Analyzing content...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Simplify & Cross-Verify Claims</span>
                </>
              )}
            </button>

            {loading && loadingStep && (
              <div className="py-2.5 text-center">
                <p className={`text-[11px] font-bold animate-pulse ${
                  highContrast ? 'text-white' : 'text-[#7c6950]'
                }`}>{loadingStep}</p>
              </div>
            )}
          </form>

          {error && (
            <div className={`p-4 border rounded-xl text-xs flex items-start gap-3 ${
              highContrast ? 'bg-black border-white text-white' : 'bg-[#fff5f5] border-rose-200 text-rose-700'
            }`}>
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error:</span> {error}
              </div>
            </div>
          )}
        </section>

        {/* Results Card */}
        {result && (() => {
          const type = result.summary.contentType || 'NEWS_POLICY';
          const isScam = type === 'SCAM_PHISHING' || type === 'JOB_INVESTMENT';
          
          // Calculate Scam Risk Score: 100 - truth_score
          const scamRiskScore = Math.max(0, Math.min(100, 100 - result.verification.truth_score));
          const scoreDisplay = isScam ? scamRiskScore : result.verification.truth_score;
          
          const styles = getTruthScoreStyles(scoreDisplay, isScam);
          
          return (
            <section className={`border rounded-xl p-6 space-y-6 shadow-sm animate-in slide-in-from-bottom-4 duration-400 ${
              highContrast 
                ? 'bg-black border-white' 
                : (isScam ? 'bg-[#fffdfd] border-rose-200' : 'bg-white border-[#e9e2d3]')
            }`}>
              
              {/* Header / Category Badge */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
                highContrast ? 'border-white' : (isScam ? 'border-rose-100' : 'border-[#f6efe2]')
              }`}>
                <h2 className={`text-lg font-bold tracking-tight leading-snug ${
                  highContrast ? 'text-white' : (isScam ? 'text-rose-950' : 'text-[#2c2214]')
                }`}>
                  {result.summary.title}
                </h2>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase border ${
                    highContrast 
                      ? 'bg-black text-white border-white' 
                      : (isScam ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-[#faf6ee] text-amber-800 border-[#ebdcb8]')
                  }`}>
                    <TrendingUp className="h-3 w-3" />
                    {result.summary.category}
                  </span>
                </div>
              </div>

              {/* Consensus Divergence Warnings Banner */}
              {result.verification.consensus_note && (
                <div className={`p-4 border rounded-xl text-xs flex items-center gap-2.5 ${
                  highContrast ? 'bg-black border-white text-white animate-pulse' : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                  <span className="font-bold">{result.verification.consensus_note}</span>
                </div>
              )}

              {/* Truth/Scam Score Gauge & Credibility Analysis */}
              <div className={`p-5 rounded-xl border ${
                highContrast 
                  ? 'border-2 border-white bg-black' 
                  : (isScam ? 'border-rose-200 bg-rose-50/10' : 'border-[#e9e2d3] bg-[#faf6ee]/50')
              } grid grid-cols-1 md:grid-cols-4 gap-5 items-center`}>
                
                {/* Score Column */}
                <div className={`flex flex-col items-center justify-center text-center space-y-1.5 md:pr-4 py-2 ${
                  highContrast 
                    ? 'md:border-r-2 md:border-white' 
                    : (isScam ? 'md:border-r border-rose-100' : 'md:border-r border-[#e9e2d3]')
                }`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    highContrast ? 'text-white' : 'text-stone-550'
                  }`}>
                    {isScam ? 'Scam Risk' : 'Truth Score'}
                  </span>
                  <span className={`text-4xl font-black ${styles.text}`}>
                    {scoreDisplay}%
                  </span>
                  <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full tracking-wide uppercase ${styles.badge}`}>
                    {isScam 
                      ? (scamRiskScore >= 75 ? 'HIGH RISK' : scamRiskScore >= 40 ? 'SUSPICIOUS' : 'SAFE')
                      : (result.verification.score_label || 'MIXED')}
                  </span>
                  
                  {/* Gauge Severity Bar */}
                  <div className="w-28 mt-2.5 space-y-1">
                    <div className={`h-2 w-full rounded-full overflow-hidden border ${
                      highContrast ? 'bg-zinc-900 border-white' : 'bg-stone-200/50 border-[#ebdcb8]/20'
                    }`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          highContrast 
                            ? 'bg-white' 
                            : (isScam 
                                ? (scamRiskScore >= 75 ? 'bg-rose-500' : scamRiskScore >= 40 ? 'bg-orange-500' : 'bg-emerald-500')
                                : (result.verification.truth_score >= 80 ? 'bg-emerald-500' : result.verification.truth_score >= 50 ? 'bg-orange-500' : 'bg-rose-500')
                              )
                        }`}
                        style={{ width: `${scoreDisplay}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-extrabold tracking-wider px-0.5 text-[#8c7960] uppercase">
                      <span>{isScam ? 'Safe' : 'Risk'}</span>
                      <span>50%</span>
                      <span>{isScam ? 'Risk' : 'Safe'}</span>
                    </div>
                  </div>
                </div>

                {/* Reasoning Trace Column */}
                <div className="md:col-span-3 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className={`h-4 w-4 ${styles.text}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      highContrast ? 'text-white' : 'text-stone-500'
                    }`}>
                      Consensus Credibility Audit
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">
                    {result.verification.reasoning_trace}
                  </p>
                </div>
              </div>

              {/* Key Summary points */}
              <div className="space-y-3.5">
                <h3 className={`text-[10px] font-bold uppercase tracking-wider ${
                  highContrast ? 'text-white' : 'text-[#7c6950]'
                }`}>Analyzed Details</h3>
                <div className="grid grid-cols-1 gap-3">
                  {result.summary.summary_points.map((point, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-4 border rounded-xl ${
                      highContrast 
                        ? 'bg-black border-white' 
                        : (isScam ? 'bg-rose-50/20 border-rose-100/50 text-rose-950' : 'bg-[#faf6ee]/60 border-[#e9e2d3] text-[#3c3020]')
                    }`}>
                      <span className={`text-sm font-semibold pt-0.5 shrink-0 ${
                        highContrast ? 'text-white' : (isScam ? 'text-rose-600' : 'text-amber-800')
                      }`}>
                        0{idx + 1}.
                      </span>
                      <p className="text-sm leading-relaxed font-medium">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scam Red Flags Detected list */}
              {isScam && result.verification.red_flags && result.verification.red_flags.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className={`text-[10px] font-bold uppercase tracking-wider ${
                    highContrast ? 'text-white' : 'text-rose-700'
                  }`}>Red Flags Detected</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.verification.red_flags.map((flag, idx) => (
                      <span key={idx} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        highContrast 
                          ? 'bg-black text-white border-white' 
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}>
                        ⚠️ {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Citizen Impact / Financial Risk Box */}
              <div className={`border rounded-xl p-5 ${
                highContrast 
                  ? 'bg-black border-2 border-white' 
                  : (isScam ? 'border-rose-250 bg-rose-50/30' : 'border-[#e6decb] bg-[#fbf8f3]')
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    highContrast ? 'bg-white' : (isScam ? 'bg-rose-500' : 'bg-amber-600')
                  }`} />
                  <h4 className={`text-[10px] font-bold uppercase tracking-wider ${
                    highContrast ? 'text-white' : (isScam ? 'text-rose-700' : 'text-amber-800')
                  }`}>
                    {isScam ? 'Financial Risk / Threat Assessment' : 'Citizen Impact'}
                  </h4>
                </div>
                <p className="text-sm leading-relaxed font-medium">
                  {result.summary.citizen_impact}
                </p>
              </div>

              {/* Actionable Advice / Civic Steps */}
              {result.summary.actionable_advice && (
                <div className={`border rounded-xl p-5 ${
                  highContrast 
                    ? 'bg-black border-2 border-white' 
                    : (isScam ? 'border-amber-300 bg-amber-50/20' : 'border-stone-200 bg-stone-50/50')
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      highContrast ? 'bg-white' : (isScam ? 'bg-amber-500' : 'bg-stone-500')
                    }`} />
                    <h4 className={`text-[10px] font-bold uppercase tracking-wider ${
                      highContrast ? 'text-white' : (isScam ? 'text-amber-700' : 'text-stone-600')
                    }`}>
                      {isScam ? 'Actionable Precautionary Advice' : 'Actionable Civic Guidance'}
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed font-medium">
                    {result.summary.actionable_advice}
                  </p>
                </div>
              )}

              {/* Audit / Gonka Proof Footer */}
              <div className={`border-t pt-4 ${highContrast ? 'border-white' : (isScam ? 'border-rose-100' : 'border-[#f6efe2]')}`}>
                <button
                  onClick={() => setShowAudit(!showAudit)}
                  className="w-full flex items-center justify-between text-[11px] font-semibold text-[#7c6950] hover:text-[#3c3020] transition-colors py-2 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className={`h-4 w-4 ${highContrast ? 'text-white' : 'text-amber-700'}`} />
                    Gonka Proof of Execution (Request Audit)
                  </span>
                  {showAudit ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {showAudit && (
                  <div className={`mt-3 p-4 rounded-lg border font-mono text-[10px] space-y-3.5 animate-in slide-in-from-top-2 duration-200 ${
                    highContrast ? 'bg-black border-white text-white' : 'bg-[#faf6ee] border-[#ebdcb8] text-[#7c6950]'
                  }`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className={`font-bold block ${highContrast ? 'text-white' : 'text-[#5c4a36]'}`}>Model 1 (Extractor):</span>
                        <span className={`block text-[9px] ${highContrast ? 'text-white' : 'text-[#8c7960]'}`}>{result.model1Used}</span>
                        <div className={`p-2.5 rounded border select-all break-all ${
                          highContrast ? 'bg-black border-white text-white' : 'bg-white border-[#ebdcb8] text-[#3c3020]'
                        }`}>
                          {result.model1RequestId}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className={`font-bold block ${highContrast ? 'text-white' : 'text-[#5c4a36]'}`}>Model 2 (Auditor):</span>
                        <span className={`block text-[9px] ${highContrast ? 'text-white' : 'text-[#8c7960]'}`}>{result.model2Used}</span>
                        <div className={`p-2.5 rounded border select-all break-all ${
                          highContrast ? 'bg-black border-white text-white' : 'bg-white border-[#ebdcb8] text-[#3c3020]'
                        }`}>
                          {result.model2RequestId}
                        </div>
                      </div>
                    </div>
                    <div className={`pt-2 border-t text-[9px] flex items-center justify-between ${
                      highContrast ? 'border-white text-white' : 'border-[#ebdcb8] text-[#8c7960]'
                    }`}>
                      <span>Base API: https://api.gonkarouter.io/v1</span>
                      <a 
                        href="https://gonkarouter.io" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`flex items-center gap-1 ${
                          highContrast ? 'text-white underline' : 'text-amber-800 hover:text-amber-900'
                        }`}
                      >
                        gonkarouter.io <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

            </section>
          );
        })()}

        {/* Collapsible Connection Diagnostic (Developer/Judge Verification Tool) */}
        <div className="pt-4 border-t border-[#ebdcb8]/45">
          <button
            onClick={() => setShowDevTest(!showDevTest)}
            className="flex items-center gap-1.5 text-[10px] font-bold text-[#7c6950] hover:text-[#2c2214] transition-colors cursor-pointer"
          >
            <Info className="h-3 w-3" />
            {showDevTest ? 'Hide Connection Test' : 'Run Gonka Gateway Connection Test'}
          </button>
          
          {showDevTest && (
            <div className={`mt-3 border rounded-xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200 ${
              highContrast ? 'bg-black border-white' : 'bg-[#fcfbfa] border-[#ebdcb8] shadow-sm'
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${
                highContrast ? 'border-white' : 'border-[#e6decb]'
              }`}>
                <div>
                  <h3 className="font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle className={`h-4 w-4 ${highContrast ? 'text-white' : 'text-amber-700'}`} />
                    Gonka Router Connection
                  </h3>
                  <p className={`text-[11px] ${highContrast ? 'text-white' : 'text-[#7c6950]'}`}>Validation for direct endpoint authentication.</p>
                </div>
                <button
                  onClick={handleVerifyGonka}
                  disabled={devLoading}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                    highContrast 
                      ? 'bg-black text-white border-white hover:bg-zinc-900' 
                      : 'bg-[#3c3020] text-[#faf6ee] border-[#3c3020] hover:bg-[#2c2317]'
                  }`}
                >
                  {devLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Run Test'}
                </button>
              </div>

              {devResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {devResult.error ? (
                    <div className={`col-span-2 p-3 border rounded-lg ${
                      highContrast ? 'bg-black border-white text-white' : 'bg-[#fff5f5] border-rose-200 text-rose-700'
                    }`}>
                      <span className="font-bold">Error:</span> {devResult.error}
                    </div>
                  ) : (
                    <>
                      <div className={`p-3 rounded-lg border ${highContrast ? 'bg-black border-white' : 'bg-[#faf6ee] border-[#e9e2d3]'}`}>
                        <span className={`block mb-1 uppercase font-bold text-[9px] tracking-wider ${highContrast ? 'text-white' : 'text-[#7c6950]'}`}>Response:</span>
                        <p className={highContrast ? 'text-white' : 'text-[#3c3020]'}>{devResult.text}</p>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${highContrast ? 'bg-black border-white' : 'bg-[#faf6ee] border-[#e9e2d3]'}`}>
                        <span className={`block mb-1 uppercase font-bold text-[9px] tracking-wider ${highContrast ? 'text-white' : 'text-[#7c6950]'}`}>Request ID:</span>
                        <p className={highContrast ? 'text-white' : 'text-amber-850 font-bold break-all select-all'}>{devResult.requestId}</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 text-center text-xs mt-auto ${
        highContrast ? 'bg-black border-white text-white' : 'border-[#ebdcb8] bg-[#fbf8f3] text-[#8c7960]'
      }`}>
        <p>© 2026 CivicPulse Explainer. Powering citizens with media transparency via Gonka Network.</p>
      </footer>
    </div>
  );
}
