# CivicPulse — Pitch Day Cheat Sheet

**For:** B and C, presenting on **6 September 2026**.
**Purpose:** answer judges' technical questions with confidence, without needing
to read the code. Everything here is accurate to what's actually built and
deployed.

**Live app:** https://civicpulse-hackathon.vercel.app

---

## 1. The one-sentence pitch

> **CivicPulse lets any citizen paste a suspicious message, news link, or job
> offer and get an instant, plain-language verdict on whether it's trustworthy —
> checked by two independent AI models on a decentralized network, with a
> receipt proving the check actually happened.**

**Why it matters (the public-value angle):** scams and misinformation target the
people least equipped to spot them — the elderly, non-native speakers, anyone in
a hurry. And the tools meant to help (fact-checkers) are centralized and opaque,
so people don't trust them. CivicPulse is fast, speaks four languages, explains
its reasoning, tells you what to *do*, and doesn't ask you to just trust one
authority.

---

## 2. How the AI verification actually works

**Two different AI models look at the same content, separately.**

- **Model 1 (DeepSeek-V4-Flash)** — the "explainer." It figures out what kind of
  message this is (news / scam / job-or-investment / viral rumor), pulls out the
  3 key points, explains the risk to the reader, gives one safety tip, and puts a
  0–100 trust score on it.
- **Model 2 (MiniMax-M2.7)** — the "auditor." It independently checks the same
  raw text for red flags: missing sources, fake urgency ("act in 24 hours"),
  requests for bank details or OTP codes, financial traps. It lists those red
  flags and gives its *own* 0–100 score — **without seeing Model 1's answer.**

**Then we combine them:**
- The final score is the **average** of the two.
- If the two models **disagree by more than 25 points**, the app flags it:
  *"the models disagree — a human should double-check this."* It shows you the
  disagreement instead of hiding it inside an average.

### Why two models is better than one — *(say this to a judge)*

> "A single AI model has blind spots and can be confidently wrong — it'll give
> you a clean answer even when it's unsure. We use two models from **different
> companies, trained on different data**, so they don't share the same blind
> spots. If they agree, that's a real signal. If they disagree, we don't paper
> over it — we tell the user to verify manually. It's the difference between
> asking one friend versus asking two and noticing when they don't match."

---

## 3. What "Gonka Router" is and why it matters

**Gonka Router is a decentralized AI network.** Instead of every request going to
one company's servers (like OpenAI's), requests are routed to **independent
operator nodes** run by different people. Gonka gives us a standard
OpenAI-style connection point, but the actual computation happens across a
distributed network.

### Why that matters *specifically* for a fact-checking tool — *(say this)*

> "Fact-checking has a 'who decides what's true' problem. If our verification ran
> entirely on one company's servers, we'd just be another centralized gatekeeper.
> By running it through a decentralized network, the **execution layer isn't
> controlled by us or by any single vendor** — and every check produces a public
> record you can look up independently. We're not asking people to trust
> CivicPulse. We're giving them a result they can audit."

**Honest nuance if pressed:** the *models themselves* (DeepSeek, MiniMax) are
still made by companies. What's decentralized is **where the analysis runs and
the proof that it ran** — the routing and the receipts, not the model weights.
Don't claim the models are decentralized.

---

## 4. The "Proof of Execution" panel (the Gonka Request IDs)

After every analysis, a panel opens showing **two Request IDs** — one for each
model call — plus which model answered and which network node served it. There's
a "Verify on Gonka" button that pulls up the official receipt.

**What it proves:** the analysis genuinely ran on the Gonka network, on real
nodes, at a specific time — with an ID anyone can look up. It's not a black box,
and the result wasn't faked or hard-coded.

**Why we built it — *(say this)*:**

> "A tool that judges trustworthiness should itself be checkable. Most AI apps
> ask you to just believe the output. We attach a receipt to every single
> verification so it's auditable — that's the whole point of doing this on a
> decentralized network instead of a private API."

---

## 5. Likely tough questions — honest, simple answers

### "Why does it sometimes take up to a minute?"
> "Two AI models each analyze the content, and to be resilient against a slow
> network node we actually send each request twice and take the faster reply.
> That's four calls across a decentralized network for one result. The first time
> anyone checks a particular piece of text it takes 30–70 seconds; after that
> it's cached and near-instant. The app shows a timer and a 'this can take up to
> a minute' note so it's clearly working, not frozen."

*(If demoing live: run your demo examples once a few minutes beforehand so
they're cached and return instantly on stage.)*

### "What happens if one AI model fails?"
> "Each model backs the other one up — if DeepSeek is unreachable we re-run that
> step on MiniMax, and vice-versa. You still get two readings, and the result is
> marked 'reduced confidence — backup model used' so it's transparent. If *both*
> are down, the user gets a clear 'please try again' message — we never show a
> crash or a made-up answer."

### "How is this different from just asking ChatGPT?"
> "Three things. **One:** ChatGPT is a single model that will confidently answer
> even when it's unsure — we use two independent models and explicitly flag when
> they disagree. **Two:** there's no verifiable record with ChatGPT; every
> CivicPulse check has a look-up-able receipt. **Three:** it's purpose-built for
> citizens — it names the specific scam red flags, tells you exactly what to do,
> works in four languages, and knows local context like MyKad and .gov.my
> domains. It's a safety tool, not a chatbot."

### "Is this available in multiple languages?"
> "Yes — English, Chinese, Bahasa Melayu, and Tamil. Both the interface and the
> AI's analysis come back in the language you pick. Honest caveat: the newest
> Tamil interface text is machine-translated and still waiting on a native
> speaker to review the phrasing — the meaning is right, the polish isn't final.
> English, Chinese and Malay are solid."

### "What's the VIRAL_RUMOR category, and how is it different from a scam?"
> "A **scam** is someone actively trying to take your money or data right now — a
> phishing link, a fake job asking for a deposit. A **viral rumor** is
> misinformation spreading socially — a hoax, a chain message, a fake policy
> announcement with no named source, a miracle cure. Nobody's directly robbing
> you, but the harm is people believing and forwarding it. We score rumors on the
> trust scale rather than a 'scam risk' scale — but if the auditor rates a rumor
> HIGH RISK, the card turns red and shows all the red flags, same as a scam. A
> mild rumor stays calm and just informational."

### Bonus: "Isn't the AI itself biased? Who decides what's true here?"
> "No single source decides. Two different model families cross-check each other,
> and we surface disagreement instead of hiding it. And the app doesn't present
> itself as the final word — for anything serious it tells the user to confirm
> through official government channels. It's a triage and literacy aid, not an
> oracle."

---

## 6. If a question goes beyond this sheet

**Don't guess.** Say something like:

> "That's a great technical question — I'd rather give you an accurate answer than
> guess at it. Let me follow up with our teammate who built that part and get you
> the detail after the session."

or

> "Good question — that's outside what I can speak to precisely right now, but
> it's in our development notes and I'm happy to walk you through it afterwards."

Judges respect "I'll get you the right answer" far more than a confident wrong one.

---

## Quick-reference facts (for fast recall)

| | |
|---|---|
| Models | **DeepSeek-V4-Flash** (explainer) + **MiniMax-M2.7** (auditor) |
| Network | **Gonka Router** — decentralized AI inference network |
| Score | Average of the two models, 0–100; disagreement >25 pts = flagged |
| Categories | News/Policy · Scam/Phishing · Job/Investment · Viral Rumor |
| Languages | English · 中文 · Bahasa Melayu · Tamil *(Tamil polish pending)* |
| First-check speed | 30–70 seconds; cached repeats ~1 second |
| If a model fails | Falls back to the other model; flagged as "reduced confidence" |
| Proof | Two Gonka Request IDs per check, independently verifiable |
| Stack | Next.js 16, TypeScript, Tailwind, deployed on Vercel |
| Built with | Claude Code, team-reviewed |

---
---

# Expanded Pitch Day & Q&A Master Cheat Sheet

**Event:** MUBA Blockchain Hackathon 2026 (APU, 6 September 2026)  
**Track:** Gonka Track ("AI for Society")  
**Presenters:** B (Frontend/UX Lead) & C (QA/Pitch Lead)  
**Purpose:** Comprehensive guide for presenting the pitch and answering any technical, philosophical, or business Q&A from judges with absolute confidence.  
**Live App URL:** https://civicpulse-hackathon.vercel.app  

---

## 1. Executive Summary & Core Narrative

### The 60-Second Pitch
> **"CivicPulse is a dual-AI public fact-checker and phishing guard. Any citizen can paste a suspicious message, news link, or job pitch, and get an instant, plain-language verdict on whether it's trustworthy — audited independently by two different AI models on a decentralized network, with a cryptographic receipt proving the check actually happened."**

### Why CivicPulse Matters (The Public-Value Narrative)
1. **The Scam & Misinformation Epidemic:** Vulnerable citizens (seniors, non-native speakers, youth) are bombarded with phishing SMS, fake government aid notices, and viral WhatsApp hoaxes designed to induce panic or urgency.
2. **The Trust Deficit in Fact-Checking:** Conventional fact-checkers are centralized gatekeepers. Citizens frequently ask: *"Who decides what is true?"*
3. **The CivicPulse Answer:** We don't ask citizens to trust one central server or single AI model. We cross-verify content across **two independent AI models from different model families**, running on the **decentralized Gonka inference network**, surfacing model agreement or disagreement transparently alongside a look-up-able execution receipt.

---

## 2. 3-Minute Pitch Presentation Script & Timing Guide

> [!IMPORTANT]
> **Strict Pitch Constraints:** 3 Minutes Pitching (180s) + 1 Minute Q&A (60s). Keep speech brisk, confident, and tight.

| Time | Topic | Presenter | Key Talking Points & Exact Phrasing |
|---|---|---|---|
| **0:00 - 0:30** (30s) | **1. Problem & Hook** | Presenter C | "Every day, millions of citizens receive fake bank warnings or WhatsApp hoaxes designed to create panic. Scams move faster than traditional fact-checkers, and centralized tools demand blind trust: *'Who decides what's true?'*" |
| **0:30 - 1:30** (60s) | **2. Live Demo** | Presenter B | "CivicPulse solves this. Watch us paste a live phishing SMS. In real time, CivicPulse checks the claim across **two independent AI models** on the decentralized Gonka network. Result: 0% Truth, 100% Scam Risk. It extracts specific red flags—fake URL, urgency—gives plain safety advice, and shows a public Gonka Request ID receipt." |
| **1:30 - 2:30** (60s) | **3. Dual-AI & Gonka** | Presenter C | "Under the hood: **Model 1 (DeepSeek-V4-Flash)** extracts context while **Model 2 (MiniMax-M2.7)** audits credibility independently. If scores diverge by >25 points, we flag the uncertainty. Why Gonka? Decentralized inference guarantees execution isn't locked in a private black box—every check leaves an auditable cryptographic receipt." |
| **2:30 - 3:00** (30s) | **4. Impact & Call to Action** | Presenter B | "CivicPulse supports 4 languages (EN, BM, ZH, TA), generates 1-click visual share cards for family group chats, and works as an offline PWA. We are building AI for society that empowers citizens with transparent, auditable truth. Thank you!" |

---

## 3. 1-Minute Q&A Rapid-Fire Strategy (Max 15s Per Answer)

> [!TIP]
> **Rule for 1-Minute Q&A:** The clock is ticking! Give a **15-second bullet answer**. State the direct fact first, then stop. Do not ramble!

* **Q: Why two AI models instead of one?**  
  👉 *"Single models have blind spots and hallucinate with confidence. We cross-audit across two different model families (DeepSeek + MiniMax) and explicitly flag when they disagree."* (12s)

* **Q: Why decentralized on Gonka Router?**  
  👉 *"Fact-checking has an execution authority problem. Decentralized execution means no single company controls the truth, and every check outputs a verifiable Request ID receipt."* (14s)

* **Q: Why does a cold check take 30–70s?**  
  👉 *"It queries two AI models across four hedged network calls for maximum reliability. Upstream caching makes repeat checks instant (~1s)—which is why our live demo was instant."* (14s)

* **Q: How is this different from ChatGPT?**  
  👉 *"ChatGPT is a single black box model. CivicPulse uses dual cross-auditing models, public cryptographic receipts, 4-language support, and purpose-built red flag extraction."* (13s)

* **Q: What is your business model?**  
  👉 *"Free public tier for citizens, B2B API licensing for telcos (SMS filtering) and banks (fraud triage), and developer middleware on Gonka Router."* (11s)

---

## 4. Live Demo Playbook & Pre-Pitch Checklist

### Pre-Pitch Caching Checklist (Crucial!)
> [!IMPORTANT]
> **Pre-warm the cache 5–10 minutes before going on stage!**  
> Run all 4 sample presets once on your phone/laptop. Upstream caching on Gonka ensures that repeated checks return in **~1 second** on stage instead of waiting for a cold cold-model run (30–70s).

### Step-by-Step Demo Flow
1. **Open Deployed App:** Navigate to `https://civicpulse-hackathon.vercel.app`.
2. **Demo Preset 1 (Phishing Scam):**
   - Click chip `🚨 Bank Account Alert (Scam - ENG)`.
   - Hit **Simplify & Cross-Verify Claims**.
   - *Point out:* Red alarm styling, 100% Scam Risk, extracted red flags (`cimb-online-security-verify.com`), clear warning: *"Do NOT click links or provide OTP"*.
3. **Demo Preset 2 (Legitimate Government Aid):**
   - Click chip `✅ STR Aid Notice (Safe - ENG)`.
   - Hit **Simplify & Cross-Verify Claims**.
   - *Point out:* Green safe badge, high Truth Score, validation of official `.gov.my` portal.
4. **Demo Preset 3 (Multilingual Support):**
   - Switch Language dropdown to **Bahasa Melayu** or **中文**.
   - Click `✅ Flood Relief Notice (Safe - 中文)`.
   - *Point out:* Complete localized UI and AI-generated analysis in target language.
5. **Demo Preset 4 (News URL Parser):**
   - Switch to **News Link** tab.
   - Click `📰 SinChew Sabah News Article (Link)`.
   - *Point out:* Cheerio engine automatically extracts clean article body from live news site and evaluates journalistic credibility.
6. **Show Audit Drawer:**
   - Scroll to bottom, expand **Gonka Proof of Execution**.
   - Show `DeepSeek-V4-Flash` and `MiniMax-M2.7` Request IDs, Serving Node (Devshard #), and click **Verify on Gonka** to show raw HTTP receipt.
7. **Show Share Card:**
   - Click **Share Card** button.
   - Show 1200x630 PNG preview card with dynamic 2D QR matrix.

---

## 4. Deep Technical Architecture & Engineering Principles

```
                          User Input (Text / URL)
                                    │
                       ┌────────────┴────────────┐
                       ▼                         ▼
            Cheerio Article Extractor      Raw Text Input
                       │                         │
                       └────────────┬────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            │  Gonka Router (https://api.gonkarouter.io/v1) │
            │       3-Second Intelligent Hedged Pipeline    │
            └───────────┬───────────────────────┬───────────┘
                        │                       │
                        ▼                       ▼
            Model 1 (DeepSeek-V4-Flash)   Model 2 (MiniMax-M2.7)
            "Extractor & Context"         "Independent Auditor"
                        │                       │
                        └───────────┬───────────┘
                                    ▼
                         Consensus & Divergence Engine
                         - Truth Score = Avg(M1, M2)
                         - Scam Risk = 100 - Truth Score
                         - Gap > 25 pts? Flag Divergence
                                    │
                                    ▼
                         UI & Audit Receipt Panel
```

### Key Technical Specs
* **Model Selection:** `deepseek-ai/DeepSeek-V4-Flash-0731` (Extractor) + `MiniMaxAI/MiniMax-M2.7` (Auditor).
  * *Note on Kimi-K2.6:* An earlier build used `moonshotai/Kimi-K2.6` as Model 2, but it was replaced after live testing revealed malformed JSON formatting and network timeouts. DeepSeek + MiniMax is the verified stable pair.
* **3-Second Intelligent Hedging:** To prevent Cloudflare rate limits (`429 Too Many Requests`) on the Gonka gateway while overcoming node latency, duplicate requests are delayed by 3 seconds. If primary node responds in <3s, duplicate is skipped; if primary lags, duplicate responds seamlessly.
* **Cross-Model Redundant Fallback:** If DeepSeek is unreachable, MiniMax runs as fallback (and vice versa). Results carry a transparent badge: *"reduced confidence — backup model used"*.
* **Stateless Architecture:** Zero database storage. No user data, IPs, or text inputs are stored on server disks, ensuring total privacy.

---

## 5. Master Q&A Defense Matrix (20+ Anticipated Questions)

### Category A: Technical Architecture & AI

#### Q1: Why use TWO AI models instead of just one?
> **Answer:** "A single AI model has inherent blind spots and training biases—it can be confidently wrong without warning. By utilizing two models from **completely different model families (DeepSeek and MiniMax)** trained on different datasets, we create an independent cross-audit system. When both agree, confidence is extremely high. When they disagree by >25 points, our system explicitly flags the uncertainty rather than hiding it behind a fake consensus."

#### Q2: What is Gonka Router, and why run this on a decentralized network?
> **Answer:** "Gonka Router is a decentralized AI inference network where LLM execution happens across independent operator nodes rather than a single vendor's server. Fact-checking has a 'who decides truth' problem—if our tool ran entirely on a private backend, we'd just be another centralized gatekeeper. Decentralized execution guarantees that neither we nor a single cloud vendor controls the analysis, and every check outputs a verifiable Request ID receipt."

#### Q3: Why does cold verification sometimes take 30–70 seconds?
> **Answer:** "Because each verification requires calling two independent AI models through a decentralized multi-node network. To ensure reliability, we run a hedged request pipeline across four network calls. For newly submitted text, this takes 30–70 seconds; however, repeated text is cached upstream and returns in ~1 second. We also provide a live elapsed timer so users see active progress."

#### Q4: What happens if one of the AI models goes offline during a request?
> **Answer:** "We built cross-model redundancy into our backend. If DeepSeek is down, the request automatically reruns on MiniMax (and vice versa). The user still receives dual analysis points, and the UI transparently marks the result as *'reduced confidence — backup model used'*. If both models fail, we show a clean retry prompt—never a crash or fake score."

#### Q5: How does your URL parser work, and how do you handle anti-scraping blocks?
> **Answer:** "Our API endpoint uses server-side Cheerio HTML parsing to strip scripts, ads, and navigation DOM elements, extracting pure article body text. If a target website blocks server scraping (e.g. strict Cloudflare anti-bot), our UI seamlessly alerts the user to paste the raw text directly into the text tab."

#### Q6: How do you prevent prompt injection or adversarial attacks in user-submitted text?
> **Answer:** "User text is strictly wrapped inside delimited variable blocks (`<user_content>`) within system instructions. Model 2 acts as a strict auditor isolated from user prompt directions, and all outputs pass through rigid TypeScript schema parsing and `<think>` tag stripping before rendering."

#### Q7: Why is there no database? Doesn't that limit history features?
> **Answer:** "Statelessness is a deliberate design feature for citizen privacy and security. Users reporting sensitive financial scams or personal messages don't want their data stored in a central database. Verification is instant and on-demand, with shareable PNG cards and cryptographic Gonka Request IDs for auditability."

---

### Category B: Product, UX & Accessibility

#### Q8: How is CivicPulse different from just pasting a claim into ChatGPT or Claude?
> **Answer:** "Three major differences:
> 1. **Consensus vs Single Model:** ChatGPT is one model with no cross-audit. CivicPulse uses dual independent models and flags divergence.
> 2. **Verifiable Receipts:** ChatGPT outputs cannot be independently verified. CivicPulse provides public Gonka Request IDs and node receipts.
> 3. **Purpose-Built Citizen UX:** ChatGPT gives generic conversational text. CivicPulse extracts specific red flags (phishing URLs, OTP requests), gives actionable safety advice, translates across 4 localized languages, and generates visual social share cards."

#### Q9: Is CivicPulse available in multiple languages? How accurate is Tamil?
> **Answer:** "Yes—English, Bahasa Melayu, Chinese (中文), and Tamil. Both the UI elements and the AI analysis dynamically render in the selected language. *Honest caveat:* English, Malay, and Chinese are fully verified; our Tamil interface strings were machine-translated and are pending final review by a native Tamil speaker, though the core meaning is accurate."

#### Q10: What is the `VIRAL_RUMOR` category, and how is it different from a scam?
> **Answer:** "A **scam** involves direct financial or identity theft (phishing links, fake jobs asking for deposits). A **viral rumor** is social misinformation (unverified policy announcements, miracle cures, chain messages). Rumors are scored on a Truth scale rather than Scam Risk; however, if a rumor contains dangerous red flags, the card automatically switches to red high-alarm styling."

#### Q11: How does the Visual Social Share Card work?
> **Answer:** "It renders a client-side `1200x630` HTML Canvas image containing the dual truth/risk score, key red flags, safety checklists, and a high-contrast 2D QR matrix pointing to the live verification page. Citizens can download and post this PNG directly to WhatsApp groups, Facebook, or X to warn family members."

#### Q12: Is CivicPulse mobile-friendly or installable as a mobile app?
> **Answer:** "Yes! CivicPulse is a fully installable Progressive Web App (PWA). Users on iOS or Android can tap 'Add to Home Screen' to launch CivicPulse in standalone full-screen mode with native app performance—no App Store download required."

---

### Category C: Trust, Ethics & Fact-Checking Philosophy

#### Q13: Who decides what is 'true'? Isn't AI itself biased?
> **Answer:** "No single authority or AI decides. We explicitly do not position CivicPulse as an infallible oracle. Instead, we use two separate AI model families to cross-check claims, surface disagreement when it occurs, and provide direct links to official government sources (such as `.gov.my` portals). It is designed as a media literacy and triage tool to assist human judgment."

#### Q14: What if both AI models are tricked by an extremely sophisticated scam?
> **Answer:** "While dual-model cross-auditing drastically reduces false positives, sophisticated social engineering can evolve. That is why every report includes standard safety advice (e.g. *'Never share OTPs', 'Verify via official 997 NSRC hotline'*). CivicPulse provides risk indicators, but emphasizes verification through official channels."

#### Q15: How does CivicPulse evaluate real-time breaking news not present in model training data? Is the model connected to real-time internet?
> **Answer:** "The AI models themselves are not browsing the web live. Instead, when a user submits a news URL, our **Next.js server-side web scraper (Cheerio)** fetches the live article text in real time, strips away ads/HTML clutter, and feeds that fresh article body directly to the dual AI models. The models then perform structural credibility and red-flag auditing on the newly extracted text."

---

### Category D: Business Model, Scalability & Future Roadmap

#### Q16: What is the business model / sustainability strategy for CivicPulse?
> **Answer:** 
> 1. **Public Good Tier:** Free web app for citizens funded via community node infrastructure.
> 2. **B2B / B2G API Licensing:** Telcos (real-time SMS phishing filtering), Banks (fraud prevention integration), and Media Outlets (automated editorial fact-checking triage).
> 3. **API Middleware:** Offering our dual-model consensus & hedging engine as a developer SDK on Gonka Network."

#### Q17: How would CivicPulse scale to handle millions of daily checks on WhatsApp or Telegram?
> **Answer:** "Because our core API is stateless and hosted on Vercel Fluid Compute with Gonka Router's distributed node network, backend scaling is handled horizontally. For messaging platforms, we plan to release WhatsApp/Telegram bot integrations where users forward messages to receive instant verdict cards."

#### Q18: What is on your post-hackathon roadmap?
> **Answer:** 
> - **Phase 1 (Q3 2026):** WhatsApp & Telegram fact-checking bot integration.
> - **Phase 2 (Q4 2026):** Browser extension for automatic phishing link detection on social media feeds.
> - **Phase 3 (Q1 2027):** Multi-modal analysis (analyzing deepfake audio and scam screenshot images via Gonka vision models)."

---

### Category E: Team & Development Protocol

#### Q19: How was CivicPulse built during the hackathon, and what AI tools were used?
> **Answer:** "CivicPulse was built using Next.js 16, TypeScript, Tailwind CSS, and the Gonka Router SDK. In accordance with hackathon rules, we used **Claude Code (Anthropic)** as an AI pair-programmer for rapid prototyping, UI component styling, and API integration. All architecture decisions, prompt engineering, and code reviews were led by our team. Detailed notes are recorded in `ProjectSessionLog.md`."

#### Q20: What if a judge asks a technical question that isn't answered in this cheat sheet?
> **Answer:** Don't guess! Use this exact response:  
> *"That's an excellent technical question. I want to ensure I give you an exact answer rather than speculating. Let me note that down and follow up with you right after this session with full technical details from our dev log!"*

---

## 6. Quick Reference Fact Sheet (Fast Mental Recall)

| Parameter | Exact Detail |
|---|---|
| **AI Models** | Model 1: `deepseek-ai/DeepSeek-V4-Flash-0731` · Model 2: `MiniMaxAI/MiniMax-M2.7` |
| **Inference Gateway** | **Gonka Router** (`https://api.gonkarouter.io/v1`) — Decentralized AI Network |
| **Scoring Formula** | `Truth Score = Avg(Model 1, Model 2)` · `Scam Risk = 100 - Truth Score` |
| **Divergence Threshold** | Score gap > 25 points triggers explicit human verification warning badge |
| **Hedging Strategy** | 3-second delayed duplicate request to prevent Cloudflare 429 rate limits |
| **Failover Rule** | Automatic fallback to surviving model; tagged as "reduced confidence" |
| **Supported Categories** | `SCAM_PHISHING`, `JOB_INVESTMENT`, `NEWS_POLICY`, `VIRAL_RUMOR` |
| **Languages** | English, Bahasa Melayu, Chinese (中文), Tamil (Tamil polish in progress) |
| **Performance** | Cold execution: 30–70s · Upstream cached execution: ~1s |
| **URL Parsing** | Server-side Cheerio HTML article extraction engine |
| **Proof of Execution** | Public Gonka Request IDs & Devshard Node IDs per check |
| **Tech Stack** | Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript, Vercel |
| **Installability** | PWA compliant (iOS / Android / Desktop standalone support) |
| **Live URL** | https://civicpulse-hackathon.vercel.app |
