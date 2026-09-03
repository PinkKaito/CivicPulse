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
