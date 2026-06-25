# Plan: AI payslip upload front door + restyled flow + gated result

## Scope guardrails
- No changes to `calculate-shift-pay`, `get-awards`, `get-classifications`, or any other edge function.
- No changes to Supabase schema, routing infra, or auth flow.
- Only routing change: add `/check`. All existing CTAs repointed to `/check`.
- Engine request shape stays byte-identical to today's Step 2.

---

## 1. New upload screen — `/check`

**File:** `src/pages/CheckUpload.tsx` (new)
**Route:** add `<Route path="/check" element={<CheckUpload />} />` in `src/App.tsx`.

Design: full `.ap-` system — `ApNav`, hero with `ap-eyebrow` + `ap-h1` + gold swash, scroll-reveal, hairline card for the drop zone, gold CTA, site footer, `SEO`.

Behaviour:
- Hero: "Check your payslip" + "Snap a photo or upload your payslip — we'll read it and check it against official Fair Work rates."
- Large drop zone (label-wrapped `<input type="file" accept="image/*" capture="environment" />`) supporting click + drag-drop.
- On file select: `FileReader.readAsDataURL` → base64 data URL → `supabase.functions.invoke("ai-parse-payslip", { body: { image } })`.
- Loading state: calm centered spinner + "Reading your payslip…".
- Success (and `unreadable !== true`): `navigate("/new-check-step-1", { state: { parsedPayslip } })`.
- Failure or `unreadable === true`: inline error card "We couldn't read that clearly — try a sharper photo, or enter your details manually." with **Try again** + **Enter manually** buttons.
- Secondary link below zone: "No payslip handy? Enter your details manually" → `/new-check-step-1` (no state).
- Reassurance line: "Your payslip is read, then discarded. Free. No account needed."

## 2. Repoint all "Check my payslip" / primary CTAs to `/check`

Sweep these files and switch the target from `/new-check-step-1` (or onboarding/calculator) to `/check` **only where the button text is the primary "Check my payslip / Check My Pay Now" CTA** — do not touch internal step-to-step navigation:
- `src/components/ApNav.tsx` (nav CTA)
- `src/components/NavBar.tsx` (if it has a primary CTA)
- `src/pages/Index.tsx` (hero + any repeat CTAs + screenshot carousel CTA)
- `src/pages/Pricing.tsx` (all 3 tier buttons → `/check`)
- `src/pages/HowItWorks.tsx` (bottom CTA)
- `src/pages/WhyAwardPay.tsx` (bottom CTA)
- `src/pages/Contact.tsx` (if any)
- `src/pages/Auth.tsx`, `AppDashboard.tsx` — leave unless they carry the primary marketing CTA

Step 1 / Step 2 / Step 3 internal navigation is untouched.

## 3. Pre-fill Step 1 from `location.state.parsedPayslip`

**File:** `src/pages/NewCheck_Step1_WhoAreYou.tsx` (edit, additive)
- Read `parsedPayslip` from `useLocation().state` on mount.
- If present:
  - Pre-select `employmentType` from `payslip.employment_type` (map "Full-time"/"Part-time"/"Casual" to existing internal values).
  - Pre-fill the award search input with `payslip.classification_or_role || payslip.employer_name`.
  - Render a small green note above the form: "Pulled from your payslip — please confirm."
- User still confirms award + classification (engine needs exact codes/ids). No change to how `get-awards` / `get-classifications` are called.
- Forward `parsedPayslip` along when navigating to Step 2 via `state`.

## 4. Pre-fill Step 2 (advanced payslip path)

**File:** `src/pages/NewCheck_Step2_ShiftDetails.tsx` (edit, additive)
- Read `parsedPayslip` from incoming `state`.
- If present, switch the UI into the **advanced payslip** path and pre-fill:
  - `payslipBaseRate` ← `base_hourly_rate`
  - `hoursAtBase` ← `ordinary_hours`
  - `actualPaid` ← `total_paid` ?? `gross_pay`
  - `hoursAt150` / `hoursAt200` — scan `line_items[].description` for /overtime|1\.5|x1\.5/ and /double|2\.0|x2/ keywords and sum `hours` where obvious; otherwise leave 0.
- Each pre-filled input keeps its existing edit behaviour. Render small muted note next to pre-filled fields: "From your payslip — edit if wrong."
- Submit handler unchanged. `calculate-shift-pay` body unchanged.
- Forward `parsedPayslip` to Step 3 state along with engine response.

## 5. Gated Step 3 result

**File:** `src/pages/NewCheck_Step3_Result.tsx` (edit)

**Free band (always visible):**
- Big headline card styled like the home page payslip mock: green surface, gold owed figure with **count-up animation** (reuse simple `requestAnimationFrame` count-up; no new deps).
- Primary line: "You may be owed about $X" using the engine's underpayment/owed total.
- Sub line: "We found N issue(s) with your pay" from count of underpaid line items in the engine response.
- If owed total ≤ 0 / no issues: replace with a calm "Looks like you were paid correctly" state (green tick, same card chrome).

**Locked band (rendered, blurred):**
- Render the existing itemised breakdown inside a container with `filter: blur(6px); pointer-events: none; user-select: none;`.
- Overlay card (centered, hairline + gold border): "Unlock your full report — see exactly what's missing and how to claim it."
  - Primary gold button: "Unlock full report — $10" → `navigate("/auth")`
  - Secondary outline button: "Check up to 5 payslips — $30" → `navigate("/auth")`
- No Stripe call yet. No charge logic added.

**Footer link on Step 3:** "Check another payslip" → `/check`.

If no owed amount, hide the locked overlay (nothing to unlock) and just show the "paid correctly" card + "Check another payslip" link.

---

## Technical notes
- Reuse `useReveal` IntersectionObserver pattern from `WhyAwardPay` / `HowItWorks` / `Pricing` on the new `/check` page (copy the small hook inline; no new shared file required).
- Count-up: small inline hook in Step 3, animates 0 → owed total over ~800ms.
- All new copy and components use existing tokens (`hsl(var(--green))`, `hsl(var(--gold))`, `.ap-h1`, `.ap-hl`, `.ap-eyebrow`, hairline card class).
- No new npm deps.
- `parsedPayslip` is optional in every step — manual flow works exactly as today when state is absent.

## Files touched
- `src/App.tsx` — add `/check` route
- `src/pages/CheckUpload.tsx` — new
- `src/pages/NewCheck_Step1_WhoAreYou.tsx` — additive pre-fill
- `src/pages/NewCheck_Step2_ShiftDetails.tsx` — additive pre-fill + advanced path defaulting
- `src/pages/NewCheck_Step3_Result.tsx` — free headline + locked overlay
- `src/pages/Index.tsx`, `src/pages/Pricing.tsx`, `src/pages/HowItWorks.tsx`, `src/pages/WhyAwardPay.tsx`, `src/pages/Contact.tsx`, `src/components/ApNav.tsx`, `src/components/NavBar.tsx` — CTA target swap to `/check`

## Out of scope (deferred)
- Stripe checkout for $10 / $30 unlocks (next step)
- Saving parsed payslips to a table
- Auth/sign-up changes
