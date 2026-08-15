# Fix the paid conversion path

The site isn't making sales for two compounding reasons, and this round fixes the one we control directly: **friction between "I got a number" and "I paid $10."**

Today a visitor who reaches a result is asked to **create an account first**, then get sent to Stripe. Over the last 30 days only 2 people reached a result at all — asking those 2 to sign up before paying is guaranteed zero sales. We remove the account step entirely from the buying path.

## What changes

**1. Buy without signing up**
- "Unlock full report — $10" goes **straight to Stripe**. No `/auth` detour, no pending-product resume dance.
- Before redirecting we save the report to the database as an anonymous row and pass its ID as `client_reference_id`, exactly as now.
- We collect the buyer's email on the Stripe page (already required by Stripe) and prefill it if we captured it earlier in the flow.
- After payment they land on the report page and can read it immediately via the report ID in the URL. An account becomes optional, offered afterwards as "save this report to your account".

**2. A result screen that actually sells**
- Keep the free view to the **headline number only** as you chose: "You may have been underpaid approximately $X."
- Directly under it: a short, specific list of what the $10 unlocks (award name and classification, per-shift rate breakdown, penalty/overtime lines, allowances missed, the exact shortfall figure, and a dated PDF you can send to your employer).
- Single gold CTA, priced and unambiguous. Remove the competing secondary buttons that currently split attention.
- Add a one-line trust row under the CTA: one-off payment, no subscription, refund if the report is wrong.

**3. Don't lose the almost-buyers**
- If someone reaches a result and doesn't buy, offer one low-commitment option: email me my result. That writes to the existing `leads` table so you can follow up instead of losing them.

**4. Verify it end to end**
- Walk the full path in the browser: upload a payslip, get a result, click unlock, complete a Stripe test payment, confirm the webhook marks the report paid and the report page renders unlocked.
- Confirm both Payment Links are in **live** mode and redirect back to `/report/<id>`. If they're still test-mode links, no real sale can ever complete — this gets checked and reported back.

## The part this doesn't fix

Conversion work multiplies traffic you already have. With ~56 visitors a month and roughly a third in Australia, even a perfect funnel produces very few sales. Once this is live, the next round should be AU-targeted SEO landing pages (per award and per industry) to grow qualified arrivals — that's where the volume has to come from.

## Technical notes

- `src/pages/NewCheck_Step3_Result.tsx`: drop the `!user` → `navigate("/auth")` branch and the `pendingProduct` auto-resume effect from the purchase handler; insert the report row anonymously and redirect to `buildCheckoutUrl(FULL_REPORT_LINK, reportId)`.
- Requires an RLS policy allowing anonymous inserts into the reports table (mirroring the existing anonymous `leads` insert policy), with reads scoped by report ID; the webhook keeps using the service role to flip the paid flag.
- `src/components/report/LockedTeaser.tsx`: restructure to headline + benefit list + single CTA + trust line.
- `src/pages/Report.tsx`: render by report ID for anonymous visitors when the row is marked paid; keep the signed-in path unchanged.
- No changes to the calculation engine, `calculate-shift-pay`, `ai-parse-payslip`, award data, routing, nav, footer or the green/gold tokens.
