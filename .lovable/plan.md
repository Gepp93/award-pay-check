# AwardPay 2.0 preview: fix pay mapping, then full end-to-end testing

Preview only. Live checker, Stripe, accounts, saved reports, database structure and v1 calculations stay untouched. Nothing published.

## 1. Pay-category mapping fix
- Remove the "Ordinary" default on "Add a pay line". New lines start as "Choose a category" and the user can't continue until every line has one.
- Category list: Ordinary pay, Saturday pay, Sunday pay, Public holiday pay, Overtime, Casual loading, Allowance, Other / Not sure.
- For Saturday, Sunday, Public holiday and Overtime lines, ask: "Is this the whole payment for those hours, or only the extra loading on top of ordinary pay?" (Whole payment / Extra loading only / Not sure).
- Scanned payslips: keep a category only when the payslip line clearly names it (ordinary, public holiday, overtime). A combined "weekend" line, or anything unclear, is marked "Please confirm" and has no category until the user picks one. The current automatic weekend-to-Saturday/Sunday guess is removed.
- "Other / Not sure", or "Not sure" on whole vs loading, is sent to the engine as unidentified. The engine then returns Partial and doesn't allocate the amount.

## 2. Results breakdown
- For each category, a table shows: actual paid, award minimum, shortfall, overpayment.
- Net comparable difference appears only when the engine marks the comparison reliable (Complete). Otherwise the result reads: "Category differences shown; these may offset each other, so no total underpayment is stated."
- A shortfall in one category is never labelled recoverable on its own.
- Award rules are not changed unless testing finds a real error. Any error found is reported before it is fixed.

## 3. Retail extended trading question
- When a Retail shift falls outside the cl 15.1 ordinary span, ask whether the store's trading hours extend the span under cl 15.2 (Yes / No / Not sure).
- Yes: the extended span from cl 15.2 applies. No: those hours count as outside the span (overtime trigger). Not sure: Partial, with the question shown in the results.
- No other awards are affected.

## 4. Ten browser journeys
- Run all 10 journeys through the actual preview screens, signed in as the tester: the 4 earlier ones again, plus the 6 that were only tested by direct calls.
- Each journey records: inputs, the actual engine response captured from the page, the displayed result, the expected result with its source, pass/fail, and desktop and mobile screenshots.
- A direct call is never counted as a browser pass.

## 5. Scanner to engine
- Synthetic payslip as PDF, then as an image (JPG or PNG).
- Steps: upload, AI reading, confirm or correct, carry into the questions, add shifts and employment details, calculate, check the results breakdown.
- Each amount is checked to appear exactly once in the request and the results, with nothing lost or double-counted.

## 6. Security regression
- Engine v2 call signed out: rejected. Signed in as a non-admin: rejected. Tester: allowed.
- Function and AI usage logs are checked for payslip images, names or amounts.
- The live `/check` and the v1 function are confirmed unchanged (no diff to their files).

## 7. Stop and report
Bugs fixed, all 10 browser results, scanner results, calculation discrepancies, remaining Partial/Unsupported scenarios, security results, and whether the preview is ready for final human review.

## Technical details
- `model.ts`: `PayLineDraft.kind` can be empty, and lines get a new `basis: "total" | "loading" | "unknown"`. Remove `resolveKind`. Unchosen, "other" or unknown-basis lines map to `other` with a flag. Add `extendedTrading: Tri`, and add a step `"extended"` when the Retail award applies and a shift falls outside `pack.span`.
- `engine.ts` (v2 only, an input contract addition): optional `PaidLine.basis` and `arrangement.extendedTrading`. A loading-basis line is compared against the penalty portion only, and unknown basis gives Partial. `extendedTrading === true` uses `span.extendedEnd`, false keeps the standard span, undefined gives the existing Partial question. Per-category actual/minimum/shortfall/overpayment comes from the existing comparison output, plus `netComparableCents` only when Complete.
- `EngineQuestions.tsx` and `Results.tsx`: UI for the above.
- Tests: `tests/v2/engine-model.test.ts` (no default category, weekend needs confirmation, unknown gives other) and `tests/engine-v2` (loading basis, unknown basis gives Partial, three extended-trading outcomes from cl 15.2). Each new case cites its clause.
- Browser runs use Playwright scripts in /tmp/browser. Evidence and the report go in `tests/v2/BROWSER-REPORT.md`.
