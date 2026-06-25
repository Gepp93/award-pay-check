# Plan: Add `ai-parse-payslip` edge function

## Scope
Create exactly one new edge function. No other files touched (except `supabase/config.toml` if needed for `verify_jwt = false`).

## Pre-flight checks
- `OPENAI_API_KEY` — already present in project secrets ✅
- `supabase/functions/_shared/guard.ts` — already exists ✅

If either were missing I would stop and tell you; both are present, so we proceed.

## Steps
1. Create `supabase/functions/ai-parse-payslip/index.ts` with the exact code you pasted — verbatim, no edits.
2. Check `supabase/config.toml`. If `ai-parse-payslip` isn't listed with `verify_jwt = false`, add:
   ```toml
   [functions.ai-parse-payslip]
   verify_jwt = false
   ```
   (matching the pattern used for the other public functions like `ai-parse-shifts`.)
3. Deploy `ai-parse-payslip` and confirm it deploys without errors.

## Out of scope (will not touch)
- Any other edge function
- `_shared/guard.ts`
- Frontend, routing, calculation engine, Supabase schema
- Any other config

## Notes
- Function uses OpenAI directly (your pasted code calls `api.openai.com` with `OPENAI_API_KEY`), not the Lovable AI Gateway. Kept as-is per "verbatim" instruction.
- Rate limit: 8 calls / 5 min per IP, origin allow-list via `guardPublicFunction`.
