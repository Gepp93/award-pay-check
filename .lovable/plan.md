## Fix 403 on ai-parse-payslip from Lovable preview

The public Edge Functions share `supabase/functions/_shared/guard.ts` for origin allow-listing. The Lovable preview domain (e.g. `...lovableproject.com`) is not currently in `ALLOWED_HOST_SUFFIXES`, so `assertAllowedOrigin` returns 403 for preview traffic.

### Changes

1. Update `supabase/functions/_shared/guard.ts`:
   - Add `.lovableproject.com` to `ALLOWED_HOST_SUFFIXES`.
   - Add a diagnostic `console.log` inside `assertAllowedOrigin` immediately after the `host` variable is computed, before the no-host block.

2. Redeploy all public Edge Functions so the shared guard change is live everywhere.

### Out of scope

No changes to the `ai-parse-payslip` function body, the calculation engine, the frontend upload screen, or `supabase/config.toml`.

### Files touched

- `supabase/functions/_shared/guard.ts`

### Functions to redeploy

`ai-parse-payslip`, `ai-parse-shifts`, `calculate-shift-pay`, `get-awards`, `get-classifications`, `get-classification-details`, `get-pay-rates`, `get-penalties`, `get-allowances`, `generate-pdf-report`, `send-email-report`, `test-fwc-api`, `debug-ma000020-classifications` (all functions that import `../_shared/guard.ts`).