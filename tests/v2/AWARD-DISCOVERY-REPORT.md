# 2.0 award discovery fix: report

## Root cause (confirmed against the live Fair Work award list: 156 awards)
The wrong screens came from the **live checker** (`/check`). The 2.0 preview linked to it from the "Check my payslip" intent review and from the homepage tool card.
- Running the live matcher on "Civil Crew Foreman" returns MA000047 Aircraft Cabin Crew and MA000003 Fast Food. "Crew" overlaps the award name and the "Fast food crew" job. With an employer name containing "Queensland", it also returns MA000128 Queensland Newspapers, because employer words are scored.
- The live checker automatically applies the top suggestion after a scan.
- get-classifications for MA000047 returns 36 rows covering only 3 classification IDs (one row per rate date, with label variants). These are shown without de-duplication.

## Changes (preview only)
2.0 links now stay inside 2.0. Award suggestions come only from specific job or duty phrases and need your confirmation. Unsupported awards stop with the required message. Levels are de-duplicated and checked against the award, and the level is cleared when the award changes. The question step is kept in the URL, so Back, Forward and refresh work.

## Results
- Automated tests: 134 passed, 0 failed (`bun test tests`).
- Browser, desktop 1280 and mobile 390: all six occupations, unsupported stop, retail levels (9, no duplicates), refresh, Back/Forward and switching Retail → Hospitality passed. Screenshots are in /tmp/browser/aw/shots.

## Live checker weaknesses (not changed)
1. Word-overlap scoring treats generic words such as "crew" and employer-name words as evidence.
2. The top three results are always shown, even when the only evidence is one shared word.
3. The top award is applied automatically after a payslip scan.
4. Duplicate classification rows are shown with no ID de-duplication or award check.
5. The "Not sure — check across all levels" option and the "Most people in this job are covered by…" wording are not supported by the evidence.
