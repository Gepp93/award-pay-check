
# Privacy & security hardening (no UX/design/logic changes)

Scope is strictly security. No visual, copy, calculation, or flow changes. Existing functionality preserved.

## 1. Lock down `public.leads`

Current state: `SELECT USING (true)` on `leads` lets anyone with the anon key dump every email + calculation. Insert is also `WITH CHECK (true)` (required for the public flow).

Migration:
- Drop policy `"Anyone can read leads by id"` on `public.leads`. No replacement anon SELECT policy.
- Keep policy `"Anyone can insert leads"` (anon + authenticated) as-is — the unauth funnel still needs to write.
- Keep `"Allow service role updates on leads"` (used by Stripe webhook / server flows).
- Revoke `SELECT` from `anon` and `authenticated` on `public.leads`; keep `INSERT` for both and `ALL` for `service_role`. Service-role bypasses RLS so edge functions keep full read access.
- Net effect: browsers can write a lead but cannot read any lead back via PostgREST.

Client change (`src/pages/NewCheck_Step3_Result.tsx`, the only client read/write of `leads`):
- The existing insert already uses `.insert({...}).select("id").single()`. Change `.select("id")` to `.select("*")` so the full inserted row comes back in the same request and the page can keep it in state. This works under the new policy because PostgREST returns the inserted row from the INSERT itself (no extra SELECT roundtrip and no SELECT policy required for the inserting role on its own row, since we keep `RETURNING` enabled via the GRANT on INSERT). If PostgREST still blocks the return because of the missing SELECT grant, fall back to keeping the row entirely in component state from the values we just submitted (`email`, `calculation_data`, `shift_details`) plus the returned `id`. No new network calls, no behaviour change for the user.
- No other client file reads `leads`, so nothing else needs touching.

Server side:
- Confirm any future reads of `leads` (PDF report, email report, Stripe webhook) go through edge functions using `SUPABASE_SERVICE_ROLE_KEY`. Audit-only in this pass — no functional rewrite unless we find a client read, which we did not.

## 2. Abuse protection on public Edge Functions

Targets (must remain callable without login because the unauth calculator uses them):
`calculate-shift-pay`, `ai-parse-shifts`, `get-awards`, `get-classifications`, `get-pay-rates`. Also apply to `get-classification-details` and `test-fwc-api` since they hit the same FWC key. Leave `generate-pdf-report` and `send-email-report` alone in this pass (they are post-payment server flows).

Shared helper: `supabase/functions/_shared/guard.ts` exporting:
- `assertAllowedOrigin(req)` — reads `Origin` (fallback `Referer`); allows hosts matching:
  - `awardpay.com.au`, `www.awardpay.com.au`
  - `*.lovable.app` and `*.lovable.dev` (preview + published)
  - `localhost` / `127.0.0.1` (local dev)
  Anything else → return `403`. OPTIONS preflight is unaffected (handled before the guard).
- `enforceRateLimit({ key, limit, windowSeconds })` — per-IP+function counter backed by a new table `public.rate_limits` (`bucket text`, `count int`, `window_start timestamptz`, PK `bucket`). Uses a `SECURITY DEFINER` SQL function `public.increment_rate_limit(_bucket text, _window_seconds int)` that atomically resets when the window expires and returns the new count. Edge functions call it via service role. Returns 429 with `Retry-After` when over the limit.
- IP source: `x-forwarded-for` first hop, fallback to `cf-connecting-ip`.

Default limits (tunable per function):
- `ai-parse-shifts`: 10 / 5 min per IP (expensive, OpenAI).
- `calculate-shift-pay`: 60 / 5 min per IP.
- `get-awards`, `get-classifications`, `get-classification-details`, `get-pay-rates`, `test-fwc-api`: 60 / 5 min per IP.

Wiring in each function (minimal diff): right after the OPTIONS short-circuit, call `assertAllowedOrigin` then `enforceRateLimit`. Both return a `Response` on failure that the handler returns immediately. No change to request/response shape on the happy path → no client changes needed.

Migration for rate limit table:
- `CREATE TABLE public.rate_limits (...)`, no grants to anon/authenticated, `GRANT ALL ... TO service_role`, RLS enabled with no policies (locked to service role).
- `CREATE FUNCTION public.increment_rate_limit(...) SECURITY DEFINER`.

## 3. Secret audit

Grep already run. Findings:
- `OPENAI_API_KEY` referenced only via `Deno.env.get('OPENAI_API_KEY')` in `ai-parse-shifts` (and any other AI function) — correct.
- `FWC_API_KEY` — to verify across the FWC functions; expectation is `Deno.env.get('FWC_API_KEY')` only.
- `SUPABASE_SERVICE_ROLE_KEY` — only used inside edge functions via `Deno.env`.
- `.env` contains only `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` (anon/publishable — safe to commit).

Action: do a final `rg` sweep across `supabase/functions/**` for `sk-`, `Bearer `, hardcoded `eyJ` JWTs, and any literal key strings. Report findings in the implementation message. No code change expected unless a leak is found, in which case the literal is replaced with `Deno.env.get(...)` and the user is told to rotate that key.

## Deliverables

1. One migration: drop the anon SELECT policy on `leads`, adjust grants, create `rate_limits` table + `increment_rate_limit` function.
2. New file `supabase/functions/_shared/guard.ts`.
3. Edits to the 7 listed edge functions to call the guard (≈4 lines each, no other changes).
4. One-line change in `NewCheck_Step3_Result.tsx` (`.select("id")` → `.select("*")`) with a safe fallback if PostgREST blocks the return.
5. Secret-audit report inline in chat (no code change unless a leak is found).

## Out of scope (explicitly)

- No UI, copy, calculator math, allowance rules, funnel, or marketing-page edits.
- No auth changes (anon flow stays anon).
- No change to `generate-pdf-report` / `send-email-report` / Stripe webhook behaviour.
