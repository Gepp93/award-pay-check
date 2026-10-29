# AwardPay — Build accurate calculation engine v2 (Retail, Hospitality, Fast Food)

The audit findings (errors E1–E8: public holiday 2.5× label, flat weekend +50%, penalties applied to the whole period, casual stacking, generic overtime, newest-rate-only, invented $20/$15 allowances, unverified weekly÷38) stand. This plan builds the fix. Nothing is published, and live `/check` keeps using v1 until you approve.

## Phase 1 — Data foundation

- Confirm the award codes and current clause numbers against the official Fair Work award documents and the Fair Work Commission API: MA000004 General Retail, MA000009 Hospitality (General), MA000003 Fast Food.
- Pull classifications, pay rates (adult, junior, casual), penalties (Saturday, Sunday, public holiday, evening/late-night, overtime, casual combinations) for the 2024 and 2025 published years. Save them as dated snapshot files in the repo, with `operativeFrom`/`operativeTo` and each Fair Work record ID.
- One rule pack per award (versioned and clause-cited) covering: ordinary span of hours, overtime triggers and tiers, evening/late-night windows, which Fair Work penalty ID applies to each situation, and how overlapping penalties combine as the award text says. Rule packs hold no dollar amounts or percentages; those come only from the snapshots.
- Public holidays: a dated national + state/territory list for 2024–2026, citing each government's official holiday page. Part-day holidays (e.g. Christmas Eve or New Year's Eve evenings in SA) are marked Not assessed unless supported.

## Phase 2 — Engine v2

- New backend function `calculate-award-pay-v2`, with the pure maths in `_shared/engine-v2/` so tests can run it directly. `calculate-shift-pay` is unchanged.
- Input: award, classification, employment type, age/junior band, state, pay period start/end, dated shifts (start, finish, breaks), actual paid (optional).
- Rate selection uses the "first full pay period starting on or after `operativeFrom`" rule. If a period crosses a change date, the engine applies that rule. A missing pay period start means the item is Not assessed.
- Each shift is split into segments wherever the conditions change (midnight, evening cut-off, day type, overtime threshold). Each segment's rate comes from the award's own overlap rule, never an automatic "highest applies".
- All maths is in integer cents, using the award's rounding.
- Output: line items, each with the Fair Work record ID, clause, effective date and a plain explanation. Items it can't assess carry their reason and are left out of the assessed total. Every result is tagged with `engine: "v2"`, the rule pack version and the snapshot date.
- Strict boundaries: any other award, enterprise agreement, award-free work, or unsupported arrangement (split shifts, rosters averaged over several weeks, RDOs, allowances, leave) returns `unsupported` with an explanation. No generic estimate is ever produced.

## Phase 3 — Tests

`tests/engine-v2/<award>.test.ts`. Expected amounts come from the published Fair Work pay guide PDFs and the award clauses (cited by page or clause in each case), never from the engine. Coverage:
- full-time, part-time and casual; adult and junior
- weekday, Saturday and Sunday; public holidays in at least NSW, VIC, QLD and SA
- evening and overnight work; overtime tiers; casual penalty interactions; overlapping penalties
- historical pay periods; periods crossing 1 July
- missing or unsupported classification; missing pay period start; ambiguous payslip input

A generated `tests/engine-v2/REPORT.md` lists each case: award, level, employment type, date, hours, expected $, actual $, source, pass/fail.

## Phase 4 — Protect current users (proposal only, needs your approval)

- Audit where v1 errors reach users on `/check` and in saved reports.
- Recommended interim measure, applied only if you approve: label v1 totals "Estimate — general rules" and hide any total that includes public holiday or weekend lines.
- Existing reports are not rewritten. The report view reads them as v1 (no `engine` tag means v1).

## Phase 5 — Stop for review

Report back with:
1. what was built
2. the supported situations
3. the test report
4. failing or unsupported cases
5. the clause list
6. v1 vs v2 side-by-side examples
7. risks and assumptions
8. what's needed before AwardPay 2.0 connects

Then wait for your approval.

## Not changed

Stripe, the pass, accounts, saved reports, the database schema, security rules, live calculation routing, publishing.

## Technical notes

- Fair Work data is fetched once, while building, through a small dev script using `FWC_API_KEY` (from inside a backend function, since the key isn't available in the browser). The snapshots are committed, so tests work without the network.
- If the API leaves out a penalty the award text requires (e.g. a specific casual public holiday combination), that case stays Not assessed. Nothing is hand-entered.
- Risk: pay guide PDFs may round differently from the API's `calculatedRate`. The tests will flag any difference over 1 cent rather than adjusting expected values to match.

## Additional approved requirements

- Snapshots cover the 2024, 2025 and 2026 published years, with every operative date and rate change the API provides.
- Junior, apprentice and trainee eligibility is checked per award and per classification. If a band isn't supported, the item is Not assessed. Adult rates are never substituted, and no common age formula is assumed.
- Each result is marked `complete`, `partial` or `unsupported`. When a material entitlement is missing, the assessed subtotal is never presented as total underpayment.
- Gross pay and comparable paid amounts stay separate. Only payments matched to the assessed lines are compared, and unrelated gross is never compared or counted twice.
- Every rule and expected test value links to a Fair Work record ID, pay guide page or award clause. Expected values are never adjusted to make tests pass.
- Scope is Phases 1–3: the v2 engine, rule packs, historical snapshots, tests, the pass/fail report and v1-versus-v2 comparisons.
- The live v1 warning is not implemented; that needs separate approval. AwardPay 2.0 is not connected, nothing is enabled for customers, nothing is published.
- After that, stop and report: test results, supported scenarios, unsupported conditions, sources, risks and an implementation summary. Passing tests are not presented as proof of accuracy.
