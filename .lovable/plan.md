# Fix incorrect award and classification suggestions (2.0 preview)

## What the code shows (diagnosis)

The screens you saw ("Most people in this job are covered by…", "Not sure — check across all levels", repeated cabin crew levels) are not part of the 2.0 preview. That text only exists in the **live checker** (`/check`). Choosing "Check my payslip" on the 2.0 intent screen sends you to the live checker, which loses your 2.0 industry and job and runs the old matching.

Within the live checker, the code shows three faults:

1. **Word-overlap matching.** Awards are scored by shared words. "Civil **Crew** Foreman" matches "Aircraft Cabin **Crew**" and the "Fast food **crew**" job. Employer-name words also count, which is how something like "Queensland Newspapers" can appear. The top three scores are shown even when the only evidence is one shared word.
2. **Silent auto-selection.** When a payslip is read, the top-scoring award is applied automatically, with no confirmation.
3. **No de-duplication of levels.** The official classifications list can return several rows per level (for example, one per rate date). These are shown as returned, which produces repeated entries. Nothing checks that each row belongs to the selected award.

No request logs were captured from your test. Step 1 of the build is to confirm points 1–3 using the real award and classification responses for "Civil Crew Foreman". If those responses point to a different cause, I'll stop and report it before changing anything.

## The fix (2.0 preview only)

Your brief says to keep the live checker unchanged, so the fix keeps 2.0 users inside the 2.0 preview.

- **Stop the hand-off to the live checker.** "Check my payslip" in 2.0 goes to the 2.0 upload/questions flow and keeps your industry and confirmed job title.
- **New 2.0 award discovery step**, placed before calculation:
  - Shows the confirmed job title prominently, with the industry and award as separate items.
  - Suggestions come only from a short curated list of roles, industries and duty keywords. One shared generic word ("crew", "worker", "level") or an employer name is never enough.
  - For civil construction roles, Building and Construction (MA000020) appears as a candidate. Electrical (MA000025) appears only when the role or duties mention electrical work. Both are labelled "possible — please confirm", never as a default.
  - Unknown occupations get no suggestion. You choose from the industry's list or search, and you can mark "covered by an enterprise agreement".
  - Nothing looks selected until you confirm, and the phrase "Most people in this job are covered by" is removed.
- **Discovery separate from calculation.** Only Retail (MA000004), Hospitality (MA000009) and Fast Food (MA000003) continue to the v2 calculation. Any other confirmed award shows: "We've identified your selected award, but detailed pay calculations for this award aren't available yet." It offers a "Change award" button and no substitute award. The classification picker never opens for unsupported awards.
- **Strict classifications.** Levels come only from the confirmed supported award's rule pack. They are de-duplicated by stable ID, and the selected level is cleared when the award changes. No "check across all levels" option.
- **Session.** The confirmed award and job are saved in the existing answers-only 2.0 session, so Back/Forward and refresh keep the right award and never show a previous award's levels.

## Live checker (not changed; needs your decision)

The live checker at `/check` has the same matching and duplicate-level bugs, so real customers can see the same wrong suggestions today. I won't change it without your separate approval. I'll report the exact fix it needs.

## Tests

Automated tests, plus real browser runs on desktop and phone screens:
- Civil Crew Foreman: no cabin crew, fast food or newspaper suggestion; MA000020 offered only as a candidate; unsupported message shown.
- Electrician: MA000025 offered as a candidate, then unsupported message.
- Retail assistant, Barista, Fast food worker: the right supported award is suggested but not preselected; levels belong only to that award, with no duplicates.
- Unknown occupation: no suggestion.
- Switching awards: old levels cleared.
- Back/forward and refresh mid-flow: award, job and level stay consistent.

## Safety

No changes to the live checker, v1 engine, Stripe, database, accounts or saved reports. The 2.0 calculator stays tester-only. Nothing is published.

## Technical details

- Files: `src/features/v2/intents.tsx` (payslip intent goes to `/v2/upload` instead of `/check`); a new `src/features/v2/engine/awardDiscovery.ts` (curated evidence table and pure ranking with reasons); `EngineQuestions.tsx` (job-title display, a discovery step before the award/classification steps, the unsupported-award stop, and clearing `classificationFixedId` when the award changes); `classificationsFor` de-duplicates by ID and validates against the rule pack code; `store.tsx` keeps the job title in the answers-only state.
- Discovery list entries for MA000020 and MA000025 hold only codes and official names, with no rates.
- Tests: `tests/v2/award-discovery.test.ts` and extensions to `tests/v2/engine-model.test.ts`, run with `bun test`. Browser runs are reported in `tests/v2/BROWSER-REPORT.md`.
- `AGENTS.md`: add one rule saying 2.0 award discovery is evidence-based and confirmation-only, and that only rule-pack awards proceed to calculation.
