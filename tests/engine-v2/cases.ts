// Engine v2 accuracy cases. Expected amounts are worked out by hand from
// official sources — NOT from the engine:
//  * 2026-27 dollar figures: the award's own Schedule B "Summary of Hourly
//    Rates of Pay" (award text at awards.fairwork.gov.au, read 2026-10-29),
//    multiplied by hours. Retail L1 FT: ord 27.81, after 6pm 34.76, Sat 34.76,
//    Sun 41.72, PH 62.57; OT 41.72/55.62/55.62/69.53. Retail L1 casual: 34.76,
//    41.72, 41.72, 48.67, 69.53. Hospitality L2 FT: 27.08, Sat 33.85, Sun 40.62,
//    PH 60.93; OT 40.62/54.16/54.16/60.93; casual 33.85/40.62/47.39/67.70, casual
//    OT 40.62/54.16/54.16/67.70; evening addition $2.95 (cl 29.2). Fast Food L1
//    FT: 27.81, 10pm–12 30.59, 12–6am 31.98, Sat 34.76, Sun L1 34.76, PH 62.57;
//    L2 Sun 44.18; L1 casual 34.76/37.54/38.93/41.72/41.72; casual OT L1
//    48.67/62.57/62.57/76.48.
//  * Earlier years: the dated adult hourly rate from the Fair Work API record
//    (Retail L1 $25.65 from 2024-07-01, $26.55 from 2025-07-01) × the award
//    table percentage, rounded to the cent, written out by hand below.
//  * Public holidays: data.gov.au Australian Public Holidays dataset.
import type { AssessmentInput } from "../../supabase/functions/_shared/engine-v2/engine.ts";

export interface Case {
  id: string; title: string; input: AssessmentInput;
  expect: { status: "complete" | "partial" | "unsupported"; entitlementCents?: number; underpaymentCents?: number | null; comparableCents?: number | null };
  working: string; source: string;
}

const R = "MA000004", H = "MA000009", F = "MA000003";
const adult = { rateType: "adult" as const };
const SB = (award: string) => `Schedule B, ${award} award text (awards.fairwork.gov.au/${award}.html)`;

export const CASES: Case[] = [
  // ---------------- Retail ----------------
  { id: "R1", title: "Retail L1 full-time, weekday ordinary, 30 min break",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-07-06", end: "2026-07-19" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-06", start: "09:00", finish: "17:30", breakMinutes: 30, breakStart: "12:00", overtimeMinutes: 0 }] },
    expect: { status: "complete", entitlementCents: 22248 }, working: "8 h × $27.81 = $222.48", source: `${SB(R)} B.1.1; cl 22 Table 12` },
  { id: "R2", title: "Retail L1 full-time, Saturday",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "VIC", payPeriod: { start: "2026-07-06", end: "2026-07-19" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-11", start: "09:00", finish: "17:00" }] },
    expect: { status: "complete", entitlementCents: 27808 }, working: "8 h × $34.76 (125%) = $278.08", source: `${SB(R)} B.1.1` },
  { id: "R3", title: "Retail L1 part-time, Sunday",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "part_time", ...adult, state: "QLD", payPeriod: { start: "2026-07-06", end: "2026-07-19" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-12", start: "10:00", finish: "16:00" }] },
    expect: { status: "complete", entitlementCents: 25032 }, working: "6 h × $41.72 (150%) = $250.32", source: `${SB(R)} B.1.1` },
  { id: "R4", title: "Retail L1 full-time, weekday shift into evening (after 6pm)",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "SA", payPeriod: { start: "2026-07-13", end: "2026-07-26" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-13", start: "14:00", finish: "20:00" }] },
    expect: { status: "complete", entitlementCents: 18076 }, working: "4 h × $27.81 + 2 h × $34.76 = $111.24 + $69.52 = $180.76", source: `${SB(R)} B.1.1; cl 22 Table 12 (Mon–Fri after 6pm 125%)` },
  { id: "R5", title: "Retail L1 casual, Saturday",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "casual", ...adult, state: "NSW", payPeriod: { start: "2026-07-06", end: "2026-07-12" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-11", start: "10:00", finish: "16:00" }] },
    expect: { status: "complete", entitlementCents: 25032 }, working: "6 h × $41.72 (casual 150%) = $250.32", source: `${SB(R)} B.2.1` },
  { id: "R6", title: "Retail L1 casual, Sunday",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "casual", ...adult, state: "NSW", payPeriod: { start: "2026-07-06", end: "2026-07-12" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-12", start: "10:00", finish: "14:00" }] },
    expect: { status: "complete", entitlementCents: 19468 }, working: "4 h × $48.67 (casual 175%) = $194.68", source: `${SB(R)} B.2.1` },
  { id: "R7", title: "Retail L1 full-time, weekday overtime both tiers (OT not affected by after-6pm penalty)",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-07-13", end: "2026-07-26" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-14", start: "08:00", finish: "20:00", overtimeMinutes: 240 }] },
    expect: { status: "complete", entitlementCents: 40326 }, working: "8 h × $27.81 = $222.48; OT 3 h × $41.72 = $125.16; 1 h × $55.62 → $403.26", source: `${SB(R)} B.1.1, B.1.3; cl 21.2 Table 11` },
  { id: "R8", title: "Retail L1 full-time, public holiday (NSW Australia Day observed 27 Jan 2025), 2024-25 rate",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2025-01-27", end: "2025-02-09" }, shifts: [{ date: "2025-01-27", start: "09:00", finish: "17:00" }] },
    expect: { status: "complete", entitlementCents: 46168 }, working: "$25.65 × 225% = $57.7125 → $57.71; 8 h × $57.71 = $461.68", source: "FWC API pay rate L1 operative 2024-07-01 ($25.65); cl 22 Table 12 (225%); data.gov.au NSW 2025-01-27" },
  { id: "R9", title: "Retail L1 full-time, 10 Mar 2025 is a public holiday in VIC (Labour Day)",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "VIC", payPeriod: { start: "2025-03-10", end: "2025-03-23" }, shifts: [{ date: "2025-03-10", start: "09:00", finish: "13:00" }] },
    expect: { status: "complete", entitlementCents: 23084 }, working: "4 h × $57.71 = $230.84", source: "FWC API $25.65; Table 12 225%; data.gov.au VIC Labour Day 2025-03-10" },
  { id: "R10", title: "Same date in NSW is an ordinary weekday",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2025-03-10", end: "2025-03-23" }, shifts: [{ date: "2025-03-10", start: "09:00", finish: "13:00" }] },
    expect: { status: "complete", entitlementCents: 10260 }, working: "4 h × $25.65 = $102.60", source: "FWC API $25.65; data.gov.au (no NSW holiday 2025-03-10)" },
  { id: "R11", title: "Retail SA Christmas Eve part-day holiday from 7pm (overlapping evening and PH penalties)",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "SA", payPeriod: { start: "2025-12-22", end: "2026-01-04" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2025-12-24", start: "17:00", finish: "23:00", overtimeMinutes: 0 }] },
    expect: { status: "complete", entitlementCents: 29870 }, working: "1 h × $26.55 + 1 h × $33.19 (125% of 26.55 = 33.1875) + 4 h × $59.74 (225% = 59.7375) = $298.70", source: "FWC API $26.55 (2025-07-01); Table 12; data.gov.au SA 'Christmas Eve: 7pm to midnight'" },
  { id: "R12", title: "Pay period starting 30 Jun 2025 keeps the old rate for a 2 Jul shift",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2025-06-30", end: "2025-07-13" }, shifts: [{ date: "2025-07-02", start: "09:00", finish: "17:00" }] },
    expect: { status: "complete", entitlementCents: 20520 }, working: "8 h × $25.65 = $205.20 (new rate starts from the first full pay period on/after 1 Jul)", source: "FWC data dictionary 'operativeFrom'; API L1 records 2024 and 2025" },
  { id: "R13", title: "Next pay period (7 Jul 2025) uses the new rate",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2025-07-14", end: "2025-07-27" }, shifts: [{ date: "2025-07-15", start: "09:00", finish: "17:00" }] },
    expect: { status: "complete", entitlementCents: 21240 }, working: "8 h × $26.55 = $212.40", source: "FWC API L1 operative 2025-07-01" },
  { id: "R14", title: "No pay period start, shift just after 1 Jul → can't pick the rate",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "NSW", shifts: [{ date: "2025-07-02", start: "09:00", finish: "17:00" }] },
    expect: { status: "unsupported" }, working: "A period could have started before or after 1 Jul", source: "FWC data dictionary 'operativeFrom'" },
  { id: "R15", title: "No pay period start, mid-year shift → rate is unambiguous (historical 2024-25)",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "WA", shifts: [{ date: "2024-10-15", start: "09:00", finish: "13:00" }] },
    expect: { status: "complete", entitlementCents: 10260 }, working: "4 h × $25.65 = $102.60", source: "FWC API L1 operative 2024-07-01" },
  { id: "R16", title: "Retail casual with overtime → casual overtime not in Fair Work data",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "casual", ...adult, state: "NSW", payPeriod: { start: "2026-07-06", end: "2026-07-12" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-07", start: "08:00", finish: "20:00", overtimeMinutes: 120 }] },
    expect: { status: "partial", underpaymentCents: null }, working: "API has no casual overtime records for MA000004", source: "FWC API penalties MA000004" },
  { id: "R17", title: "Retail full-time 12 h shift with no overtime information (ambiguous payslip)",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-07-06", end: "2026-07-19" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-07", start: "07:00", finish: "19:00" }] },
    expect: { status: "partial", underpaymentCents: null }, working: "More than 9 ordinary hours (cl 15.4)", source: "cl 15.4–15.5" },
  { id: "R18", title: "Retail full-time Sunday 7am start (outside 9am span) without overtime info",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-07-06", end: "2026-07-19" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-12", start: "07:00", finish: "12:00" }] },
    expect: { status: "partial" }, working: "Sunday span 9am–6pm (Table 2); hours before 9am may be overtime", source: "cl 15.1 Table 2; Table 10" },
  { id: "R19", title: "Retail compare against paid wage lines (allowance excluded)",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "VIC", payPeriod: { start: "2026-07-06", end: "2026-07-19" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-11", start: "09:00", finish: "17:00" }], paid: { grossCents: 26000, lines: [{ kind: "saturday", amountCents: 24000 }, { kind: "allowance", amountCents: 2000 }] } },
    expect: { status: "complete", entitlementCents: 27808, comparableCents: 24000, underpaymentCents: 3808 }, working: "$278.08 − $240.00 wages = $38.08; $20 allowance not compared", source: `${SB(R)} B.1.1` },
  { id: "R20", title: "Retail gross only (not confirmed as wages only) → no comparison",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "VIC", payPeriod: { start: "2026-07-06", end: "2026-07-19" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-11", start: "09:00", finish: "17:00" }], paid: { grossCents: 26000 } },
    expect: { status: "complete", entitlementCents: 27808, comparableCents: null, underpaymentCents: null }, working: "Gross may include other payments", source: "—" },
  { id: "R21", title: "Retail junior → not assessed (no junior dollar rates in API)",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "casual", rateType: "junior", state: "NSW", payPeriod: { start: "2026-07-06", end: "2026-07-12" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-11", start: "10:00", finish: "16:00" }] },
    expect: { status: "unsupported" }, working: "JN pay-rate records have null calculated_rate", source: "FWC API pay-rates MA000004 (JN)" },
  { id: "R22", title: "Retail apprentice → not assessed",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", rateType: "apprentice", state: "NSW", payPeriod: { start: "2026-07-06", end: "2026-07-19" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-07", start: "09:00", finish: "17:00" }] },
    expect: { status: "unsupported" }, working: "Apprentice rates depend on start date/year", source: "—" },
  { id: "R23", title: "Retail shiftworker → not assessed",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-07-06", end: "2026-07-19" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-07", start: "22:00", finish: "06:00" }], flags: { shiftworker: true } },
    expect: { status: "unsupported" }, working: "Shiftwork tables not mapped", source: "—" },
  { id: "R24", title: "Unknown retail classification → not assessed",
    input: { awardCode: R, classificationFixedId: 999999, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-07-06", end: "2026-07-19" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-07", start: "09:00", finish: "17:00" }] },
    expect: { status: "unsupported" }, working: "Not in rule pack", source: "—" },
  { id: "R25", title: "QLD Brisbane-only show holiday → needs confirmation",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "QLD", payPeriod: { start: "2025-08-11", end: "2025-08-24" }, shifts: [{ date: "2025-08-13", start: "09:00", finish: "13:00" }] },
    expect: { status: "partial" }, working: "Regional holiday", source: "data.gov.au QLD 'Royal Queensland Show (Brisbane area only)'" },
  { id: "R26", title: "2026 date outside the official holiday list (not marked) → partial",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-12-21", end: "2027-01-03" }, shifts: [{ date: "2026-12-28", start: "09:00", finish: "13:00" }] },
    expect: { status: "partial" }, working: "Holiday list covers 2024–2025 only", source: "data.gov.au dataset coverage" },

  { id: "R27", title: "Retail L1 casual, Christmas Day 2025 (NSW)",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "casual", ...adult, state: "NSW", payPeriod: { start: "2025-12-22", end: "2025-12-28" }, shifts: [{ date: "2025-12-25", start: "09:00", finish: "17:00" }] },
    expect: { status: "complete", entitlementCents: 53104 }, working: "$26.55 × 250% = $66.375 → $66.38; 8 h × $66.38 = $531.04", source: "FWC API $26.55 (2025-07-01); cl 22 Table 12 column 3 (250%); data.gov.au NSW 2025-12-25" },

  // ---------------- Hospitality ----------------
  { id: "H1", title: "Hospitality L2 full-time, weekday into evening (+$2.95 per hour or part)",
    input: { awardCode: H, classificationFixedId: 246, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-07-13", end: "2026-07-26" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-14", start: "17:00", finish: "22:30" }] },
    expect: { status: "complete", entitlementCents: 16074 }, working: "5.5 h × $27.08 = $148.94; 7pm–10:30pm = 3.5 h → 4 × $2.95 = $11.80 → $160.74", source: `${SB(H)} B.2.1; cl 29.2 / Schedule wage allowances ($2.95)` },
  { id: "H2", title: "Hospitality L2 casual, Friday night into Saturday",
    input: { awardCode: H, classificationFixedId: 246, employmentType: "casual", ...adult, state: "VIC", payPeriod: { start: "2026-07-13", end: "2026-07-19" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-17", start: "22:00", finish: "02:00" }] },
    expect: { status: "complete", entitlementCents: 15484 }, working: "Fri 2 h × $33.85 = $67.70 + 2 × $2.95 = $5.90; Sat 2 h × $40.62 = $81.24 → $154.84", source: `${SB(H)} B.2.3; cl 29.2` },
  { id: "H3", title: "Hospitality L2 casual weekday overtime (2 tiers)",
    input: { awardCode: H, classificationFixedId: 246, employmentType: "casual", ...adult, state: "NSW", payPeriod: { start: "2026-07-13", end: "2026-07-19" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-13", start: "09:00", finish: "20:00", overtimeMinutes: 180 }] },
    expect: { status: "complete", entitlementCents: 40620 }, working: "8 h × $33.85 = $270.80; OT 2 h × $40.62 = $81.24; 1 h × $54.16 → $406.20", source: `${SB(H)} B.2.3, B.2.4` },
  { id: "H4", title: "Hospitality L2 full-time Sunday",
    input: { awardCode: H, classificationFixedId: 246, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-07-13", end: "2026-07-26" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-19", start: "10:00", finish: "18:00", breakMinutes: 30, breakStart: "13:00" }] },
    expect: { status: "complete", entitlementCents: 30465 }, working: "7.5 h × $40.62 = $304.65", source: `${SB(H)} B.2.1` },
  { id: "H5", title: "Hospitality L2 full-time Saturday overtime (weekend flat 200%)",
    input: { awardCode: H, classificationFixedId: 246, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-07-13", end: "2026-07-26" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-18", start: "08:00", finish: "18:00", overtimeMinutes: 120 }] },
    expect: { status: "complete", entitlementCents: 37912 }, working: "8 h × $33.85 = $270.80; OT 2 h × $54.16 = $108.32 → $379.12", source: `${SB(H)} B.2.1, B.2.2` },
  { id: "H6", title: "Hospitality casino gaming employee → not assessed",
    input: { awardCode: H, classificationFixedId: 246, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-07-13", end: "2026-07-26" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-14", start: "09:00", finish: "17:00" }], flags: { casinoGaming: true } },
    expect: { status: "unsupported" }, working: "Casino tables not mapped", source: "—" },
  { id: "H7", title: "Hospitality enterprise agreement → not assessed",
    input: { awardCode: H, classificationFixedId: 246, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-07-13", end: "2026-07-26" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-14", start: "09:00", finish: "17:00" }], flags: { enterpriseAgreement: true } },
    expect: { status: "unsupported" }, working: "EA coverage", source: "—" },

  // ---------------- Fast Food ----------------
  { id: "F1", title: "Fast Food L1 full-time, evening into early morning",
    input: { awardCode: F, classificationFixedId: 108, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-07-13", end: "2026-07-26" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-16", start: "18:00", finish: "02:00", overtimeMinutes: 0 }] },
    expect: { status: "complete", entitlementCents: 23638 }, working: "4 h × $27.81 + 2 h × $30.59 + 2 h × $31.98 = $111.24 + $61.18 + $63.96 = $236.38", source: `${SB(F)} B.1.1; cl 21` },
  { id: "F2", title: "Fast Food L2 full-time Sunday (level 2–3 rate)",
    input: { awardCode: F, classificationFixedId: 109, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-07-13", end: "2026-07-26" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-19", start: "10:00", finish: "16:00" }] },
    expect: { status: "complete", entitlementCents: 26508 }, working: "6 h × $44.18 (150%) = $265.08", source: `${SB(F)} B.1.1` },
  { id: "F3", title: "Fast Food L1 casual Sunday (level 1 rate)",
    input: { awardCode: F, classificationFixedId: 108, employmentType: "casual", ...adult, state: "NSW", payPeriod: { start: "2026-07-13", end: "2026-07-19" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-19", start: "10:00", finish: "16:00" }] },
    expect: { status: "complete", entitlementCents: 25032 }, working: "6 h × $41.72 (casual 150%) = $250.32", source: `${SB(F)} B.2.1` },
  { id: "F4", title: "Fast Food L1 casual Saturday with overtime",
    input: { awardCode: F, classificationFixedId: 108, employmentType: "casual", ...adult, state: "NSW", payPeriod: { start: "2026-07-13", end: "2026-07-19" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-18", start: "08:00", finish: "19:00", overtimeMinutes: 120 }] },
    expect: { status: "complete", entitlementCents: 47282 }, working: "9 h × $41.72 = $375.48; OT 2 h × $48.67 = $97.34 → $472.82", source: `${SB(F)} B.2.1, B.2.2` },
  { id: "F5", title: "Fast Food L1 full-time Christmas Day 2024 (QLD), 2024-25 rate",
    input: { awardCode: F, classificationFixedId: 108, employmentType: "full_time", ...adult, state: "QLD", payPeriod: { start: "2024-12-23", end: "2025-01-05" }, shifts: [{ date: "2024-12-25", start: "10:00", finish: "14:00" }] },
    expect: { status: "complete", entitlementCents: 23084 }, working: "Fast Food L1 2024-25 $25.65 × 225% = $57.71; 4 h = $230.84", source: "FWC API MA000003 L1 operative 2024-07-01; cl 21 (225%); data.gov.au QLD 2024-12-25" },
  { id: "F6", title: "Fast Food 12 h shift, no overtime stated (> 11 h max)",
    input: { awardCode: F, classificationFixedId: 108, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-07-13", end: "2026-07-26" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-14", start: "08:00", finish: "20:00" }] },
    expect: { status: "partial" }, working: "cl 13.5", source: "cl 13.5" },
  { id: "X1", title: "Unsupported award (Building and Construction MA000020)",
    input: { awardCode: "MA000020", classificationFixedId: 1, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-07-13", end: "2026-07-26" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-14", start: "07:00", finish: "15:00" }] },
    expect: { status: "unsupported" }, working: "Not in v2 scope", source: "—" },
  { id: "X2", title: "Award-free worker",
    input: { awardCode: R, classificationFixedId: 112, employmentType: "full_time", ...adult, state: "NSW", payPeriod: { start: "2026-07-13", end: "2026-07-26" }, holidayConfirmation: { publicHolidayDates: [] }, shifts: [{ date: "2026-07-14", start: "07:00", finish: "15:00" }], flags: { awardFree: true } },
    expect: { status: "unsupported" }, working: "—", source: "—" },
];
