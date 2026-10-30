# Roadmap — AwardPay 2.0 Full Industry and Award Engine Expansion

Preview-only. Engine v2 stays admin-only. No changes to Engine v1, Stripe, auth, DB records or saved reports. No publishing without explicit approval.

## Batch 1 — Construction (MA000020) + Electrical (MA000025) [in progress]
- [x] Verify award names/status/coverage via Fair Work API (both current, consolidated to 1 Jul 2026)
- [x] Download official pay rates, penalties, wage allowances (2023–2026)
- [x] Read award texts: MA000020 cl 12/16/18/29/30; MA000025 cl 11/13/14/20
- [x] Cross-check API rates against award text rate tables (CW1a $26.67, EW5 $29.45 verified)
- [ ] Extend snapshot builder: award args + inline penalties (MA000020 has no penalty records in the Fair Work pay database — percentages sourced from award text, dated and cited)
- [ ] Engine: weekend-is-overtime awards (null ordinary Sat/Sun), Saturday-noon rule (MA000020 cl 30.1(b)), RDO accrual handling (cl 16.2), inline penalty lookup
- [ ] Rule packs: CONSTRUCTION + ELECTRICAL with clause citations
- [ ] Hand-worked test cases C1–C9, E1–E9; update X1 (MA000020 no longer unsupported)
- [ ] Coverage registry (supported/partial/unsupported per award and scenario) + admin-only /v2 page
- [ ] Frontend: add both awards to the v2 award step
- [ ] Run full test suite + regenerate REPORT.md
- [ ] Update AGENTS.md (inline-penalties extension)

## Later batches (not started)
- Batch 2: Hospitality MA000119, MA000058; Retail MA000012, MA000005
- Batch 3: Healthcare MA000034, MA000027, MA000018, MA000100
- Batch 4: Manufacturing MA000010, MA000073, MA000089; Transport MA000038, MA000039, MA000063, MA000015
- Batch 5: Agriculture MA000035, MA000028, MA000090, MA000114; Education MA000120, MA000076, MA000077, MA000075
- Batch 6: MA000036, MA000029; cross-industry integration; full regression; coverage review
- Payslip scanner → Engine v2 prefill integration (supported cases)
