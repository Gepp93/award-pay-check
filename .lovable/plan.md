## Goal

Stop comparing a single shift's award pay against a whole pay period's `actualPaid`. Switch the underpayment math to an **effective hourly rate** comparison so the unsure-mode B&C case (actualPaid $2,250, effective ~$21/hr) actually surfaces an underpayment against the $25–$32/hr CW classifications.

No changes to FWC API calls, rate fetching, classification fetching, allowance detection, or the response shape consumed by the UI.

## Files to change

- `supabase/functions/calculate-shift-pay/index.ts` only.

Two paths share the same bug and both need the same new math:

- `calculateSingleClassification(...)` (~lines 860–1010) — used by the unsure-mode loop, returns `{ awardPayTotal, possibleUnderpayment, ... }` per classification.
- The single-classification path at the bottom of `serve` (~lines 1336–1530) — returns `{ awardPayTotal, underpayment, ... }`.

## New shared helper (inline, top of file)

```text
computePeriodComparison({
  baseRate,                        // $/hr from FWC
  employmentType,                  // for casual loading
  startTime, finishTime, breakMinutes,  // single shift (fallback only)
  workedWeekend, workedPublicHoliday,
  advancedPayslip,                 // { payslipBaseRate, hoursAtBase, hoursAt150, hoursAt200 } | undefined
  actualPaid,
})
  -> { totalHoursPaid, effectiveHourlyPaid, requiredAvgRate, expectedPay, basePay, overtimePay, weekendPay, publicHolidayPay }
```

Logic:

1. **totalHoursPaid**
   - If `advancedPayslip` has any of `hoursAtBase|hoursAt150|hoursAt200` > 0:
     `totalHoursPaid = hoursAtBase + hoursAt150 + hoursAt200`
   - Else fall back to single-shift hours derived from `startTime/finishTime − breakMinutes` (the existing calculation).

2. **effectiveHourlyPaid** = `actualPaid / totalHoursPaid` (guard divide-by-zero → 0).

3. **requiredAvgRate** — two branches:
   - **With advancedPayslip** (period mode): weight by the payslip's own split.
     `expectedBeforeExtras = baseRate*hoursAtBase + baseRate*1.5*hoursAt150 + baseRate*2*hoursAt200`
     Apply casual 25% loading to the base portion only when `employmentType === 'Casual'`.
     `requiredAvgRate = expectedBeforeExtras / totalHoursPaid` (used for the comparison + display).
   - **Without advancedPayslip** (single-shift fallback): re-use the existing single-shift formula (ordinary up to 7.6h / casual 8h, OT first 2h @1.5x then 2x, casual loading on base) to produce `expectedBeforeExtras`, with `totalHoursPaid === shiftTotalHours`.

4. **Period-level adders applied on top of expectedBeforeExtras**, scaled to `totalHoursPaid` (not to the single shift):
   - `weekendPay = workedWeekend ? totalHoursPaid * baseRate * 0.5 : 0`
   - `publicHolidayPay = workedPublicHoliday ? totalHoursPaid * baseRate * 1.5 : 0`

   These match the existing behaviour for the flags, but use period hours instead of one shift's hours. Keep them as separate breakdown lines.

5. **expectedPay** = `expectedBeforeExtras + weekendPay + publicHolidayPay + perPeriodAllowances`
   where `perPeriodAllowances` is the existing `droveOwnCar` ($20) and `workedOver10Hours` ($15) additions, unchanged.

6. **underpayment** = `max(0, expectedPay − actualPaid)`.

## Wiring into `calculateSingleClassification`

Replace the block at ~lines 927–981 (`Calculate hours worked` through `const possibleUnderpayment = ...`) with a call to `computePeriodComparison(...)`.

Return shape stays the same to avoid breaking `NewCheck_Step3_Result.tsx`, `LockedTeaser`, `FullReport`, the saved `calculations.breakdown` rows, and the unsure-mode aggregation:

```text
{
  baseRate,
  awardPayTotal: expectedPay,        // now period-scaled
  possibleUnderpayment: underpayment, // now from effective-hourly logic
  matchScore,
  potentialAllowances,
  breakdown: {
    totalHoursPaid,                  // NEW
    effectiveHourlyPaid,             // NEW
    requiredAvgRate,                 // NEW
    basePay, overtimeAt150Hours, overtimeAt200Hours, overtimePay,
    weekendPay, publicHolidayPay, allowances,
  },
}
```

Unsure-mode aggregator (~lines 1158–1160) keeps using `r.possibleUnderpayment` to compute `overallMin/MaxUnderpayment`, so no change there.

## Wiring into the single-classification path

Same swap around ~lines 1440–1455: derive `expectedPay`/`underpayment` from the helper, keep the existing `reasons`/`warnings` array, just feed it the new numbers. Response stays `{ awardPayTotal, underpayment, breakdown, ... }`.

## What does NOT change

- FWC fetch calls (`get pay-rates`, classifications, allowances).
- Allowance detection (`detectPotentialAllowances`, `awardSpecificRules`, `fetchAwardAllowances`).
- Response top-level field names and the `mode: 'unsure'` shape.
- Frontend code (`NewCheck_Step3_Result.tsx`, `LockedTeaser`, `FullReport`, Step 2 invocation payload).
- `actualPaid` calculation in Step 2 (already correctly period-level).

## Validation after build mode

1. Re-run the captured B&C unsure case via the deployed function with:
   `awardCode=MA000020`, `classificationId=null`, `employmentType=Full-time`, `startTime=06:00`, `finishTime=18:00`, `breakMinutes=30`, `workedWeekend=true`, `workedPublicHoliday=true`, `actualPaid=2250`, plus `advancedPayslip={ payslipBaseRate: 21, hoursAtBase: ~38, hoursAt150: 0, hoursAt200: 0 }` (approximated from a 38h week at $21/hr if not pulled from the saved row).
2. Capture and report:
   - `overallMinUnderpayment`, `overallMaxUnderpayment`
   - `expectedPay`, `requiredAvgRate`, `effectiveHourlyPaid` for the top 3 `likelyClassifications` (CW1a/b/c at $25.46–$26.31/hr — should now show ~$170–$200+ underpayment per week before the weekend/PH adders, more once those flags scale to the full period).
3. Sanity-check the non-payslip path: a single classified shift with no `advancedPayslip` should produce the same numbers as before for that shift (fallback branch).

## Notes / risks

- The weekend and public-holiday adders now scale to the full period, which is more aggressive than the previous single-shift scaling. This is the intended behaviour given the user's input (they ticked the flag for the period), and is consistent with the user's instruction to keep period-level flags applied on top.
- If `advancedPayslip` is present but all three hour buckets are 0 (only `payslipBaseRate` filled), we treat it as "no payslip hours" and fall back to single-shift hours so we never divide by zero.
