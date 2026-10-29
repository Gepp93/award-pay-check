# AwardPay — Calculation accuracy fix plan (audit only, no code changes yet)

This plan replaces the previous "connect 2.0 to the engine" plan. That work waits until the engine is accurate (Phase 5 below).

## 1. Current calculation errors (from the `calculate-shift-pay` code)

All extra-pay maths sits in one place, `computePeriodComparison`. Only the base rate comes from Fair Work. Everything else is a fixed generic rule that ignores the award.

| # | Error | What the code does | Effect |
|---|---|---|---|
| E1 | Public holiday | Adds `hours × base × 1.5` on top of base pay, labelled "2.5x" | The total is 2.5× base. The label mixes up "extra amount" and "total". Retail and hospitality permanent staff get 225%, so this overstates what is owed. |
| E2 | Weekend | One `workedWeekend` flag adds +50% for both Saturday and Sunday | Saturday and Sunday are never told apart. Retail Saturday is 125% and Sunday 150%; hospitality Saturday 125% and Sunday 150%. |
| E3 | Penalty scope | Weekend and public holiday extras apply to all `totalHoursPaid` in the period | One Saturday shift makes every hour in the period count as weekend work. |
| E4 | Casual loading | +25% on ordinary hours only, with weekend and public holiday added on top | Many awards set specific casual weekend rates instead (e.g. retail casual Sunday 175%). Stacking the two double-counts. |
| E5 | Overtime | Daily trigger of 7.6 hours (8 for casuals), then 1.5× for 2 hours and 2× after, the same for every award | Ignores weekly, roster and span-of-hours triggers, Sunday or public holiday overtime rates, and casual overtime rules. |
| E6 | Effective date | Sorts rates by `operative_from` and takes the newest | Past pay periods are checked against today's higher rates, which overstates what is owed. |
| E7 | Invented allowances | `droveOwnCar` adds $20 and `workedOver10Hours` adds $15 | These are hard-coded amounts, not Fair Work data. |
| E8 | Weekly rate fallback | Weekly rate ÷ 38 | Fine for most awards, but not verified for each award. |

**Reproducible public holiday example (E1).** Retail permanent, base $26.55/h (illustrative), 8 hours on a public holiday:
- The engine gives base $212.40 + extra $318.60 = $531.00 (2.5×).
- The award rate is 225%, which gives $477.90.
- So the engine overstates by $53.10, and the label is misleading as well.

**Correction.** Take the percentage for that award, level and employment type from Fair Work's penalties data. Apply it as a total multiplier to the hours actually worked on that day. Show it as "225% of $X".

## 2. What the Fair Work rates service provides

The live Fair Work Commission API (already connected through `FWC_API_KEY`) has these endpoints: `/awards`, `/classifications`, `/pay-rates`, `/penalties`, `/wage-allowances`, `/expense-allowances`. Fields come from the official data dictionary.

- **Rates by level:** `baseRate` and `calculatedRate` with their rate types (hourly, weekly, casual hourly), plus `employeeRateTypeCode` (adult, junior, apprentice).
- **Penalties:** `penaltyDescription`, `rate` (%), `penaltyCalculatedValue`, linked to a clause and classification. This covers "most penalty rates, overtime and casual rates": Saturday, Sunday, public holiday, overtime tiers and casual combinations, as described text plus a percentage.
- **Allowances:** amounts, `paymentFrequency`, and an `isAllPurpose` flag.
- **Dates:** `operativeFrom` and `operativeTo` on each record, plus `publishedYear`. Rates apply from the first full pay period starting on or after `operativeFrom`.

**What it does not provide** (needs the award text, a curated rule per award):
- When overtime starts (daily, weekly or roster-based)
- Span of ordinary hours and shift definitions (e.g. after 7pm or 10pm)
- Minimum engagement periods and break rules
- Eligibility conditions for allowances
- RDO arrangements
- Which penalty applies when several overlap

**Approach:** amounts and percentages come from the service. The rules for when each one applies are curated for each award, with the award clause cited.

## 3. Proposed architecture

```text
Fair Work API ──> rate snapshot (by award, level, operative dates)
                       │
Curated rule pack (per award, clause-cited, version-tagged)
  - ordinary span, overtime triggers, penalty selection order
  - maps each situation -> Fair Work penalty ID (no hard-coded %)
                       │
Engine v2 (new function, pure maths, cents)
  input: award, level, employment type, age type, pay period dates,
         dated shifts (start, finish, break, public holiday flag), actual paid
  per hour segment: pick ONE applicable rate (highest-applies rule),
         never stack loading + penalty unless the award says so
  output: line items with a source (penalty ID, clause, operativeFrom),
          plus "not assessed" items with a reason
```

- **Versioning:** each result records `engine_version` ("v1-generic" or "v2-<award>-<rulepack date>") inside the existing `reports.result` record. There is no database schema change, and old reports stay labelled as v1.
- **Unsupported situations:** if there is no rule pack for an award, or something isn't covered, that line is marked "not assessed". The engine never falls back to a generic multiplier.
- **Rate changes inside a pay period:** each shift date gets the rate set that was in force for its pay period, using the full-pay-period rule. If a period crosses a change date and the period start is unknown, the engine asks for it rather than guessing.

## 4. Recommended first awards

Start with three awards that have high demand, clear penalty tables, and mostly shift-based rules:

1. **General Retail (MA000004)**
   - Supported: ordinary, Saturday, Sunday, public holiday, evening penalties after 6pm on weekdays (a published table), casual combined rates, overtime 150%/200%.
   - Needs from the user: dated shifts, employment type, age/junior, pay period dates.
   - Not supported: rosters averaging over several weeks, allowance eligibility beyond flags.
2. **Hospitality (MA000009)**
   - Supported: Saturday, Sunday, public holiday, late-night loadings, casual rates, overtime.
   - Needs from the user: the same as retail, plus whether they are a "managerial staff" level.
   - Not supported: meal credit and live-in arrangements, tips.
3. **Fast Food (MA000003)**
   - Supported: ordinary, weekend, public holiday and late-night rates, casual rates, overtime.
   - Not supported: split-shift and delivery allowances, at first.

Construction (MA000020) and Nurses (MA000034) come later: RDOs, industry allowances and roster averaging need much more curation. Every other award shows "estimate, not award-specific" or "not assessed".

**Before launch, each award needs:** about 15 hand-worked cases (listed below) that pass to the cent against the official Fair Work pay guide for the same date.

## 5. Testing strategy

Each case is a fixture in `tests/engine-v2/<award>.test.ts`, recording:
- award and level
- employment type
- date
- shifts
- expected cents
- source (the Fair Work pay guide PDF and page, plus the clause)
- actual result, and pass or fail

Coverage for each award:
- ordinary weekday
- Saturday and Sunday
- public holiday
- casual Saturday, Sunday and public holiday
- evening or late-night
- weekday overtime, both tiers
- a junior
- a shift before and after 1 July in a rate-change year (two years of rates)
- a pay period crossing the change date
- a missing level, which gives "not assessed"
- an unsupported award, which gives "not assessed"

The Fair Work responses are recorded as fixtures, so the tests are repeatable without live calls. A separate report compares v1 against v2 to show how much old results differ.

## 6. Safe migration

1. Build v2 as a new backend function. `calculate-shift-pay` (v1) stays untouched.
2. Run v2 in shadow mode on test fixtures only. Live `/check` keeps using v1.
3. You review the pass/fail table.
4. After your approval, switch the 2.0 flow (and later `/check`) to v2 only for supported awards, behind one setting.
5. Saved reports show their engine version. v1 reports get a note: "calculated with an earlier general method".

Payments, the pass, saved reports, the database and security rules are all unchanged.

## 7. Phases and effort

| Phase | Work | Effort |
|---|---|---|
| P1 | Pull and record Fair Work penalties and rates for the three awards across two published years; map penalty IDs | Medium |
| P2 | Engine v2 core: dated rate selection, splitting shifts by hour, one rate per segment, line items in cents | Medium–high |
| P3 | Rule packs for retail, hospitality and fast food, with clause citations | High (accuracy-critical) |
| P4 | Tests (about 45 cases) and the v1-vs-v2 comparison report | Medium |
| P5 | Connect 2.0: award and level confirmation, follow-up questions, real results screen, existing save, paywall and PDF | Medium |
| P6 | Switch over, after your approval | Low |

**Remaining risks:**
- Choosing the wrong award or level.
- Enterprise agreements and award-free workers can't be assessed.
- Fair Work API gaps or bad records.
- Users don't provide dates for weekend and public holiday hours.
- State-specific public holidays.
- RDOs and averaging stay unsupported at first.

## What AwardPay can reliably calculate after v2

- **Can:** shift-based ordinary, weekend, public holiday, evening and overtime pay, plus casual rates, for the three supported awards, against the rates in force on the shift date.
- **Cannot (labelled "not assessed"):** other awards (estimate only), enterprise agreements, award-free work, RDO accrual, roster averaging, allowance eligibility beyond simple flags, leave, super.

The hard-coded $20/$15 allowances (E7) will be removed from v2. Until v2 is switched on, live `/check` keeps them.
