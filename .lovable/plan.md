# Engine v2 — Independent Accuracy Verification and Safety Fixes

Scope: engine v2 only (`_shared/engine-v2`, its tests and report). v1 checker, Stripe, accounts, saved reports, database, AwardPay 2.0 frontend untouched. Nothing published.

## 1. Re-derive all 42 cases from official sources
- For each case, recompute the expected amount by hand from the official Fair Work pay guide / award clause (Retail MA000004, Hospitality MA000009, Fast Food MA000003), not from the engine or prior expectations.
- Record per case: award, classification, employment type, operative date and rate, ordinary/penalty conditions, overtime clause, expected dollars, source URL + clause/page.
- Mark each case "Source-verified" or "Could not verify" (with reason). No claim of human audit.
- Where a source contradicts the engine, fix the rule pack and note the correction.

## 2. Breaks
- Remove any automatic break deduction. If a break affects pay and its duration/timing is missing, result becomes Partial with a clarification request ("Enter break length and start time").

## 3. Overtime detection
- Implement only triggers derivable from dated shifts: daily maximum ordinary hours, outside span of hours, weekly 38h for full-time where the week is complete, casual/part-time triggers per award clause.
- Triggers needing roster cycles, averaging or agreed part-time hours: ask for them or return Partial.
- Hours are never assumed ordinary because the payslip lacks an overtime label.

## 4. 2026 public holidays
- Build a dated holiday table from each state/territory government calendar (2024–2026), with source links.
- National and state-wide days supported; regional days (e.g. show days) require location confirmation; part-day holidays (Christmas Eve / NYE evenings in SA, etc.) supported only where the hours rule is implemented, otherwise Partial.

## 5. Actual-pay comparison audit
- Compare by category (ordinary, penalties, overtime, casual loading, allowances) where the payslip splits them; gross only when nothing else is available, and labelled as approximate.
- Guard against double-counting ordinary pay or casual loading; allowances never offset wages.
- Missing paid categories → Partial, never a complete underpayment figure.
- Worked examples: correctly paid, underpaid, overpaid component.

## 6. New regression tests
Missing break times, unlabelled overtime, weekly overtime, midnight crossing, historical rate changes (pre/post 1 July), regional and part-day holidays, correctly paid, overpaid components, missing actual pay, Partial results. Expected values from official sources wherever possible.

## 7. Final report (then stop for approval)
Verified count and failures, sources, corrections, unsupported scenarios, limitations, complete vs partial examples, and a frontend-readiness verdict. Updated in `tests/engine-v2/REPORT.md`.
