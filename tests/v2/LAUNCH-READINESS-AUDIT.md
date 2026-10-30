# AwardPay 2.0 — Customer launch-readiness audit

**30 October 2026 · Recommendation: NO-GO for replacing the public checker with Engine v2.**

The public website and existing $30/90-day checker can stay as they are. The 14-pack Engine v2 remains an internal test product, not a complete paying-customer journey. No application code, calculation rules, deployed functions, Stripe settings, accounts, customer records or entitlements were changed during this audit. No publication or payment was initiated. Further award expansion is paused.

## Verified results

| Synthetic payslip | Browser / format | Real scanner and function | Result | Assessed items |
|---|---|---|---|---|
| Construction MA000020 | Desktop 1280px / PDF | Both HTTP 200 | Partial; no headline underpayment | $213.36 |
| Aged Care MA000018 | Desktop 1280px / JPG | Both HTTP 200 | Partial; no headline underpayment | $216.53 |
| Manufacturing MA000010 | Desktop 1280px / PNG | Both HTTP 200 | Complete | $235.60 |
| Road Transport MA000038 | Mobile 390px / JPG | Both HTTP 200 | Complete | $214.96 |
| Horticulture MA000028 | Mobile 390px / PNG | Both HTTP 200 | Complete | $211.52 |
| Children's Services MA000120 | Mobile 390px / JPG | Both HTTP 200 | Complete | $243.53 |

These were six separate, authenticated owner/admin browser journeys using generated, clearly labelled synthetic documents and the actual deployed reader/calculator, not mocked calculation responses. Each document had one ordinary earnings line. Users explicitly chose award, classification, employment, rate category, state, roster facts and actual shift times. Classification/job-title extraction varied; the audit typed the known synthetic job title at discovery where necessary. No award was automatically selected in any journey; classification started unselected. The scanner confirmation button was disabled until checked. No page exceptions or page-width overflow were observed in these six journeys. Screenshots of scan confirmation, results and Unsupported were inspected.

The Children's Services document printed $243.52 gross/ordinary pay because the synthetic generator rounded a half-cent down; the independently expected award amount is $243.53. Its one-cent potential difference is therefore a fixture rounding difference, not evidence of a real underpayment or scanner error.

- Full existing automated suite rerun twice: **250 passed, 0 failed, 1,324 assertions, 12 files**. No extra award packs or formula changes.
- Latest preview diagnostic: **build OK**, 30 October 2026 02:15:38 UTC. No manual build/typecheck was run.
- All eight public homepage cards exercised on desktop and mobile, then through manual-entry start: seven retained the exact industry; Agriculture correctly retained no industry instead of substituting another. Every handoff left the award unselected. The query disappears intentionally after being consumed (`GuidedCheck.tsx:94–97`).
- Anonymous deployed Engine v2 request: **401**. Authorised owner/admin requests: **200**. Cross-award classification ID: **Unsupported**, null underpayment. Unknown award through real questions: **Unsupported**, no headline amount, clear reason and change-answer option.
- Read-only live-domain signed-out checks denied `/v2`, `/v2/check`, `/v2/upload`, `/v2/questions`, `/v2/results`, `/v2/coverage`, `/v2/sign-in`.

## Ranked blockers and minimum changes

### Critical — eligibility uncertainty can still produce a Complete monetary result

`EngineQuestions.tsx:73–75, 127–129` permits “I'm not sure” about an enterprise agreement. `engine/model.ts:176` sends a flag only for **yes**, discarding **unknown**. Reproduced through a complete real manual browser journey: Manufacturing C10, $200 ordinary pay, uncertain enterprise agreement → **Complete / Potential underpayment $35.60**. The pure adapter/engine reproduction agrees. This is an eligibility hole, not solved by a disclaimer.

The questionnaire also never collects/sends `shiftworker`, although the engine has a rejection flag (`engine.ts:187–192`, wrapper `index.ts:43–46`). It lacks confirmed daily-hire, piecework, oil-distribution and other pack-scope exclusions. The presence of a pack or a day-shift-looking payslip does not confirm eligibility for its day-worker rules.

**Minimum:** collect explicit applicable-scope facts before calculation. Unknown enterprise-agreement coverage must block reliable award comparisons or be represented to the server as unresolved; explicit excluded cases must be Unsupported. Add concrete adapter, server and real-browser regression cases before release. Keep formulas unchanged.

### Critical — no Engine v2 paid-report journey exists

`Results.tsx:15–20, 52` shows an in-browser result and explicitly disables reports/passes. `store.tsx:26–35` stores answers and results in session storage; `calculate-award-pay-v2/index.ts` is a pure non-persisting calculation wrapper. There is no authenticated v2 result → stored v2 report → checkout → entitlement → Full Report/PDF path. Existing Full Report expects the legacy result shape.

**Minimum:** create an authoritative, server-produced, versioned v2 report/request snapshot associated with a trusted purchase reference; render its assessment status, exclusions, sources and itemisation in saved report and PDF; enforce owner/report access and idempotent verified-payment unlocking. Preserve legacy records and rights. Never sell or save a client-provided result as authoritative. Decide what a Partial deliverable includes; Unsupported should not proceed to a misleading paid-underpayment report.

### High — RDO/ADO confirmation exists in the engine but not the questions

Construction and Aged Care both reached Partial because the actual required day-off arrangement was never asked. `EngineDraft`, `stepsFor` and `buildRequest` have no RDO answer; the deployed wrapper already accepts `arrangement.rdoAccrual` (`index.ts:30`). The results explain the missing fact but provide no direct answer control for it.

**Minimum:** one award-specific confirmed day-off-arrangement question, mapped to the existing engine field; yes/no/unknown browser and adapter tests. No rate/formula rewrite.

### High — scanner loses earnings detail and conflates classification with role

All six scans correctly read the printed dates, hours, employment type, base rate, ordinary amount and gross. Confirmed dates/employment/ordinary earnings/gross transferred into questions after mount effects settled. Missing overtime/weekend/allowance fields remained blank, not fabricated zeroes.

However `payslipFields.ts:40–64` collapses line items into aggregate fields and uses one `classification_or_role` string as job title. Four packs returned classification-only text rather than the separately printed job title; Horticulture combined the two. Printed award text is displayed but not used as a separate confirmed discovery hint. Separate Saturday/Sunday lines become one weekend amount; line hours, labels and total-vs-loading structure are not preserved. `prefillFromPayslip` does not create roster shifts from printed dates/times, and ordinary hours/base rate are not transferred as engine shift/rate evidence. This does **not** justify inferring a roster or classification: actual times and award classification need explicit confirmation.

**Minimum:** retain tagged editable earnings rows, hours, separate job-title/classification/award text and total/loading basis through confirmation; retain all printed lines exactly once. Keep award/classification as explicit user choices. Use printed roster only when present and confirmed; otherwise explain that hours totals cannot establish overtime and ask for times. Clear/reconfirm stale scan-derived fields when replacing a payslip (`model.ts:110–115` currently prefers prior nonempty values).

### High — proposed products and annual entitlement are not configured

Current offer is **A$30 one-time / 90 days**, `src/lib/plans.ts:1–7`. Current documented live Price ID is `price_1SqoeLK62CSHwnHJANeHUhC1`; checkout code uses the corresponding Payment Link, not an explicit Price-ID call. This audit did not independently query Stripe configuration or open checkout because `startSubscriptionCheckout` inserts a pending purchase row (`paymentLinks.ts:24–48`), forbidden by this audit's no-record-change constraint.

Required new Stripe Prices — **actual IDs do not exist in the inspected configuration and must not be invented**:

| Proposed product | Required Price configuration | Required entitlement decision |
|---|---|---|
| AwardPay — Pay Check | AUD 900 cents, one-time; new real `price_…` ID | One confirmed check/report reference; define what access/download it includes and any upgrade credit |
| AwardPay — Underpayment Report | AUD 2,900 cents, one-time; new real `price_…` ID | One identified detailed report; define upgrade from Pay Check and Partial report policy |
| AwardPay — Pay Protection | AUD 5,900 cents, yearly recurring **if auto-renewing**; otherwise one-time annual access | Confirm auto-renewal vs fixed annual access, included checks/reports, cancellation, expiry, renewal, refund/dispute policy |

No products/prices were created. Do not repurpose existing $30/legacy Price IDs. Annual access must not silently inherit old `yearly_access` semantics.

Current pass fulfillment is signature-verified, stored-product-based and transactional, with purchase/advisory locks, repeat-paid no-op, expiry extension and linked-report unlock (`stripe-webhook/payment.ts:11–25`; `drizzle/migrations/0001_pass_existing_account_and_legacy_access.sql:1–24`; service-only grants in `0002_harden_paid_access.sql`). Preserve that behavior, including paid-AUD promo/tax handling. Do not wrongly apply the legacy amount-routing concerns to this pass branch.

**Minimum:** additive product keys and protected entitlements; configured trusted product/Price mapping, report association and atomic fulfillment; subscription renewal/failure/cancellation events if recurring. The existing handler only dispatches `checkout.session.completed`; it cannot maintain a recurring annual subscription. Test duplicate sessions, concurrent/repeated deliveries, delayed payment, guest claiming, upgrades and expiry without charges. Keep current $30 and historical rights intact. Separately review the legacy report fallback's amount routing and nontransactional credit update (`payment.ts:28–42`); do not extend that branch to the new tiers.

### High — public routing is intentionally still v1, and coverage marketing exceeds v2 scope

Public `/` → industry → `/check` remains Engine v1. Six v2 browser journeys started at the admin upload page with an industry-only browser fixture; they do **not** establish a public end-to-end v2 paid journey. `publicSite.ts:9–24`, `App.tsx:54–97`. Agriculture lacks an exact v1 industry and is not substituted.

V2 excludes allowances, leave/loading, superannuation, termination and missed-break penalties even when ordinary pay status is Complete. Existing homepage/offer promises include supported allowances (`Home.tsx:48, 175–176`, `plans.ts:10–12`). Fourteen packs do not mean all workers in eight industries are supported: shiftwork, junior/apprentice/trainee rates, unlisted classifications, piecework and conditional rates remain exclusions.

**Minimum:** after safety/report/payment work and separate approval, connect a customer path to the hardened v2 function without opening internal tester routes. Align product copy and “Complete” scope with assessed wage items; clearly identify exclusions before payment. Unsupported roles must stop rather than be mapped to a related-looking pack.

### Medium — host gate and preview data lifecycle need a release decision

`V2Gate.tsx:6–16` performs role checks only on enumerated live hosts. Localhost/preview hosts intentionally allow pages without an admin account. Server calculation remains protected, but this is not “all preview pages admin-only.” Custom host aliases need default-deny consideration. `store.tsx:35` persists confirmed employer/earnings/result values in session storage (not the image); reconcile privacy copy with that actual lifecycle. This audit did not verify AI-provider/workspace retention policies.

**Minimum:** keep the calculator server gate until launch approval; define fail-closed internal-route behavior across hosts while preserving authorised tester access; disclose/limit answers/result retention and clear sensitive state on appropriate lifecycle events. Do not change account roles to test restrictions.

## Partial / Unsupported safety conclusion

Observed Construction/Aged Care Partial screens have an explicit limitation, no headline underpayment and assessed-item subtotals labelled **not a total entitlement**. Unknown award and mismatched classification return Unsupported with no amount. Category differences explicitly warn that offsets and unassessed items prevent a total underpayment claim (`Results.tsx:41–59, 78, 105–110`). These protections work for tested paths, but cannot compensate for missing eligibility facts incorrectly yielding Complete. Any future saved report/PDF must preserve the same status rules.

## Untested / evidence limits

- No new paid report, completed payment, webhook delivery, purchase row, refund, renewal or existing entitlement was created/changed. V2 paid report/PDF remains unavailable, not merely untested.
- No real payslips; HEIC and multipage extraction were not rerun. Current reader uses only the first PDF page. Six scanner cases were ordinary-only, not a comprehensive overtime/weekend/loading extraction benchmark.
- No separately authorised non-admin signed-in account was available: live signed-out route rejection and anonymous server 401 were tested; authenticated non-admin 403 remains source-audited, not freshly browser-verified. Owner/admin calculations were verified in localhost preview, not by injecting credentials into the live domain.
- Six awards were divided across desktop/mobile, not each tested at both sizes. All eight homepage handoffs were tested at both sizes. No new official-source or independent legal review was commissioned.
- The suite is green despite the reproduced enterprise-agreement hole: the missing eligibility rule needs a new failing regression and targeted fix, not another broad rebuild.

**Release order:** resolve eligibility and mapping holes → add RDO/ADO question → implement authoritative saved report/PDF → decide/configure three products and protected fulfillment → verify real paid/report/renewal paths with separately approved safe fixtures → approve customer routing switch. Keep public v1 and the $30 pass unchanged until then.

## Audit changes only

- Added this report: `tests/v2/LAUNCH-READINESS-AUDIT.md`.
- Updated `roadmap.md` to pause expansion and mark audit completion.
- Recorded owner audit constraints in project memory; no application files edited.
- Browser scripts, synthetic documents, screenshots and raw synthetic evidence remain temporary under `/tmp/browser/launch-audit/`; no tokens or real customer data included in this report.