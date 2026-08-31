# CivicPulse — Decentralized Multi-Model Truth Engine & Universal Claim Analyzer

**CivicPulse** is a decentralized media literacy and fraud prevention application built for the **Gonka Track** hackathon. It simplifies complex public policies, verifies viral claims, and identifies phishing scams and fake job offers using parallel multi-model LLM consensus.

---

## 🔍 The Problem
1. **Centralized Fact-Checking Bias**: Conventional fact-checking platforms are centralized, leading to potential ideological bias, lack of transparency, and distrust among the public.
2. **Rising Digital Fraud & Scams**: The rise of text scams (phishing, WhatsApp forwards, fake investment pitches, and Telegram job offers) targets vulnerable citizens, causing severe identity theft and financial losses.

CivicPulse solves this by decentralizing the analysis layer—routing claims to independent, parallel AI models via the **Gonka DePIN network** to construct a mathematical consensus without human moderators.

---

## 🧠 Multi-Model Consensus Architecture

CivicPulse coordinates two independent models in parallel using `Promise.all` via the Gonka Router OpenAI-compatible API gateway (`https://api.gonkarouter.io/v1`):

1. **Model 1: Extractor & Context Analyst (`deepseek-ai/DeepSeek-V4-Flash-0731`)**
   - Classifies the text into one of: `NEWS_POLICY` | `SCAM_PHISHING` | `JOB_INVESTMENT` | `VIRAL_RUMOR`.
   - Simplifies the content into 3 key takeaway points.
   - Extracts the direct daily life impact (or financial risk) and actionable civic/safety advice.
   - Assigns a **preliminary legitimacy score (0–100)**.
2. **Model 2: Independent Fact & Credibility Auditor (`moonshotai/Kimi-K2.6`)**
   - Independently reviews the raw text for factual plausibility, missing official citations, manipulative urgency, or financial red flags.
   - Detects specific list of **Red Flags**.
   - Assigns an **independent score (0–100)**.

### Consensus Logic & Divergence Engine
*   **Final Truth Score**: Calculated as the average of the two independent scores:
    $$\text{Final Truth Score} = \text{round}\left(\frac{\text{Model 1 Score} + \text{Model 2 Score}}{2}\right)$$
*   **Scam Risk Score**: Calculated as:
    $$\text{Scam Risk Score} = 100 - \text{Final Truth Score}$$
*   **Divergence Warning**: If the scores differ by **more than 25 points** ($\Delta > 25$), the engine automatically appends a warning consensus note:
    *"Models exhibited divergence on claim certainty; human verification advised."*

---

## 🛡️ Verifiable Request IDs (Audit Trail)
To provide transparent proof of execution:
- The backend extracts the unique `response.id` (Gonka Request ID) returned from each decentralized node's execution header.
- A collapsible **"Gonka Proof of Execution"** audit drawer displays these IDs, demonstrating cryptographically that the verification did take place on the Gonka network.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 (Warm Reading Paperback Sepia Aesthetic & High Contrast Mode)
- **Decentralized AI Router**: Gonka Router (OpenAI SDK client)
- **Lightweight Parser**: Cheerio (extracts clean text body, title, and OpenGraph descriptions from URLs)

---

 **Live Demo URL**:
   *(Provide your deployed live demo URL here)*
