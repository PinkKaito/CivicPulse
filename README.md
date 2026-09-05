# CivicPulse — Dual-AI Public Fact-Checker & Anti-Phishing Guard

**A dual-AI public fact-checker and phishing guard.** Paste a news link, a suspicious SMS, a forwarded WhatsApp message, or a job/investment pitch — CivicPulse runs it past **two independent AI models on a decentralized network**, showing a credibility score, specific red flags, plain-language advice, and an auditable receipt proving the check actually executed.

**Built for:** MUBA Blockchain Hackathon 2026 — **Gonka Track ("AI for Society")**.

**Live Demo URL:** https://civicpulse-hackathon.vercel.app

---

## 📌 Project Description

CivicPulse is an installable Progressive Web App (PWA) designed for zero-friction citizen media literacy and fraud protection. 

Instead of relying on a single AI model or asking users to trust a centralized authority, CivicPulse routes claims to **two independent AI models from different model families** running on the **decentralized Gonka inference network**. 
- **Model 1 (`DeepSeek-V4-Flash`)** extracts structural context, impact, and safety advice.
- **Model 2 (`MiniMax-M2.7`)** independently audits the claim for financial traps, phishing URLs, and manipulative urgency.

If the two models disagree by >25 points, CivicPulse surfaces the score gap explicitly to warn the user. Every verification generates a public Gonka Request ID and node receipt, ensuring that truth verification is auditable, transparent, and decentralized.

---

## 🚨 Problem Statement

Ordinary citizens face a double crisis:

1. **Relentless Misinformation & Fraud:** Phishing SMS, fake government aid announcements (STR / disaster relief), Telegram "easy money" jobs, and miracle-cure chain messages target the most vulnerable — seniors, non-native speakers, and citizens in a hurry.
2. **The Trust Deficit in Centralized Fact-Checking:** Conventional fact-checkers operate as centralized gatekeepers. Citizens frequently ask *"Who decides what is true?"* when answers come from a single opaque server.

**CivicPulse's Solution:** Eliminate centralized gatekeeping. Cross-verify claims across two independent AI model families on a decentralized inference network, flag model disagreements transparently, and attach a look-up-able execution receipt to every check.

---

## ⛓️ Blockchain & Decentralized Technology Used

CivicPulse is built on the **Gonka Decentralized AI Inference Network** (`https://api.gonkarouter.io/v1`).

* **Decentralized Inference Execution:** Compute is distributed across independent operator nodes (**Devshards**) rather than controlled by a single vendor or centralized backend.
* **Gonka Router Gateway:** Standard OpenAI-compatible API gateway interfacing directly with Gonka's distributed node cluster.
* **3-Second Intelligent Hedging:** Eliminates Cloudflare rate limiting (`429`) and variable node latency by firing hedged requests across distributed nodes with sub-second failover redundancy.
* **Auditable Request Receipts:** Every query outputs a unique `x-request-id` and serving node ID (`x-devshard-id`), allowing citizens to independently verify the exact node execution parameters.

---

## 📜 Smart Contract Addresses & Network Endpoints (Testnet / Gonka Ledger)

As part of the **Gonka Hackathon Track ("AI for Society")**, CivicPulse leverages decentralized inference execution receipts and request ledgers rather than EVM smart contracts:

| Protocol Layer | Target Endpoint / Address | Description |
|---|---|---|
| **Gonka Decentralized Gateway** | `https://api.gonkarouter.io/v1` | OpenAI-compatible decentralized inference router |
| **Gonka Receipt Ledger API** | `https://api.gonkarouter.io/v1/receipts/[id]` | Public endpoint serving cryptographic execution receipts |
| **CivicPulse Receipt Proxy** | `https://civicpulse-hackathon.vercel.app/api/receipt/[id]` | On-demand verification proxy for dual-node receipts |
| **Dual-Node Verification Page** | `https://civicpulse-hackathon.vercel.app/verify/[id]` | Public dual-node verification page linked via QR matrix |

---

## 📊 How It Works (30 Seconds)

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

## 🏗️ Architecture: Two-Model Consensus

Both models are called **in parallel** through the **Gonka Router**, an OpenAI-compatible gateway to a decentralized AI inference network (`https://api.gonkarouter.io/v1`).

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

### Consensus Logic
- **Final Truth Score** = `round((Model 1 score + Model 2 score) / 2)`
- **Scam Risk Score** = `100 − Final Truth Score`
- **Divergence detection**: if the two scores differ by **more than 25 points**, the result carries the note *"Models exhibited divergence on claim certainty; human verification advised"* — and shows exactly how far apart they were. The tool surfaces disagreement instead of averaging it away.

### Hedging (Why it's fast despite network latency)
For **each** model, CivicPulse fires **two identical requests with a 3-second delay** and uses whichever responds first, cancelling the other. A decentralized network has variable node latency; sending hedged copies dramatically cuts the chance of waiting on a slow node while preventing Cloudflare `429` rate limits.

### Cross-Fallback (Why one model failing doesn't break it)
If a model can't be reached at all, CivicPulse retries the analysis with **the other model** — DeepSeek's backup is MiniMax and vice-versa. A single model outage still yields two readings, and the result is marked *"reduced confidence — backup model used"* so the user knows. If **both** models are unreachable, the user gets a plain "please try again" message — never a crash or a fabricated answer.

> An earlier build used `moonshotai/Kimi-K2.6` as Model 2. It was dropped after testing showed it returns malformed output and times out through the router. DeepSeek + MiniMax is the verified-working pair.

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
| **Gonka Proof of Execution** | A panel showing both Gonka request IDs, serving node IDs, and fallback statuses — with a "Verify on Gonka" button that fetches raw receipts side-by-side. |
| **Two input methods** | Paste raw text, **or** paste a news URL — a lightweight parser (Cheerio) extracts the clean article body. |
| **Strict Multilingual Output** | UI and AI analysis outputs 100% in **English, Bahasa Melayu, 中文 (Chinese), and Tamil**, enforced via end-of-prompt priority directives and automated translation passes. |
| **Accessibility & Themes** | Sepia reading theme, high-contrast dark mode, root font-size scaling, and wide layout. |
| **PWA & Mobile Installability** | Enables 1-click home screen installation on iOS, Android, and Desktop without App Store friction, launching full-screen (`standalone` mode) with branded theme colors for instant, native-like mobile fact-checking on-the-go. |
| **Tab-Aware Demo Presets** | Contextual one-click presets for both text claims (CIMB scam, STR aid, NADMA flood relief) and live news URLs (SinChew Sabah news link). |

---

## 📋 Preset Demonstration Scenarios & Real-World Sources

CivicPulse provides pre-configured test presets to demonstrate both real-world scam detection and authentic public service announcements during evaluations:

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

## 🛠️ Tech Stack & Local Setup Instructions

### Tech Stack
- **Framework:** Next.js 16.3.3 (App Router) with Turbopack
- **Language:** TypeScript
- **UI:** React 19, Tailwind CSS 4, `lucide-react` icons
- **AI Gateway:** Gonka Router (decentralized inference network) via the `openai` SDK v7, pointed at `https://api.gonkarouter.io/v1`
- **URL Parsing:** Cheerio
- **Hosting:** Vercel (Fluid Compute)

### Prerequisites
* **Node.js 20.x or higher**
* **npm** or **pnpm**
* A valid **Gonka Router API Key** (`GONKA_API_KEY`)

### Local Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/PinkKaito/CivicPulse.git
cd CivicPulse

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Create a .env.local file in the project root:
# On macOS / Linux:
echo "GONKA_API_KEY=sk-your-gonka-api-key-here" > .env.local

# On Windows (PowerShell):
# "GONKA_API_KEY=sk-your-gonka-api-key-here" | Out-File -Encoding utf8 .env.local

# 4. Run the development server
npm run dev
```

Open **http://localhost:3000** in your browser.

### Quick Health Check
Visit `http://localhost:3000/api/verify-gonka` — a JSON response containing `{"text": "...", "requestId": "..."}` confirms your Gonka API connection is active.

---

## ⚠️ Known Limitations

- **Tamil translations are pending final review.** All four languages work, but the most recently added UI strings were machine-translated into Tamil and still need a native-speaker pass. English, Chinese, and Malay are in better shape.
- **`PUBLIC_HEALTH` and `COMMUNITY_DEVELOPMENT`** are valid categories the model can return, but the UI currently shows them with the same badge label as `NEWS_POLICY`. Scoring and analysis are unaffected — only the badge text.
- **Cold-prompt latency: ~30–70 seconds** (measured up to ~85s in the worst observed case) for content the network hasn't analysed before, because two models are each called twice through a busy decentralized network. Identical repeat content is cached upstream and returns in about a second. The UI shows an elapsed-time counter and a "this can take up to a minute" note so the wait doesn't look like a freeze.
- **No server-side database persistence.** Results are stateless for citizen privacy.

---

## 👥 Team Members

| Name | Role | Responsibilities |
|---|---|---|
| **Ivan** | **Backend & Gonka Integration Lead** | Gonka Router API integration, dual-prompt engineering, consensus & divergence engine, 3s hedging pipeline, Vercel deployment. |
| **Lau Jun Hao** | **Frontend & UX Lead** | Next.js 16 App Router UI, PWA configuration (`manifest.json` + `sw.js`), Sepia/High-Contrast themes, Canvas PNG share card with QR matrix. |
| **Tang Jing Hong** | **QA, Content & Pitch Lead** | Real-world scam test case curation, government advisory verification, README, demo video, pitch day presentation. |

---

## 📑 AI Tools Declaration

This project was built using **Claude Code** (Anthropic) throughout development for rapid prototyping, UI component styling, API route integration, testing against live Gonka Router, and documentation. All architectural decisions, prompt engineering rules, consensus logic, and final code reviews were directed and verified by the team. Session-by-session development logs are recorded in [`ProjectSessionLog.md`](./ProjectSessionLog.md).
