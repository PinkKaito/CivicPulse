# CivicPulse — 5-Day Build Plan (3-Person Team)
## Gonka Track — MUBA Blockchain Hackathon 2026

**Scope for MVP:** `SCAM_PHISHING` category only, raw text input only (no URL/Cheerio parsing yet), 2-model consensus + divergence engine + audit drawer. Everything else is stretch.

**Deadline:** Submit on Devfolio by **5 Sep, 11:59 PM MYT**. Pitch day: **6 Sep at APU**.

---

## Team Roles

| Role | Owns |
|---|---|
| **A (Ivan) — Backend / Gonka Integration Lead** | Gonka Router API calls, both model prompts, consensus + divergence logic, Request ID capture, deployment, technical Q&A prep — **absent on pitch day, see contingency below** |
| **B — Frontend / UX Lead** | Next.js UI, input screen, results screen, audit drawer, high-contrast/sepia styling — **presents on pitch day** |
| **C — QA / Content / Pitch Lead** | Test case curation, red flag list, README, demo video, pitch script — **presents on pitch day** |

*(Adjust B/C names to your actual teammates.)*

### ⚠️ Pitch Day Contingency (Ivan absent)
Since Ivan can't attend 6 Sep, the plan below shifts more of the technical load onto him **during the build days**, so B and C aren't left debugging or explaining backend internals live without him. Specifically:
- All backend work (API integration, consensus logic, deployment) must be **fully done and stable by end of Day 4** — no backend changes on Day 5, since that's when B/C need to be confident operating it solo
- Ivan owns **deployment** (hosting the app somewhere B/C can just open a URL, not run locally) — this removes a major point of failure for pitch day
- Ivan writes a short **"How It Works" cheat sheet** by Day 4 — plain-language answers to likely technical Q&A questions (why two models, how the score is calculated, what a Request ID proves) so B/C can field questions confidently
- B and C do a **full solo run-through** on Day 5 — operating the deployed app end-to-end without Ivan's help, to catch anything only he currently knows

---

## Day 1 — Mon 31 Aug: Verify & Scaffold

**Goal by end of day:** confirmed the tech actually works, project scaffolded.

- **A:**
  - Confirm `deepseek-ai/DeepSeek-V4-Flash-0731` and `moonshotai/Kimi-K2.6` are actually live and responsive on Gonka Router **right now** — test with real API calls, don't assume from docs
  - Set up Gonka Router client (OpenAI SDK compatible) with API keys/env config
  - Get one raw model call working end-to-end (input → output), no scoring logic yet
- **B:**
  - Scaffold Next.js 16 (App Router) + TypeScript + Tailwind 4 project
  - Set up GitHub repo (commit history must start no earlier than 26 Aug — you're fine)
  - Rough wireframe: input box → results screen → audit drawer (sketch only, no styling polish yet)
- **C:**
  - Collect 15–20 real/realistic SCAM_PHISHING examples (actual phishing SMS patterns, fake bank alerts, Macau-scam-style messages) and 10–15 legitimate messages for contrast
  - Draft the initial "red flag" list to inform Model 2's prompt (urgency language, fake links, impersonation, OTP/money requests, etc.)

**End-of-day sync:** confirm both models respond reliably before committing further — if either model is flaky, decide on a fallback model today, not later.

---

## Day 2 — Tue 1 Sep: Core Consensus Logic

**Goal by end of day:** the actual scoring pipeline works end-to-end via API/CLI (UI comes later).

- **A:**
  - Build Model 1 (Extractor & Context Analyst) prompt: classification, 3 key takeaways, impact/advice, preliminary score (0–100)
  - Build Model 2 (Independent Fact & Credibility Auditor) prompt: red flag detection, independent score (0–100)
  - Run both in parallel via `Promise.all`
- **A + B (pair if needed):**
  - Implement Final Truth Score (average), Scam Risk Score (100 − Truth Score), and the divergence check (>25 point gap → warning note)
  - Extract and store `response.id` from both model calls
- **C:**
  - Run the test messages from Day 1 through the pipeline as they come online; flag anything scoring obviously wrong
  - Start README draft: problem statement, architecture overview, setup instructions

**End-of-day sync:** does the consensus logic produce sensible scores on your test set? If scores are erratic, this is the day to fix prompts — not Day 4.

---

## Day 3 — Wed 2 Sep: UI Integration

**Goal by end of day:** a working app a stranger could use without explanation.

- **B:**
  - Build the input screen (text paste box) and results screen (Truth Score, Risk Score, key takeaways, advice)
  - Build the collapsible "Gonka Proof of Execution" audit drawer showing both Request IDs
  - Apply the sepia/high-contrast styling pass
- **A:**
  - Wire backend logic to the frontend (API routes in Next.js)
  - Handle error states: model timeout, malformed input, empty input
- **C:**
  - Continue testing against the full example set as the UI comes online; log any mismatches between expected and actual verdicts
  - Refine the red flag list based on real test results

**End-of-day sync:** full click-through test — paste a message, see a result, see the audit drawer. This is your first real "does the demo work" checkpoint.

---

## Day 4 — Thu 3 Sep: Harden, Test, Record

**Goal by end of day:** the demo-critical path is bulletproof, video is done.

- **A (Ivan):**
  - Bug fixes on backend logic from Day 3 testing
  - Add basic loading states for the 2 parallel model calls
  - Stress-test edge cases: very short/long input, non-scam text, gibberish, model timeouts
  - **Deploy the app** to a stable, public URL (Vercel or similar) so B/C don't need to run anything locally on pitch day
  - Write the **"How It Works" cheat sheet** for B/C (see contingency note above)
- **B:**
  - Polish UI based on Day 3 testing feedback
  - Verify the deployed version (once Ivan ships it) looks and behaves the same as local
- **C:**
  - Finalize README (architecture, tech stack, setup instructions, team members)
  - **Record the demo video today, not tomorrow** — script: problem → live paste of a real scam example → walk through Truth/Risk Score → open the audit drawer → close
  - Draft the pitch script (what problem, why Gonka/decentralized matters, live demo moment, what's next)

**End-of-day sync:** video recorded, app deployed, cheat sheet written. This is the last day Ivan can safely touch backend code — Day 5 belongs to B and C building confidence with the finished product.

---

## Day 5 — Fri 4 Sep: Buffer, Polish, Rehearse

**Goal by end of day:** ready to submit, ready to pitch.

- **B + C:**
  - **Solo run-through**: operate the deployed app end-to-end without Ivan's help — the real test of whether the handoff worked
  - Full pitch rehearsal, timed to 5 minutes, using Ivan's cheat sheet to prep for likely technical questions
  - Only if everything above is solid: consider one stretch feature — but the SCAM_PHISHING path must not be touched/destabilized this late
- **A (Ivan):**
  - On standby for any last-minute bugs B/C hit during their solo run-through — last chance to fix anything before you're unavailable on pitch day
  - Final AI tool declaration list for submission
  - Double-check all Devfolio submission requirements are met
  - Brief B/C on how to handle a technical question that goes beyond the cheat sheet ("happy to follow up after" is a fine answer)

---

## Sat 5 Sep, 11:59 PM MYT — SUBMIT

- [/] Public GitHub repo, clean commit history (from 26 Aug onward)
- [/] README complete
- [ ] Demo video uploaded (YouTube/Loom, unlisted OK)
- [/] AI tool declarations included
- [ ] Submitted on Devfolio before deadline

## Sun 6 Sep — Pitch Day at APU

- Live 5-minute presentation + 5-minute Q&A
- Live working demo required — rehearsed path from Day 5 should be your safety net if live input surprises you

**Contingency — one teammate may not be available on pitch day:**
- The two attending must each be able to speak to *all* parts of the build (backend/consensus logic, frontend/audit drawer, and the "why Gonka/why this matters" narrative), not just their own role
- Split the 5-minute pitch into two clear halves in advance — e.g. one person covers problem + architecture, the other runs the live demo + Q&A — so there's no fumbling over who says what
- Rules only require that whoever *is* presenting attends the full session — a missing teammate isn't a disqualifying issue, but an unprepared one is
- Build this cross-coverage into the Day 5 rehearsal explicitly: have all three run through the *other* two roles' talking points at least once, so the two who show up aren't seeing the material fresh

---

## Guardrails to Keep in Mind

- **Don't expand scope after Day 2.** If SCAM_PHISHING + consensus + audit drawer works, that alone is a complete, demo-able product. Everything else is optional upside.
- **Raw text input is your guaranteed-working demo path.** If URL parsing gets added later, always have the text-paste fallback ready in case scraping fails live.
- **Don't call it "cryptographic proof" in the pitch** unless you've confirmed Gonka actually publishes verifiable on-chain computation proofs. "Transparent, auditable request trail via Gonka Request IDs" is accurate and still strong — say that instead.
