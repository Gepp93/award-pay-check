# AwardPay 2.0 — Connect the payslip scanner to real calculations

## Audit: what exists today

**Where the maths happens.** All pay maths runs in one backend function, `calculate-shift-pay`, which checks one shift per call. The live `/check` flow uses an adapter (`src/features/check/calculate.ts`) that calls it once per shift and adds up the results. There is no second engine, and none will be added.

**Where rates come from.** Rates come live from the official Fair Work Commission API, using the `FWC_API_KEY`:
- `get-awards`, `get-classifications`, `get-pay-rates` and `get-allowances` look up awards, levels, rates and allowances.
- Inside the engine, rates are fetched straight from the API and the row with the newest `operative_from` date is used.
- The `awards` table only stores the SEO pages. It is not used for any calculation.

**Award and level.** The live guided checker suggests awards from the person's role and industry keywords, and they must confirm. They then pick a level, or choose "unsure". In "unsure" mode the engine gives a range across the likely levels.

**Employment type.** Casuals get a 25% loading on base hours, and their overtime starts after 8 hours instead of 7.6.

**Overtime and penalties.** These use generic rules:
- Overtime: 1.5× for the first 2 hours, then 2×.
- Weekends: a flat 50% extra on both days.
- Public holidays: computed as 1.5× while the label says "2.5×".
- In payslip-hours mode, the printed 1.5× and 2× hours are compared directly.

**Allowances and RDOs.** About 30 condition-based rules flag possible allowances, such as meal and tool allowances, from the official list. These are flagged, not costed into the total. There is no RDO calculation.

**Effective dates.** The newest rate is always used, whatever the pay period date. There is no historical rate selection.

**Saving results.** The `reports` table stores inputs, the result and the owed amount. Guests save unowned reports, signed-in users save their own, and `claim_my_passes` links guest reports to accounts later.

**PDF.** `FullReport.tsx` builds the PDF in the browser. A backend `generate-pdf-report` function also exists.

**The $30 pass.** `subscription_purchases` plus `unlock_report_with_pass` set the report to paid. `LockedTeaser` hides the details until then, while the headline result stays visible.

**What the 2.0 screens are missing.**
- Only hours and rate carry forward from the scan.
- There is no award or level step.
- There is no call to the engine.
- `/v2/results` is static.
- There is no saving, paywall or PDF.

## Major accuracy risks (in the existing engine)

1. Overtime and penalty multipliers are the same for every award. Real awards differ: retail Sunday is 150%, hospitality Saturday 125%, construction is different again.
2. Saturday and Sunday both get +50%.
3. The public holiday maths does not match its label.
4. Pay periods in the past are checked against today's rates.
5. A daily 7.6-hour overtime trigger ignores weekly and roster-based overtime rules.
6. Allowances are suggested, never valued.

The engine is "verified rates, approximate rules". The 2.0 results will say this plainly. Fixing these rules means changing the production engine, so it is a separate decision for you (see Decision below).

## Implementation (frontend adapter only)

1. **Carry the scan forward.** Store every confirmed scanned field in the 2.0 session store (answers only, no image): employer, pay period, employment type, rate, ordinary, overtime, weekend, public holiday, allowances and gross. Each field keeps its source tag. Missing stays missing, never zero.
2. **Confirm award and level.**
   - A new 2.0 step ranks award suggestions from industry plus role, using the same curated matching as `/check`. The person must confirm.
   - The level is picked from `get-classifications`, or "I'm not sure", which shows a range.
   - Options for "enterprise agreement", "award-free" and "don't know" stop the award assessment with an explanation.
3. **Ask only what is missing.** Short questions cover only what the engine needs and the payslip lacked: employment type, pay period dates, and which days the weekend or public holiday hours fell on (needed to split hours). If hours can't be split reliably, that item is marked "not assessed".
4. **Calculate.** Map the answers into the existing `calculateAnswers` contract (payslip-hours mode with printed 1.5× and 2× buckets, and actual gross). Penalty lines are tagged so nothing is counted twice. No rates are written into the code.
5. **Real results screen** (`/v2/results`) shows:
   - the confirmed award and level, and the assessment period;
   - the components assessed, the award minimum, and the itemised differences;
   - the total only when it can be reliably calculated, otherwise a range or "can't assess";
   - the rate source (FWC API, with the date the rate applies from);
   - missing information and exclusions: allowances flagged only, no RDO, and a note that historical rates aren't applied when the period is before the rate's date;
   - "How we calculated this", plus Edit links.
6. **Payments and reports.** Save the report through the same insert the live flow uses. The headline is visible; the detailed lines reuse `LockedTeaser` and `ReportIncludes`; the existing pass checkout is unchanged. Paid users see `FullReport` and the PDF. No changes to pricing or Stripe.
7. **Tests.** Adapter tests with in-memory engine stubs cover the 9 scenarios you listed. The expected answers will be worked out by hand from the published Fair Work pay guides and listed next to the engine's output. Where the engine's generic rules disagree (risks 1–5), the test records the gap instead of hiding it. I'll also run one browser walk-through: Industry → Upload → Review → Award → Questions → Results → locked or unlocked report. Live checkout and database writes are stubbed.

## Decision needed

Should I also fix accuracy risks 1–5 in the production engine?
- **(a) Leave the engine untouched.** The 2.0 results clearly label weekend, public holiday and overtime as estimates using general rules.
- **(b) Separate approved phase.** Add award-specific penalty tables and historical rate dates. This changes live `/check` results too.

The default is (a).

## Not changed

Database schema, security rules, auth, Stripe, live `/check`, production data. Nothing is published.
