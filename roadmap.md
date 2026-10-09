# Phase 7 payment security and reader diagnosis
- [ ] Harden paid-access policies, triggers and function privileges; verify using rolled-back role-based SQL.
- [ ] Diagnose one deployed synthetic reader call and check published version.
- [ ] Handle discounted/taxed pass checkouts and legacy yearly purchases; rerun webhook tests.
- [ ] Rerun stubbed guided/checkout/claim/reports checks at 1280px/390px and check build diagnostics.

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
- [ ] Real source URLs, Privacy Policy, Terms and ABN: awaiting owner-supplied details.