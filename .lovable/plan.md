# Live checker safety patch (`/check`)

A narrow patch to the live checker's award, level and result screens. The calculation formulas, Engine v2, Stripe, accounts, the database and saved reports are not changed. Nothing is published until you approve.

## What customers will notice

- **No automatic award.** A scanned payslip still fills in the job title, hours and pay, but never the award. The "Looks right" job button no longer picks an award behind the scenes. Everyone confirms their award on the award screen.
- **Fewer, honest suggestions.** Up to three awards appear, but only ones with real evidence from the job title or chosen job. Generic words ("crew", "worker", "foreman", "level", and similar) and employer names no longer count. When nothing credible matches, customers see: "We couldn't confidently identify your award. Search for your award or tell us more about your work." The award search box is open below that message.
- **Neutral wording.** "Most people in this job are covered by…" becomes "Possible award — please confirm". The "I'm not sure — use the suggested award" button is removed.
- **Clean level list.** Only levels for the confirmed award are shown, each once, even when the official list repeats a level for different rate dates. Genuinely different levels, such as junior or apprentice levels and different work areas, stay separate. Changing the award clears the chosen level.
- **"Not sure" level option.** The live checker can calculate a range across an award's levels, so this option stays. It is renamed "Not sure — show an estimated range across this award's levels". That result always shows a range, never one "you may be owed up to" figure.
- **Prominent notice** on the review screen (before calculating) and on the result screen: "Important: This checker currently uses simplified pay rules and may not reflect all conditions of your award. Results are preliminary estimates, not verified underpayment amounts."
- **Softer headline.** "You may be owed" becomes "Preliminary estimate", followed by the amount.

## Not changed

Rate and overtime maths, what is sent to the calculation, payment and pass access, how reports are saved (including the stored amount), and existing saved report pages. Open question: should saved Full Report pages also show the notice? This plan leaves them unchanged unless you say so.

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
- `src/pages/NewCheck_Step3_Result.tsx`: add the notice, use the preliminary-estimate label, and always show a range in "not sure" mode. Display only; the saved values are unchanged.
- Tests: update `tests/guided-model.test.ts` and add `tests/live-award-matching.test.ts` using a committed snapshot of the award list. Run with `bun test`.
- `AGENTS.md`: replace the existing "Rank guided award suggestions…" rule with the stricter evidence and confirmation rule.
