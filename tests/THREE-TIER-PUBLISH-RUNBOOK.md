# Three-tier publish runbook

## Coordinated release (single sitting, gap of seconds)
0. Before publishing: confirm latest build OK and automated suite green.
Pricing now shows $9 / $29 (recommended) / $59 per year; new $30 pass sales are switched off in code (`LEGACY_PASS_ON_SALE = false`). Existing $30 entitlements, the Stripe product, Payment Link and legacy webhook are untouched.

## Order (immediately after publishing the site)
1. Publish the website (new report pages read details via `get_report_view` / `list_my_reports`).
2. Apply the report privacy permission change:

```sql
REVOKE SELECT ON public.reports FROM anon, authenticated;
GRANT SELECT (id, created_at, user_id, owed_amount, product, payment_status, stripe_session_id) ON public.reports TO anon, authenticated;
```

Verified 30 Oct 2026 in a rolled-back transaction: direct `result` reads denied, headline columns allowed, My Reports list and an existing paid $30 report still load in full.

## Rollback
- Report pages fail after step 2: re-run `GRANT SELECT ON public.reports TO anon, authenticated;` (restores the old behaviour instantly; no data changes).
- Website problem: restore the previous version from version history, then run the GRANT above (the previous site reads reports directly).
- Switch fails (error or report pages break): first disable new tier checkout (restore the admin check in `tier-billing` and redeploy), then follow the rows above.
- Payment problem: tier checkout can be stopped without touching the $30 offer by removing customer actions in `tier-billing` (restore the admin check) and redeploying. Existing $30 webhook and pass are separate and unaffected.
- No database rows are changed by publishing, so rollback never needs data repair.
