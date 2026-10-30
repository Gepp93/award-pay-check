# Three-tier payment readiness — 30 October 2026

## Decision: NO-GO for customer launch

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

1. The enabled live Stripe destination is missing `customer.subscription.updated` and `charge.dispute.created`. Its other events are completed/async succeeded/async failed checkout, invoice paid/failed, subscription created/deleted, and charge refunded. Owner must add the two missing events to the existing destination; no recreation is required. Checkout is deliberately paused until verified.
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