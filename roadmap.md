# Roadmap — AwardPay 2.0 Full Industry and Award Engine Expansion

Preview-only. Engine v2 stays admin-only. No changes to Engine v1, Stripe, auth, DB records or saved reports. No publishing without explicit approval.

## Batch 1 — Construction (MA000020) + Electrical (MA000025) [in progress]
- [x] Verify award names/status/coverage via Fair Work API (both current, consolidated to 1 Jul 2026)
- [x] Download official pay rates, penalties, wage allowances (2023–2026)
- [x] Read award texts: MA000020 cl 12/16/18/29/30; MA000025 cl 11/13/14/20
- [x] Cross-check API rates against award text rate tables (CW1a $26.67, EW5 $29.45 verified)
- [x] Extend snapshot builder: award args + inline penalties (MA000020 has no penalty records in the Fair Work pay database — percentages sourced from award text, dated and cited)
- [x] Engine: weekend-is-overtime awards (null ordinary Sat/Sun), Saturday-noon rule (MA000020 cl 30.1(b)), RDO accrual handling (cl 16.2), inline penalty lookup
- [x] Rule packs: CONSTRUCTION + ELECTRICAL with clause citations
- [x] Hand-worked test cases C1–C14, E1–E11; X1 moved to MA000010 (MA000020 now supported)
- [x] Coverage registry (supported/partial/unsupported per award and scenario) + admin-only /v2/coverage page
- [x] Frontend: both awards added to the v2 award step (model.ts AWARDS)
- [x] Full test suite green (189 tests) + REPORT.md regenerated
- [x] AGENTS.md updated (inline-penalties exception)

## Batch 2 — Restaurant (MA000119), Clubs (MA000058), Pharmacy (MA000012), Hair and Beauty (MA000005) [done]
- [x] Official data verified and snapshotted (2023–2026 rates, penalties, allowances; all four have pay-database penalty records — no inline transcription needed)
- [x] Award texts read and cited (ordinary hours, penalty tables, overtime, breaks, minimum engagements)
- [x] Engine extensions: Saturday/Sunday time-of-day bands, per-day overtime tier rates
- [x] Four rule packs with clause citations; registered and selectable in the admin preview
- [x] 40 hand-worked cases (R1–R11, K1–K9, P1–P10, H1–H10) incl. historical rates, boundary and negative tests
- [x] Coverage registry updated; admin-only /v2/coverage shows all nine awards
- [x] End-to-end: deployed function returns exact hand-worked amounts for Construction, Electrical and Pharmacy cases (validator fixed to pass rdoAccrual through)
- [x] Full suite green (229 tests), typecheck clean, build OK; Engine v1, Stripe, auth, customer data untouched; nothing published

## Batch 3 (revised, cost-efficient) — one award per uncovered homepage industry [done]
- [x] MA000018 Aged Care (Healthcare) — award-text inline penalties (no DB records); Sat/Sun ordinary, OT tiers, casual OT, PH 250%/275%, ADO accrual via RDO mechanism
- [x] MA000120 Children's Services (Education) — inline penalties; weekend = overtime; casual weekend/PH Not assessed (no casual rates in award text)
- [x] MA000010 Manufacturing — DB penalties; day workers Mon–Fri 6am–6pm; weekend = overtime; OT 150%/200% (3h tiers); casual OT supported
- [x] MA000038 Road Transport — DB penalties; transport + distribution facility streams (penaltyGroup overrides); Sat/Sun ordinary penalties; Good Friday/Christmas Day distinct PH rates; oil distribution + shiftworkers excluded
- [x] MA000028 Horticulture — DB penalties; casuals any day 125%; FT/PT weekend = overtime; flat 150% OT (tierMinutes 0); Sunday OT Not assessed (harvest season)
- [x] Engine extensions: publicHolidayGfcd, nullable publicHoliday refs, penaltyGroup overrides, flat-OT label, generalized unpriced-day message
- [x] 20 hand-worked cases (AC1–4, CS1–4, MF1–4, RT1–5, HO1–4); full suite 250 green; typecheck clean
- [x] Coverage registry + award discovery + model.ts AWARDS updated; all 8 homepage industries now have a supported award
- [x] Temporary fwc-fetch-raw function deleted after snapshot download

## Later batches (not started)
- Further award batches paused by owner; no expansion during launch audit.

## Customer launch-readiness audit
- [x] Audit homepage → confirmed award/classification → scanner/manual → Engine v2 → itemised results → paid report (v2 paid reports absent; launch blocker documented).
- [x] Real owner/admin browser tests with six synthetic payslips; desktop/mobile, Partial/Unsupported, live signed-out gate and anonymous function rejection. Signed-in non-admin remains unverified without an authorised account.
- [x] Audit existing Stripe and proposed $9/$29/$59 products without changing checkout or entitlements; new Price IDs and product semantics require future approval/configuration.
- [x] Full suite 250 passing; latest preview build OK. Ranked NO-GO report: tests/v2/LAUNCH-READINESS-AUDIT.md. No publication or application changes.

## Three-tier pricing and payment safeguards — preview only
- [x] Exact $9/$29/$59 Payment Links and 2.0 preview offers; public $30 flow preserved until publication approval.
- [x] Additive protected purchases, recurring entitlements and authoritative v2 saved reports; legacy records untouched.
- [ ] Complete server verification, idempotent isolated webhook, renewal/cancellation/refund handling and owner access.
- [x] Explicit eligibility, RDO/ADO questions and Complete-only report sales; keep engine formulas/private access.
- [x] Automated security/entitlement tests (298 pass) and authenticated desktop/mobile locked-report checks; tests/TIER-PAYMENT-READINESS.md records PASS/FAIL and remaining limitations.
- [ ] Paid report/PDF access and real database concurrency verification (approved isolated paid fixture required).
- [ ] Stripe destination must include customer.subscription.updated and charge.dispute.created (owner configuration required).
- [ ] Real paid checkout → webhook → report/PDF and renewal/refund delivery verification (separate payment approval required).
- [ ] Confirm partial-refund/dispute restoration policy and signed-out customer launch journey; implement recovery/return flow after decisions. No publication.
