# Build the Full Report (unlocked for review)

Goal: surface the paid "Full Report" so we can see it end-to-end. Render it UNLOCKED on Step 3 directly below the existing free headline. Re-gating behind Stripe is the next task and is out of scope here.

No changes to the calculation engine, routing, or other pages.

---

## 1. New component — `src/components/report/FullReport.tsx`

Reusable, presentational. Props:

```ts
type Props = {
  result: any;            // engine result already in Step 3 state
  shiftDetails: any;      // already in Step 3 state
  advancedPayslip?: any;  // already in Step 3 state (optional)
}
```

Owed amount logic (matches existing Step 3):
- `isUnsure = result.mode === 'unsure'`
- `owed = isUnsure ? (result.overallMaxUnderpayment ?? 0) : (result.underpayment ?? 0)`

Sections (rendered defensively — only show fields that exist):

1. **Header** — AwardPay wordmark, "Pay Check Report", today's date (`en-AU`), pay period if derivable from `shiftDetails.shifts` (first → last date) or `shiftDetails.date`.
2. **Headline** —
   - If `owed > 0`: large gold "You may be owed $X" + 1-line summary of issue count.
   - Else: neutral "Your pay looks correct for this period" panel.
3. **Your details** — award name, classification, employment type, base hourly rate, total hours, hours at base / 1.5x / 2x (from `advancedPayslip` when present, else from `result.breakdown`), total actually paid.
4. **What's missing** — itemised breakdown reusing the SAME fields Step 3 currently renders behind the blur:
   - Expected award pay table: regularHours×baseRate, overtimeAt150Hours×1.5, overtimeAt200Hours×2, `awardPayTotal`.
   - Vs actually paid (`shiftDetails.actualPaid` / advancedPayslip totals).
   - `result.reasons[]` as a bullet list of missing penalties/loadings.
   - `result.potentialAllowances[]` with name, amount string, estimated value, reason.
5. **How to recover it** — static templated 4-step list, personalised by interpolating `$owed` and the names/amounts from `reasons` + `potentialAllowances`. Ends with the line: *"AwardPay provides general information, not legal advice."*
6. **Footer** — small print, generated date, awardpay.com.au.

Styling: existing semantic tokens (`--primary` green, `--gold`, `--card`, `--border`, `--muted`). Plus Jakarta Sans is already the body font; figures use `font-mono tabular-nums` (IBM Plex Mono is not currently loaded — using the existing mono stack avoids a new font load and keeps the report crisp). No hardcoded colors.

## 2. Client-side PDF — "Download report (PDF)" button

- Install `jspdf` (and `jspdf-autotable` for the breakdown tables — keeps it crisp and avoids manual column math).
- Button lives inside `FullReport.tsx` top-right of the header.
- `buildPdf(result, shiftDetails, advancedPayslip)` writes the SAME sections as the on-screen report using text + autoTable — not a canvas screenshot.
- Filename: `awardpay-report-YYYY-MM-DD.pdf`.
- The existing `generate-pdf-report` edge function is left untouched but unused by this flow (noted in a code comment).

## 3. Step 3 wiring — `src/pages/NewCheck_Step3_Result.tsx`

- Import `FullReport`.
- Keep the existing free headline block exactly as-is at the top.
- Remove the blur wrapper + paywall overlay around `LockedBreakdown`. Replace with:
  ```tsx
  {/* TEMP: report shown unlocked for review — re-gate behind payment in Stripe step */}
  <FullReport result={result} shiftDetails={shiftDetails} advancedPayslip={advancedPayslip} />
  ```
- `LockedBreakdown` is no longer rendered. Leave the function defined (dead code) so the re-gating step can restore it quickly, with a `// TEMP` comment above it.
- The two CTA buttons ($10 unlock / $30 5-payslip) stay where they are below the report.
- "Check another payslip" outline button stays.

## Files touched
- ADD `src/components/report/FullReport.tsx`
- EDIT `src/pages/NewCheck_Step3_Result.tsx` (remove blur/overlay, render `<FullReport />`, add TEMP comments)
- EDIT `package.json` (add `jspdf`, `jspdf-autotable`)

## Out of scope
- Payment gating (next task).
- Engine, routing, edge functions, other pages.
- Replacing or deleting `generate-pdf-report` edge function.

Approve and I'll build it.
