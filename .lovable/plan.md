# Live checker safety patch: final release checks (preview only)

## What changes
1. **Misleading $0.00 award total in old reports.** When a saved report's award pay total is missing or zero but still shows a shortfall (the old "not sure" range reports), the Full Report page and PDF show "Not available for this estimate — calculated across several levels" in place of $0.00. Stored values are not changed.
2. **Headline vs breakdown.** Check whether award total minus actually paid equals the headline shortfall. If it doesn't (old range reports, or allowances added in), show a short note saying the figures can't be reconciled and that the headline is a preliminary estimate. Allowances stay listed separately, outside both figures. The same applies on the page and in the PDF.
3. **Other ways into the checker.** Review every other place that sets an award:
   - the old Step 1 page
   - manual award selection
   - award recommendation
   - shift input form
   - the calculation adapter

   If any of them selects an award or skips classification confirmation, and customers can still reach it, require confirmation there. If none do, I report each path and change nothing.

## Checks
- Full signed-in journey on desktop and phone: My Reports, open a paid report, Full Report, Download PDF. This uses the test admin account. If it has no paid report, I use a test copy of a report served only inside the browser test, with all saving and payment requests blocked. Nothing in the database, payments or access changes.
- The warning appears on the result, saved report, locked teaser, Full Report and PDF, for both new and historical reports. I confirm this by reading the PDF text.
- Run all automated tests, plus new tests for the $0.00 explanation and the reconciliation check.
- Rerun the desktop and phone browser tests: award suggestions, classifications, a new result, the saved report and the payslip upload.

## Unchanged
Engine v1 formulas, Engine v2, Stripe, accounts, database records and saved calculations. Nothing is published.

## Deliverable
Test results, files changed, any remaining blockers and a release recommendation.
