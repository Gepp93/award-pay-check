# Account-first payment + "My Reports" safety net

Calculator engine, wizard math, free headline rendering, and Step 1/2/3 routing are NOT touched. Only auth-gating, `reports` rows, dashboard, payment-complete page, webhook record-matching, and a small profile cleanup change.

## 1. Account-first unlock on Step 3 (`src/pages/NewCheck_Step3_Result.tsx`)
Change `handleUnlock` so the order is strict:
- If not signed in → `navigate("/auth", { state: { returnTo: "/new-check-step-3", returnState: {...locationState, pendingProduct}, mode: "signup" } })`. (Already exists, keep.)
- If signed in → ensure a `reports` row for *this* result exists, owned by the user:
  - Use a `sessionReportIdRef` (in component) + `sessionStorage["pendingReportId"]` keyed by a hash of the result, so re-clicks reuse the same row instead of creating duplicates.
  - Insert with `payment_status: 'free'`, `product`, `owed_amount`, `result`, `inputs: { shiftDetails, advancedPayslip }`.
- Then `localStorage.setItem("pendingReportId", reportId)` and `navigate(`/report/${reportId}`, { state: { pendingProduct } })`.
- Do NOT redirect to Stripe from Step 3 anymore. Stripe redirect happens from `/report/:id`.

Auto-resume effect already handles returning from `/auth` — it will now end on `/report/:id` instead of Stripe.

## 2. `/report/:id` becomes the Stripe launch point (`src/pages/Report.tsx`)
- Keep current `handleUnlock`: builds `buildCheckoutUrl(link, id)` with the report id as `client_reference_id`.
- Before `window.location.href = ...`, set `localStorage.setItem("pendingReportId", id)`.
- If `location.state.pendingProduct` is present on first mount and the report is still `free`, auto-trigger that product's unlock once (so the post-auth resume goes straight to Stripe without an extra click). Skip auto-trigger if `credits > 0` for `full_report` so users don't accidentally burn a credit.

## 3. New page `/reports` — My Reports (`src/pages/MyReports.tsx`)
- Requires sign-in (redirect to `/auth` with `returnTo: "/reports"`).
- `select id, created_at, owed_amount, payment_status, result` from `reports` where `user_id = auth.uid()` (RLS already enforces) ordered `created_at desc`.
- Render a clean list (rows, not cards). Each row:
  - date (e.g. "27 Jun 2026")
  - headline owed: if `result.mode === "unsure"` → "owed at least ~$X" using `result.overallMinUnderpayment`; else `$owed_amount`. If 0 → "Paid correctly".
  - status badge: `Paid` (green) vs `Locked` (muted).
  - `Open` button → `/report/:id`.
- Empty state: "No reports yet — run a free check to get started" + button → `/check`.
- Wire route in `src/App.tsx`: `<Route path="/reports" element={<MyReports />} />`.

## 4. NavBar update (`src/components/NavBar.tsx`)
- Replace the "Dashboard" link with "My Reports" → `/reports` (signed-in nav only). Mobile menu mirrors it.

## 5. Robust `/payment-complete` (new `src/pages/PaymentComplete.tsx`, route in `App.tsx`)
- Requires sign-in (redirect to `/auth` with `returnTo: "/payment-complete?session_id=..."`).
- Resolve target report id:
  1. `localStorage.getItem("pendingReportId")` if present.
  2. Else `?session_id=...` → query `reports` where `stripe_session_id = session_id` (user-scoped via RLS).
- Poll that row's `payment_status` every 2s for up to 20s.
- On `paid` → `localStorage.removeItem("pendingReportId")` and `navigate("/report/:id")`.
- On timeout → reassuring screen: "Payment received. Your full report is unlocking now and will appear under My Reports in a moment." with buttons → `/reports` and "Refresh" (re-runs the resolver). No error styling.
- Note: Stripe Payment Links must be configured to redirect to `${origin}/payment-complete?session_id={CHECKOUT_SESSION_ID}` — this is a Stripe dashboard setting and can't be changed in code. I'll call this out in the closing message.

## 6. Webhook stores stripe_session_id (`supabase/functions/stripe-webhook/index.ts`)
Already updates `stripe_session_id` in the same `update`. No change needed except: confirm it persists on free→paid transition (it does). Keep `verify_jwt = false`. Keep credits behavior for `backpay_pack`. No code change required here — already correct.

## 7. Profile cleanup (`src/pages/Profile.tsx`)
- Remove the entire "Subscription" card (subscription state, cancel dialog, navigate to `/subscription`).
- Remove unused imports (`useSubscription`, `CreditCard`, `AlertTriangle`, `AlertDialog*`, `cancelling` state, etc.).
- Keep Account Information card and the admin badge.

## Files to change
- `src/pages/NewCheck_Step3_Result.tsx` — create/reuse report row, navigate to `/report/:id` instead of Stripe.
- `src/pages/Report.tsx` — set `pendingReportId` in localStorage before Stripe redirect; auto-trigger on `pendingProduct`.
- `src/pages/MyReports.tsx` — NEW.
- `src/pages/PaymentComplete.tsx` — NEW.
- `src/App.tsx` — add `/reports` and `/payment-complete` routes.
- `src/components/NavBar.tsx` — replace Dashboard with My Reports.
- `src/pages/Profile.tsx` — remove subscription card.

## Out of scope
- `supabase/functions/calculate-shift-pay/*` — untouched.
- Wizard logic, free headline math, Step 1/2/3 calculation paths — untouched.
- Stripe Payment Link dashboard config (success URL) — must be set by you in Stripe to `${origin}/payment-complete?session_id={CHECKOUT_SESSION_ID}`.

Approve to build.
