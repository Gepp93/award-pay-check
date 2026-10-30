# Three-tier payment readiness — 30 October 2026

## Decision: NO-GO for customer launch

### Re-audit after owner updated webhook (30 October, 05:47 UTC request)

Configuration is now PASS: the enabled live destination has exactly 10 events, including both previously missing events. The deployed configuration endpoint returns `ready: true`, `missingEvents: []`. The saved signing secret authenticates a harmless no-op (200); missing/invalid signatures fail (400). This does not establish a Stripe-origin payment delivery or fulfillment.

Full suite rerun: 298 passed, 0 failed, 1,427 assertions across 14 files. Desktop/mobile authenticated owner locked-report access, payment-status refresh, false success-query rejection, no PDF button, admin pricing, signed-out route/function denial and nonexistent report 404 all passed. No page errors or horizontal overflow. No checkout action invoked because it would create a pending purchase now that configuration is ready. No application code, Stripe configuration, legacy webhook, account permissions or customer records changed in this re-audit; no publication or live transaction.

Read-only snapshots confirm Stripe webhook configuration stayed unchanged during checks. Legacy purchases remain 17, tier purchases/events remain zero. Accordingly no real tier payment, invoice delivery, unlock or paid PDF download has been verified.

Additional launch blockers identified on re-audit:
- PDF entitlement is UI-only: the $9 tier receives the full result used by the public client-side PDF generator. The $29 PDF cannot be described as securely exclusive until an authorized report-generation endpoint delivers tier-specific content; users can always print content already provided.
- Refund/dispute revocation permanently excludes a subscription purchase from reconciliation, even after later legitimate paid renewal. Partial refunds revoke the entire purchase; won-dispute restoration is not handled. Older invalidated invoices are not checked by access-time latest-invoice verification before webhook processing.
- A repeated Payment Link reference can produce a second paid session; fulfillment returns false for a different session, but the handler ignores this boolean. The additional paid session has no recovery path.
- Real database duplicate/concurrent event behavior remains untested. Test mocks do not prove SQL transactions or RLS integration.
- No customer cancellation portal/action or automatic AwardPay checkout return is implemented. Signed-out tier checkout remains intentionally unavailable while Engine v2 is admin-only.

Safe Stripe sandbox matrix after isolated setup: all three tier purchases, actual signed Stripe deliveries/retries/duplicates, email/reference mismatch, failed asynchronous payment, paid/failed/recovered renewals with test clocks, scheduled/immediate cancellation, partial/full refunds, dispute open/won/lost, PDF authorization and refund-before-fulfillment. No real money is needed for these scenarios.

Sandbox prerequisites are NOT present: separate sandbox API key/signing secret, test Prices/Payment Links, isolated reports/purchases and a sandbox endpoint. Current production code explicitly requires live objects and exact live links; do not point test events at it or weaken live checks. A mode-specific isolated test deployment is needed.

Separately approved live verification: small owner-controlled purchases through each exact live link, Stripe-origin delivery/fulfillment and owner report/PDF readback; optional approved live refund/cancellation. Real failed payments/disputes and annual waiting are unnecessary—use sandbox tests instead. No live transaction was approved or performed in this re-audit.

Next action: fix duplicate-session handling and secure tier-specific report delivery, agree refund/dispute recovery semantics, then authorize an isolated Stripe sandbox environment. Complete sandbox matrix before requesting a narrowly scoped live purchase approval.

Implementation resumed; no website publication, real payment, Stripe configuration change, account permission change or customer record mutation was performed. Billing functions were deployed for verification; these backend deployments take effect immediately on the shared backend. The legacy webhook received only a tier-link exclusion guard.

## PASS

- Verified live AUD Payment Links: $9 one-time Pay Check, $29 one-time Underpayment Report, $59/year recurring Pay Protection; exact link/Price identities matched.
- Both credentials configured; deployed webhook rejects missing/invalid signatures (400), accepts a harmless correctly signed no-op request (200). This is not a Stripe-origin delivery test.
- Full automated suite: 298 passed, 0 failed, 1,427 assertions, 14 files; latest preview build OK.
- Stateful simulated events: product-specific access; duplicate fulfillment/refund no extra mutation; failed asynchronous payment grants nothing; failed renewal removes active access; scheduled cancellation lasts only through paid period; stale notifications use current Stripe state; refund-before-fulfillment cannot grant access; disputes cannot revive through invoice notifications.
- Owner email binding prevents a different checkout email claiming the initiating owner's purchase. One-time purchases do not require Stripe to create a Customer object.
- Current Stripe verification is required for report access; stored flags and success-query parameters cannot unlock reports. PDF downloads recheck server permission.
- Authenticated desktop/mobile: existing owner synthetic report opened through My assessment reports; details/PDF locked; all three buy buttons safely paused; no overflow or page errors. False success redirect remained locked.
- Signed-out routes denied; billing/calculation calls return 401. Missing/unowned report lookup returns 404; uncertain eligibility save returns 422.
- Database checks: client fulfillment RPC execution denied; direct protected report reads denied; new account-binding column exists.
- Legacy purchase count unchanged at 17; tier purchases/events remain 0. Calculation formulas, Engine v2 role restrictions and customer entitlements unchanged.

## FAIL / blocked

1. RESOLVED on re-audit: owner added `customer.subscription.updated` and `charge.dispute.created`; all 10 selected events verified. Configuration-only checkout pause is no longer active; Engine v2 and tier billing remain admin-only. Overall launch recommendation remains NO-GO.
2. No real or approved isolated paid flow is available. Checkout → Stripe delivery → transactional fulfillment → unlocked report/PDF, real renewals, cancellation/refund deliveries and account mismatch recovery are NOT verified. No real payment was initiated.
3. Database transaction duplicates/concurrency were not exercised with paid fixtures. Stateful tests simulate the service boundary and do not prove real SQL transaction concurrency. Current Stripe checks prevent reliance on stale subscription cache, but concurrent webhook cache writes are not serialized before external retrieval.
4. Stripe Payment Links currently end on Stripe's hosted confirmation, not AwardPay. No automatic return exists; returning users must reopen My assessment reports and check payment status. No Stripe setting was changed.
5. Engine v2 remains admin-only. Signed-out users correctly cannot buy v2 reports; public guest purchase/account-claim journeys are intentionally not enabled. A separately approved launch/access decision is required.
6. Any detected partial refund conservatively blocks access; dispute resolution and later restoration following a revoked subscription are not automated. Refund-before-checkout is safely denied but can keep retrying rather than persisting a final refunded purchase state. Agree recovery policy before launch.
7. Stripe verification availability is required for paid access; API outages fail closed. Saved PDFs already downloaded cannot be revoked.

## Exact changed files

- `AGENTS.md`
- `roadmap.md`
- `drizzle/migrations/0007_tier_account_binding_and_revocation.sql` and generated migration metadata
- `src/integrations/supabase/types.ts` (generated)
- `supabase/functions/_shared/tier-products.ts`
- `supabase/functions/_shared/tier-stripe.ts`
- `supabase/functions/_shared/tier-webhook.ts`
- `supabase/functions/tier-billing/index.ts`
- `supabase/functions/stripe-webhook/payment.ts`
- `src/features/v2/PaidReport.tsx`
- `src/features/v2/tierApi.ts`
- `tests/tier-billing.test.ts`
- `tests/pass-webhook.test.ts`
- `tests/tier-entitlements.test.ts`
- `tests/TIER-PAYMENT-READINESS.md`