## Goal

Fix the `handleCheckPay` function in `src/pages/NewCheck_Step2_ShiftDetails.tsx` so it no longer reports "Missing Information — complete date and shift times" when the user has already entered shifts via the day-by-day `shifts[]` array.

## What is broken

The current validation only checks the legacy single fields `date`, `startTime`, and `finishTime`. Those fields are empty when the user uses the `MultiDayShiftEntry` (`shifts[]`) input, so validation always fails even though valid shift data exists.

## Scope

- **Only file changed:** `src/pages/NewCheck_Step2_ShiftDetails.tsx`
- **Only function changed:** `handleCheckPay`
- Edge functions, calculation engine, request/response shape, routing, and other components are **not** touched.

## Implementation

1. At the top of `handleCheckPay`, derive effective shift values:
   - Pick the first usable entry from `shifts[]`:
     `const firstShift = shifts.find(s => s.date && s.start && s.finish) || shifts[0];`
   - Effective date: prefer single `date`, fall back to `firstShift?.date`:
     `const effDate = date ? format(date, "yyyy-MM-dd") : (firstShift?.date || "");`
   - Effective start time: prefer `startTime`, fall back to `firstShift?.start`:
     `const effStart = startTime || firstShift?.start || "";`
   - Effective finish time: prefer `finishTime`, fall back to `firstShift?.finish`:
     `const effFinish = finishTime || firstShift?.finish || "";`
   - Effective break: prefer `breakMinutes`, fall back to `firstShift?.break_minutes`:
     `const effBreak = (breakMinutes && breakMinutes !== "") ? parseInt(breakMinutes) : (firstShift?.break_minutes ?? 0);`

2. Replace the existing validation block with these checks (using the legacy `useToast` shape from the file):
   - If `!awardCode || !classificationId`, toast: title `"Award not selected"`, description `"Go back to Step 1 and choose your award and classification."`, then `return`.
   - If `!effDate || !effStart || !effFinish`, toast: title `"Add a shift"`, description `"Enter at least one shift with a date, start and finish time."`, then `return`.
   - If `!payslipBaseRate || !hoursAtBase`, toast: title `"Payslip figures needed"`, description `"Enter your base hourly rate and ordinary hours under 'Your payslip breakdown'."`, then `return`.

3. In the `calculate-shift-pay` invoke body and the `navigate` state, use the effective values:
   - `date: effDate` (already a `"yyyy-MM-dd"` string — do not wrap in `format()` again)
   - `startTime: effStart`
   - `finishTime: effFinish`
   - `breakMinutes: effBreak`
   - Leave every other body field exactly as-is (`awardCode`, `classificationId`, `employmentType`, `workArea`, `advancedPayslip`, `actualPaid`, `allowanceConditions`, and all flags).
   - Also use `effDate` / `effStart` / `effFinish` / `effBreak` in the `shiftDetails` object passed to the next route state.

## Verification

- Type-check and build the frontend.
- Smoke-test Step 2 by selecting an award/classification on Step 1, entering a shift in the "Day by Day" tab, and confirming the "Check my pay" button invokes the edge function without the validation toast.
