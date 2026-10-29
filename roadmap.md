# Engine v2 (Retail, Hospitality, Fast Food) — Phases 1–3
- [x] Fair Work snapshots (pay rates, penalties, wage allowances; published years 2023–2026) and official public holidays (2024–2025)
- [x] Clause-cited rule packs, integer-cent engine, complete/partial/unsupported output, gross vs comparable pay
- [x] 42 hand-worked cases + rules tests, REPORT.md and v1-vs-v2 comparison
- [ ] Owner review of results; approval needed before connecting AwardPay 2.0, enabling v2 or adding the v1 warning
- [ ] 2026 public holiday list: no official national dataset yet (users must confirm holiday dates for 2026)

# Phase 8 guided-flow polish
- [x] Fast reader-outage fallback (429/unavailable: one request), keyword award matching and tagged printed penalty-hour roster defaults.
- [x] Casual/part-time shortcuts, monthly typical-week paid-share comparison and mobile sticky actions with safe-area padding.
- [x] Exact paywall copy verified; no advertised free wording (internal unpaid-status values retained). Nine stubbed guided/reader paths and 28 unit tests passed; 390px chips/inputs/actions verified; preview build OK. No live writes or charges.

# Phase 7 payment security and reader diagnosis
- [x] Harden paid-access policies, triggers and function privileges; role-based SQL checks passed and all fixtures rolled back.
- [x] Diagnose one deployed synthetic reader call: HTTP 429 reader_unavailable, logs confirm OpenAI returned 429; origin guard passed. Published bundle lacks Phase 6 markers.
- [x] Handle discounted/taxed pass checkouts and legacy yearly purchases; 12 webhook and 4 calculation tests passed.
- [x] Rerun 8 stubbed guided/checkout/polling flows at 1280px/390px, plus signed-in claim/My Reports/resume/Back; no overflow or page errors. Preview build OK.
- [ ] Restore OpenAI availability: owner must check quota/billing and update OPENAI_API_KEY if needed; one-call response did not distinguish quota from transient rate limiting.
- [ ] Publish latest frontend: public site serves an older build; publishing requires the owner's request.

# Phase 6 guided checker and single pass
- [x] Investigate available reader logs; deploy bounded parsing/retry/fallback and verify PDF worker conversion. No logs returned, so the original live failure is unconfirmed.
- [x] Build the one-route guided checker while preserving official calculation contracts and saved results.
- [x] Switch current offers to the $30 / 90-day 3 Month Pass and preserve legacy access.
- [x] Link purchases to reports, extend active passes, and preserve payment-complete fallback.
- [x] Verify all requested flows at 1280px/390px with stubbed requests and eight in-memory unit tests; no live test rows/checkouts. Preview build OK.
- [ ] Confirm the original iPhone/Safari upload on the owner's device; unavailable in the Chromium sandbox and no original failure logs.

# Phase 5 final QA
- [x] Sweep remaining styles, reveal safety, consistency and accessibility.
- [x] Recheck every route and report print output with stubbed requests at 1280px/390px.
- [x] Record before/after counts and final build diagnostics.

# Phase 4 remaining pages
- [x] Apply shared Ledger presentation without changing behaviour.
- [x] Restrict debug classifications route to development only.
- [x] Verify all routes at 1280px and 390px with stubbed requests and check build diagnostics.

# Phase 3 checker and reports
- [x] Apply Ledger checker, choice-list, result and report presentation; preserve all behaviour.
- [x] Verify upload through both result states at 1280px and 390px using only stubbed network; confirm no overflow, email/unlock controls, PDF downloads and passing build diagnostics.

# Homepage update
- [x] Apply Phase 2 Ledger homepage layout, preserving all existing behaviour and offers.
- [x] Verify Phase 2 at 1280px and 390px: no overflow, FAQ works, controlled upload parsing handoff works, live pending purchase returns 201 and launches Stripe (no payment made).
- [x] Apply Ledger visual foundation site-wide without changing behaviour.
- [x] Verify Ledger rendering, control interactions and build diagnostics.
- [x] Update section order, mockup, upload, pricing, FAQ, sources and footer.
- [x] Verify desktop layout, FAQ expansion and upload handoff with a network-stubbed parsing response; live parsing and payment were not re-tested.
- [ ] Real source URLs, Privacy Policy, Terms and ABN: awaiting owner-supplied details.- [x] Phase 9: guest pass claiming after sign-up

- [x] Engine v2 accuracy verification and safety fixes (breaks, roster-aware overtime, gross-only Partial, 2026 holidays, report)
- [ ] Engine v2 frontend integration — waiting on owner approval
- [x] Connect Engine v2 to AwardPay 2.0 preview (internal only) — awaiting owner review

## 2.0 preview: pay mapping and end-to-end testing
- [x] Explicit pay categories, total vs loading basis, no Ordinary default
- [x] Results: per-category actual/minimum/shortfall/overpayment, net only when Complete
- [x] Retail cl 15.2 extended trading questions (verified conditions)
- [x] Combined vs split Saturday payment equivalence test
- [x] 10 browser journeys desktop and mobile, scanner PDF and image, security regression, report
