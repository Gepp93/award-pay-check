# Connect Engine v2 to the AwardPay 2.0 preview (internal testing only)

Scope: `/v2/*` preview only. The live `/check`, the old engine, Stripe, accounts, saved reports, database and the pass stay unchanged. Nothing gets published.

## 1. Backend function (`calculate-award-pay-v2`)
- Bring the function's input checks up to date with the current engine. Right now they reject the newer fields: work arrangement (all shifts included, worked to roster, guaranteed hours, roster cycle), "pay lines cover all wages" and the casual loading pay line.
- Keep it as pure calculation: no storage, and logs only count requests (no payslip values).
- Add the same origin check and per-IP rate limit the scanner uses, plus a request size cap.
- Deploy it so the preview can call it. No page outside `/v2` calls it.

## 2. Carrying answers between steps
- Extend the preview's answers-only session store to hold:
  - award and classification
  - state, pay period and dated shifts (with break length and start time, and overtime minutes)
  - the arrangement answers
  - pay lines and gross, each tagged "from payslip (confirmed)" or "entered by you"
  - local holiday confirmations
  - the last engine response
- The payslip file itself is never stored.
- Scanned values carry forward only after the confirmation screen is confirmed. Unconfirmed scan values are never sent to the engine.

## 3. Short questionnaire (new screen after confirmation or manual start)
One question at a time, showing only what the selected award and employment type need:
1. **Award:** Retail, Hospitality or Fast Food. The Fast Food option appears inside the Hospitality industry. Any other industry or award goes straight to an Unsupported result that explains why, with a "change award" button.
2. **Classification:** a picker limited to the engine's supported levels. "Not sure" leads to Unsupported. Never guessed from the job title.
3. **Rate type:** adult, junior, apprentice or trainee. Anything other than adult leads to Unsupported with an explanation.
4. **State or territory.**
5. **Pay period start and end.** Prefilled from a confirmed payslip.
6. **Shifts:** date, start and finish (with overnight handling), unpaid break length, and the break start time when the engine needs it.
7. **"Are these all the shifts in this pay period?"**
8. **Full-time and part-time:** "Apart from overtime, were these your rostered hours?" **Part-time (Retail and Fast Food):** guaranteed or agreed weekly hours.
9. **Overtime minutes for a shift.** Asked when the payslip shows overtime or a shift goes over the award's daily limit.
10. **Pay lines:** prefilled from confirmed payslip categories, then "Do these lines cover all your wages for these hours?" Gross only is allowed but leads to Partial.
11. **Local holiday question:** asked only for dates the engine says need confirmation.

"I don't know" is offered wherever a fact is optional. It sends the check on to a Partial result rather than guessing.

## 4. Results screen (rebuilt on the real engine response)
- **Complete:**
  - the award minimum, comparable wages and each pay category's difference, plus any potential underpayment and category shortfalls
  - award, classification, rate dates, and the Fair Work source for each line
  - what the check covered and what it left out
- **Partial:**
  - which items were assessed, as itemised lines with no total
  - what's missing, with buttons that jump back to the right question
  - the indicative gross figure, labelled "not an underpayment"
- **Unsupported:** the engine's reason and a "change award or classification" button. No dollar amounts.
- A small "Preview — internal testing" banner. The pass/report unlock is never offered for Partial or Unsupported results. For Complete results the existing pass button shows unchanged, and no new report is generated.

## 5. Testing
- **Unit tests** for:
  - scanned payslip to engine input (confirmed only, no double counting of loading or overtime)
  - questionnaire branching by award and employment type
  - results state handling
- **End-to-end runs in the browser** against the deployed function for the 10 journeys in your brief. Each run captures the actual function response and a screenshot. The scanner-failure journey uses a deliberately unreadable file, then manual entry.
- The existing engine tests must still pass.

## Technical details
- **Files:**
  - `supabase/functions/calculate-award-pay-v2/index.ts`
  - `src/features/v2/store.tsx`, `UploadPayslip.tsx`, `Results.tsx`, `payslipFields.ts`
  - new `src/features/v2/engine/` (input mapping, API call, questionnaire steps)
  - new `/v2/questions` route
  - tests under `tests/v2/`
- **Mapping:** payslip categories map to engine pay lines like this:
  - ordinary → ordinary
  - weekend → saturday or sunday, only when the payslip says which; otherwise "other", which leads to Partial
  - public holiday → public_holiday
  - overtime → overtime
  - allowances → allowance (left out of the comparison)
  - casual loading → casual_loading
- `AGENTS.md` gets one rule: the 2.0 preview calls only `calculate-award-pay-v2`, using confirmed answers, and production stays on v1.

## Stop point
I'll report the changed screens, the mapping, the questions added, which scenarios reach each state, and the real test results. Then I'll stop for your review.
