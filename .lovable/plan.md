# Live checker safety patch (`/check`)

A narrow patch to the live checker's award, level and result screens. The calculation formulas, Engine v2, Stripe, accounts, the database and saved reports are not changed. Nothing is published until you approve.

## What customers will notice

- **No automatic award.** A scanned payslip still fills in the job title, hours and pay, but never the award. The "Looks right" job button no longer picks an award behind the scenes. Everyone confirms their award on the award screen.
- **Fewer, honest suggestions.** Up to three awards appear, but only ones with real evidence from the job title or chosen job. Generic words ("crew", "worker", "foreman", "level", and similar) and employer names no longer count. When nothing credible matches, customers see: "We couldn't confidently identify your award. Search for your award or tell us more about your work." The award search box is open below that message.
- **Neutral wording.** "Most people in this job are covered by…" becomes "Possible award — please confirm". The "I'm not sure — use the suggested award" button is removed.
- **Clean level list.** Only levels for the confirmed award are shown, each once, even when the official list repeats a level for different rate dates. Genuinely different levels, such as junior or apprentice levels and different work areas, stay separate. Changing the award clears the chosen level.
- **"Not sure" level option removed.** The live "not sure" range mixes adult, junior and apprentice levels, and only checks the first 30 levels. It leaves out only trainee and school-leaver levels. Fixing that would mean changing the calculation, so the option is removed. Customers see: "Please confirm your classification before we can estimate your pay. You'll find it on your payslip or contract, or you can ask your employer." Old saved reports that used the range keep their numbers. They are labelled "Estimated across several levels — may not match your classification".
- **Prominent notice** on the review screen, the result screen, saved report pages, the Full Report, My Reports and the downloaded PDF, including reports created before this patch: "Important: This checker currently uses simplified pay rules and may not reflect all conditions of your award. Results are preliminary estimates, not verified underpayment amounts."
- **Preliminary wording everywhere** across those same screens and the paid-report teaser:
  - "You may be owed", "You may be owed up to" and "Owed $X" become "Preliminary estimate".
  - "The amount owed" becomes "the preliminary estimate".
- **Unreliable parts are not shown as underpayment.** v1 results are never labelled "verified" or "owed". Some parts of the live calculation are only generic estimates: allowances, and penalties without a confirmed level. These are listed as "Possible issue — not calculated reliably" and are not included in the headline amount. Without a confirmed level, no amount is shown.

## Not changed

Rate and overtime maths, what is sent to the calculation, payment and pass access, and saved report data. The notice and wording are added when a page or PDF is shown; stored amounts and records are never rewritten or recalculated.

## Testing

- Automated tests run on the real Fair Work award list (156 awards) for Civil Crew Foreman, Electrician, Retail assistant, Barista, Fast Food worker and an unknown job. They check that nothing is picked automatically, no unrelated award appears, and fewer than three suggestions show when evidence is thin.
- Level tests: repeated cabin-crew rows (36 rows, 3 real levels) collapse to 3. Junior levels stay separate. Switching award clears the level.
- Real browser on desktop and a phone-sized screen: questions-only path, synthetic payslip upload (award left unselected), switching award, changing level, notice visible on review and result.
- Existing saved reports and pass access: open a saved report signed in as the test admin and confirm it still unlocks. Only reads, no payments.

## Technical details

- `src/features/check/model.ts`
  - `matchAwards`: add a generic-word stoplist, drop employer-word scoring, require a non-generic role match or curated job title, keep the existing `award_name_or_code` hint, and return only credible matches.
  - `applyPayslip`: stop setting `awardCode`/`awardName`.
  - Add a `dedupeClassifications` helper keyed on `classification_fixed_id`.
- `src/features/check/GuidedCheck.tsx`
  - The job step no longer sets the award, and the award step gets the new copy and no fallback button.
  - The level list uses `dedupeClassifications` and ignores responses for an award that is no longer selected.
  - Add the notice on review.
- `GuidedCheck.tsx` level step: remove the "not sure" choice. Continue needs a confirmed `classificationId`, and a resumed draft with no level returns to the level step.
- New shared `src/components/report/PreliminaryNotice.tsx`, containing the notice and wording.
- Display-only changes, with stored `owed_amount` and result JSON untouched: `src/pages/NewCheck_Step3_Result.tsx`, `src/pages/Report.tsx`, `src/components/report/FullReport.tsx` (screen and jsPDF), `src/pages/MyReports.tsx` and `src/components/report/LockedTeaser.tsx`.
- Tests also cover a new result and an existing saved report, including an old "not sure" one. They download the PDF, extract its text, and check that the notice is present and the amounts are unchanged.
- `roadmap.md`: add this patch's tasks when build starts.
- Tests: update `tests/guided-model.test.ts` and add `tests/live-award-matching.test.ts` using a committed snapshot of the award list. Run with `bun test`.
- `AGENTS.md`: replace the existing "Rank guided award suggestions…" rule with the stricter evidence and confirmation rule.
