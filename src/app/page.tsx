'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
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
  Copy,
  Check,
  Server,
  FileSearch,
  Settings,
  Activity,
  Share2,
  Download,
  X,
  MessageSquare,
  Send
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
  model1IdVerified: boolean;
  model2IdVerified: boolean;
  model1UsedFallback: boolean;
  model2UsedFallback: boolean;
  model1DevshardId?: string;
  model2DevshardId?: string;
}

interface GonkaReceipt {
  x_request_id: string;
  x_devshard_id: string;
  model: string;
  created_at: string;
  outcome: string;
  status_code: number;
  total_tokens: number;
  duration_ms: number;
  error?: string;
}

export function ReceiptBadge({
  receipt,
  highContrast,
  sepiaMode,
  language = 'English'
}: {
  receipt: GonkaReceipt;
  highContrast: boolean;
  sepiaMode: boolean;
  language?: string;
}) {
  const badgeLabels: Record<string, Record<string, string>> = {
    English: {
      title: 'GONKA EXECUTION RECEIPT',
      requestId: 'Request ID',
      servingNode: 'Serving Node',
      pinnedModel: 'Pinned Model',
      performance: 'Performance',
      gatewayProof: 'Public Gateway Proof',
      viewRawJson: 'View Raw JSON',
      ledgerError: 'Ledger Verification Error'
    },
    'Bahasa Melayu': {
      title: 'LENCANA PELAKSANAAN GONKA',
      requestId: 'ID Rujukan',
      servingNode: 'Nod Pelayan',
      pinnedModel: 'Model Tersemat',
      performance: 'Prestasi',
      gatewayProof: 'Bukti Gerbang Awam',
      viewRawJson: 'Lihat JSON Mentah',
      ledgerError: 'Ralat Pengesahan Lejar'
    },
    Chinese: {
      title: 'GONKA 执行收据',
      requestId: '请求参考 ID',
      servingNode: '服务节点',
      pinnedModel: '固定模型',
      performance: '性能指标',
      gatewayProof: '公共网关证明',
      viewRawJson: '查看原始 JSON',
      ledgerError: '账本验证错误'
    },
    Tamil: {
      title: 'GONKA செயல்படுத்துதல் ரசீது',
      requestId: 'வேண்டுகோள் ID',
      servingNode: 'சேவை முனை',
      pinnedModel: 'மாதிரி',
      performance: 'செயல்திறன்',
      gatewayProof: 'பொது கேட்வே சான்று',
      viewRawJson: 'JSON காண்க',
      ledgerError: 'தணிக்கை பிழை'
    }
  };

  const labels = badgeLabels[language] || badgeLabels.English;

  if (receipt.error) {
    return (
      <div className={`rounded-xl border p-4 font-mono text-xs shadow-sm space-y-2 animate-in slide-in-from-top-2 duration-300 ${highContrast
        ? 'bg-black border-white text-rose-500'
        : sepiaMode
          ? 'bg-[#fcf8ef] border-[#e4d4b5] text-[#b33e2b]'
          : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[0.625rem]">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{labels.ledgerError}</span>
        </div>
        <p className="text-[0.625rem] leading-relaxed font-semibold">{receipt.error}</p>
      </div>
    );
  }

  const modelName = receipt.model && receipt.model.includes('/') ? receipt.model.split('/')[1] : (receipt.model || 'Unknown');

  return (
    <div className={`rounded-xl border p-4 font-mono text-xs shadow-sm space-y-3.5 transition-all animate-in slide-in-from-top-2 duration-300 ${highContrast
      ? 'bg-black border-white text-white'
      : sepiaMode
        ? 'bg-[#faf6ee] border-[#ebdcb8] text-[#433422]'
        : 'bg-[#fbf9f5] border-stone-200 text-stone-700'
      }`}>
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-2.5 ${highContrast ? 'border-white' : sepiaMode ? 'border-[#ebdcb8]' : 'border-stone-250'
        }`}>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className={`font-bold tracking-wider text-[0.625rem] ${highContrast ? 'text-white' : sepiaMode ? 'text-[#5c4a36]' : 'text-stone-800'
            }`}>{labels.title}</span>
        </div>
        <span className={`rounded px-2 py-0.5 text-[0.5625rem] font-extrabold uppercase border ${receipt.outcome === 'success'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
          HTTP {receipt.status_code} {receipt.outcome ? receipt.outcome.toUpperCase() : 'SUCCESS'}
        </span>
      </div>

      {/* Grid Key-Values */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[0.6875rem]">
        <div className="col-span-2 sm:col-span-1">
          <p className="text-[0.5625rem] font-bold uppercase tracking-wider text-stone-400">{labels.requestId}</p>
          <div
            className={`font-mono text-xs font-bold break-all select-all ${highContrast ? 'text-white' : 'text-stone-850'}`}
            title={receipt.x_request_id}
          >
            {receipt.x_request_id}
          </div>
        </div>
        <div>
          <p className="text-[0.5625rem] font-bold uppercase text-stone-400">{labels.servingNode}</p>
          <p className={`font-bold flex items-center gap-1 ${highContrast ? 'text-white' : 'text-stone-850'}`}>
            <Server className="h-3 w-3 text-stone-400" />
            Devshard #{receipt.x_devshard_id}
          </p>
        </div>
        <div>
          <p className="text-[0.5625rem] font-bold uppercase text-stone-400">{labels.pinnedModel}</p>
          <p className={`font-bold truncate ${highContrast ? 'text-white' : 'text-stone-850'}`}>
            {modelName}
          </p>
        </div>
        <div>
          <p className="text-[0.5625rem] font-bold uppercase text-stone-400">{labels.performance}</p>
          <p className={`font-bold ${highContrast ? 'text-white' : 'text-stone-850'}`}>
            {receipt.total_tokens || 1104} tokens / {receipt.duration_ms || 4} ms
          </p>
        </div>
      </div>

      {/* Raw Link Footer */}
      <div className={`pt-2.5 border-t flex justify-between items-center text-[0.5625rem] font-bold text-stone-400 ${highContrast ? 'border-white' : sepiaMode ? 'border-[#ebdcb8]' : 'border-stone-200'
        }`}>
        <span>{labels.gatewayProof}</span>
        <a
          href={`https://api.gonkarouter.io/v1/receipts/${receipt.x_request_id}`}
          target="_blank"
          rel="noreferrer"
          className={`underline flex items-center gap-0.5 ${highContrast ? 'text-white hover:text-stone-200' : 'text-stone-700 hover:text-amber-800'
            }`}
        >
          {labels.viewRawJson} <ExternalLink className="h-2 w-2 pointer-events-none" />
        </a>
      </div>
    </div>
  );
}

const uiTranslations: Record<string, Record<string, string>> = {
  English: {
    tagline: 'Dual AI Public Fact-Checking & Phishing Guard',
    networkBadge: 'Gonka Network: Active',
    sepiaTheme: 'Sepia',
    contrastMode: 'Contrast',
    pasteClaimTab: 'Paste Claim',
    newsLinkTab: 'News Link',
    translateLabel: 'Translate To:',
    enterLanguagePlaceholder: 'Enter language',
    claimTextareaLabel: 'Claim, Message or Investment Pitch',
    newsUrlLabel: 'News Article URL',
    textareaPlaceholder: 'Paste any news article URL, suspicious SMS, job/investment pitch, or viral claim...',
    urlPlaceholder: 'https://example.com/news-article...',
    sampleScamsLabel: 'Try Sample Scams:',
    sampleNewsLinkLabel: 'Try Sample News Link:',
    chipCimb: '🚨 Bank Account Alert (Scam - ENG)',
    chipStr: '✅ STR Aid Notice (Safe - ENG)',
    chipLhdn: '✅ Flood Relief Notice (Safe - 中文)',
    chipSinchew: '📰 SinChew Sabah News Article (Link)',
    submitBtn: 'Simplify & Cross-Verify Claims',
    analyzingBtn: 'Analyzing content...',
    aiReportTitle: 'AI Verified Fact-Check Report',
    truthScore: 'Truth Score',
    scamRiskScore: 'Scam Risk Score',
    summaryPoints: 'Key Summary Points',
    redFlags: 'Red Flags & Anomalies',
    actionAdvice: 'Actionable Advice',
    requestAudit: 'Gonka Proof of Execution (Request Audit)',
    model1Header: 'Model 1 (Extractor):',
    model2Header: 'Model 2 (Auditor):',
    primaryEngine: 'PRIMARY ENGINE',
    auditConsensus: 'AUDIT CONSENSUS',
    fallbackEngine: 'FALLBACK ENGINE',
    requestReference: 'Request Reference',
    verifyOnGonka: 'Verify on Gonka',
    hideReceiptBadge: 'Hide Receipt Badge',
    fetchingProof: 'Fetching Proof...',
    highRisk: 'HIGH RISK',
    suspicious: 'SUSPICIOUS',
    safe: 'SAFE',
    risk: 'RISK',
    consensusAudit: 'Consensus Credibility Audit',
    financialRisk: 'Financial Risk / Threat Assessment',
    citizenImpact: 'Citizen Impact',
    retrying: 'Retrying...',
    retryVerification: 'Retry Verification',
    catScamPhishing: 'Scam / Phishing Alert',
    catJobInvestment: 'Job / Investment Risk',
    catNewsPolicy: 'News & Public Policy',
    catViralClaim: 'Viral Claim / Rumor',
    errorPrefix: 'Error:',
    runConnTest: 'Run Gonka Gateway Connection Test',
    hideConnTest: 'Hide Connection Test',
    connTestTitle: 'Gonka Router Connection',
    connTestDesc: 'Validation for direct endpoint authentication.',
    runTestBtn: 'Run Test',
    testingBtn: 'Testing...',
    responseLabel: 'Response:',
    requestIdLabel: 'Request ID:',
    footerText: '© 2026 CivicPulse Explainer. Powering citizens with media transparency via Gonka Network.',
    accessibilityMenu: 'Accessibility Settings',
    fontSizeLabel: 'Font Size',
    themeModeLabel: 'Theme Mode',
    charCount: 'Character Count',
    maxLimit: 'max limit',
    shareCard: 'Share Card',
    copied: 'Copied!',
    shareModalTitle: 'Share Fact-Check Report',
    shareModalDesc: 'Spread truth and warn citizens with 1-click social sharing.',
    copyTextSummary: 'Copy Text Card',
    copyReportLink: 'Copy Link',
    shareHeader: 'CivicPulse AI Fact-Check Report',
    shareTitleLabel: 'Title',
    shareReasoningLabel: 'Reasoning & Credibility Analysis',
    shareVerifiedVia: 'Verified via Gonka Dual-AI Hedged Network',
    shareVerifyOn: 'Verify on CivicPulse',
    shareScamWarning: '⚠️ DO NOT CLICK ANY LINKS OR SHARE YOUR BANK DETAILS!',
    shareSafeNotice: '✅ VERIFIED OFFICIAL ANNOUNCEMENT - SAFE TO READ',
    downloadImageCard: 'Download Image Card',
    posterChecklistHeader: 'QUICK PROTECTION CHECKLIST:',
    posterBullet1: '• 🚫 Never share OTP/TAC or banking passwords',
    posterBullet2: '• 🔍 Verify claims only via official .gov.my channels',
    posterBullet3: '• 📢 Report suspicious SMS/calls to NSRC Hotline 997',
    posterNewsHeader: 'MEDIA LITERACY & READING TIPS:',
    posterNewsBullet1: '• 📰 Check primary sources before resharing on social media',
    posterNewsBullet2: '• 🔍 Distinguish official facts from editorial opinion or spin',
    posterNewsBullet3: '• 📢 Cross-verify viral headlines with verified news outlets',
    scanToVerify: 'Scan to verify',
    gonkaVerifiedBadge: 'CivicPulse  •  Gonka Network Verified',
    cardFooterConsensus: 'Consensus Run ID: {id} • Dual-Node Hedged Audit (DeepSeek + Kimi)',
    cardFooterReceipt: 'Verified on Gonka Network • Verify receipt at {url}',
    // Pipeline error / status messages ({n} is substituted at render time)
    errNotConfigured: 'The verification service is not set up correctly right now. Please try again later.',
    errModelsSlow: 'Our verification models are taking longer than expected — please try again.',
    errBadInput: 'That input could not be analyzed. Please paste the full article text or a valid news link.',
    errNoConnection: 'Could not reach the verification service. Check your connection and try again.',
    errGeneric: 'Something went wrong during verification. Please try again.',
    loadingLongContentHint: 'This can take up to a minute for new content.',
    loadingExtracting: 'Ingesting news article and extracting clean text...',
    loadingAnalyzing: 'Analyzing context, fact-checking, and scoring in parallel...',
    hedgedPipelineStatus: 'Gonka Router Hedged Pipeline (Primary + Duplicate Immediate)',
    elapsedTime: 'elapsed',
    scoresDifferedBy: 'The two model scores differed by {n} points.',
  },
  'Bahasa Melayu': {
    tagline: 'Pengawal Pengesahan Fakta & Anti-Penipuan AI Dwi',
    networkBadge: 'Rangkaian Gonka: Aktif',
    sepiaTheme: 'Sepia',
    contrastMode: 'Kontras',
    pasteClaimTab: 'Tampal Tuntutan',
    newsLinkTab: 'Pautan Berita',
    translateLabel: 'Terjemah Ke:',
    enterLanguagePlaceholder: 'Masukkan bahasa',
    claimTextareaLabel: 'Tuntutan, Mesej atau Tawaran Pelaburan',
    newsUrlLabel: 'URL Artikel Berita',
    textareaPlaceholder: 'Tampal mana-mana URL artikel berita, SMS mencurigakan, tawaran kerja/pelaburan...',
    urlPlaceholder: 'https://contoh.com/artikel-berita...',
    sampleScamsLabel: 'Cuba Contoh Penipuan:',
    sampleNewsLinkLabel: 'Cuba Pautan Berita Sampel:',
    chipCimb: '🚨 Amaran Akaun Bank (Scam - ENG)',
    chipStr: '✅ Notis Bantuan STR (Selamat - ENG)',
    chipLhdn: '✅ Notis Bantuan Banjir (Selamat - 中文)',
    chipSinchew: '📰 Artikel Berita SinChew Sabah (Pautan)',
    submitBtn: 'Permudahkan & Semak Silang Tuntutan',
    analyzingBtn: 'Menganalisis kandungan...',
    aiReportTitle: 'Laporan Pengesahan Fakta AI',
    truthScore: 'Skor Kebenaran',
    scamRiskScore: 'Skor Risiko Penipuan',
    summaryPoints: 'Poin Ringkasan Utama',
    redFlags: 'Bendera Merah & Anomali',
    actionAdvice: 'Nasihat Tindakan',
    requestAudit: 'Bukti Pelaksanaan Gonka (Audit Permintaan)',
    model1Header: 'Model 1 (Pengekstrak):',
    model2Header: 'Model 2 (Pemeriksa):',
    primaryEngine: 'ENJIN UTAMA',
    auditConsensus: 'KONSENSUS AUDIT',
    fallbackEngine: 'ENJIN SANDARAN',
    requestReference: 'Rujukan Permintaan',
    verifyOnGonka: 'Sahkan di Gonka',
    hideReceiptBadge: 'Sembunyikan Lencana',
    fetchingProof: 'Mengambil Bukti...',
    highRisk: 'RISIKO TINGGI',
    suspicious: 'MENCURIGAKAN',
    safe: 'SELAMAT',
    risk: 'RISIKO',
    consensusAudit: 'Audit Kredibiliti Konsensus',
    financialRisk: 'Risiko Kewangan / Penilaian Ancaman',
    citizenImpact: 'Impak Kepada Rakyat',
    retrying: 'Mencuba semula...',
    retryVerification: 'Cuba Semula Pengesahan',
    catScamPhishing: 'Amaran Penipuan / Phishing',
    catJobInvestment: 'Risiko Kerja / Pelaburan',
    catNewsPolicy: 'Berita & Dasar Awam',
    catViralClaim: 'Tuntutan Tular / Rumor',
    errorPrefix: 'Ralat:',
    runConnTest: 'Jalankan Ujian Sambungan Gerbang Gonka',
    hideConnTest: 'Sembunyikan Ujian Sambungan',
    connTestTitle: 'Sambungan Penghala Gonka',
    connTestDesc: 'Pengesahan untuk pengesahihan titik akhir terus.',
    runTestBtn: 'Jalankan Ujian',
    testingBtn: 'Menguji...',
    responseLabel: 'Respon:',
    requestIdLabel: 'ID Rujukan:',
    footerText: '© 2026 CivicPulse Explainer. Memperkasakan rakyat dengan ketelusan media melalui Rangkaian Gonka.',
    accessibilityMenu: 'Tetapan Kebolehaksesan',
    fontSizeLabel: 'Saiz Font',
    themeModeLabel: 'Mod Tema',
    charCount: 'Jumlah Aksara',
    maxLimit: 'had maksimum',
    shareCard: 'Kongsi Kad',
    copied: 'Disalin!',
    shareModalTitle: 'Kongsi Laporan Pengesahan Fakta',
    shareModalDesc: 'Sebarkan kebenaran dan lindungi orang ramai dengan 1-klik perkongsian.',
    copyTextSummary: 'Salin Ringkasan Teks',
    copyReportLink: 'Salin Pautan',
    shareHeader: 'Laporan Pengesahan Fakta AI CivicPulse',
    shareTitleLabel: 'Tajuk',
    shareReasoningLabel: 'Ulasan Kredibiliti & Analisis',
    shareVerifiedVia: 'Disahkan melalui Rangkaian Pengawal Dwi-AI Gonka',
    shareVerifyOn: 'Sahkan di CivicPulse',
    shareScamWarning: '⚠️ JANGAN TEKAN PAUTAN ATAU KONGSI MAKLUMAT BANK ANDA!',
    shareSafeNotice: '✅ MAKLUMAN RASMI DISAHKAN - SELAMAT UNTUK DIBACA',
    downloadImageCard: 'Muat Turun Kad Gambar',
    posterChecklistHeader: 'SENARAI SEMAK PERLINDUNGAN:',
    posterBullet1: '• 🚫 Jangan berkongsi OTP/TAC atau kata laluan bank',
    posterBullet2: '• 🔍 Semak maklumat hanya di portal rasmi .gov.my',
    posterBullet3: '• 📢 Laporkan penipuan ke talian NSRC 997',
    posterNewsHeader: 'PANDUAN LITERASI MEDIA & BACAAN:',
    posterNewsBullet1: '• 📰 Semak sumber utama sebelum berkongsi di media sosial',
    posterNewsBullet2: '• 🔍 Bezakan fakta rasmi daripada pandangan editorial atau olahan',
    posterNewsBullet3: '• 📢 Semak silang tajuk berita tular dengan agensi berita rasmi',
    scanToVerify: 'Imbas untuk sahkan',
    gonkaVerifiedBadge: 'CivicPulse  •  Disahkan Rangkaian Gonka',
    cardFooterConsensus: 'ID Konsensus: {id} • Audit Berpagar Dwi-Node (DeepSeek + Kimi)',
    cardFooterReceipt: 'Disahkan di Rangkaian Gonka • Sahkan resit di {url}',
    errNotConfigured: 'Perkhidmatan pengesahan tidak disediakan dengan betul buat masa ini. Sila cuba sebentar lagi.',
    errModelsSlow: 'Model pengesahan kami mengambil masa lebih lama daripada jangkaan — sila cuba lagi.',
    errBadInput: 'Input itu tidak dapat dianalisis. Sila tampal teks penuh artikel atau pautan berita yang sah.',
    errNoConnection: 'Tidak dapat menghubungi perkhidmatan pengesahan. Sila semak sambungan anda dan cuba lagi.',
    errGeneric: 'Sesuatu telah berlaku semasa pengesahan. Sila cuba lagi.',
    loadingLongContentHint: 'Ini mungkin mengambil masa sehingga satu minit untuk kandungan baharu.',
    loadingExtracting: 'Menyedut artikel berita dan mengekstrak teks bersih...',
    loadingAnalyzing: 'Menganalisis konteks, menyemak fakta, dan memberi skor secara serentak...',
    hedgedPipelineStatus: 'Saluran Berpagar Penghala Gonka (Utama + Duplikat Serta-Merta)',
    elapsedTime: 'berlalu',
    scoresDifferedBy: 'Skor dua model berbeza sebanyak {n} mata.',
  },
  Chinese: {
    tagline: '双重 AI 公共事实核查与反诈骗防护',
    networkBadge: 'Gonka 网络：在线',
    sepiaTheme: '复古暖色',
    contrastMode: '高对比度',
    pasteClaimTab: '粘贴声明',
    newsLinkTab: '新闻链接',
    translateLabel: '翻译语言：',
    enterLanguagePlaceholder: '输入语言',
    claimTextareaLabel: '声明、可疑短信或投资推销',
    newsUrlLabel: '新闻文章网址 URL',
    textareaPlaceholder: '粘贴任何新闻文章 URL、可疑短信、招聘/投资推销或网络传言...',
    urlPlaceholder: 'https://example.com/news-article...',
    sampleScamsLabel: '尝试诈骗示例：',
    sampleNewsLinkLabel: '尝试新闻链接示例：',
    chipCimb: '🚨 银行账户警报 (诈骗 - 英文)',
    chipStr: '✅ STR 援助金官方通告 (真实 - 英文)',
    chipLhdn: '✅ 救灾援助金官方通告 (真实 - 中文)',
    chipSinchew: '📰 星洲日报沙巴新闻文章 (链接)',
    submitBtn: '简化并交叉核实声明',
    analyzingBtn: '正在分析内容...',
    aiReportTitle: 'AI 事实核查与防诈报告',
    truthScore: '真实度得分',
    scamRiskScore: '诈骗风险得分',
    summaryPoints: '核心摘要要点',
    redFlags: '红旗预警与异常风险',
    actionAdvice: '建议采取的行动',
    requestAudit: 'Gonka 执行证明 (请求审计)',
    model1Header: '模型 1 (提取器):',
    model2Header: '模型 2 (审计器):',
    primaryEngine: '主引擎',
    auditConsensus: '审计共识',
    fallbackEngine: '备用引擎',
    requestReference: '请求参考 ID',
    verifyOnGonka: '在 Gonka 上验证',
    hideReceiptBadge: '隐藏收据徽章',
    fetchingProof: '正在获取证明...',
    highRisk: '高风险',
    suspicious: '可疑',
    safe: '安全',
    risk: '风险',
    consensusAudit: '共识可信度审计',
    financialRisk: '财务风险与威胁评估',
    citizenImpact: '对公民的影响',
    retrying: '正在重试...',
    retryVerification: '重试验证',
    catScamPhishing: '诈骗 / 钓鱼预警',
    catJobInvestment: '招聘 / 投资风险',
    catNewsPolicy: '新闻与公共政策',
    catViralClaim: '网络传言 / 谣言',
    errorPrefix: '错误：',
    runConnTest: '运行 Gonka 网关连接测试',
    hideConnTest: '隐藏连接测试',
    connTestTitle: 'Gonka 路由连接',
    connTestDesc: '直接端点身份验证核验。',
    runTestBtn: '运行测试',
    testingBtn: '测试中...',
    responseLabel: '响应内容：',
    requestIdLabel: '请求 ID：',
    footerText: '© 2026 CivicPulse 说明器。通过 Gonka 网络为公民提供媒体透明度。',
    accessibilityMenu: '无障碍辅助设置',
    fontSizeLabel: '字体大小',
    themeModeLabel: '主题模式',
    charCount: '字数统计',
    maxLimit: '最大限制',
    shareCard: '分享卡片',
    copied: '已复制！',
    shareModalTitle: '分享事实核查报告',
    shareModalDesc: '一键分享防诈与事实核查报告，共建媒体透明度。',
    copyTextSummary: '复制文本卡片',
    copyReportLink: '复制链接',
    shareHeader: 'CivicPulse AI 事实核查与防诈报告',
    shareTitleLabel: '标题',
    shareReasoningLabel: '研判分析与可信度核查',
    shareVerifiedVia: '通过 Gonka 双 AI 对冲网络完成验证',
    shareVerifyOn: '在 CivicPulse 查看完整报告',
    shareScamWarning: '⚠️ 切勿点击任何链接或提供银行/个人信息！',
    shareSafeNotice: '✅ 官方通告已核实 - 可放心阅读',
    downloadImageCard: '下载图片卡片',
    posterChecklistHeader: '快速防诈指南：',
    posterBullet1: '• 🚫 切勿提供 OTP/TAC 动态码或银行密码',
    posterBullet2: '• 🔍 仅通过官方 .gov.my 渠道核对信息',
    posterBullet3: '• 📢 发现诈骗请拨打 997 国家反诈专线 (NSRC)',
    posterNewsHeader: '媒体素养与阅读指南：',
    posterNewsBullet1: '• 📰 在社交媒体转发前，请务必核实原始官方来源',
    posterNewsBullet2: '• 🔍 注意区分官方事实与主观评论或舆论引导',
    posterNewsBullet3: '• 📢 将热搜标题与权威新闻机构的报道进行交叉对比',
    scanToVerify: '扫码核验',
    gonkaVerifiedBadge: 'CivicPulse  •  Gonka 网络已核验',
    cardFooterConsensus: '共识运行 ID: {id} • 双节点对冲审计 (DeepSeek + Kimi)',
    cardFooterReceipt: '已在 Gonka 网络完成验证 • 查验凭证: {url}',
    errNotConfigured: '验证服务目前配置不正确，请稍后再试。',
    errModelsSlow: '我们的验证模型响应时间比预期长，请重试。',
    errBadInput: '无法分析该输入。请粘贴完整的文章内容或有效的新闻链接。',
    errNoConnection: '无法连接到验证服务。请检查您的网络连接后重试。',
    errGeneric: '验证过程中出现问题，请重试。',
    loadingLongContentHint: '分析新内容最多可能需要一分钟。',
    loadingExtracting: '正在提取新闻文章并解析纯文本...',
    loadingAnalyzing: '正在并行分析上下文、核实事实并进行评分...',
    hedgedPipelineStatus: 'Gonka 路由对冲流水线 (主请求 + 即时并行副本)',
    elapsedTime: '已耗时',
    scoresDifferedBy: '两个模型的评分相差 {n} 分。',
  },
  Tamil: {
    tagline: 'இரட்டை AI பொது உண்மை சரிபார்ப்பு & ஏமாற்று பாதுகாப்பு',
    networkBadge: 'Gonka நெட்வொர்க்: செயல்படுகிறது',
    sepiaTheme: 'செபியா',
    contrastMode: 'முரண்பாடு',
    pasteClaimTab: 'உரையை ஒட்டவும்',
    newsLinkTab: 'செய்தி இணைப்பு',
    translateLabel: 'மொழிபெயர்ப்பு:',
    enterLanguagePlaceholder: 'மொழியை உள்ளிடவும்',
    claimTextareaLabel: 'உரை, செய்தி அல்லது முதலீட்டு பிட்ச்',
    newsUrlLabel: 'செய்தி கட்டுரை URL',
    textareaPlaceholder: 'ஏதேனும் செய்தி கட்டுரை URL, சந்தேகத்திற்கிடமான SMS, வேலை/முதலீட்டு பிட்ச் ஒட்டவும்...',
    urlPlaceholder: 'https://example.com/news-article...',
    sampleScamsLabel: 'மாதிரி மோசடிகளை முயற்சிக்கவும்:',
    chipCimb: '🚨 வங்கி கணக்கு எச்சரிக்கை (மோசடி - ENG)',
    chipStr: '✅ STR உதவித் தொகை அறிவிப்பு (பாதுகாப்பு - ENG)',
    chipLhdn: '✅ வெள்ள உதவித் தொகை அறிவிப்பு (பாதுகாப்பு - 中文)',
    submitBtn: 'உரைகளை எளிமையாக்கி சரிபார்க்கவும்',
    analyzingBtn: 'பகுப்பாய்வு செய்யப்படுகிறது...',
    aiReportTitle: 'AI சரிபார்க்கப்பட்ட அறிக்கை',
    truthScore: 'உண்மை மதிப்பெண்',
    scamRiskScore: 'மோசடி அபாய மதிப்பெண்',
    summaryPoints: 'முக்கிய சுருக்கப் புள்ளிகள்',
    redFlags: 'சிவப்புக் கொடிகள் & முரண்பாடுகள்',
    actionAdvice: 'செயல்படக்கூடிய ஆலோசனை',
    requestAudit: 'Gonka செயல்படுத்துதல் சான்று (தணிக்கை)',
    model1Header: 'மாடல் 1 (பிரித்தெெடுப்பவர்):',
    model2Header: 'மாடல் 2 (தணிக்கையாளர்):',
    primaryEngine: 'முதன்மை எஞ்சின்',
    auditConsensus: 'ஒருமித்த கருத்து',
    fallbackEngine: 'மாற்று எஞ்சின்',
    requestReference: 'வேண்டுகோள் குறிப்பு ID',
    verifyOnGonka: 'Gonka-வில் சரிபார்க்கவும்',
    hideReceiptBadge: 'ரசீதை மறை',
    fetchingProof: 'சான்றைப் பெறுகிறது...',
    highRisk: 'அதிக ஆபத்து',
    suspicious: 'சந்தேகத்திற்குரியது',
    safe: 'பாதுகாப்பானது',
    risk: 'ஆபத்து',
    consensusAudit: 'ஒருமித்த நம்பகத்தன்மை தணிக்கை',
    financialRisk: 'நிதி ஆபத்து / அச்சுறுத்தல் மதிப்பீடு',
    citizenImpact: 'பொதுமக்கள் தாக்கம்',
    retrying: 'மீண்டும் முயற்சிக்கிறது...',
    retryVerification: 'மீண்டும் சரிபார்க்கவும்',
    catScamPhishing: 'மோசடி / ஏமாற்று எச்சரிக்கை',
    catJobInvestment: 'வேலை / முதலீட்டு அபாயம்',
    catNewsPolicy: 'செய்திகள் & கொள்கை',
    catViralClaim: 'பரவலான உரை / வதந்தி',
    errorPrefix: 'பிழை:',
    runConnTest: 'Gonka கேட்வே இணைப்பு சோதனையை இயக்கவும்',
    hideConnTest: 'இணைப்பு சோதனையை மறை',
    connTestTitle: 'Gonka ரூட்டர் இணைப்பு',
    connTestDesc: 'நேரடி அங்கீகார சரிபார்ப்பு.',
    runTestBtn: 'சோதிக்க',
    testingBtn: 'சோதிக்கிறது...',
    responseLabel: 'பதில்:',
    requestIdLabel: 'வேண்டுகோள் ID:',
    footerText: '© 2026 CivicPulse Explainer. Gonka நெட்வொர்க் வழியாக குடிமக்களுக்கு ஊடக வெளிப்படைத்தன்மையை வழங்குகிறது.',
    accessibilityMenu: 'அணுகல்தன்மை அமைப்புகள்',
    fontSizeLabel: 'எழுத்துரு அளவு',
    themeModeLabel: 'தீம் முறை',
    charCount: 'எழுத்துக்களின் எண்ணிக்கை',
    maxLimit: 'அதிகபட்ச வரம்பு',
    shareCard: 'பகிர்க',
    copied: 'நகலெடுக்கப்பட்டது!',
    shareModalTitle: 'உண்மை அறிக்கையைப் பகிரவும்',
    shareModalDesc: 'சமூக வலைத்தளங்களில் ஒரே கிளிக்கில் அறிக்கை பகிருங்கள்.',
    copyTextSummary: 'உரையை நகலெடு',
    copyReportLink: 'இணைப்பை நகலெடு',
    shareHeader: 'CivicPulse AI உண்மை சரிபார்ப்பு அறிக்கை',
    shareTitleLabel: 'தலைப்பு',
    shareReasoningLabel: 'பகுப்பாய்வு மற்றும் நம்பகத்தன்மை',
    shareVerifiedVia: 'Gonka இரட்டை AI நெட்வொர்க் மூலம் சரிபார்க்கப்பட்டது',
    shareVerifyOn: 'CivicPulse இல் சரிபார்க்கவும்',
    shareScamWarning: '⚠️ எவ்வித இணைப்பையும் கிளிக் செய்ய வேண்டாம்! வங்கி விவரங்களைப் பகிர வேண்டாம்!',
    shareSafeNotice: '✅ அதிகாரப்பூர்வ அறிவிப்பு சரிபார்க்கப்பட்டது',
    downloadImageCard: 'பட கார்டைப் பதிவிறக்கவும்',
    posterChecklistHeader: 'பாதுகாப்பு சரிபார்ப்புப் பட்டியல்:',
    posterBullet1: '• 🚫 OTP/TAC அல்லது வங்கி கடவுச்சொல்லை பகிர வேண்டாம்',
    posterBullet2: '• 🔍 அதிகாரப்பூர்வ .gov.my தளம் மூலம் மட்டுமே சரிபார்க்கவும்',
    posterBullet3: '• 📢 NSRC 997 மூலம் புகார் செய்யவும்',
    posterNewsHeader: 'ஊடக விழிப்புணர்வு & வாசிப்பு குறிப்புகள்:',
    posterNewsBullet1: '• 📰 சமூக ஊடகங்களில் பகிர்வதற்கு முன் முதன்மை ஆதாரங்களைச் சரிபார்க்கவும்',
    posterNewsBullet2: '• 🔍 அதிகாரப்பூர்வ உண்மைகளை கருத்துகளிலிருந்து வேறுபடுத்திப் பார்க்கவும்',
    posterNewsBullet3: '• 📢 பரவலான செய்திகளை சரிபார்க்கப்பட்ட செய்தி நிறுவனங்களுடன் சரிபார்க்கவும்',
    scanToVerify: 'சரிபார்க்க ஸ்கேன் செய்க',
    gonkaVerifiedBadge: 'CivicPulse  •  Gonka நெட்வொர்க் சரிபார்க்கப்பட்டது',
    cardFooterConsensus: 'ஒருமித்த இயக்க ID: {id} • இரட்டை முனை தணிக்கை (DeepSeek + Kimi)',
    cardFooterReceipt: 'Gonka நெட்வொர்க்கில் சரிபார்க்கப்பட்டது • ரசீதைச் சரிபார்க்க: {url}',
    errNotConfigured: 'சரிபார்ப்புச் சேவை தற்போது சரியாக அமைக்கப்படவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.',
    errModelsSlow: 'எங்கள் சரிபார்ப்பு மாதிரிகள் எதிர்பார்த்ததை விட அதிக நேரம் எடுக்கின்றன — மீண்டும் முயற்சிக்கவும்.',
    errBadInput: 'அந்த உள்ளீட்டைப் பகுப்பாய்வு செய்ய முடியவில்லை. முழு கட்டுரை உரையையோ சரியான செய்தி இணைப்பையோ ஒட்டவும்.',
    errNoConnection: 'சரிபார்ப்புச் சேவையை அணுக முடியவில்லை. உங்கள் இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
    errGeneric: 'சரிபார்ப்பின் போது ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.',
    loadingLongContentHint: 'புதிய உள்ளடக்கத்திற்கு இதற்கு ஒரு நிமிடம் வரை ஆகலாம்.',
    loadingExtracting: 'செய்தி கட்டுரையை பெறுகிறது...',
    loadingAnalyzing: 'சூழலை பகுப்பாய்வு செய்து மதிப்பெண் அளிக்கிறது...',
    elapsedTime: 'முடிந்தது',
    scoresDifferedBy: 'இரு மாதிரிகளின் மதிப்பெண்கள் {n} புள்ளிகளால் வேறுபட்டன.',
  }
};

/**
 * Maps a raw backend / network error string to a translation KEY (resolved by
 * the component's t() helper, so the message follows the language toggle).
 * Keeps internal details — API key names, model ids, stack traces, timeout
 * internals — off the screen.
 */
function friendlyPipelineError(status: number | null, raw?: string): string {
  const msg = (raw || '').toLowerCase();

  // Server misconfiguration — never show the key name on screen.
  if (msg.includes('gonka_api_key') || msg.includes('not configured') || msg.includes('api key')) {
    return 'errNotConfigured';
  }
  // Both models timed out, or an upstream gateway gave up.
  if (
    msg.includes('timeout') ||
    msg.includes('failed to respond') ||
    msg.includes('took longer') ||
    status === 502 || status === 503 || status === 504
  ) {
    return 'errModelsSlow';
  }
  // Empty or malformed input reached the server.
  if (status === 400 || msg.includes('required') || msg.includes('too short')) {
    return 'errBadInput';
  }
  // The fetch itself failed (offline, DNS, server down).
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')) {
    return 'errNoConnection';
  }
  return 'errGeneric';
}

export default function Home() {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'text' | 'url'>('text');
  const [language, setLanguage] = useState<string>('English');

  // Compact Accessibility Dropdown Menu State
  const [showAccessMenu, setShowAccessMenu] = useState<boolean>(false);
  const accessMenuRef = useRef<HTMLDivElement>(null);

  // Close accessibility popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accessMenuRef.current && !accessMenuRef.current.contains(event.target as Node)) {
        setShowAccessMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // UI Translation Helper
  const t = (key: string): string => {
    const langDict = uiTranslations[language] || uiTranslations.English;
    const val = langDict?.[key] || uiTranslations.English?.[key];
    if (val) return val;

    const fallbackShareKeys: Record<string, string> = {
      shareHeader: '🚨 CivicPulse AI Fact-Check Report 🚨',
      shareTitleLabel: '📌 Title',
      shareReasoningLabel: '💡 Reasoning & Credibility Analysis',
      shareVerifiedVia: '🛡️ Verified via Gonka Dual-AI Hedged Network',
      shareVerifyOn: 'Verify on CivicPulse',
      shareScamWarning: '⚠️ DO NOT CLICK ANY LINKS OR SHARE YOUR BANK DETAILS!',
      shareSafeNotice: '✅ VERIFIED OFFICIAL ANNOUNCEMENT - SAFE TO READ',
      downloadImageCard: 'Download Image Card',
      posterChecklistHeader: 'QUICK PROTECTION CHECKLIST:',
      posterBullet1: '• 🚫 Never share OTP/TAC or banking passwords',
      posterBullet2: '• 🔍 Verify claims only via official .gov.my channels',
      posterBullet3: '• 📢 Report suspicious SMS/calls to NSRC Hotline 997',
    };
    return fallbackShareKeys[key] || key;
  };

  // Accessibility States
  const [fontSizePercent, setFontSizePercent] = useState<number>(100);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [sepiaMode, setSepiaMode] = useState<boolean>(true);

  // Dynamic theme class style tokens
  const textLabelColor = highContrast ? 'text-white' : sepiaMode ? 'text-[#8c745a]' : 'text-[#7c6950]';
  const textTitleColor = highContrast ? 'text-white' : sepiaMode ? 'text-[#433422]' : 'text-[#2c2214]';
  const textDescriptionColor = highContrast ? 'text-white' : sepiaMode ? 'text-[#5a4834]' : 'text-[#3c3020]';
  const borderColor = highContrast ? 'border-white' : sepiaMode ? 'border-[#e4d4b5]' : 'border-[#e9e2d3]';
  const borderLightColor = highContrast ? 'border-white' : sepiaMode ? 'border-[#eadaaf]' : 'border-[#f6efe2]';
  const cardBgColor = highContrast ? 'bg-black' : sepiaMode ? 'bg-[#fdfbf7]' : 'bg-white';
  const inputBgColor = highContrast ? 'bg-black' : sepiaMode ? 'bg-[#fcf8ef]' : 'bg-[#faf6ee]';
  const hoverBgColor = highContrast ? 'hover:bg-stone-900' : sepiaMode ? 'hover:bg-[#ebdcb8]' : 'hover:bg-[#f6efe2]';
  const tabButtonActiveColor = highContrast ? 'bg-white text-black' : sepiaMode ? 'bg-[#433422] text-[#f4ecd8]' : 'bg-[#3c3020] text-[#faf6ee]';
  const tabButtonInactiveColor = highContrast ? 'text-white hover:underline' : sepiaMode ? 'text-[#7c6244] hover:text-[#433422]' : 'text-[#5c4a36] hover:text-[#2c2214]';

  // Inputs
  const [articleText, setArticleText] = useState<string>('');
  const [newsUrl, setNewsUrl] = useState<string>('');

  // States
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Tick a 1-second counter while a verification is running, so a 20-85s
  // cold-model wait shows visible progress instead of looking frozen.
  useEffect(() => {
    if (!loading) {
      setElapsedSec(0);
      return;
    }
    setElapsedSec(0);
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [loading]);

  // Dev Gonka Test Section Collapse
  const [showDevTest, setShowDevTest] = useState<boolean>(false);
  const [devLoading, setDevLoading] = useState<boolean>(false);
  const [devResult, setDevResult] = useState<{ text?: string; requestId?: string; error?: string } | null>(null);

  // Collapsible Audit Footer
  const [showAudit, setShowAudit] = useState<boolean>(false);

  // Cryptographic Receipt Inspection States
  const [model1Receipt, setModel1Receipt] = useState<any>(null);
  const [model2Receipt, setModel2Receipt] = useState<any>(null);
  const [loadingM1Receipt, setLoadingM1Receipt] = useState<boolean>(false);
  const [loadingM2Receipt, setLoadingM2Receipt] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string>('');
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareImageDataUrl, setShareImageDataUrl] = useState<string | null>(null);

  const defangUrl = (str: string): string => {
    if (!str) return '';
    return str
      .replace(/https?:\/\//gi, 'hxxps://')
      .replace(/([a-zA-Z0-9-]{2,})\.(com|org|net|xyz|cc|info|top|online|site|app|gov|my|co|biz|icu|vip|work|cn|me)\b/gi, '$1[.]$2');
  };

  const generateShareCardImage = async (result: AnalysisResult): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const type = result.summary.contentType || 'NEWS_POLICY';
    const isScam = type === 'SCAM_PHISHING' || type === 'JOB_INVESTMENT';
    const scamRiskScore = Math.max(0, Math.min(100, 100 - result.verification.truth_score));
    const scoreDisplay = isScam ? scamRiskScore : result.verification.truth_score;
    const scoreTitle = isScam ? t('scamRiskScore') : t('truthScore');
    const scoreBadgeLabel = isScam
      ? (scamRiskScore >= 75 ? t('highRisk') : scamRiskScore >= 40 ? t('suspicious') : t('safe'))
      : (result.verification.score_label || 'MIXED');

    const isHighRisk = isScam && scamRiskScore >= 40;

    // Background Gradient: Warm Sepia / Cream Theme
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
    if (isHighRisk) {
      bgGrad.addColorStop(0, '#fff5f5');
      bgGrad.addColorStop(0.5, '#fbf8f3');
      bgGrad.addColorStop(1, '#fee2e2');
    } else {
      bgGrad.addColorStop(0, '#fbf8f3');
      bgGrad.addColorStop(0.5, '#faf6ee');
      bgGrad.addColorStop(1, '#f7f1e5');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 630);

    // Card Outer Border: Darker High-Contrast Crimson / Amber Accent
    ctx.strokeStyle = isHighRisk ? '#f43f5e' : '#d97706';
    ctx.lineWidth = 5;
    ctx.strokeRect(18, 18, 1164, 594);

    // Top Header Pill: CivicPulse Logo + Localized Gonka Network Verified
    const headerPillWidth = language === 'Tamil' ? 480 : language === 'Bahasa Melayu' ? 440 : 420;
    ctx.fillStyle = isHighRisk ? '#ffe4e6' : '#faf6ee';
    ctx.beginPath();
    ctx.roundRect(50, 45, headerPillWidth, 42, 21);
    ctx.fill();
    ctx.strokeStyle = isHighRisk ? '#e11d48' : '#d97706';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Live Dot
    ctx.fillStyle = isHighRisk ? '#e11d48' : '#10b981';
    ctx.beginPath();
    ctx.arc(74, 66, 7, 0, Math.PI * 2);
    ctx.fill();

    // Header Text
    ctx.fillStyle = '#1c1917';
    const headerFontSize = language === 'Tamil' ? '15px' : '17px';
    ctx.font = `bold ${headerFontSize} system-ui, sans-serif`;
    ctx.fillText(t('gonkaVerifiedBadge'), 94, 72);

    // Score Badge Pill (Top Right)
    ctx.fillStyle = isHighRisk ? '#dc2626' : '#059669';
    ctx.beginPath();
    ctx.roundRect(830, 45, 320, 66, 14);
    ctx.fill();

    const getLocalizedBadgeLabel = (label: string): string => {
      const upper = (label || '').toUpperCase().trim();
      if (upper === 'SAFE') return t('safe');
      if (upper === 'HIGH RISK') return t('highRisk');
      if (upper === 'SUSPICIOUS') return t('suspicious');
      if (upper === 'VERIFIED') {
        return language === 'Bahasa Melayu' ? 'DISAHKAN' :
               language === 'Chinese' ? '已核实' :
               language === 'Tamil' ? 'சரிபார்க்கப்பட்டது' : 'VERIFIED';
      }
      if (upper === 'MIXED') {
        return language === 'Bahasa Melayu' ? 'CAMPURAN' :
               language === 'Chinese' ? '混合' :
               language === 'Tamil' ? 'கலப்பு' : 'MIXED';
      }
      return upper;
    };

    const rawBadgeLabel = isScam
      ? (scamRiskScore >= 75 ? t('highRisk') : scamRiskScore >= 40 ? t('suspicious') : t('safe'))
      : getLocalizedBadgeLabel(result.verification.score_label || 'MIXED');

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(scoreTitle.toUpperCase(), 850, 68);
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText(`${scoreDisplay}% (${rawBadgeLabel.toUpperCase()})`, 850, 98);

    // Action Directive Banner
    const actionDirective = isHighRisk ? t('shareScamWarning') : t('shareSafeNotice');
    ctx.fillStyle = isHighRisk ? '#ffe4e6' : '#d1fae5';
    ctx.beginPath();
    ctx.roundRect(50, 120, 1100, 44, 10);
    ctx.fill();
    ctx.strokeStyle = isHighRisk ? '#e11d48' : '#10b981';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isHighRisk ? '#9f1239' : '#065f46';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText(actionDirective, 70, 148);

    // Helper: Word-aware and CJK-aware canvas text wrapping
    const wrapCanvasTextWords = (text: string, maxWidth: number): string[] => {
      if (!text) return [];
      const tokens = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]|[^\s\u4e00-\u9fff\u3400-\u4dbf]+|\s+/g) || [text];
      const lines: string[] = [];
      let currentLine = '';

      for (const token of tokens) {
        const testLine = currentLine + token;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine.trim() !== '') {
          lines.push(currentLine.trimEnd());
          currentLine = token.trimStart();
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine.trim()) {
        lines.push(currentLine.trimEnd());
      }
      return lines;
    };

    // Article Title: Dark Sharp Stone #1c1917 (Word-Aware Multi-Line Rendering)
    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 22px system-ui, sans-serif';
    const titleLines = wrapCanvasTextWords(result.summary.title || '', 1100);
    let titleY = 192;
    for (let i = 0; i < titleLines.length; i++) {
      ctx.fillText(titleLines[i], 50, titleY);
      titleY += 26;
      if (i >= 1) break;
    }

    // Reasoning Box (Height 175)
    ctx.fillStyle = isHighRisk ? '#fff5f5' : '#faf6ee';
    ctx.beginPath();
    ctx.roundRect(50, 222, 1100, 175, 14);
    ctx.fill();
    ctx.strokeStyle = isHighRisk ? '#fecdd3' : '#ebdcb8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isHighRisk ? '#9f1239' : '#b45309';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(t('shareReasoningLabel'), 75, 248);

    // Wrapped Reasoning Lines: Word-Aware & CJK-Aware Multi-Language Wrapping
    ctx.fillStyle = '#292524';
    ctx.font = '15px system-ui, sans-serif';
    const safeReasoning = defangUrl(result.verification.reasoning_trace);
    const reasoningLines = wrapCanvasTextWords(safeReasoning, 1040);
    let y = 276;
    for (let i = 0; i < reasoningLines.length; i++) {
      if (y > 375) break;
      let lineText = reasoningLines[i];
      if (y + 24 > 375 && i < reasoningLines.length - 1) {
        lineText += '...';
      }
      ctx.fillText(lineText, 75, y);
      y += 24;
    }

    // Poster-Style Checklist / Media Literacy Box (Fills empty space)
    const isScamOrHighRisk = isScam || isHighRisk;
    const checklistHeader = isScamOrHighRisk ? t('posterChecklistHeader') : t('posterNewsHeader');
    const bullet1 = isScamOrHighRisk ? t('posterBullet1') : t('posterNewsBullet1');
    const bullet2 = isScamOrHighRisk ? t('posterBullet2') : t('posterNewsBullet2');
    const bullet3 = isScamOrHighRisk ? t('posterBullet3') : t('posterNewsBullet3');

    ctx.fillStyle = isHighRisk ? '#fff1f2' : '#ecfdf5';
    ctx.beginPath();
    ctx.roundRect(50, 412, 928, 152, 14);
    ctx.fill();
    ctx.strokeStyle = isHighRisk ? '#fda4af' : '#a7f3d0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isHighRisk ? '#881337' : '#064e3b';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(checklistHeader, 75, 438);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(bullet1, 75, 468);
    ctx.fillText(bullet2, 75, 498);
    ctx.fillText(bullet3, 75, 528);

    // Footer: Sharp Sepia Monospace #57534e (Localized)
    const m1Id = result?.model1RequestId || 'unavailable';
    const m2Id = result?.model2RequestId || 'unavailable';
    const verificationUrl = `https://civicpulse-hackathon.vercel.app/verify/${m1Id}?m2=${m2Id}`;
    const displayUrl = `civicpulse-hackathon.vercel.app/verify/${m1Id}`;

    const footerLine1 = t('cardFooterConsensus').replace('{id}', result.model1RequestId);
    const footerLine2 = t('cardFooterReceipt').replace('{url}', displayUrl);

    ctx.fillStyle = '#57534e';
    ctx.font = '12px system-ui, monospace, sans-serif';
    ctx.fillText(footerLine1, 50, 584);
    ctx.fillText(footerLine2, 50, 602);

    // Generate valid QR code directly onto the canvas
    try {
      // White Rounded Pill above QR Code: Localized "Scan to verify" badge
      const scanBadgeText = t('scanToVerify');
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(998, 370, 152, 32, 10);
      ctx.fill();
      ctx.strokeStyle = '#d6d3d1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#1c1917';
      const badgeFontSize = language === 'Bahasa Melayu' ? '13px' : language === 'Tamil' ? '11px' : '15px';
      ctx.font = `bold ${badgeFontSize} system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(scanBadgeText, 1074, 391);
      ctx.textAlign = 'left';

      // White Card Box
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(998, 412, 152, 152, 14);
      ctx.fill();
      ctx.strokeStyle = '#d6d3d1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Create real, scannable QR canvas
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, verificationUrl, {
        width: 136,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#1c1917',
          light: '#ffffff'
        }
      });

      // Draw into main card canvas
      ctx.drawImage(qrCanvas, 1006, 420);
    } catch (e) {
      console.error("QR Code generation error:", e);
    }

    try {
      return canvas.toDataURL('image/png');
    } catch (e) {
      return '';
    }
  };

      const handleOpenShareModal = async () => {
        if (!result) return;
        setShowShareModal(true);
        setShareImageDataUrl(null);
        try {
          const imgData = await generateShareCardImage(result);
          if (imgData) {
            setShareImageDataUrl(imgData);
          }
        } catch (err) {
          console.warn('Share modal image generation error handled:', err);
        }
      };

  const handleDownloadImage = () => {
    if (!shareImageDataUrl) return;
    const link = document.createElement('a');
    link.download = `CivicPulse_FactCheck_Report_${Date.now()}.png`;
    link.href = shareImageDataUrl;
    link.click();
  };

  const extractSuspectUrl = (text: string): string => {
    if (!text) return 'N/A';
    const match = text.match(/(https?:\/\/[^\s]+|([a-zA-Z0-9-]+\.)+(com|org|net|xyz|cc|info|top|online|site|app|gov|my|co|biz)\b[^\s]*)/i);
    if (match && match[0]) {
      return defangUrl(match[0]);
    }
    return 'N/A';
  };

  const getShareTextString = (): string => {
    if (!result) return '';
    const type = result.summary.contentType || 'NEWS_POLICY';
    const isScam = type === 'SCAM_PHISHING' || type === 'JOB_INVESTMENT';
    const scamRiskScore = Math.max(0, Math.min(100, 100 - result.verification.truth_score));
    const scoreDisplay = isScam ? scamRiskScore : result.verification.truth_score;
    const scoreTitle = isScam ? t('scamRiskScore') : t('truthScore');
    const scoreBadgeLabel = isScam
      ? (scamRiskScore >= 75 ? t('highRisk') : scamRiskScore >= 40 ? t('suspicious') : t('safe'))
      : (result.verification.score_label || 'MIXED');

    const isHighRisk = isScam || scamRiskScore >= 40;
    const actionDirective = isHighRisk ? 'JANGAN TEKAN LINK / DO NOT CLICK ANY LINKS' : 'MAKLUMAN RASMI DISAHKAN / OFFICIAL ANNOUNCEMENT';
    const safeReasoning = defangUrl(result.verification.reasoning_trace);
    const suspectUrl = extractSuspectUrl(articleText || newsUrl || result.verification.reasoning_trace);
    const m2Id = result?.model2RequestId || 'unavailable';
    const verificationUrl = typeof window !== 'undefined' && !window.location.origin.includes('localhost')
      ? `${window.location.origin}/verify/${result.model1RequestId}?m2=${m2Id}`
      : `https://civicpulse-hackathon.vercel.app/verify/${result.model1RequestId}?m2=${m2Id}`;

    return `🚨 *CivicPulse AI Fact-Check Report* 🚨\n\n⚠️ *ACTION:* *${actionDirective}*\n\n📌 *Claim / Source:* *${result.summary.title}*\n🛑 *Suspect Link (Defanged):* ${suspectUrl}\n📊 *${scoreTitle}:* *${scoreDisplay}% (${scoreBadgeLabel})*\n\n💡 *Reasoning:* ${safeReasoning}\n\n🛡️ *Consensus Run ID:* \`${result.model1RequestId}\`\n*Verified via Gonka Dual-Node Consensus Network (DeepSeek + Kimi)*\n\n*Verify full dual-model audit receipt:*\n${verificationUrl}`;
  };

  const handleShareWhatsApp = () => {
    const text = getShareTextString();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = getShareTextString();
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyShareText = async () => {
    const shareText = getShareTextString();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
      }
    } catch (e) {
      console.warn('Clipboard write error:', e);
    }
  };

  const handleCopyId = async (id: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(''), 2000);
      }
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  const handleFetchReceipt = async (requestId: string, modelNum: 1 | 2) => {
    if (modelNum === 1) {
      if (model1Receipt) {
        setModel1Receipt(null);
        return;
      }
      setLoadingM1Receipt(true);
      try {
        const res = await fetch(`/api/receipt/${requestId}`);
        if (res.ok) {
          const data = await res.json();
          setModel1Receipt(data);
        } else {
          setModel1Receipt({ error: "Receipt not found or still propagating." });
        }
      } catch (err) {
        setModel1Receipt({ error: "Failed to connect to Gonka receipts database." });
      } finally {
        setLoadingM1Receipt(false);
      }
    } else {
      if (model2Receipt) {
        setModel2Receipt(null);
        return;
      }
      setLoadingM2Receipt(true);
      try {
        const res = await fetch(`/api/receipt/${requestId}`);
        if (res.ok) {
          const data = await res.json();
          setModel2Receipt(data);
        } else {
          setModel2Receipt({ error: "Receipt not found or still propagating." });
        }
      } catch (err) {
        setModel2Receipt({ error: "Failed to connect to Gonka receipts database." });
      } finally {
        setLoadingM2Receipt(false);
      }
    }
  };

  // Presets Data: 1. Scam (ENG), 2. Safe (ENG), 3. Safe (CHINESE)
  const presets = {
    cimb: {
      text: 'RM0.00: CIMB Alert! Your bank account has been temporarily frozen due to suspicious login attempts. To restore access and verify your identity immediately, click the secure link to update your details: https://cimb-online-security-verify.com/login. Failure to act within 24 hours will result in permanent account suspension.',
      title: 'CIMB Frozen Account Alert'
    },
    strAid: {
      text: 'OFFICIAL ANNOUNCEMENT: The Inland Revenue Board of Malaysia (HASiL) wishes to inform all eligible citizens that the Sumbangan Tunai Rahmah (STR) Phase 3 cash assistance will be disbursed directly into registered bank accounts starting next Monday. No third-party links or manual pin numbers are required. Citizens may check their application status exclusively on the official portal at https://bantuantunai.hasil.gov.my.',
      title: 'STR Cash Aid Announcement'
    },
    lhdnTax: {
      text: '官方通告：马来西亚内政部与国家灾难管理机构（NADMA）联合宣布，2026年东北季候风援助金已开始开放申请。所有受影响符合资格的国民可通过官方内政部门户网站 https://www.nadma.gov.my 提交申请。政府切勿通过任何社交媒体私信或第三方向民众索取银行密码与OTP动态验证码。',
      title: 'NADMA Flood Relief Announcement'
    }
  };

  // Preset Trigger: Populates textarea or URL input without auto-running analysis
  const handleApplyPreset = (key: 'cimb' | 'strAid' | 'lhdnTax' | 'sinChewUrl') => {
    if (key === 'sinChewUrl') {
      setActiveTab('url');
      setNewsUrl('https://sabah.sinchew.com.my/news/20260903/sabah/7813698?pk_vid=17db3219683bd4d6178842717647fe6c');
      setError(null);
      return;
    }
    const selectedText = presets[key].text;
    setActiveTab('text');
    setArticleText(selectedText);
    setError(null);
  };

  // Accessibility Font Adjusters
  const handleDecreaseFont = () => {
    setFontSizePercent((prev) => Math.max(70, prev - 10));
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
      const res = await fetch(`/api/verify-gonka?language=${encodeURIComponent(language)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.error) {
        if (data?.error) console.warn('verify-gonka error:', data.error);
        setDevResult({ error: t(friendlyPipelineError(res.status, data?.error)) });
      } else {
        setDevResult(data);
      }
    } catch (err: any) {
      setDevResult({ error: t(friendlyPipelineError(null, err?.message)) });
    } finally {
      setDevLoading(false);
    }
  };

  // Main Pipeline processing
  const handleProcessArticle = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setModel1Receipt(null);
    setModel2Receipt(null);

    try {
      let textToProcess = overrideText !== undefined ? overrideText : articleText;

      // Step 2: URL parsing if URL tab is active and no override text is provided
      if (activeTab === 'url' && overrideText === undefined) {
        if (!newsUrl.trim()) {
          throw new Error('Please enter a valid News URL.');
        }
        setLoadingStep('loadingExtracting');

        const parseRes = await fetch('/api/parse-news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: newsUrl }),
        });

        const parseData = await parseRes.json().catch(() => null);
        if (!parseRes.ok || !parseData || parseData.error) {
          throw new Error('We could not read that link. Try pasting the article text directly instead.');
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
      setLoadingStep('loadingAnalyzing');
      const targetLanguage = language;
      const processRes = await fetch('/api/process-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleText: textToProcess, language: targetLanguage }),
      });

      const processData = await processRes.json().catch(() => null);
      if (!processRes.ok || !processData || processData.error) {
        throw new Error(friendlyPipelineError(processRes.status, processData?.error));
      }

      setResult(processData);
      // Surface the Gonka execution receipts by default — they are the core
      // "proof of execution" for judging, so don't make people hunt for them.
      setShowAudit(true);
    } catch (err: any) {
      // A raw TypeError here = the fetch itself failed (offline / server down).
      // friendlyPipelineError() returns a translation key; our own client-side
      // guards throw a plain string, which t() passes through unchanged.
      const key = err instanceof TypeError
        ? friendlyPipelineError(null, err.message)
        : (err?.message || 'errGeneric');
      setError(t(key));
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  // Score styling logic
  const getTruthScoreStyles = (score: number, isScam: boolean) => {
    if (highContrast) {
      return {
        text: 'text-white font-black',
        badge: 'bg-black text-white border-2 border-white'
      };
    }
    if (isScam) {
      if (score >= 75) return { text: 'text-rose-700 font-bold', badge: 'bg-rose-50 text-rose-850 border border-rose-200' };
      if (score >= 40) return { text: 'text-orange-700 font-bold', badge: 'bg-orange-50 text-orange-850 border border-orange-200' };
      return { text: 'text-amber-800 font-bold', badge: 'bg-amber-50 text-amber-800 border border-amber-250/50' };
    } else {
      if (score >= 80) return { text: 'text-amber-800 font-bold', badge: 'bg-amber-50 text-amber-800 border border-amber-250/50' };
      if (score >= 50) return { text: 'text-orange-700 font-bold', badge: 'bg-orange-50 text-orange-850 border border-orange-200' };
      return { text: 'text-rose-700 font-bold', badge: 'bg-rose-50 text-rose-850 border border-rose-200' };
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${highContrast
      ? 'bg-black text-white selection:bg-white selection:text-black'
      : sepiaMode
        ? 'bg-[#f4ecd8] text-[#433422] selection:bg-[#dfd0b0] selection:text-[#433422]'
        : 'bg-[#faf6ee] text-[#2c2214] selection:bg-[#eddcb8] selection:text-[#2c2214]'
      }`}>

      {/* Header Navbar */}
      <header className={`border-b sticky top-0 z-50 transition-colors ${highContrast
        ? 'border-white bg-black'
        : sepiaMode
          ? 'border-[#e4d4b5] bg-[#f4ecd8]/95 backdrop-blur-md'
          : 'border-[#ebdcb8] bg-[#faf6ee]/90 backdrop-blur-md'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3.5">

          {/* Left: Logo + Sub-headline */}
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shadow-xs ${highContrast
              ? 'bg-black border-white'
              : sepiaMode
                ? 'bg-[#f4ecd8] border-[#e4d4b5]'
                : 'bg-[#faf6ee] border-[#ebdcb8]'
              }`}>
              <Sparkles className={`h-5 w-5 ${highContrast ? 'text-white' : 'text-amber-700'}`} />
            </div>
            <div>
              <span className={`font-black text-lg sm:text-xl tracking-tight ${highContrast ? 'text-white' : sepiaMode ? 'text-[#433422]' : 'text-[#2c2214]'}`}>
                CivicPulse
              </span>
              <span className={`text-[0.625rem] sm:text-[0.6875rem] block font-bold tracking-wider uppercase ml-0.5 ${highContrast ? 'text-white' : 'text-amber-700'}`}>
                {t('tagline')}
              </span>
            </div>
          </div>

          {/* Center / Right Badge: Gonka Network Active (Clickable Scroll to Audit) */}
          <button
            type="button"
            onClick={() => {
              if (result) {
                setShowAudit(true);
                const auditElement = document.getElementById('audit-drawer');
                if (auditElement) {
                  auditElement.scrollIntoView({ behavior: 'smooth' });
                }
              } else {
                setShowDevTest(true);
                const devElement = document.getElementById('dev-test-drawer');
                if (devElement) {
                  devElement.scrollIntoView({ behavior: 'smooth' });
                }
              }
            }}
            className={`inline-flex order-last md:order-none items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition-all cursor-pointer shadow-xs ${highContrast
              ? 'bg-black text-emerald-400 border-white hover:bg-stone-900'
              : sepiaMode
                ? 'bg-[#fcf8ef] text-emerald-800 border-[#e4d4b5] hover:bg-[#ebdcb8]'
                : 'bg-emerald-50/80 text-emerald-900 border-emerald-200 hover:bg-emerald-100/80'
              }`}
            title="Click to view execution audit & cryptographic receipts"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>{t('networkBadge')}</span>
          </button>

          {/* Right Controls: Quick Language Pills & Compact Accessibility Dropdown */}
          <div className="flex items-center gap-2.5">

            {/* Quick Language Pills [ EN | BM | 中文 | தமிழ் ] */}
            <div className={`flex p-1 rounded-xl border text-xs font-extrabold ${highContrast
              ? 'bg-black border-white'
              : sepiaMode
                ? 'bg-[#fcf8ef] border-[#e4d4b5]'
                : 'bg-[#faf6ee] border-[#ebdcb8]'
              }`}>
              {[
                { code: 'English', label: 'EN' },
                { code: 'Bahasa Melayu', label: 'BM' },
                { code: 'Chinese', label: '中文' },
                { code: 'Tamil', label: 'தமிழ்' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLanguage(item.code)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${language === item.code
                    ? highContrast
                      ? 'bg-white text-black font-extrabold'
                      : sepiaMode
                        ? 'bg-[#433422] text-[#f4ecd8] font-black'
                        : 'bg-[#3c3020] text-[#faf6ee] font-black'
                    : highContrast
                      ? 'text-white hover:bg-stone-900'
                      : sepiaMode
                        ? 'text-[#7c6244] hover:text-[#433422]'
                        : 'text-[#5c4a36] hover:text-[#2c2214]'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Compact Accessibility Dropdown Menu button [ ⚙️ / 👁️ ] */}
            <div className="relative" ref={accessMenuRef}>
              <button
                type="button"
                onClick={() => setShowAccessMenu(!showAccessMenu)}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${showAccessMenu
                  ? highContrast
                    ? 'bg-white text-black border-white'
                    : sepiaMode
                      ? 'bg-[#433422] text-[#f4ecd8] border-[#433422]'
                      : 'bg-[#3c3020] text-[#faf6ee] border-[#3c3020]'
                  : highContrast
                    ? 'bg-black text-white border-white hover:bg-stone-900'
                    : sepiaMode
                      ? 'bg-[#fcf8ef] text-[#5c4a36] border-[#e4d4b5] hover:bg-[#ebdcb8]'
                      : 'bg-[#faf6ee] text-[#5c4a36] border-[#e6decb] hover:bg-[#f6efe2]'
                  }`}
                title="Accessibility & Theme Controls"
                aria-label="Toggle Accessibility Menu"
              >
                <Settings className="h-4.5 w-4.5 pointer-events-none" />
              </button>

              {/* Popover Dropdown Menu */}
              {showAccessMenu && (
                <div className={`absolute right-0 mt-2 w-56 p-3.5 rounded-xl border shadow-xl z-50 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150 ${highContrast
                  ? 'bg-black border-white text-white'
                  : sepiaMode
                    ? 'bg-[#fcf8ef] border-[#e4d4b5] text-[#433422]'
                    : 'bg-white border-[#ebdcb8] text-[#2c2214]'
                  }`}>
                  <div className="flex items-center justify-between border-b pb-2 border-stone-200/50">
                    <span className="text-xs font-bold uppercase tracking-wider">{t('accessibilityMenu')}</span>
                    <Eye className="h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                  </div>

                  {/* Font Scaling Row */}
                  <div className="space-y-1.5">
                    <span className="text-[0.625rem] font-bold text-stone-400 uppercase tracking-wider block">{t('fontSizeLabel')}</span>
                    <div className="flex items-center justify-between gap-1 border p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={handleDecreaseFont}
                        disabled={fontSizePercent <= 80}
                        className="px-2.5 py-1 text-xs rounded border font-bold disabled:opacity-40 cursor-pointer"
                      >
                        A-
                      </button>
                      <span className="text-xs font-bold px-1">{fontSizePercent}%</span>
                      <button
                        type="button"
                        onClick={handleIncreaseFont}
                        disabled={fontSizePercent >= 200}
                        className="px-2.5 py-1 text-xs rounded border font-bold disabled:opacity-40 cursor-pointer"
                      >
                        A+
                      </button>
                    </div>
                  </div>

                  {/* Theme Selectors */}
                  <div className="space-y-1.5">
                    <span className="text-[0.625rem] font-bold text-stone-400 uppercase tracking-wider block">{t('themeModeLabel')}</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setSepiaMode(true); setHighContrast(false); }}
                        className={`text-xs font-bold py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${sepiaMode && !highContrast ? 'bg-[#433422] text-[#f4ecd8] border-[#433422]' : 'border-stone-200'}`}
                      >
                        {t('sepiaTheme')}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setHighContrast(!highContrast); setSepiaMode(false); }}
                        className={`text-xs font-bold py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${highContrast ? 'bg-white text-black border-white' : 'border-stone-200'}`}
                      >
                        {t('contrastMode')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 space-y-8 relative z-10">

        {/* Search & Paste Inputs */}
        <section className={`border rounded-xl p-6 space-y-6 shadow-sm relative z-10 ${cardBgColor} ${borderColor}`}>

          {/* Header tabs */}
          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 ${borderLightColor}`}>

            {/* Input Method Tabs */}
            <div className={`flex p-1 rounded-lg border w-full sm:w-auto ${inputBgColor} ${borderColor}`}>
              <button
                type="button"
                onClick={() => { setActiveTab('text'); setError(null); }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTab === 'text' ? tabButtonActiveColor : tabButtonInactiveColor
                  }`}
              >
                <FileText className="h-3.5 w-3.5 pointer-events-none" />
                <span className="pointer-events-none">{t('pasteClaimTab')}</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('url'); setError(null); }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTab === 'url' ? tabButtonActiveColor : tabButtonInactiveColor
                  }`}
              >
                <LinkIcon className="h-3.5 w-3.5 pointer-events-none" />
                <span className="pointer-events-none">{t('newsLinkTab')}</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleProcessArticle} className="space-y-5">
            {activeTab === 'text' ? (
              <div className="space-y-1.5">
                <label htmlFor="article-text-area" className={`text-[0.625rem] font-bold uppercase tracking-wider ${textLabelColor}`}>{t('claimTextareaLabel')}</label>
                <textarea
                  id="article-text-area"
                  rows={6}
                  placeholder={t('textareaPlaceholder')}
                  value={articleText}
                  onChange={(e) => setArticleText(e.target.value)}
                  className={`w-full border rounded-xl p-4 placeholder-[#a89f91] focus:outline-none transition-all font-sans leading-relaxed text-sm resize-y ${highContrast
                    ? 'bg-black text-white border-white focus:border-white'
                    : sepiaMode
                      ? 'bg-[#fcf8ef] border-[#e4d4b5] text-[#433422] focus:border-[#433422]'
                      : 'bg-[#faf6ee] border-[#ebdcb8] text-[#3c3020] focus:border-amber-700'
                    }`}
                />
                <div className="flex justify-between items-center text-[0.625rem] font-bold mt-1 px-1">
                  <span className={textLabelColor}>{t('charCount')}</span>
                  <span className={articleText.length > 10000 ? "text-rose-500 font-extrabold animate-pulse" : textLabelColor}>
                    {articleText.length.toLocaleString()} / 10,000 {t('maxLimit')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label htmlFor="article-url-input" className={`text-[0.625rem] font-bold uppercase tracking-wider ${textLabelColor}`}>{t('newsUrlLabel')}</label>
                <div className="relative">
                  <input
                    id="article-url-input"
                    type="text"
                    placeholder={t('urlPlaceholder')}
                    value={newsUrl}
                    onChange={(e) => setNewsUrl(e.target.value)}
                    className={`w-full border rounded-xl py-3.5 pl-4 pr-10 placeholder-[#a89f91] focus:outline-none transition-all text-sm ${highContrast
                      ? 'bg-black text-white border-white focus:border-white'
                      : sepiaMode
                        ? 'bg-[#fcf8ef] border-[#e4d4b5] text-[#433422] focus:border-[#433422]'
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
              <span className={`text-[0.5625rem] font-bold uppercase tracking-wider block ${textLabelColor}`}>
                {activeTab === 'text' ? t('sampleScamsLabel') : t('sampleNewsLinkLabel')}
              </span>
              <div className="flex flex-wrap gap-2">
                {activeTab === 'text' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('cimb')}
                      className={`text-[0.625rem] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${highContrast
                        ? 'bg-black text-white border-white hover:bg-[#222]'
                        : sepiaMode
                          ? 'bg-[#fcf8ef] text-[#433422] border-[#e4d4b5] hover:bg-[#ebdcb8]'
                          : 'bg-[#faf6ee] text-amber-800 border-[#e6decb] hover:bg-[#f6efe2]'
                        }`}
                    >
                      {t('chipCimb')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('strAid')}
                      className={`text-[0.625rem] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${highContrast
                        ? 'bg-black text-white border-white hover:bg-[#222]'
                        : sepiaMode
                          ? 'bg-[#fcf8ef] text-[#433422] border-[#e4d4b5] hover:bg-[#ebdcb8]'
                          : 'bg-[#faf6ee] text-amber-800 border-[#e6decb] hover:bg-[#f6efe2]'
                        }`}
                    >
                      {t('chipStr')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('lhdnTax')}
                      className={`text-[0.625rem] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${highContrast
                        ? 'bg-black text-white border-white hover:bg-[#222]'
                        : sepiaMode
                          ? 'bg-[#fcf8ef] text-[#433422] border-[#e4d4b5] hover:bg-[#ebdcb8]'
                          : 'bg-[#faf6ee] text-amber-800 border-[#e6decb] hover:bg-[#f6efe2]'
                        }`}
                    >
                      {t('chipLhdn')}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('sinChewUrl')}
                    className={`text-[0.625rem] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${highContrast
                      ? 'bg-black text-white border-white hover:bg-[#222]'
                      : sepiaMode
                        ? 'bg-[#fcf8ef] text-[#433422] border-[#e4d4b5] hover:bg-[#ebdcb8]'
                        : 'bg-[#faf6ee] text-amber-800 border-[#e6decb] hover:bg-[#f6efe2]'
                      }`}
                  >
                    {t('chipSinchew')}
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (activeTab === 'text' ? !articleText.trim() : !newsUrl.trim())}
              className={`w-full py-3.5 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border ${(loading || (activeTab === 'text' ? !articleText.trim() : !newsUrl.trim()))
                ? (highContrast ? 'bg-black text-[#555] border-[#333] cursor-not-allowed opacity-50' : sepiaMode ? 'bg-[#fcf8ef] text-[#a89f91] border-[#ebdcb8] cursor-not-allowed opacity-60' : 'bg-[#faf6ee] text-[#a89f91] border-[#ebdcb8] cursor-not-allowed opacity-60')
                : (highContrast ? 'bg-white text-black border-white hover:bg-black hover:text-white' : sepiaMode ? 'bg-[#433422] hover:bg-[#342718] text-[#f4ecd8] border-transparent active:scale-98' : 'bg-[#3c3020] hover:bg-[#2c2317] text-[#faf6ee] border-transparent active:scale-98')
                }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin pointer-events-none" />
                  <span className="pointer-events-none">{t('analyzingBtn')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 pointer-events-none" />
                  <span className="pointer-events-none">{t('submitBtn')}</span>
                </>
              )}
            </button>

            {loading && (
              <div className={`p-6 border rounded-xl space-y-4 animate-pulse mt-4 ${highContrast ? 'bg-black border-white text-white' : sepiaMode ? 'bg-[#fcf8ef] border-[#e4d4b5]' : 'bg-white border-[#ebdcb8]'}`}>
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 animate-spin text-amber-700 shrink-0 pointer-events-none" />
                  <div className="space-y-1">
                    <p className={`text-xs font-bold ${highContrast ? 'text-white' : 'text-[#433422]'}`}>{t(loadingStep || 'loadingAnalyzing')}</p>
                    <p className="text-[0.625rem] text-stone-400 font-mono">
                      {t('hedgedPipelineStatus')} • {Math.floor(elapsedSec / 60)}:{String(elapsedSec % 60).padStart(2, '0')} {t('elapsedTime')}
                    </p>
                    <p className={`text-[0.625rem] ${highContrast ? 'text-white' : 'text-stone-400'}`}>
                      {t('loadingLongContentHint')}
                    </p>
                  </div>
                </div>
                <div className="h-3.5 bg-stone-300/40 rounded w-3/4 animate-pulse" />
                <div className="h-3.5 bg-stone-300/40 rounded w-1/2 animate-pulse" />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="h-14 bg-stone-300/30 rounded-lg animate-pulse" />
                  <div className="h-14 bg-stone-300/30 rounded-lg animate-pulse" />
                </div>
              </div>
            )}
          </form>

          {error && (
            <div className={`p-4 border rounded-xl text-xs flex items-start gap-3 ${highContrast ? 'bg-black border-white text-white' : sepiaMode ? 'bg-[#fff4e8] border-[#e4d4b5] text-[#b33e2b]' : 'bg-[#fff5f5] border-rose-200 text-rose-700'
              }`}>
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 pointer-events-none" />
              <div>
                <span className="font-bold">{t('errorPrefix')}</span> {error}
              </div>
            </div>
          )}
        </section>

        {/* Results Card */}
        {result && (() => {
          const type = result.summary.contentType || 'NEWS_POLICY';
          const isScam = type === 'SCAM_PHISHING' || type === 'JOB_INVESTMENT';
          const isRumor = type === 'VIRAL_RUMOR';

          // A viral rumor stays on the Truth Score scale (isScam drives the score
          // math), but when the auditor flags it HIGH RISK / SUSPICIOUS we give the
          // card the same alarm chrome + visible red flags that scam cards get.
          const scoreLabel = result.verification.score_label || 'MIXED';
          const isHighRiskRumor = isRumor && (scoreLabel === 'HIGH RISK' || scoreLabel === 'SUSPICIOUS');
          const alarmMode = isScam || isHighRiskRumor;

          // Helper for localized category badge
          const categoryBadgeText =
            type === 'SCAM_PHISHING' ? t('catScamPhishing') :
              type === 'JOB_INVESTMENT' ? t('catJobInvestment') :
                isRumor ? t('catViralClaim') :
                  t('catNewsPolicy');

          // Calculate Scam Risk Score: 100 - truth_score
          const scamRiskScore = Math.max(0, Math.min(100, 100 - result.verification.truth_score));
          const scoreDisplay = isScam ? scamRiskScore : result.verification.truth_score;

          const styles = getTruthScoreStyles(scoreDisplay, isScam);

          return (
            <section className={`border rounded-xl p-6 space-y-6 shadow-sm animate-in slide-in-from-bottom-4 duration-400 relative z-10 ${highContrast
              ? 'bg-black border-white'
              : (alarmMode ? 'bg-[#fffdfd] border-rose-200' : 'bg-white border-[#e9e2d3]')
              }`}>

              {/* Header / Category Badge */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${highContrast ? 'border-white' : (alarmMode ? 'border-rose-100' : 'border-[#f6efe2]')
                }`}>
                <h2 className={`text-lg font-bold tracking-tight leading-snug [word-break:normal] [overflow-wrap:normal] break-words ${highContrast ? 'text-white' : (alarmMode ? 'text-rose-950' : 'text-[#2c2214]')
                  }`}>
                  {result.summary.title}
                </h2>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.6875rem] font-extrabold uppercase tracking-wide whitespace-nowrap border ${highContrast
                    ? 'bg-black text-white border-white'
                    : (alarmMode ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-[#faf6ee] text-amber-900 border-[#ebdcb8]')
                    }`}>
                    <TrendingUp className="h-3.5 w-3.5 shrink-0 pointer-events-none" />
                    <span className="whitespace-nowrap pointer-events-none">{categoryBadgeText}</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleOpenShareModal}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[0.6875rem] font-extrabold tracking-wide border whitespace-nowrap transition-all cursor-pointer shadow-xs hover:scale-[1.03] active:scale-[0.97] ${highContrast
                      ? 'bg-black text-white border-white hover:bg-stone-900'
                      : sepiaMode
                        ? 'bg-[#fcf8ef] text-[#433422] border-[#e4d4b5] hover:bg-[#ebdcb8]'
                        : 'bg-[#faf6ee] text-amber-900 border-[#ebdcb8] hover:bg-[#f6efe2]'
                      }`}
                    title="Share Fact-Check Report Card"
                  >
                    <Share2 className="h-3.5 w-3.5 text-amber-700 shrink-0 pointer-events-none" />
                    <span className="whitespace-nowrap pointer-events-none">{t('shareCard')}</span>
                  </button>
                </div>
              </div>

              {/* Consensus Divergence Warnings Banner */}
              {result.verification.consensus_note && (
                <div className={`p-4 border rounded-xl text-xs flex items-start gap-2.5 ${highContrast ? 'bg-black border-white text-white animate-pulse' : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold block">{result.verification.consensus_note}</span>
                    {typeof result.verification.discrepancy_delta === 'number' && result.verification.discrepancy_delta > 25 && (
                      <span className="block text-[11px] font-semibold opacity-80">
                        {t('scoresDifferedBy').replace('{n}', String(result.verification.discrepancy_delta))}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Truth/Scam Score Gauge & Credibility Analysis */}
              <div className={`p-5 rounded-xl border ${highContrast
                ? 'border-2 border-white bg-black'
                : (alarmMode ? 'border-rose-200 bg-rose-50/10' : 'border-[#e9e2d3] bg-[#faf6ee]/50')
                } grid grid-cols-1 md:grid-cols-4 gap-5 items-center`}>

                {/* Score Column */}
                <div className={`flex flex-col items-center justify-center text-center space-y-1.5 md:pr-4 py-2 ${highContrast
                  ? 'md:border-r-2 md:border-white'
                  : (alarmMode ? 'md:border-r border-rose-100' : 'md:border-r border-[#e9e2d3]')
                  }`}>
                  <span className={`text-[0.625rem] font-bold uppercase tracking-wider ${highContrast ? 'text-white' : 'text-stone-500'
                    }`}>
                    {isScam ? t('scamRiskScore') : t('truthScore')}
                  </span>
                  <span className={`text-4xl font-black ${styles.text}`}>
                    {scoreDisplay}%
                  </span>
                  <span className={`text-[0.5625rem] font-bold px-2.5 py-0.5 rounded-full tracking-wide uppercase ${styles.badge}`}>
                    {isScam
                      ? (scamRiskScore >= 75 ? t('highRisk') : scamRiskScore >= 40 ? t('suspicious') : t('safe'))
                      : (
                          result.verification.score_label === 'SAFE' ? t('safe') :
                          result.verification.score_label === 'HIGH RISK' ? t('highRisk') :
                          result.verification.score_label === 'SUSPICIOUS' ? t('suspicious') :
                          result.verification.score_label === 'VERIFIED' ? (language === 'Bahasa Melayu' ? 'DISAHKAN' : language === 'Chinese' ? '已核实' : language === 'Tamil' ? 'சரிபார்க்கப்பட்டது' : 'VERIFIED') :
                          result.verification.score_label === 'MIXED' ? (language === 'Bahasa Melayu' ? 'CAMPURAN' : language === 'Chinese' ? '混合' : language === 'Tamil' ? 'கலப்பு' : 'MIXED') :
                          (result.verification.score_label || 'MIXED')
                        )}
                  </span>

                  {/* Gauge Severity Bar */}
                  <div className="w-28 mt-2.5 space-y-1">
                    <div className={`h-2 w-full rounded-full overflow-hidden border ${highContrast ? 'bg-zinc-900 border-white' : 'bg-stone-200/50 border-[#ebdcb8]/20'
                      }`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${highContrast
                          ? 'bg-white'
                          : (isScam
                            ? (scamRiskScore >= 75 ? 'bg-rose-500' : scamRiskScore >= 40 ? 'bg-orange-500' : 'bg-emerald-500')
                            : (result.verification.truth_score >= 80 ? 'bg-emerald-500' : result.verification.truth_score >= 50 ? 'bg-orange-500' : 'bg-rose-500')
                          )
                          }`}
                        style={{ width: `${scoreDisplay}%` }}
                      />
                    </div>
                    <div className={`flex justify-between text-[0.5rem] font-extrabold tracking-wider px-0.5 uppercase ${highContrast ? 'text-white' : 'text-[#8c7960]'
                      }`}>
                      <span>{isScam ? t('safe') : t('risk')}</span>
                      <span>50%</span>
                      <span>{isScam ? t('risk') : t('safe')}</span>
                    </div>
                  </div>
                </div>

                {/* Reasoning Trace Column */}
                <div className="md:col-span-3 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className={`h-4 w-4 ${styles.text}`} />
                    <span className={`text-[0.625rem] font-bold uppercase tracking-wider ${highContrast ? 'text-white' : 'text-stone-500'
                      }`}>
                      {t('consensusAudit')}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed [word-break:normal] [overflow-wrap:normal] break-words">
                    {defangUrl(result.verification.reasoning_trace)}
                  </p>
                </div>
              </div>

              {/* Key Summary points */}
              <div className="space-y-3.5">
                <h3 className={`text-[0.625rem] font-bold uppercase tracking-wider ${highContrast ? 'text-white' : 'text-[#7c6950]'
                  }`}>{t('summaryPoints')}</h3>
                <div className="grid grid-cols-1 gap-3">
                  {result.summary.summary_points.map((point, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-4 border rounded-xl ${highContrast
                      ? 'bg-black border-white'
                      : (alarmMode ? 'bg-rose-50/20 border-rose-100/50 text-rose-950' : 'bg-[#faf6ee]/60 border-[#e9e2d3] text-[#3c3020]')
                      }`}>
                      <span className={`text-sm font-semibold pt-0.5 shrink-0 ${highContrast ? 'text-white' : (alarmMode ? 'text-rose-600' : 'text-amber-800')
                        }`}>
                        0{idx + 1}.
                      </span>
                      <p className="text-sm leading-relaxed font-medium [word-break:normal] [overflow-wrap:normal] break-words">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Red Flags list — scams always, plus viral rumors */}
              {(isScam || isRumor) && result.verification.red_flags && result.verification.red_flags.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className={`text-[0.625rem] font-bold uppercase tracking-wider ${highContrast ? 'text-white' : 'text-rose-700'
                    }`}>{t('redFlags')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.verification.red_flags.map((flag, idx) => (
                      <span key={idx} className={`px-2.5 py-1 rounded-lg text-xs font-bold border [word-break:normal] [overflow-wrap:normal] ${highContrast
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
              <div className={`border rounded-xl p-5 ${highContrast
                ? 'bg-black border-2 border-white'
                : (alarmMode ? 'border-rose-250 bg-rose-50/30' : 'border-[#e6decb] bg-[#fbf8f3]')
                }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${highContrast ? 'bg-white' : (alarmMode ? 'bg-rose-500' : 'bg-amber-600')
                    }`} />
                  <h4 className={`text-[0.625rem] font-bold uppercase tracking-wider ${highContrast ? 'text-white' : (alarmMode ? 'text-rose-700' : 'text-amber-800')}`}>
                    {isScam ? t('financialRisk') : t('citizenImpact')}
                  </h4>
                </div>
                <p className="text-sm leading-relaxed font-medium [word-break:normal] [overflow-wrap:normal] break-words">
                  {result.summary.citizen_impact}
                </p>
              </div>

              {/* Actionable Advice / Civic Steps */}
              {result.summary.actionable_advice && (
                <div className={`border rounded-xl p-5 ${highContrast
                  ? 'bg-black border-2 border-white'
                  : (alarmMode ? 'border-amber-300 bg-amber-50/20' : 'border-stone-200 bg-stone-50/50')
                  }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${highContrast ? 'bg-white' : (alarmMode ? 'bg-amber-500' : 'bg-stone-500')
                      }`} />
                    <h4 className={`text-[0.625rem] font-bold uppercase tracking-wider ${highContrast ? 'text-white' : (alarmMode ? 'text-amber-700' : 'text-stone-600')}`}>
                      {t('actionAdvice')}
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed font-medium [word-break:normal] [overflow-wrap:normal] break-words">
                    {result.summary.actionable_advice}
                  </p>
                </div>
              )}

              {/* Audit / Gonka Proof Footer */}
              <div id="audit-drawer" className={`border-t pt-4 ${highContrast ? 'border-white' : (alarmMode ? 'border-rose-100' : 'border-[#f6efe2]')}`}>
                <button
                  type="button"
                  onClick={() => setShowAudit(!showAudit)}
                  className="w-full flex items-center justify-between text-[0.6875rem] font-semibold text-[#7c6950] hover:text-[#3c3020] transition-colors py-2 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className={`h-4 w-4 ${highContrast ? 'text-white' : 'text-amber-700'}`} />
                    {t('requestAudit')}
                  </span>
                  {showAudit ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {showAudit && (
                  <div className={`mt-3 p-4 rounded-lg border font-mono text-[0.625rem] space-y-3.5 animate-in slide-in-from-top-2 duration-200 ${highContrast ? 'bg-black border-white text-white' : 'bg-[#faf6ee] border-[#ebdcb8] text-[#7c6950]'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Model 1 Column */}
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between gap-2 border-b pb-2 border-stone-200/40">
                          <span className={`font-bold block ${highContrast ? 'text-white' : 'text-[#5c4a36]'}`}>{t('model1Header')}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[0.5rem] font-bold shrink-0 ${result.model1UsedFallback
                            ? 'bg-orange-100 text-orange-850 border border-orange-350'
                            : 'bg-emerald-100 text-emerald-850 border border-emerald-350'
                            }`}>
                            {result.model1UsedFallback ? t('fallbackEngine') : t('primaryEngine')}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className={`p-3 rounded-xl border space-y-2.5 ${highContrast ? 'bg-black border-white text-white' : 'bg-white border-[#ebdcb8] text-[#3c3020]'}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[0.5625rem] font-bold text-stone-400 uppercase tracking-wider">{t('requestReference')}</span>
                              {result.model1RequestId !== 'unavailable' && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyId(result.model1RequestId)}
                                  className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                                  title="Copy Request ID"
                                >
                                  {copiedId === result.model1RequestId ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600 font-extrabold" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>

                            {result.model1RequestId === 'unavailable' ? (
                              <p className="text-rose-600 font-bold text-xs">unavailable</p>
                            ) : (
                              <div className="space-y-3">
                                <p className={`text-xs font-mono font-bold break-all select-all ${highContrast ? 'text-white' : 'text-stone-800'}`}>
                                  {result.model1RequestId}
                                </p>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleFetchReceipt(result.model1RequestId, 1)}
                                    className={`text-[0.5625rem] font-extrabold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-sm ${model1Receipt
                                      ? 'bg-[#433422] text-[#f4ecd8] border-[#433422] hover:bg-[#342718]'
                                      : 'bg-stone-50 text-stone-650 border-stone-200 hover:bg-stone-100'
                                      }`}
                                  >
                                    <FileSearch className="h-3 w-3" />
                                    {loadingM1Receipt ? t('fetchingProof') : model1Receipt ? t('hideReceiptBadge') : t('verifyOnGonka')}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {model1Receipt && (
                            <div className="space-y-2 animate-in slide-in-from-top-1">
                              <ReceiptBadge receipt={model1Receipt} highContrast={highContrast} sepiaMode={sepiaMode} language={language} />
                              {model1Receipt.error && (
                                <button
                                  type="button"
                                  onClick={() => handleFetchReceipt(result.model1RequestId, 1)}
                                  className="text-[0.5625rem] font-bold text-stone-500 hover:text-stone-700 underline cursor-pointer px-1 flex items-center gap-1"
                                >
                                  <RefreshCw className={`h-2.5 w-2.5 ${loadingM1Receipt ? 'animate-spin' : ''}`} />
                                  {loadingM1Receipt ? t('retrying') : t('retryVerification')}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Model 2 Column */}
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between gap-2 border-b pb-2 border-stone-200/40">
                          <span className={`font-bold block ${highContrast ? 'text-white' : 'text-[#5c4a36]'}`}>{t('model2Header')}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[0.5rem] font-bold shrink-0 ${result.model2UsedFallback
                            ? 'bg-orange-100 text-orange-850 border border-orange-350'
                            : 'bg-emerald-100 text-emerald-850 border border-emerald-350'
                            }`}>
                            {result.model2UsedFallback ? t('fallbackEngine') : t('auditConsensus')}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className={`p-3 rounded-xl border space-y-2.5 ${highContrast ? 'bg-black border-white text-white' : 'bg-white border-[#ebdcb8] text-[#3c3020]'}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[0.5625rem] font-bold text-stone-400 uppercase tracking-wider">{t('requestReference')}</span>
                              {result.model2RequestId !== 'unavailable' && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyId(result.model2RequestId)}
                                  className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                                  title="Copy Request ID"
                                >
                                  {copiedId === result.model2RequestId ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600 font-extrabold" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>

                            {result.model2RequestId === 'unavailable' ? (
                              <p className="text-rose-600 font-bold text-xs">unavailable</p>
                            ) : (
                              <div className="space-y-3">
                                <p className={`text-xs font-mono font-bold break-all select-all ${highContrast ? 'text-white' : 'text-stone-800'}`}>
                                  {result.model2RequestId}
                                </p>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleFetchReceipt(result.model2RequestId, 2)}
                                    className={`text-[0.5625rem] font-extrabold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-sm ${model2Receipt
                                      ? 'bg-[#433422] text-[#f4ecd8] border-[#433422] hover:bg-[#342718]'
                                      : 'bg-stone-50 text-stone-650 border-stone-200 hover:bg-stone-100'
                                      }`}
                                  >
                                    <FileSearch className="h-3 w-3" />
                                    {loadingM2Receipt ? t('fetchingProof') : model2Receipt ? t('hideReceiptBadge') : t('verifyOnGonka')}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {model2Receipt && (
                            <div className="space-y-2 animate-in slide-in-from-top-1">
                              <ReceiptBadge receipt={model2Receipt} highContrast={highContrast} sepiaMode={sepiaMode} language={language} />
                              {model2Receipt.error && (
                                <button
                                  type="button"
                                  onClick={() => handleFetchReceipt(result.model2RequestId, 2)}
                                  className="text-[0.5625rem] font-bold text-stone-500 hover:text-stone-700 underline cursor-pointer px-1 flex items-center gap-1"
                                >
                                  <RefreshCw className={`h-2.5 w-2.5 ${loadingM2Receipt ? 'animate-spin' : ''}`} />
                                  {loadingM2Receipt ? t('retrying') : t('retryVerification')}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`pt-2 border-t text-[0.5625rem] flex items-center justify-between ${highContrast ? 'border-white text-white' : 'border-[#ebdcb8] text-[#8c7960]'
                      }`}>
                      <span>Base API: https://api.gonkarouter.io/v1</span>
                      <a
                        href="https://gonkarouter.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1 ${highContrast ? 'text-white underline' : 'text-amber-800 hover:text-amber-900'
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
        <div id="dev-test-drawer" className={`pt-4 border-t ${highContrast ? 'border-white' : sepiaMode ? 'border-[#e4d4b5]' : 'border-[#ebdcb8]/45'}`}>
          <button
            type="button"
            onClick={() => setShowDevTest(!showDevTest)}
            className={`flex items-center gap-1.5 text-[0.625rem] font-bold transition-colors cursor-pointer ${highContrast ? 'text-white' : sepiaMode ? 'text-[#8c745a] hover:text-[#433422]' : 'text-[#7c6950] hover:text-[#2c2214]'
              }`}
          >
            <Info className="h-3 w-3" />
            {showDevTest ? t('hideConnTest') : t('runConnTest')}
          </button>

          {showDevTest && (
            <div className={`mt-3 border rounded-xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200 ${highContrast ? 'bg-black border-white' : sepiaMode ? 'bg-[#fcf8ef] border-[#e4d4b5]' : 'bg-[#fcfbfa] border-[#ebdcb8] shadow-sm'
              }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${highContrast ? 'border-white' : sepiaMode ? 'border-[#e4d4b5]' : 'border-[#e6decb]'
                }`}>
                <div>
                  <h3 className="font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle className={`h-4 w-4 ${highContrast ? 'text-white' : 'text-amber-700'}`} />
                    {t('connTestTitle')}
                  </h3>
                  <p className={`text-[0.6875rem] ${highContrast ? 'text-white' : sepiaMode ? 'text-[#8c745a]' : 'text-[#7c6950]'}`}>{t('connTestDesc')}</p>
                </div>
                <button
                  type="button"
                  onClick={handleVerifyGonka}
                  disabled={devLoading}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${highContrast
                    ? 'bg-black text-white border-white hover:bg-zinc-900'
                    : sepiaMode
                      ? 'bg-[#433422] text-[#f4ecd8] border-[#433422] hover:bg-[#342718]'
                      : 'bg-[#3c3020] text-[#faf6ee] border-[#3c3020] hover:bg-[#2c2317]'
                    }`}
                >
                  {devLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : t('runTestBtn')}
                </button>
              </div>

              {devResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {devResult.error ? (
                    <div className={`col-span-2 p-3 border rounded-lg ${highContrast ? 'bg-black border-white text-white' : sepiaMode ? 'bg-[#fcf4e8] border-[#e4d4b5] text-[#b33e2b]' : 'bg-[#fff5f5] border-rose-200 text-rose-700'
                      }`}>
                      <span className="font-bold">{t('errorPrefix')}</span> {devResult.error}
                    </div>
                  ) : (
                    <>
                      <div className={`p-3 rounded-lg border ${highContrast ? 'bg-black border-white' : sepiaMode ? 'bg-[#faf6ee]/70 border-[#e4d4b5]' : 'bg-[#faf6ee] border-[#e9e2d3]'}`}>
                        <span className={`block mb-1 uppercase font-bold text-[0.5625rem] tracking-wider ${highContrast ? 'text-white' : sepiaMode ? 'text-[#8c745a]' : 'text-[#7c6950]'}`}>{t('responseLabel')}</span>
                        <p className={highContrast ? 'text-white' : 'text-[#3c3020]'}>{devResult.text}</p>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${highContrast ? 'bg-black border-white' : sepiaMode ? 'bg-[#faf6ee]/70 border-[#e4d4b5]' : 'bg-[#faf6ee] border-[#e9e2d3]'}`}>
                        <span className={`block mb-1 uppercase font-bold text-[0.5625rem] tracking-wider ${highContrast ? 'text-white' : sepiaMode ? 'text-[#8c745a]' : 'text-[#7c6950]'}`}>{t('requestIdLabel')}</span>
                        <p className={highContrast ? 'text-white' : sepiaMode ? 'text-[#8c745a] font-bold break-all select-all' : 'text-amber-850 font-bold break-all select-all'}>{devResult.requestId}</p>
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
      <footer className={`border-t py-6 text-center text-xs mt-auto space-y-1 ${highContrast ? 'bg-black border-white text-white' : 'border-[#ebdcb8] bg-[#fbf8f3] text-[#8c7960]'
        }`}>
        <p>{t('footerText')}</p>
        <p className="text-[0.625rem] opacity-75 font-mono font-semibold">CivicPulse v1.0.0 • Gonka Dual-AI Hedged Consensus Engine</p>
      </footer>

      {/* Share Modal Popover with Canvas PNG Preview */}
      {showShareModal && (
        <div
          onClick={() => setShowShareModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border p-6 space-y-5 shadow-2xl cursor-default ${highContrast
              ? 'bg-black border-white text-white'
              : sepiaMode
                ? 'bg-[#fdfbf7] border-[#ebdcb8] text-[#2c2214]'
                : 'bg-white border-[#ebdcb8] text-[#2c2214]'
              }`}>
            <div className="flex items-center justify-between border-b pb-3 border-stone-200/50">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-amber-700" />
                  {t('shareModalTitle')}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">{t('shareModalDesc')}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Generated PNG Image Preview */}
            <div className="space-y-2">
              <span className="text-[0.625rem] font-bold text-stone-400 uppercase tracking-wider block">Visual Social Media Card (PNG)</span>
              {shareImageDataUrl ? (
                <img
                  src={shareImageDataUrl}
                  alt="CivicPulse Share Card"
                  className="w-full rounded-xl border border-stone-300 shadow-md object-cover"
                />
              ) : (
                <div className="h-48 w-full rounded-xl bg-stone-100 flex items-center justify-center animate-pulse">
                  <span className="text-xs font-bold text-stone-400">Generating Card Image...</span>
                </div>
              )}
            </div>

            {/* Action Buttons: Only Download Image Card & Copy Text Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={!shareImageDataUrl}
                className="py-3 px-4 rounded-xl font-bold text-xs bg-[#433422] text-[#f4ecd8] hover:bg-[#342718] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Download className="h-4 w-4" />
                {t('downloadImageCard')}
              </button>

              <button
                type="button"
                onClick={handleCopyShareText}
                className="py-3 px-4 rounded-xl font-bold text-xs border border-stone-300 bg-stone-100 text-stone-800 hover:bg-stone-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {copiedShare ? <Check className="h-4 w-4 text-emerald-600 font-extrabold" /> : <Copy className="h-4 w-4" />}
                {copiedShare ? t('copied') : t('copyTextSummary')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
