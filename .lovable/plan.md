# Finish the three-tier purchase flow on the public checker

Payment testing and test-credential requests stay stopped. The existing live Stripe products, Payment Links, webhook and secrets are reused. No public page changes go live until you approve publishing, and no payments are made.

## What customers will get
- After a check on the public checker (`/check`), a signed-in customer's saved report offers three choices:
  - **$9 Pay Check:** the headline result and issue summary for that report.
  - **$29 Underpayment Report:** the full itemised report plus a PDF.
  - **$59/year Pay Protection:** full reports and PDFs for all of their reports while the subscription is paid.
- Results stay labelled as preliminary estimates. No calculation, award or classification step changes.
- Guests are asked to sign in or create an account before buying, so each payment is tied to one account.
- After paying, Stripe returns them to their report. If payment confirmation is delayed, the page shows "confirming payment" and checks again automatically. It never unlocks from the return address alone.
- **My reports** gains **Manage billing** and **Cancel renewal** for Pay Protection. Cancelling keeps access until the end of the paid year.
- Existing $30 pass holders and earlier purchases keep exactly the access they have today.

## Fixes required to make this safe
1. **Tie tiers to public checker reports.** Purchases currently attach only to admin-only Engine v2 reports. They will attach to the customer's own saved public-checker report instead. Engine v2 stays admin-only.
2. **Let ordinary customers buy.** Remove the admin-only restriction from purchasing and viewing their own reports. Engine v2 calculation and testing pages stay admin-only.
3. **Hide report details on the server.** Today a saved report's full detail can be read directly from the browser, and the lock is only on screen. That means a $9 buyer, or anyone holding an unpaid report link, could see $29-level detail. Full detail will come only from the server, after it checks the account's purchases: the $30 pass and legacy purchases, $29, or an active $59. $9 customers get the summary only.
4. **Protect the PDF.** The detailed PDF is created on the server, and only for eligible purchases.
5. **Payment integrity.** Keep the completed per-payment records:
   - Duplicate notifications don't grant twice.
   - Repeat purchases are each recorded.
   - A payment from a different email than the signed-in account is held for review rather than granted to someone else.
6. **Refunds, disputes and renewals.** Access is always checked against Stripe's current state:
   - Full refunds and lost disputes remove that purchase's access only.
   - Partial refunds don't.
   - A won dispute or a later successful renewal restores access.
7. **Customer pages outside the admin area.** Payment return, My reports and report pages become reachable by signed-in customers.

## Will remain unverified, because payment testing was declined
- A real payment unlocking each tier.
- Stripe's billing portal being turned on in your live account. If it is off, **Manage billing** will show a clear message, and **Cancel renewal** still works through AwardPay.
- Real refund, dispute and renewal deliveries.
- Behaviour when two payment notifications arrive at the same moment.

## Release state
- Pricing on the public site keeps showing the $30 pass until you approve publishing.
- After implementation, I report what changed and the remaining unverified items, and ask for your final publishing approval.

## Technical details
- Reuse the existing `tier_purchases` and `tier_transactions` tables, adding a nullable link to the public checker's report. The existing Engine v2 report link stays.
- Add a service-only RPC or function path returning the authorised report shape for each tier. Narrow direct browser reads of report details to the headline columns. Legacy pass and `payment_status='paid'` reports keep full access through the same server path.
- `Report.tsx`, `FullReport` and the PDF fetch report detail from the server. The calculation output already stored is unchanged.
- The `tier-billing` admin check applies only to Engine v2 actions. Customer actions are limited to the signed-in owner's reports. Checkout binds the confirmed account email, purchase reference and live Price.
- The return route and customer report routes move outside `V2Gate`. `calculate-award-pay-v2`, the `/v2` checker and testing routes keep their admin gate.
- The legacy `stripe-webhook`, $30 Payment Link and pass functions stay unchanged.
- No new payment tests or test infrastructure. The existing automated suite and build checks run normally.
