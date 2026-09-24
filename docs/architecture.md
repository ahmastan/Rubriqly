# How Rubriqly works

A tour for contributors. For conventions and commands, see `CLAUDE.md` and `CONTRIBUTING.md`.

```
 Browser                                   API (FastAPI)                      Vercel AI Gateway
 ───────                                   ─────────────                      ─────────────────
 drafts, results, rubrics saved
 per account in localStorage
 .docx/.pdf/.txt read in the browser

 POST /api/checks {rubric (no tips),  ──▶  signed in? under the limits?
                   prompt, text}           rubric → Jev questions
                                           1 request for the rubric    ──▶   typesafe-ai/jev
                                           + 1 per paragraph (parallel) ◀──   scores + probabilities
                                    ◀──    levels, confidence, tags
 tips + overall estimate added,
 result saved locally
```

The site and the API share one address: the static host forwards `/api/*` to the API. So the sign-in cookie is an ordinary first-party cookie. In development, Vite does the same forwarding to `localhost:8000`.

## Data

What the server stores (`rubriqly-backend/src/rubriqly/models.py`):

| Table | Holds | Never holds |
|---|---|---|
| `users` | email (lowercase, unique), display name, Argon2 password hash, `is_active`, `email_verified` (unused for now), a keyed hash of the sign-up network address | the password itself, the raw IP address |
| `sessions` | SHA-256 of the session token, created / last seen / expires | the token itself |
| `check_usage` | one row per check: time, status (`ok`, `failed`, `rate_limited`), input tokens, list-price cost | draft text, prompts, results |

Deleting a user deletes their sessions and usage rows (`ON DELETE CASCADE`). Drafts, results and rubrics live only in the browser (`rubriqly-frontend/src/lib/localStore.ts`, one key per account).

## Accounts

- Email and password sign-up (`/api/auth/signup`). The user must confirm they're 13 or older and accept the Terms. There's no email confirmation yet.
- Passwords must have at least 12 characters, can't be common or easy to guess, and can't contain the email's name.
- Sessions use an HttpOnly, SameSite=Lax cookie on path `/api` (Secure in production). They last 30 days and are extended while in use.
- Wrong email and wrong password get the same answer. After 5 wrong passwords, that email is locked for 15 minutes.
- Admin command: `uv run rubriqly create-user | reset-password | deactivate-user | activate-user | list-users | usage`.

## Limits

These protect the scoring budget. They're all settings (`rubriqly-backend/src/rubriqly/config.py`), and days are UTC days.

| Setting | Default |
|---|---|
| `SIGNUPS_PER_NETWORK_PER_DAY` | 5 |
| `SIGNUPS_PER_DAY` (whole site) | 100 |
| `CHECKS_PER_USER_PER_DAY` (successful checks only) | 30 |
| `CHECKS_PER_DAY` (whole site; successful and failed) | 500 |
| `MAX_WORDS` / `MAX_PARAGRAPHS` | 10,000 / 60 |

## Scoring

- The rubric arrives with each check. Only the questions and level descriptions are used; **tips are dropped** (`scoring/compile.py`).
- **One request covers the whole draft:** each criterion becomes a `score` question, and each checklist item becomes a `boolean` question.
- **One request per paragraph** checks its tags:
  - the introduction: Claim and Context
  - body paragraphs: Claim, Evidence and Analysis
  - the conclusion (the last paragraph, when there are 3 or more): Claim and Significance

  Only body paragraphs can be marked weak (missing evidence or analysis).
- **Paragraph splitting** (`scoring/text.py`) mirrors the browser's `lib/text.ts`, so paragraph numbers match. Keep the two in sync.
- **The API returns scores only:** each criterion's level (1-based, unrounded, e.g. 3.65), confidence and per-level probabilities. The browser (`lib/scoring.ts`) rounds levels, adds tips (shown for levels below the second-highest), flags confidence below 0.6, and computes the weighted overall estimate.
- **If any request fails,** the check fails with a clear error, never a partial result.

## Jev

`POST https://ai-gateway.vercel.sh/v1/evaluate` with `model: typesafe-ai/jev`, the `state` (the text) and typed `questions`. Every request sends `providerOptions.gateway.disallowPromptTraining: true`.

Checked against a real response (23 September 2026):
- `score` is 0-based, so the API adds 1.
- Score answers include `confidence` (also in `providerMetadata.typesafe.confidence`).
- Boolean answers have only `probability`.
- The cost is in `providerMetadata.gateway` (`cost` is what was charged; `marketCost` is the list price, which is what gets recorded).

The client (`rubriqly-backend/src/rubriqly/jev/`) retries 429, 5xx and timeouts, and validates every answer. `JEV_MODE=mock` swaps in a free, repeatable fake for development and tests.
