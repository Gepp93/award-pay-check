Plan: make classification optional in Step 2 so the engine's unsure mode actually triggers, and surface the estimate honestly on Step 3 and in the Full Report.

Out of scope: calculation engine, routing, other pages, payment gating.

## 1. Step 2 — `src/pages/NewCheck_Step2_ShiftDetails.tsx`

Edit only inside `handleCheckPay`.

### 1.1 Relax validation
Replace the current check:

```tsx
if (!awardCode || !classificationId) {
  toast({ title: "Award not selected", description: "Go back to Step 1 and choose your award and classification.", variant: "destructive" });
  return;
}
```

with:

```tsx
if (!awardCode) {
  toast({ title: "Award needed", description: "Go back to Step 1 and choose your award.", variant: "destructive" });
  return;
}
```

Keep the existing shift and payslip-figures checks unchanged.

### 1.2 Send `null` for missing classification
In the `calculate-shift-pay` invoke body, change:

```tsx
classificationId,
```

to:

```tsx
classificationId: classificationId || null,
```

Keep `workArea` and all other fields exactly as they are now. This lets the engine's existing unsure-mode path (which requires `classificationId === null`) run for users who skipped classification.

## 2. Step 3 — `src/pages/NewCheck_Step3_Result.tsx`

### 2.1 Unsure headline
When `result.mode === 'unsure'` and `overallMaxUnderpayment > 0`:

- If `overallMinUnderpayment` exists and differs from `overallMaxUnderpayment`, show a range:  
  **"You may be owed $[min]–$[max]"**
- Otherwise show:  
  **"You may be owed up to ~$[max]"**

When `result.mode !== 'unsure'`, keep the existing single exact figure unchanged.

### 2.2 Caveat line
Beneath the unsure headline, add a small line:

> "This is an estimate across the likely classification levels for your role. For an exact figure, go back and select your classification."

Keep the rest of the Step 3 layout unchanged (free headline block, FullReport unlocked, CTA buttons, "Check another payslip").

## 3. Full Report — `src/components/report/FullReport.tsx`

### 3.1 Shared helper
Introduce a helper that computes the display headline and subtitle from `result`:

- `mode === 'unsure'`: return range or "up to ~" wording.
- Otherwise: return the exact owed figure.

Use this helper in both the on-screen headline section and inside `buildPdf()` so the PDF matches.

### 3.2 Caveat line
Add the same caveat line under the headline in the on-screen report when `mode === 'unsure'`. The PDF can keep a shorter note or the same line.

## Files touched
- `src/pages/NewCheck_Step2_ShiftDetails.tsx` (validation + payload)
- `src/pages/NewCheck_Step3_Result.tsx` (unsure headline + caveat)
- `src/components/report/FullReport.tsx` (unsure headline + caveat, PDF parity)

## Out of scope
- Calculation engine (`calculate-shift-pay` edge function)
- Routing, other pages, payment gating, Stripe flows