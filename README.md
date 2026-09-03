# CivicPulse

**A dual-AI public fact-checker and phishing guard.** Paste a news link, a
suspicious SMS, a "forwarded as received" WhatsApp message, or a job / investment
pitch — CivicPulse runs it past **two independent AI models on a decentralized
network**, shows you a credibility score, the specific red flags, plain-language
advice, and a look-up-able proof that the analysis actually ran.

**Built for:** MUBA Blockchain Hackathon 2026 — **Gonka track ("AI for Society")**.

**Live demo:** https://civicpulse-hackathon.vercel.app

---

## The problem

Two things hit ordinary citizens at once:

1. **Scams and misinformation are relentless.** Phishing SMS, fake government aid
   announcements, Telegram "easy income" jobs, investment fraud, miracle-cure
   chain messages. They're written to look official and to create panic.
2. **Fact-checking itself has a trust problem.** Conventional fact-checkers are
   centralized — one organisation's call, often with no visible working. "Who
   decides what's true?" is a fair question.

CivicPulse's answer: don't ask one authority. Route the same content to **two
different AI models, running on independent nodes of a decentralized network**,
and show the user where those models *agree*, where they *disagree*, and a
receipt proving the whole thing happened.

---

## How it works (30 seconds)

```
Your text / URL
      │
      ├─►  Model 1  — DeepSeek-V4-Flash  ──┐
      │    "Extractor & Context Analyst"    │   run in parallel,
      │                                     ├─  each model called
      └─►  Model 2  — MiniMax-M2.7  ───────┘   twice (hedged)
           "Independent Credibility Auditor"
                        │
                        ▼
      Average the two scores  →  Final Truth Score  (0–100)
      Scam Risk Score = 100 − Truth Score
      Scores differ by > 25?  →  "models disagree, verify manually" flag
                        │
                        ▼
      Result card: score, category, key points, red flags, advice,
      + "Gonka Proof of Execution" panel with both request IDs
```

---

## Architecture: two-model consensus

Both models are called **in parallel** through the **Gonka Router**, an
OpenAI-compatible gateway to a decentralized AI inference network
(`https://api.gonkarouter.io/v1`).

### Model 1 — Extractor & Context Analyst · `deepseek-ai/DeepSeek-V4-Flash-0731`
Reads the content and produces the *explanation* layer:
- Classifies it: `NEWS_POLICY`, `SCAM_PHISHING`, `JOB_INVESTMENT`, or `VIRAL_RUMOR`.
- Three plain-language key takeaways.
- The direct impact / financial risk to the reader, plus one concrete safety action.
- A preliminary legitimacy score, 0–100.

### Model 2 — Independent Fact & Credibility Auditor · `MiniMaxAI/MiniMax-M2.7`
Reviews the same raw text *without seeing Model 1's answer*, looking for:
- Factual plausibility, missing citations / named officials.
- Manipulative urgency ("act within 24 hours", "limited slots").
- Financial red flags (upfront fees, requests for OTP / bank details / e-KYC).

It returns a list of specific red flags and its own independent score, 0–100.

### Consensus logic
- **Final Truth Score** = `round((Model 1 score + Model 2 score) / 2)`
- **Scam Risk Score** = `100 − Final Truth Score`
- **Divergence detection**: if the two scores differ by **more than 25 points**,
  the result carries the note *"Models exhibited divergence on claim certainty;
  human verification advised"* — and shows exactly how far apart they were. The
  tool surfaces disagreement instead of averaging it away.

### Hedging (why it's usually fast despite a slow network)
For **each** model, CivicPulse fires **two identical requests at the same moment**
and uses whichever responds first, cancelling the other. A decentralized network
has variable node latency; sending two copies dramatically cuts the chance of
waiting on a slow node. (Think: hailing two taxis, taking whichever arrives first.)

### Cross-fallback (why one model failing doesn't break it)
If a model can't be reached at all, CivicPulse retries the analysis with **the
other model** — DeepSeek's backup is MiniMax and vice-versa. A single model
outage still yields two readings, and the result is marked *"reduced confidence —
backup model used"* so the user knows. If **both** models are unreachable, the
user gets a plain "please try again" message — never a crash or a fabricated
answer.

> An earlier build used `moonshotai/Kimi-K2.6` as Model 2. It was dropped after
> testing showed it returns malformed output and times out through the router.
> DeepSeek + MiniMax are the verified-working pair.

---

## Features

| Feature | What it does |
|---|---|
| **Two-model verification** | Two different model *families* (DeepSeek + MiniMax) corroborate independently. Agreement = signal; disagreement = flagged, not hidden. |
| **Truth / Scam-Risk scoring** | One 0–100 number, framed as trust (Truth Score) for news/rumors and as danger (Scam Risk Score) for scams. |
| **Divergence detection** | When the models disagree by >25 points, the result explicitly flags the discrepancy and calculates the exact score delta. |
| **`VIRAL_RUMOR` category with hybrid alarm styling** | Hoaxes / chain messages / unsourced "policy" claims are scored on the Truth Score scale — but if the auditor rates one **HIGH RISK** or **SUSPICIOUS**, the card switches to red alarm treatment. |
| **Visual Social Share Card (PNG)** | 1-click export of `1200x630` PNG report cards featuring a character-aware multi-language canvas wrapping engine and a high-contrast 2D QR matrix linking to live dual-model verification pages on Vercel. |
| **3-Second Intelligent Hedging** | Eliminates Cloudflare rate limiting (`429 / rate_limited`) on Gonka router by delaying hedged duplicate requests by 3 seconds while maintaining 100% failover redundancy. |
| **Gonka Proof of Execution** | A panel showing both Gonka request IDs, serving node IDs, and fallback statuses — with a "Verify on Gonka" button that fetches raw cryptographic receipts side-by-side. |
| **Two input methods** | Paste raw text, **or** paste a news URL — a lightweight parser (Cheerio) extracts the clean article body. |
| **Strict Multilingual Output** | UI and AI analysis outputs 100% in **English, Bahasa Melayu, 中文 (Chinese), and Tamil**, enforced via end-of-prompt priority directives and automated translation passes. |
| **Accessibility & Themes** | Sepia reading theme, high-contrast dark mode, root font-size scaling, and wide `max-w-7xl` edge-to-edge layout. |
| **PWA & Mobile Installability** | Enables 1-click home screen installation on iOS, Android, and Desktop without App Store friction, launching full-screen (`standalone` mode) with branded theme colors for instant, native-like mobile fact-checking on-the-go. |
| **Tab-Aware Demo Presets** | Contextual one-click presets for both text claims (CIMB scam, STR aid, NADMA flood relief) and live news URLs (SinChew Sabah news link). |

---

## 📋 Preset Demonstration Scenarios & Real-World Sources

CivicPulse provides pre-configured test presets to demonstrate both real-world scam detection and authentic public service announcements during evaluations:

---

### Preset 1: 🚨 Bank Account Frozen Alert (Phishing / Smishing — English)
* **Status:** High Scam Risk / Low Truth Score
* **Source Attribution:** Modeled after joint advisories by the **Royal Malaysia Police (PDRM) Commercial Crime Investigation Department (JSJK)** and the **National Scam Response Centre (NSRC 997)**.
* **Threat Characteristics:**
  * Uses psychological coercion and urgency tactics (*"within 24 hours"* / *"permanent account suspension"*).
  * Directs targets to a counterfeit phishing domain (`cimb-online-security-verify.com`) disguised as an authentic banking institution.
* **Primary Target:** Financial credentials and account harvesting.

---

### Preset 2: ✅ STR Cash Aid Disbursement (Official Advisory — English)
* **Status:** High Truth Score / Safe Rating
* **Source Attribution:** Based on official press releases issued by the **Inland Revenue Board of Malaysia (HASiL / LHDNM)** and the **Ministry of Finance Malaysia (MOF)**.
* **Official Portal:** [https://bantuantunai.hasil.gov.my](https://bantuantunai.hasil.gov.my)
* **Legitimacy Characteristics:**
  * Directs recipients exclusively to the official `.gov.my` sovereign portal.
  * Explicitly includes security reminders stating that no third-party links, fees, or manual PINs are ever required.

---

### Preset 3: ✅ Monsoon Disaster Relief Notice (Official Advisory — 中文)
* **Status:** High Truth Score / Safe Rating
* **Source Attribution:** Based on public disaster assistance advisories issued by the **National Disaster Management Agency (NADMA)** under the Prime Minister's Department of Malaysia.
* **Official Portal:** [https://www.nadma.gov.my](https://www.nadma.gov.my)
* **Legitimacy Characteristics:**
  * Transparently routes citizens to the authentic administrative disaster portal.
  * Includes proactive fraud safeguards reminding the public that government bodies never solicit OTPs, passwords, or banking credentials via private messaging.

---

### Preset 4: 📰 SinChew Sabah News Article (Live News Link Preset — 中文 / Link)
* **Status:** High Truth Score / Safe Rating
* **Source Attribution:** Live digital news report published by **Sin Chew Daily Sabah (星洲日报沙巴)**.
* **Official URL:** `https://sabah.sinchew.com.my/news/20260903/sabah/7813698`
* **Legitimacy Characteristics:**
  * Demonstrates CivicPulse's real-time Web Scraping & URL Article Body Extraction engine (via Cheerio parser).
  * Evaluates authentic news reporting regarding community health events (UMS World Mosquito Day Carnival) sponsored by recognized academic institutions (Universiti Malaysia Sabah & National University of Singapore).

---

## Tech stack

- **Framework:** Next.js 16.3.3 (App Router) with Turbopack
- **Language:** TypeScript
- **UI:** React 19, Tailwind CSS 4, `lucide-react` icons
- **AI:** Gonka Router (decentralized inference network) via the `openai` SDK v7,
  pointed at `https://api.gonkarouter.io/v1`
- **URL parsing:** Cheerio
- **Hosting:** Vercel (Fluid Compute, 5-minute function limit)

There is no database. Each analysis is a stateless request; nothing is stored
server-side.

---

## Running it locally

You need **Node.js 20 or newer** and a **Gonka Router API key**
(from the Gonka hackathon organisers).

```bash
# 1. Clone the repo
git clone https://github.com/PinkKaito/CivicPulse.git
cd CivicPulse

# 2. Install dependencies (creates the node_modules/ folder)
npm install

# 3. Create a local environment file for your API key
#    (this file is git-ignored and never committed)
#    On macOS/Linux:
echo "GONKA_API_KEY=sk-your-real-key-here" > .env.local
#    On Windows (PowerShell):
#    "GONKA_API_KEY=sk-your-real-key-here" | Out-File -Encoding utf8 .env.local

# 4. Start the dev server
npm run dev
```

Open **http://localhost:3000**. Paste a claim and submit. The first analysis of
any new text takes 30–70 seconds (see *Known limitations*); repeated text is
near-instant.

**Quick health check:** visit `http://localhost:3000/api/verify-gonka` — a
`{"text": "...", "requestId": "..."}` response means your key works. An error
mentioning `GONKA_API_KEY` means step 3 didn't take (the dev server only reads
`.env.local` at startup — restart it after editing).

---

## Known limitations

- **Tamil translations are pending final review.** All four languages work, but
  the most recently added UI strings were machine-translated into Tamil and still
  need a native-speaker pass. English, Chinese, and Malay are in better shape.
- **`PUBLIC_HEALTH` and `COMMUNITY_DEVELOPMENT`** are valid categories the model
  can return, but the UI currently shows them with the same badge label as
  `NEWS_POLICY`. Scoring and analysis are unaffected — only the badge text.
- **Cold-prompt latency: ~30–70 seconds** (measured up to ~85s in the worst
  observed case) for content the network hasn't analysed before, because two
  models are each called twice through a busy decentralized network. Identical
  repeat content is cached upstream and returns in about a second. The UI shows
  an elapsed-time counter and a "this can take up to a minute" note so the wait
  doesn't look like a freeze.
- **No persistence.** Results aren't saved; refreshing the page clears them.

---

## Team

| Name | Role |
|---|---|
| *(to fill in)* | *(e.g. Backend / pipeline)* |
| *(to fill in)* | *(e.g. Frontend / UX)* |
| *(to fill in)* | *(e.g. Design / research)* |

---

## AI tools declaration

This project was built with **Claude Code** (Anthropic) used throughout
development — for implementation, debugging, architecture decisions, testing
against the live Gonka Router, and documentation. All design decisions and the
final code were reviewed and directed by the team. Session-by-session development
notes are in [`ProjectSessionLog.md`](./ProjectSessionLog.md).
