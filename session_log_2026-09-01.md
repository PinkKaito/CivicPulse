# CivicPulse — Session Log, 2026-09-01

A start-to-finish record of one working session: recovering the project after a
re-clone, wiring up Gonka, building an analysis endpoint, and then consolidating
it into the pipeline that already existed. Written for reflection, revision, and
as a learning reference (the developer is coming from Python/ML with no prior
JS/TS/Next.js).

---

## 0. Starting point

- Project re-cloned into `c:\PROJECTS\CivicPulse` because the old copy lived
  inside OneDrive and was causing sync errors.
- **CivicPulse** = AI-powered scam / misinformation checker, built for the
  **Gonka** track of a hackathon.
- `.env.local` was gone (gitignored, never in the clone).
- Goal for the session: get back to a working state, then keep building.

---

## 1. Repo recovery

### 1.1 What the clone actually contained

Inspected `package.json` and the tree **before assuming anything needed
creating**. Findings:

- A fully scaffolded **Next.js 16.3.3** app using the **App Router**.
- `package-lock.json` present (exact dependency versions locked).
- Existing API routes under `src/app/api/`:
  | Route | Purpose |
  |---|---|
  | `verify-gonka/` | Gonka connection smoke-test (raw `fetch`) |
  | `process-news/` | Main 2-model consensus pipeline (`openai` SDK + hedging) |
  | `parse-news/` | Scrape a URL or accept pasted text |
  | `receipt/[id]/` | Verification-receipt lookup |
- Frontend: `src/app/page.tsx`, `layout.tsx`, `globals.css`.

**Conclusion:** nothing to scaffold. The clone was intact.

### 1.2 `npm install`

```
added 389 packages, and audited 390 packages in 29s
found 0 vulnerabilities
```

One harmless warning: `eslint-visitor-keys` wants Node `>=22.13`; installed Node
is `22.4.0`. Affects `npm run lint` only, not dev or runtime.

### 1.3 `.env.local`

Created with a placeholder:

```
GONKA_API_KEY=your_gonka_api_key_here
```

The developer pasted the real key into the file directly (not into chat). The
existing routes already treat the literal string `your_gonka_api_key_here` as
"not configured", so the placeholder fails safe.

### 1.4 Test command

```bash
npm run dev
curl http://localhost:3000/api/verify-gonka
```

Success = HTTP 200 `{ "text": "...", "requestId": "..." }`.

---

## 2. Second test route: `verify-gonka-kimi` (later deleted)

The developer wanted to confirm a *second* model — `moonshotai/Kimi-K2.6` —
worked, without touching the existing `verify-gonka` file.

Created `src/app/api/verify-gonka-kimi/route.ts` as a line-for-line copy of
`verify-gonka`, changing only the `model` field and the prompt wording. In the
App Router, **the folder name is the URL path**, so the new folder served
`/api/verify-gonka-kimi` automatically.

This route was deleted in step 7 once Kimi was abandoned.

---

## 3. New feature: `analyze-message` route (later deleted)

Built `src/app/api/analyze-message/route.ts` from a detailed spec: accept
`{ message }`, call two models **in parallel**, parse each model's JSON
defensively, compute a consensus score, and degrade gracefully on partial
failure.

### 3.1 Key design decisions

- **`Promise.all` over non-throwing calls.** The spec said "use `Promise.all`",
  but plain `Promise.all` rejects the moment *one* promise rejects and you lose
  the other result. Fix: write `callModel()` so it **never throws** — success and
  failure both resolve as `{ ok, raw, requestId, error }`. `Promise.all` then
  always returns both outcomes and the handler decides what to do. (This is what
  `Promise.allSettled` does; the wrapper keeps the spec's wording.)

- **Defensive JSON extraction** (`extractJson`), because LLMs ignore
  "respond with only JSON":
  1. strip ```` ```json ```` / ```` ``` ```` fences
  2. slice from the first `{` to the last `}` (drops prose on either side)
  3. `JSON.parse`
  4. on failure: delete trailing commas (`/,\s*([}\]])/g`) and retry once
  5. still failing → return `null`, let the caller degrade (never throw)

- **Error-handling matrix:**
  | Situation | Response |
  |---|---|
  | one model fails, other succeeds | 200 with the good model's data + a `notes[]` entry; score is single-model, not consensus |
  | both fail / unparseable | 502 with `details` |
  | body not JSON / no `message` | 400 |
  | key missing | 500 |
  | score gap > 25 | adds `divergenceWarning` |

### 3.2 First test — and the Windows shell fight

Inline JSON in `curl` / PowerShell got mangled by shell quoting (`curl: (6)
Could not resolve host: Your` etc.). **Fix: put the body in a file** and use
`curl.exe -d "@file.json"`, or build it in PowerShell with
`@{ message = "..." } | ConvertTo-Json`.

First real result: route worked. DeepSeek returned a correct `SCAM_PHISHING`
analysis; **Kimi hit a Cloudflare `524` timeout**. The route degraded exactly as
designed — 200 with DeepSeek's result, `model2Score: null`,
`model2RequestId: "unavailable"`, explanatory `notes`.

---

## 4. Performance fix — client-side timeout

**Problem:** `callModel` had no timeout on its `fetch`, so when Kimi hung the
whole request waited ~126s for Cloudflare to give up.

Router health check (three routes back to back):

| Route | Model | Result | Time |
|---|---|---|---|
| `/api/verify-gonka` | DeepSeek-V4-Flash | 200 | **0.4s** |
| `/api/verify-gonka-kimi` | Kimi-K2.6 | 200 | **85s** (for a 30-token reply!) |
| `/api/analyze-message` | both | 200 (DeepSeek only) | **126s** — Kimi 524 |

**Fix:** `AbortController` + `setTimeout(() => controller.abort(), 45_000)`,
`signal` passed to `fetch`, timer cleared in `finally`. Added `condenseError()`
to reduce HTML error pages (like the 524 blob) to their `<title>`.

Retest: **0.2s** when Kimi was healthy, **45s** hard cap when it stalled.

---

## 5. Swapping Model 2 → `MiniMaxAI/MiniMax-M2.7`

Ran repeated testing (16+ calls, several fresh inputs) before committing:

| | Kimi-K2.6 | MiniMax-M2.7 |
|---|---|---|
| Valid JSON returned | ~0 / 5 | **19 / 19** |
| Returned a usable score | rarely | every call |
| Cloudflare 524s | yes | none |
| Cold-prompt latency | 85s / timeout | 30–45s |

**Two things the testing surfaced:**

1. **Prompt-level caching in the Gonka stack.** First call for a unique message:
   30–45s. Every *identical* repeat: ~0.4s (fresh `requestId` each time, so it's
   an upstream cache, not our code). Real users pasting unique text will mostly
   hit the ~35s cold path.
2. One cold run measured **44.7s** — almost cut off by the 45s abort. So the
   timeout was bumped **45s → 60s**.

Verification of the 60s change: on one fresh input **DeepSeek** (normally
sub-second) stalled past 60s and was aborted cleanly; MiniMax carried the
result. **Takeaway: slow cold prompts are a router-wide condition, not specific
to any one model.** A model swap can't fix latency — only graceful degradation
and hedging help.

---

## 6. "Is `analyze-message` the same as `process-news`?"

Yes in concept, no in implementation — and only `process-news` was wired to
anything.

- `src/app/page.tsx` calls `/api/parse-news` then **`/api/process-news`**
  (line ~363). `analyze-message` was called by **nothing**.
- Both do the same shape of work: Model 1 "Extractor / Context Analyst" +
  Model 2 "Fact / Credibility Auditor", average the two scores, flag divergence
  > 25.

| | `process-news` (in repo) | `analyze-message` (this session) |
|---|---|---|
| Input | `{ articleText, language }` | `{ message }` |
| Languages | EN, ZH, MS, TA | EN only |
| Client | `openai` SDK | raw `fetch` |
| Reliability | **hedging** (2 duplicate requests/model, take fastest) + fallback models + timeout | one call/model + timeout |
| Categories | 5 | 4 (incl. `VIRAL_RUMOR`) |
| Output | nested `summary{}` / `verification{}` + node metadata | flat |

**`process-news` bug found:** both models fell back to `Kimi-K2.6` (broken), and
its hedge timeout was **20s** — shorter than the 20–85s cold-prompt reality, so
it was failing over to broken Kimi on nearly every fresh request.

**Decision:** keep `process-news`, fold in the good parts of `analyze-message`,
delete the duplicates.

---

## 7. Consolidation — changes to `process-news/route.ts`

| # | Change | Why |
|---|---|---|
| 1 | `HEDGE_TIMEOUT_MS` **20s → 60s** | 20s fired on almost every cold request |
| 2 | Model 1 fallback `Kimi` → `MiniMax` | Kimi unusable via router |
| 3 | Model 2 fallback `Kimi` → `DeepSeek` (cross-fallback) | each model backs up the other; both proven good |
| 4 | Added category **`VIRAL_RUMOR`** | the one better idea from `analyze-message`; matters for a misinformation checker; UI renders it unchanged |

Output shape untouched → frontend keeps working.

### Deleted

- `src/app/api/analyze-message/` — superseded, wired to nothing (was never
  committed, so it simply vanished from the tree)
- `src/app/api/verify-gonka-kimi/` — test for an abandoned model (was committed;
  shows as `D` in `git status`)

### Kept

`verify-gonka` (UI health check), `parse-news`, `receipt/[id]` — all UI-wired.

### Post-change test (8 calls)

| Input | HTTP | Cold time | truth / indep | Category | Fallback |
|---|---|---|---|---|---|
| phishing | 200 | 23s | 13 / 15 · HIGH RISK | SCAM_PHISHING | none |
| central-bank news | 200 | 20s | 89 / 88 · VERIFIED | NEWS_POLICY | none |
| e-wallet rumor | 200 | 28s | 8 / 5 · HIGH RISK | SCAM_PHISHING | none |
| health hoax | 200 | 85s | 8 / 5 · HIGH RISK | **VIRAL_RUMOR** | M2 → DeepSeek ✓ |

Happy path **20–28s** (hedging beats the router's tail latency). Worst case
**~85s** when a model's hedge fully times out and the cross-fallback runs — and
it now yields a real score instead of Kimi garbage, with
`model2UsedFallback: true` shown in the UI as a reduced-confidence note.

`tsc --noEmit` clean throughout.

---

## 8. Final state

### Routes

```
src/app/api/
  process-news/route.ts   ← canonical analysis pipeline (optimized)
  parse-news/route.ts     ← URL scrape / text intake
  verify-gonka/route.ts   ← connection health check
  receipt/[id]/route.ts   ← verification receipt lookup
```

### Models (both verified working via the router today)

- **Model 1 (Extractor):** `deepseek-ai/DeepSeek-V4-Flash-0731`,
  fallback `MiniMaxAI/MiniMax-M2.7`
- **Model 2 (Auditor):** `MiniMaxAI/MiniMax-M2.7`,
  fallback `deepseek-ai/DeepSeek-V4-Flash-0731`
- **`moonshotai/Kimi-K2.6`:** rejected — non-JSON output, timeouts, 524s.

### Git

```
 M src/app/api/process-news/route.ts
 D src/app/api/verify-gonka-kimi/route.ts
```

**Not committed** — review `git diff` and commit when satisfied.

---

## 9. Concepts encountered (Python → JS/TS map)

| JS/TS thing | Closest Python analogy | Note |
|---|---|---|
| `package.json` / `package-lock.json` / `node_modules/` | `pyproject.toml` / `poetry.lock` / venv `site-packages` | lock file = exact versions; `node_modules` is per-project, not global |
| `npm install` | `pip install -r requirements.txt` | populates `node_modules/` |
| `process.env.GONKA_API_KEY` + `.env.local` | `os.environ[...]` + `python-dotenv` | Next.js auto-loads `.env.local`; **only on server start** |
| App Router: `src/app/api/x/route.ts` | a Flask/FastAPI view for `/api/x` | folder path = URL; export `GET` / `POST` functions |
| `NextResponse.json({...})` | `return jsonify({...})` | |
| `async` / `await` | `async` / `await` (asyncio) | JS is single-threaded + event loop |
| `Promise.all([a, b])` | `asyncio.gather(a, b)` | rejects fast on first failure |
| `Promise.allSettled` | `asyncio.gather(..., return_exceptions=True)` | never rejects; returns per-item status |
| `AbortController` + `signal` | `requests(..., timeout=)` but as a cancellation token | one controller can cancel many fetches |
| `try / catch / finally` | `try / except / finally` | `catch (err: any)` — no typed exceptions by default |
| `x?.y?.z` | `x.get('y', {}).get('z')`-ish | optional chaining: short-circuits to `undefined` |
| `a ?? b` | `a if a is not None else b` | nullish coalescing (only `null`/`undefined`, not falsy) |
| TypeScript `type X = {...}` | a dataclass / `TypedDict` for shape-checking | erased at runtime; `tsc --noEmit` = type check only |

### Patterns worth remembering

- **Non-throwing task wrapper** so `Promise.all` can't be short-circuited by one
  failure.
- **Defensive JSON parsing** of LLM output: strip fences → slice braces → parse →
  fix trailing commas → give up gracefully.
- **Hedged requests**: fire two identical calls, take whichever returns first, to
  cut tail latency on a flaky upstream.
- **Cross-fallback**: model A's backup is model B and vice-versa, so a single
  model outage still yields two opinions.
- **Graceful degradation**: a partial result + an honest `notes[]` beats a 500.

---

## 10. Reflection

- **Check what already exists before building from a spec.** `analyze-message`
  was a clean, well-tested reimplementation of a route the frontend was already
  calling. Ten minutes reading `page.tsx` up front would have reframed the whole
  task as "optimize `process-news`".
- **Test reliability with repeated calls, not one.** A single green call hid that
  Kimi fails ~80% of the time and that the router caches identical prompts.
- **Separate infra problems from code bugs.** The Cloudflare 524s and 85s
  latencies were never fixable in our code — the right responses were a timeout,
  a model swap, and hedging, not more parsing logic.
- **Keep the output contract stable.** `process-news` could be re-tuned freely
  because its response shape (which `page.tsx` renders) never changed.

---

## 11. Open items / next steps

- [ ] Review `git diff` and commit the `process-news` changes + deletions.
- [ ] Frontend **loading state** for the 20–85s wait (a progress line like the
      existing `setLoadingStep(...)` calls, ideally with an approximate ETA).
- [ ] Decide `VIRAL_RUMOR` styling in `page.tsx` — currently a neutral badge and
      the truth score is shown (not the scam-risk inversion). Probably correct,
      but confirm.
- [ ] Consider a shorter *fallback* timeout so worst case is bounded below ~85s.
- [ ] Re-check Kimi on the router periodically; if it stabilizes it could return
      as a third opinion or a fallback.
- [ ] Reusable test fixtures live in the session scratchpad
      (`scam-sample.json`, `legit-sample.json`, `pn-*.json`) — copy into a
      `test/fixtures/` folder if you want them version-controlled.
- [ ] The `AGENTS.md` note about reading `node_modules/next/dist/docs/` before
      writing Next.js code still applies to any new route work.
```
