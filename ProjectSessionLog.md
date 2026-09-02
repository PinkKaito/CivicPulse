# CivicPulse — Project Session Log

**What this is:** a running, plain-English record of the working sessions on
CivicPulse — what changed, why, what broke, and what we learned. Read it
top-to-bottom to catch up, or jump to a date. It doubles as a learning doc: the
original author is coming from Python/ML with no prior JavaScript / TypeScript /
Next.js, so the "what we learned" sections explain the new concepts as we hit
them.

**Project in one line:** CivicPulse is a dual-AI public fact-checker and
phishing guard for the **Gonka** hackathon track. A user pastes a claim, an SMS,
a job pitch, or a news link; two AI models on the Gonka network independently
analyse it; the app shows a combined credibility score, red flags, plain-language
advice, and a cryptographic "proof of execution" (Gonka request receipts).

---

## Where the project stands right now

| Area | State |
|---|---|
| **Backend pipeline** (`src/app/api/process-news/route.ts`) | Working. Two models, hedged requests, cross-fallback. ~20–28s typical, up to ~85s on a cold cache. Committed + pushed. |
| **Other API routes** | `parse-news` (URL scrape / text intake), `verify-gonka` (connection health check), `receipt/[id]` (Gonka receipt lookup) — all working and wired to the UI. |
| **Frontend** (`src/app/page.tsx`) | Working. All backend output is now visible: credibility score, red flags, advice, divergence warning, and an auto-expanded "Proof of Execution" panel with both Gonka request IDs. Loading state has an elapsed-time counter. Errors show plain-language messages. Committed + pushed. |
| **Languages** | UI supports English / 中文 / Bahasa Melayu / Tamil. All user-facing strings are wired into the translation dictionary. **Tamil translations of the newest strings still need a native-speaker check** (see open items). |
| **Deployment** | Not deployed. Runs locally at `http://localhost:3000` via `npm run dev`. A shareable URL needs a Vercel deploy (not done). |
| **Models** | Model 1 (Extractor) = `deepseek-ai/DeepSeek-V4-Flash-0731`. Model 2 (Auditor) = `MiniMaxAI/MiniMax-M2.7`. Each falls back to the other. **`moonshotai/Kimi-K2.6` is broken on the router — do not use it.** |

To run it: `npm run dev`, then open `http://localhost:3000`. The Gonka API key
lives in `.env.local` (not in git); the app reads it as `process.env.GONKA_API_KEY`.

---

# 2026-09-01 — Backend recovery and reliability

### The situation

The project had to be re-cloned into a fresh folder because the old copy lived
inside OneDrive and OneDrive's sync kept corrupting it. A clean clone means:

- `node_modules/` is missing (it's never committed — think of it as the project's
  virtual-env `site-packages`; you rebuild it locally).
- `.env.local` is missing (it's git-ignored because it holds the API key).

Everything else — the whole Next.js app — was intact in the clone. Nothing needed
to be rebuilt from scratch.

### What we did

**1. Got the project running again.**

- `npm install` — downloaded 389 packages into a fresh `node_modules/`. (`npm
  install` ≈ `pip install -r requirements.txt`; `package.json` ≈ `requirements.txt`
  + `pyproject.toml`; `package-lock.json` pins exact versions like a `poetry.lock`.)
- Recreated `.env.local` with the `GONKA_API_KEY` line. Next.js loads this file
  automatically — but **only when the dev server starts**, so any key change needs
  a server restart.
- Confirmed the structure: **Next.js 16.3.3, App Router**. In the App Router, a
  folder under `src/app/` is a URL path, and a file called `route.ts` inside it is
  that path's request handler (like a Flask/FastAPI view). So
  `src/app/api/process-news/route.ts` answers `POST /api/process-news`.

**2. Built a new analysis route — then realised it was a duplicate.**

We built `src/app/api/analyze-message/route.ts` from a detailed spec: take a
message, call two models in parallel, parse each model's JSON defensively,
average the scores, degrade gracefully if one model fails.

Then, while checking how the frontend calls the backend, we found that
`src/app/api/process-news/route.ts` **already did the same job** — and it was the
one the UI actually calls. `analyze-message` was wired to nothing. It was a
clean, well-tested reimplementation of something that already existed.

**Decision:** keep `process-news`, fold the good ideas from `analyze-message`
into it, and delete the duplicates (`analyze-message` and a leftover
`verify-gonka-kimi` test route).

**3. Fixed the real reliability bugs in `process-news`.**

Two things were quietly breaking it:

- **The per-model timeout was 20 seconds.** The Gonka router takes 20–85 seconds
  to answer a "cold" prompt (one it hasn't seen before). So the 20s timeout was
  firing on almost every real request and forcing a fallback.
- **Both models fell back to `Kimi-K2.6`**, which is broken on the router — it
  returns non-JSON reasoning text, times out, or hits Cloudflare 524 errors. So
  the fallback was worthless; a slow primary meant a failed request.

Changes made:

| Before | After | Why |
|---|---|---|
| Hedge timeout 20s | **60s** | Matches real cold-prompt latency; stops the constant false-timeout |
| Model 1 fallback → Kimi | **→ MiniMax** | Kimi unusable; MiniMax verified working |
| Model 2 fallback → Kimi | **→ DeepSeek** | "Cross-fallback": each model backs up the other, so one model outage still yields two opinions |
| 5 content categories | **+ `VIRAL_RUMOR`** | Needed for the misinformation half of the product |

The response shape (what the frontend reads) was left **exactly** the same, so
none of this touched the UI.

### What we learned

- **Check what already exists before building from a spec.** Ten minutes reading
  `page.tsx` up front would have reframed the whole task from "build a new route"
  to "tune the existing one."
- **Test reliability with repeated calls, not one.** A single successful call hid
  that Kimi fails most of the time, and that the router caches identical prompts
  (a repeated prompt returns in ~0.4s, which can make a broken model look fast).
- **Separate infrastructure problems from code bugs.** The 524s and 85-second
  waits were never fixable in our code. The right responses were a longer
  timeout, a model swap, and *hedging* — not more parsing logic.
- **Hedging** = fire two identical requests at once, use whichever answers first,
  cancel the other. It cuts the "tail latency" of a flaky service. `process-news`
  does this, which is why its happy path is ~20–28s even though a single call can
  take 60s+.
- **Keep the output contract stable.** Because `process-news`'s JSON response
  shape never changed, we could re-tune its internals freely without breaking the
  frontend.

### Gonka router facts worth remembering (whole team)

- Cold prompts take **20–85 seconds** for *any* model we've tried.
- **Identical** prompts are cached upstream and return in ~0.4s.
- Cloudflare kills requests at **~100 seconds** with a 524 error.
- `deepseek-ai/DeepSeek-V4-Flash-0731` and `MiniMaxAI/MiniMax-M2.7` both work.
- `moonshotai/Kimi-K2.6` does **not** work reliably via the router — avoid it.
- If you ever add or swap a model, test it with several *fresh* prompts first and
  check both latency and whether it returns valid JSON.

---

# 2026-09-02 — Frontend experience pass

### The situation

The backend now computed good data, but a lot of it never reached the screen, and
some of what did reach the screen looked broken. Goal for the day: make every
useful thing the backend produces **visible, understandable, and calm-looking**
for a real user or a judge. No backend changes.

### Step 1 — Investigate before touching anything

Read the whole frontend (`src/app/page.tsx`, ~1560 lines) and compared it against
a live backend response. Findings:

| Area | Verdict |
|---|---|
| Gonka request IDs | Present, but hidden in a collapsed panel at the bottom of the results — and the only shortcut to it was hidden on mobile. |
| "Scores disagree" warning | **Works.** It's just stored under the field name `consensus_note`, not `divergenceWarning` as assumed. Fires when the two scores differ by >25, or when a fallback model was used. |
| `VIRAL_RUMOR` category | **Broken.** The code checked for a category string (`'VIRAL_CLAIM'`) that the backend never sends, so rumors were mislabelled "News & Public Policy", and their red-flags list was hidden. |
| Loading state | A spinner and skeleton exist (it doesn't look frozen), but there was no time indication for a 20–85s wait. |
| Error messages | Shown, not silent — but they were the **raw backend text**, including one that literally printed `GONKA_API_KEY is not configured…` on screen. |
| Other categories (news / scam / job) | Render correctly. No regression. |
| Mobile layout | No obvious breakage. |
| URL → parse → analyse flow | Confirmed working end-to-end (pasted text *and* a pasted news URL). |

This turned a vague "make it not look broken" into a ranked list of five specific,
independent fixes.

### Step 2 — The five fixes (commit `1ed138d`)

**Fix 1 — `VIRAL_RUMOR` rendering.**
Fixed the dead category-string check. Then added a "hybrid" behaviour: a rumor
still uses the normal *Truth Score* scale (not the inverted scam-risk scale), but
when the auditor rates it **HIGH RISK** or **SUSPICIOUS**, the card switches to
the same red "alarm" styling that scam cards use, and its red-flags list becomes
visible. A mild rumor stays calm and informational. Mechanically: a new
`alarmMode` value drives the *colours*, while the existing `isScam` still drives
the *score maths* and headings.

**Fix 2 — plain-language errors.**
New helper `friendlyPipelineError()` maps any raw error text or HTTP status to
one of a few short, non-technical messages. Anything mentioning the API key or
internal config now becomes a generic "the service isn't set up correctly right
now." Also made the JSON parsing of error responses crash-proof, and gave the
URL-scraping step its own friendly message ("We could not read that link — try
pasting the article text instead"). Note for the team: **the backend never
returns a 502**; a total model failure comes back as a 500 with a timeout
message, which now maps to "our verification models are taking longer than
expected — please try again."

**Fix 3 — make the Gonka receipts visible.**
The "Proof of Execution" panel now **auto-expands on the first result** instead of
staying collapsed, and the green "Gonka Network: Active" header button (the
shortcut to it) is now **visible on mobile** too.

**Fix 4 — loading timer.**
Added a 1-second elapsed-time counter to the loading card, plus the line "This can
take up to a minute for new content." A 60-second wait no longer reads as a
freeze.

**Fix 5 — show the score gap.**
When the two models disagree by more than 25 points, the amber warning banner now
also says exactly how far apart they were ("The two model scores differed by N
points.").

After the fixes, we re-ran one input per category through the whole pipeline:

| Input | Category | Verdict | Time |
|---|---|---|---|
| Central-bank rate announcement | `NEWS_POLICY` | VERIFIED (86/100) | 19s |
| CIMB phishing SMS | `SCAM_PHISHING` | HIGH RISK (5/100), 4 red flags | 19s |
| Fake work-from-home job | `SCAM_PHISHING` | HIGH RISK (8/100), 6 red flags | 34s |
| "EPF will be raided" hoax | `VIRAL_RUMOR` | HIGH RISK (8/100), 7 red flags | 16s |

All rendered correctly, including the new rumor alarm styling.

### Step 3 — Translate the new strings (commit `6875ea4`)

The five friendly error messages, the loading hint, and the "differed by N
points" line were English-only. The rest of the UI uses a translation dictionary
(`uiTranslations`) plus a lookup function `t('someKey')`. We wired the new
strings into that same system:

- `friendlyPipelineError()` now returns a **key** (like `errModelsSlow`) instead
  of an English sentence; the component turns the key into text with `t()`. (The
  helper lives outside the React component and can't see the current language, so
  returning a key and letting the component translate is the clean split.)
- Seven new keys were added to **all four** language blocks.

**Translation confidence — please review before the pitch:**
- English: authoritative.
- Chinese, Malay: machine-written, medium-high confidence — a quick native read is
  advised.
- **Tamil: needs a native-speaker check.** The meanings are faithful but the
  phrasing may be stiff. Most suspect: the "differed by N points" string and the
  "service not configured" string.

### Step 4 — Tab title (commit `4801ed7`)

`src/app/layout.tsx` still had the scaffold defaults, so the browser tab said
"Create Next App". Changed the `metadata` export's `title` to **"CivicPulse"** and
replaced the placeholder description. (In the App Router you set the tab title
through this `metadata` object — there's no `<title>` tag to edit by hand.)

**On renaming the URL:** `localhost:3000` can't be renamed — it's just your own
machine plus a port. A real shareable address (e.g. `civicpulse.vercel.app`) only
exists once the app is *deployed*, and the name is chosen in the host's
dashboard, not in the code. Deploying to Vercel (it connects straight to the
GitHub repo) is the way to get one; we haven't done it yet.

### What we learned

- **Investigate before editing.** Reading the frontend end-to-end first is what
  produced a clean five-item list — and it corrected a wrong assumption (the
  "missing" divergence warning was there all along under another name).
- **Keep translation (and other cross-cutting concerns) out of pure functions.**
  `friendlyPipelineError` stayed simple and testable by returning a key; the
  component owns the language lookup. Same principle as keeping the backend's
  response shape stable on Day 1.
- **Ship honestly.** The Tamil strings are in, but they're explicitly flagged for
  review rather than presented as finished. A multilingual claim is only as
  strong as its weakest language.
- **A background-task "failed (exit code 1)" notice is not always a failure.**
  The dev server showed clean compiles and 200 responses right up to the last log
  line; the non-zero exit was the process being *terminated* by tooling cleanup,
  not crashing.

---

## New-knowledge cheat-sheet (JavaScript / TypeScript / Next.js for a Python person)

### Language and runtime

| JS / TS | Closest Python idea | Notes |
|---|---|---|
| `async` / `await` | `async` / `await` (asyncio) | JS is single-threaded with an event loop. |
| `Promise.all([a, b])` | `asyncio.gather(a, b)` | **Rejects immediately if any one fails**, and you lose the other results. |
| `Promise.allSettled([a, b])` | `asyncio.gather(..., return_exceptions=True)` | Never rejects; you get a status object per item. |
| non-throwing wrapper trick | — | Wrap each task so it *always* resolves to `{ ok, value, error }`. Then `Promise.all` can't be short-circuited by one failure. Used on Day 1. |
| `x?.y?.z` | `x.get('y', {}).get('z')` | "Optional chaining" — stops at `undefined` instead of raising. |
| `a ?? b` | `a if a is not None else b` | "Nullish coalescing" — only `null`/`undefined` trigger the fallback, not `0` or `""`. |
| `str.replace('{n}', x)` | `"...".format()` / f-string | Plain-string `replace` swaps only the **first** match. Fine for one placeholder. |
| TypeScript `type X = { ... }` | a `dataclass` / `TypedDict` | Compile-time only; erased at runtime. `npx tsc --noEmit` = "type-check, don't build." |
| `AbortController` + `signal` | `requests(..., timeout=)` but as a cancel token | One controller can cancel one or many `fetch` calls. This is how you time out a `fetch`. |

### Project and framework

| Thing | Python analogy | Notes |
|---|---|---|
| `package.json` / `package-lock.json` / `node_modules/` | `requirements.txt` / `poetry.lock` / venv `site-packages` | `node_modules` is per-project, rebuilt locally with `npm install`, never committed. |
| `process.env.GONKA_API_KEY` + `.env.local` | `os.environ` + `python-dotenv` | Next.js auto-loads `.env.local` **at server start only** — restart after editing. Git-ignored. |
| `src/app/api/x/route.ts` | a Flask/FastAPI view for `/api/x` | Folder path = URL. Export `GET` / `POST` functions. |
| `metadata` export in `layout.tsx` | — | Sets the browser-tab `<title>` and `<meta>` tags. No raw HTML `<head>` editing. |
| `'use client'` at the top of `page.tsx` | — | Marks a component that runs in the browser (needs state, effects, event handlers). |
| `useState` | an instance attribute that triggers a re-render when set | `const [x, setX] = useState(0)`. |
| `useEffect(fn, [dep])` | a callback that re-runs when `dep` changes | `return () => {...}` inside is the cleanup, like a context manager's `__exit__`. We used it to run `clearInterval` when the loading state ends. |
| `setInterval` / `clearInterval` | a `threading.Timer` loop | Leaks if you don't clear it. |
| a value computed inside `return ( ... )` | a `@property` | e.g. `alarmMode` is **not** state — it's recomputed every render from other values. |
| `uiTranslations` + `t('key')` | `gettext`, or a `dict.get` chain | `t()` here resolves `currentLang[key]` → `English[key]` → the key itself. |

### Patterns we're now using on purpose

- **Hedged requests** — fire two identical calls, take the fastest, cancel the
  rest. Beats tail latency on a flaky upstream.
- **Cross-fallback** — model A's backup is model B and vice-versa, so one model
  being down still gives two independent opinions.
- **Graceful degradation** — a partial result plus an honest note beats a 500
  error page.
- **Defensive JSON parsing of LLM output** — models ignore "return only JSON."
  Strip code fences → take everything between the first `{` and last `}` → parse →
  on failure, remove trailing commas and retry → on failure, give up cleanly
  (don't throw).
- **Error mapping** — never show raw backend text to a user. Map it to a short,
  safe message. Never reveal config/secret names.

### Gotcha: Windows shell quoting

Pasting JSON straight into `curl` on Windows gets mangled by the shell (`curl: (6)
Could not resolve host: Your` and similar). Fixes:
- Put the JSON in a file and use `curl.exe -d "@body.json"`.
- Or in PowerShell build it with `@{ message = "..." } | ConvertTo-Json`.
- Use `curl.exe` explicitly — plain `curl` in PowerShell is an alias for a
  different command.

---

## Open items

**Needs a person, not code:**
- [ ] Native-speaker review of the **Tamil** UI strings added on 09-02 (and a
      lighter pass on Chinese / Malay).
- [ ] Decide whether to deploy to **Vercel** for a shareable pitch URL.

**Deferred on purpose (pre-existing, low priority with limited time):**
- [ ] `PUBLIC_HEALTH` and `COMMUNITY_DEVELOPMENT` categories fall through to the
      "News & Public Policy" badge label.
- [ ] A few client-side guard messages ("Please enter a valid News URL", "Content
      is too short to analyze", "We could not read that link") are still
      English-only — outside the 09-02 translation scope.

**Backend polish (from Day 1, still open):**
- [ ] Consider a shorter *fallback* timeout so the absolute worst case is under
      ~85s.
- [ ] Re-check `Kimi-K2.6` on the router periodically; if it stabilises it could
      come back as a third opinion.
- [ ] Move the throwaway test-input JSON files into a `test/fixtures/` folder if
      we want them in version control.

**Process reminder:**
- [ ] `AGENTS.md` says to read the bundled Next.js docs
      (`node_modules/next/dist/docs/`) before writing new route code — this
      version of Next.js has non-standard behaviour.
