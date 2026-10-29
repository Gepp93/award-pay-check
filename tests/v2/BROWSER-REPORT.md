# AwardPay 2.0 preview — browser test report

Run against the real `/v2` frontend at localhost (desktop 1280×1800, mobile 390×844), signed in as the tester admin account, calling the deployed `calculate-award-pay-v2`. Screenshots: `/tmp/browser/e2e/shots/<id>_<view>_*.png` (sandbox only).

| ID | Expected (source) | Desktop | Mobile | Shown status | Award min | Paid (comparable) | Shortfall |
|---|---|---|---|---|---|---|---|
| J1 | Complete; award $278.08 (8 h x $34.76, Sch B.1.1 Sat 125%); paid $278.08; net $0.00 | pass | pass | complete | $278.08 | $278.08 | $0.00 |
| J2 | Complete; same comparison as J1: ordinary $222.48 (8 x $27.81) + Saturday loading $55.60; net $0.00 | pass | pass | complete | $278.08 | $278.08 | $0.00 |
| J3 | Complete; $160.74 = 5.5 h x $27.08 + 4 x $2.95 (cl 29.2 Table 14, per hour or part 7pm-10:30pm); net $0.00 | pass | pass | complete | $160.74 | $160.74 | $0.00 |
| J4 | Complete entitlement $236.38 = 4 x $27.81 + 2 x $30.59 + 2 x $31.98 (cl 26); no pay comparison | pass | pass | complete | $236.38 | — | — |
| J5 | Partial; asks for the unpaid break (cl 16) | pass | pass | partial | $236.39 | — | — |
| J6 | Partial; hours above daily maximum (cl 15.4-15.5) flagged as likely overtime | pass | pass | partial | $702.20 | — | — |
| J7 | Unsupported; engine reason shown | pass | pass | unsupported | $0.00 | — | — |
| J8 | Complete; cl 15.2(c) extends span to 11pm; 4 h x $34.76 (casual 125%) + 4 h x $41.72 (casual after 6pm 150%) = $305.92; net $0.00 | pass | pass | complete | $305.92 | $305.92 | $0.00 |
| J8b | Partial; asks the cl 15.2 question | pass | pass | partial | $305.92 | — | — |
| J9 | Complete; potential underpayment $10.00 (Saturday loading shortfall $10.00) | pass | pass | complete | $278.08 | $268.08 | $10.00 |
| J10 | Partial; 'Other / Not sure' line never treated as ordinary; no total | pass | pass | partial | $278.08 | $0.00 | — |
| S1 | PDF: ordinary $222.48 + weekend line $55.60 (must ask category) -> user picks Saturday, extra loading -> Complete, net $0.00 | pass | pass | complete | $278.08 | $278.08 | $0.00 |
| S2 | JPG: one combined Saturday line $278.08 -> user picks Saturday, whole payment -> Complete, net $0.00 | pass | pass | complete | $278.08 | $278.08 | $0.00 |

J1–J3 desktop passed in the first run of this session (same values as mobile). Expected values were set from the award clauses/rates before running; none were changed to fit results.

## Scanner-to-engine
- S1 synthetic PDF (ordinary $222.48 + Saturday 25% line $55.60): scanner read all fields; weekend line arrived with no category ("Please choose"); tester picked Saturday + extra-loading → Complete, $0.00.
- S2 synthetic JPG (one combined Saturday 125% line $278.08): arrived uncategorised; tester picked Saturday + whole payment → Complete, $0.00.
- Both structures give identical award minimum $278.08 and $0.00 difference.

## Security
- Anonymous call: 401. Signed-in non-admin: 403 forbidden. Admin with invalid body: 400.
- Only `src/features/v2` calls the v2 function; no production route, payment, auth or schema files changed.

## Not tested / limitations
- PNG and HEIC were not re-run in this pass (only PDF and JPG).
- Real customer payslips were not used; only synthetic ones.
- Selected answer buttons have a fairly subtle highlight on mobile.
- The pay line keeps the scanner's printed label (e.g. "Weekend pay — please confirm the category") after the tester chooses a category; display only, no effect on the maths.
