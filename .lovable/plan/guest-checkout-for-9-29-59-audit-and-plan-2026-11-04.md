# Guest checkout for $9 / $29 / $59: audit and plan

## Audit findings

| Question | Current answer |
|---|---|
| Guest Stripe Checkout supported? | **No.** The report page sends signed-out visitors to sign-up. The server's checkout step also rejects anyone who isn't signed in with a confirmed email ("confirmed_account_required"), and it stores that account email on the purchase. |
| How the report survives the redirect | Guest reports are already saved to the database with no owner, and the report ID is part of the page address (`/report/<id>`). Stripe sends the customer back to that same address with a `tier_session` code. Nothing sensitive is kept in the browser. |
| One-time or subscription? | $9 Pay Check and $29 Underpayment Report are **one-time payments**. $59 Pay Protection is a **yearly subscription**. |
| How payment links to report and customer | Each purchase record stores the account, the account email, the report and the exact Stripe price. The Stripe session carries that purchase ID as a reference. The webhook (and the confirmation on return) re-fetches the session from Stripe and checks: live mode, paid, AUD, payment link, single line item, exact price, and that the **payer's email equals the account email**. It then records the transaction against that account and report. |
| Duplicate payments | Webhook events and Stripe sessions are recorded once each, and replays with mismatched details are rejected. Checkout refuses to start if the report is already unlocked. Two checkouts paid at the same time for the same report are both recorded (no automatic refund). |
| Failed or abandoned checkout | Nothing is unlocked unless Stripe shows the payment as paid. Abandoned checkouts leave a harmless "pending" record. There is no expired-session cleanup, which isn't needed. Failed or action-required subscription invoices update the subscription status, and refunds and disputes remove access because access is re-checked against Stripe. |
| Secure email-link sign-in exists? | **Partly.** Sign-up uses email confirmation links. There is no one-click "email me a sign-in link" option yet, but the sign-in system supports it without new infrastructure. Email sending is set up, but delivery to your support inbox is currently blocked. Customer emails go to their own address. |
| Possible without touching the calculation engine? | **Yes.** All changes are in checkout, purchase ownership and report access. Calculations, prices and Stripe products stay unchanged. |

## Minimal-change plan

1. **Report page buttons:** signed-out visitors go straight to checkout. "Sign in" stays as a small secondary link.
2. **Guest checkout start (server):** if nobody is signed in, require an unowned public-checker report. Create the purchase with no owner and no email, and let Stripe collect the email (no prefill).
3. **Webhook verification:** for guest purchases, keep every existing Stripe check. Instead of comparing the payer's email to an account, **record the payer's email from Stripe** on the purchase. Signed-in purchases keep the current account-match rule.
4. **Claiming:** extend the existing `claim_my_passes` approach. When a user signs in with a **confirmed** email that matches a paid guest purchase, the server assigns that purchase and its report to them. This runs from server code only, never from the browser.
5. **After payment:** the return page shows "Payment received — we've emailed a secure sign-in link to the address you paid with" plus an "Email me the link" button. The button only asks for a sign-in link to be sent; no account or purchase details are shown on screen. After signing in, the purchase is claimed automatically and the report opens unlocked.
6. **$59 subscription:** follows the same flow. The subscription attaches to the account at claim time, and the existing billing controls work after sign-in.
7. Legacy $30 pass, report protection, Engine v2 admin restriction and calculations stay unchanged.

## Files to modify

- `src/components/report/TierChoices.tsx` — guest buy path, secondary Sign in link
- `src/pages/Report.tsx` — post-payment "check your email" state and link request
- `src/pages/Auth.tsx` — "Email me a sign-in link" option; claim after sign-in
- `supabase/functions/_shared/tier-billing-handler.ts` — guest checkout branch
- `supabase/functions/_shared/tier-webhook.ts` — guest email capture branch
- `supabase/functions/_shared/tier-access.ts` — only if access lookup needs to include claimed rows
- One database migration: allow purchases with no owner (`tier_purchases` / `tier_transactions` user columns become optional) and add a `claim_my_tier_purchases()` server function (confirmed email only)
- Tests in `tests/` (in-memory, no live charges)

## Security risks and mitigations

- **Someone else claims the report:** only a sign-in with a confirmed email matching Stripe's recorded payer email can claim it. No browser-side ownership writes.
- **Payer typos their email:** they can't get in by themselves. Support can reassign manually after checking the Stripe receipt. Shown as a known limitation.
- **The report link is shared before payment:** paid details stay locked behind the claimed account. Anyone with the link still sees only the teaser, as today.
- **Account email differs from Stripe email:** signed-in buyers keep the current strict match, so nothing changes for them.
- **Sign-in link emails not delivered:** the customer can still sign up normally with the same email and the purchase is claimed. This depends on auth email delivery to customers working, which needs checking before launch.
- **Duplicate guest payments for the same report:** both are recorded. Refunds stay a manual decision in Stripe.

## Tests required

- Signed-out checkout creates an unowned purchase only for an unowned report, and rejects reports owned by someone else.
- The webhook records Stripe's payer email for guest purchases and still rejects price, currency, mode or payment-link mismatches.
- Claiming works only with a confirmed matching email, and an unconfirmed or different email claims nothing.
- Claiming twice is harmless, and a claimed $9 purchase still can't open the details or PDF.
- The signed-in checkout path keeps the existing email-match rejection.
- Refunds and disputes still remove guest-claimed access.
- All existing tests (299) still pass. No real payments.

## Cost note

This is a moderate change to payment handling (around 6 files plus 1 migration). It probably needs more than your remaining credits to build and test properly.
