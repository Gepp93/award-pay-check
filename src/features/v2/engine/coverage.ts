// Engine v2 coverage registry. One entry per award with a rule pack, listing what the
// engine can assess completely, what it can only assess partially (a confirmed fact is
// missing), and what it refuses to assess. Shown on the admin-only /v2/coverage page.
// Keep this in sync with rulepacks.ts — it is curated documentation, not derived logic.
import { RULE_PACKS } from "../../../../supabase/functions/_shared/engine-v2/rulepacks";

export type CoverageLevel = "supported" | "partial" | "unsupported";

export interface AwardCoverage {
  code: string;
  name: string;
  /** Dated Fair Work data snapshot the engine reads. */
  snapshot: string;
  supported: string[];
  partial: string[];
  unsupported: string[];
}

const ENTRIES: AwardCoverage[] = [
  {
    code: "MA000004",
    name: "General Retail Industry Award 2020",
    snapshot: "Fair Work pay database, 2023–2026, fetched 2026-10-29",
    supported: [
      "Weekday, evening, Saturday and Sunday ordinary hours (adult, junior, apprentice; full-time, part-time, casual)",
      "Overtime tiers, public holidays, one 11-hour day per week, 9-hour standard day",
      "Extended trading span exceptions (cl 15.2) when confirmed by the user",
      "Cold-work and first-aid allowances when the condition is confirmed",
    ],
    partial: [
      "Hours outside the span of ordinary hours when no exception is confirmed",
      "Unpaid breaks whose start time is unknown across different pay rates",
      "Gross-only payslips (no per-category comparison possible)",
    ],
    unsupported: ["Shiftwork", "Classifications not listed in the pack"],
  },
  {
    code: "MA000009",
    name: "Hospitality Industry (General) Award 2020",
    snapshot: "Fair Work pay database, 2023–2026, fetched 2026-10-29",
    supported: [
      "Weekday, evening, weekend ordinary hours; Sunday rates differ by classification group",
      "Overtime, public holidays, casual loading",
    ],
    partial: ["Unpaid breaks whose start time is unknown", "Gross-only payslips"],
    unsupported: ["Shiftwork", "Classifications not listed in the pack"],
  },
  {
    code: "MA000003",
    name: "Fast Food Industry Award 2010",
    snapshot: "Fair Work pay database, 2023–2026, fetched 2026-10-29",
    supported: ["Weekday, evening, weekend ordinary hours; overtime; public holidays; casual loading"],
    partial: ["Unpaid breaks whose start time is unknown", "Gross-only payslips"],
    unsupported: ["Shiftwork", "Classifications not listed in the pack"],
  },
  {
    code: "MA000020",
    name: "Building and Construction General On-site Award 2020",
    snapshot: "Fair Work pay database 2023–2026 (rates, allowances) + award-text penalty percentages, verified 2026-10-30",
    supported: [
      "Weekday ordinary hours 7am–6pm; RDO accrual system (cl 16.2) when the user confirms they are on it",
      "All Saturday/Sunday work as overtime; Saturday overtime after 12 noon at 200% (cl 30.1(b))",
      "Public holidays at 250%; casual loading and casual overtime/weekend rates (cl 12.4–12.6)",
      "Casual 4-hour minimum engagement (cl 12.3)",
    ],
    partial: [
      "RDO system not confirmed — 7.6 vs 8 paid hours a day can't be decided",
      "Weekend work not entered as overtime — it is overtime under this award but can't be priced without the minutes",
      "Early-start (6am) arrangements requiring agreement (cl 16.11)",
    ],
    unsupported: ["Shiftwork (cl 17)", "Daily hire employees", "Classifications not listed in the pack"],
  },
  {
    code: "MA000025",
    name: "Electrical, Electronic and Communications Contracting Award 2020",
    snapshot: "Fair Work pay database, 2023–2026, fetched 2026-10-30",
    supported: [
      "Weekday ordinary hours 6am–6pm for day workers (cl 13.2–13.4)",
      "Full-time/part-time overtime Mon–Sat (150%/200%), Sunday (200%), public holidays (250%)",
      "Casual ordinary (125%) and casual public holiday (312.5%)",
    ],
    partial: [
      "Weekend work not entered as overtime — it is overtime for day workers but can't be priced without the minutes",
      "12-hour ordinary shifts need a majority agreement (cl 13.5) that isn't known",
    ],
    unsupported: [
      "Casual overtime and casual Sunday rates (cl 20.1(b), 20.4) — no Fair Work pay-database records exist",
      "Shiftwork", "Classifications not listed in the pack",
    ],
  },
  {
    code: "MA000119",
    name: "Restaurant Industry Award 2020",
    snapshot: "Fair Work pay database, 2023–2026, fetched 2026-10-30",
    supported: [
      "Weekday, Saturday (125%/150%) and Sunday ordinary hours; casual Sunday differs by level (Introductory–L2 vs L3–6, cl 24.2 Table 8)",
      "Late-night Monday–Friday additions ($2.95/h 10pm–midnight, $4.42/h midnight–6am, cl 24.2)",
      "Overtime including Saturday's 175%/200% tiers; public holidays (225%/250%); casual 2-hour minimum engagement",
    ],
    partial: ["Unpaid breaks whose start time is unknown across different pay rates", "Gross-only payslips"],
    unsupported: ["Shiftwork", "Split-shift allowance conditions (cl 21.3)", "Classifications not listed in the pack"],
  },
  {
    code: "MA000058",
    name: "Registered and Licensed Clubs Award 2020",
    snapshot: "Fair Work pay database, 2023–2026, fetched 2026-10-30",
    supported: [
      "Weekday, Saturday (150%) and Sunday (175%) ordinary hours; public holidays (250%)",
      "Late/early Monday–Friday additions ($2.95/h 7pm–midnight, $4.42/h midnight–7am, cl 24.4)",
      "Full-time/part-time overtime including Saturday 175%/200% tiers; 8-hour daily maximum (cl 15.3)",
    ],
    partial: ["Unpaid breaks whose start time is unknown", "Gross-only payslips"],
    unsupported: [
      "Maintenance and horticultural employees (different Saturday structure, cl 15.6)",
      "Casual overtime — no Fair Work pay-database records",
      "Bingo caller / fitness instructor minimum engagements", "Shiftwork",
    ],
  },
  {
    code: "MA000012",
    name: "Pharmacy Industry Award 2020",
    snapshot: "Fair Work pay database, 2023–2026, fetched 2026-10-30",
    supported: [
      "Time-of-day banded ordinary rates every day of the week (cl 25 Table 5), including early-morning, evening and late-night bands",
      "Full-time/part-time overtime (Mon–Sat 150%/200%, Sunday 200%, public holiday 250%)",
      "12-hour daily maximum (cl 13.3); 3-hour minimum engagement (cl 10.7, 11.1)",
    ],
    partial: ["Unpaid breaks whose start time is unknown across bands", "Gross-only payslips"],
    unsupported: ["Casual overtime — no Fair Work pay-database records", "2-hour school-student minimum engagement exception", "Shiftwork"],
  },
  {
    code: "MA000005",
    name: "Hair and Beauty Industry Award 2010",
    snapshot: "Fair Work pay database, 2023–2026, fetched 2026-10-30",
    supported: [
      "Span of ordinary hours (cl 15 Table 2): Mon–Fri 7am–9pm, Saturday 7am–6pm (133%), Sunday 10am–5pm (200%)",
      "Casual rates inside and outside the span (125%/150% weekdays, 158%/150% Saturday, 225% Sunday)",
      "Overtime with 3-hour tiers (150% then 200%); public holidays (250%); 3-hour minimum engagement",
    ],
    partial: [
      "Full-time/part-time work outside the span not entered as overtime — it is overtime but can't be priced without the minutes",
      "Gross-only payslips",
    ],
    unsupported: ["More than one 10.5-hour day in a week (needs agreement, cl 15.1(e))", "Shiftwork"],
  },
  {
    code: "MA000018",
    name: "Aged Care Award 2010",
    snapshot: "Fair Work pay database 2023–2026 (rates, allowances) + award-text penalty percentages, verified 2026-10-30",
    supported: [
      "Weekday ordinary hours 6am–6pm; Saturday 150% / Sunday 175% ordinary (cl 23.1); casual 125%/175%/200%",
      "Overtime Mon–Fri 150%/200%, weekends 200%, public holidays 250% (cl 25.1); casual overtime 187.5%/250%/312.5%",
      "Public holidays at 250% (payment election) and 275% casual; ADO accrual (cl 22.1(b)) when confirmed",
    ],
    partial: [
      "ADO system not confirmed — 7.6 vs 8 paid hours a day can't be decided",
      "Public holiday annual-leave election (cl 29.2) — assessed at the 250% payment rate",
      "Unpaid breaks whose start time is unknown across different pay rates",
    ],
    unsupported: ["Shiftwork (cl 26)", "Classifications not listed in the pack"],
  },
  {
    code: "MA000120",
    name: "Children's Services Award 2010",
    snapshot: "Fair Work pay database 2023–2026 (rates, allowances) + award-text penalty percentages, verified 2026-10-30",
    supported: [
      "Weekday ordinary hours 6am–6.30pm, up to 8 a day (cl 21); casual 125%",
      "All Saturday work as overtime 150%/200% (cl 23.5(a)); Sunday 200% (cl 23.5(c)); public holidays 250% (cl 23.5(d))",
      "Casual weekday overtime 175%/225% (cl 23.2(b)); 4-hour weekend/public-holiday minimum payment flagged",
    ],
    partial: ["Weekend work not entered as overtime — it is overtime under this award but can't be priced without the minutes", "Gross-only payslips"],
    unsupported: [
      "Casual Saturday, Sunday and public holiday work — the award text states no separate casual rates",
      "Shiftwork", "Classifications not listed in the pack",
    ],
  },
  {
    code: "MA000010",
    name: "Manufacturing and Associated Industries and Occupations Award 2020",
    snapshot: "Fair Work pay database, 2023–2026, fetched 2026-10-30",
    supported: [
      "Day-worker ordinary hours Mon–Fri 6am–6pm, up to 8 a day (cl 17.2); casual 125%",
      "Overtime 150% first 3 hours then 200% (cl 32.2); Saturday overtime with 4-hour minimum; Sunday 200%; public holidays 250%",
      "Casual overtime at the same percentages of the casual ordinary rate (cl 32.1)",
    ],
    partial: [
      "Weekend work not entered as overtime — weekend ordinary hours need a facilitative agreement (cl 17.2(c)) that isn't known",
      "Spread-of-hours variations by agreement (cl 17.2(d))",
    ],
    unsupported: ["Shiftwork (cl 33)", "Vehicle manufacturing special rates (cl 48)", "Classifications not listed in the pack"],
  },
  {
    code: "MA000038",
    name: "Road Transport and Distribution Award 2020",
    snapshot: "Fair Work pay database, 2023–2026, fetched 2026-10-30",
    supported: [
      "Transport and distribution facility employees (other than shiftworkers): ordinary Mon–Fri 5.30am–6.30pm, up to 8 a day (cl 13)",
      "Saturday 150%/175% and Sunday 200%/225% ordinary penalties; Good Friday and Christmas Day at different public holiday rates",
      "Overtime 150%/200% (160%/210% casual); Good Friday and Christmas Day overtime 300%",
    ],
    partial: [
      "Early-morning (+30%) delivery arrangements (cl 13.6(d)) — hours before 5.30 am raise the outside-span question",
      "Sunday overtime — no separate rate record exists",
    ],
    unsupported: [
      "Oil distribution workers (cl 17.2 rates)", "Shiftworkers (cl 14)",
      "Casual public holiday overtime — no Fair Work pay-database records",
    ],
  },
  {
    code: "MA000028",
    name: "Horticulture Award 2020",
    snapshot: "Fair Work pay database, 2023–2026, fetched 2026-10-30",
    supported: [
      "Full-time/part-time ordinary hours Mon–Fri 6am–6pm, up to 8 a day, 152 hours over 4 weeks (cl 13.1)",
      "Casual ordinary hours at any time on any day at 125% (cl 13.2); public holidays 200%/225%",
      "Overtime Monday–Saturday flat 150% (cl 21); casual overtime 175% (over 12 hours a day or 304 in 8 weeks)",
    ],
    partial: [
      "Weekend work by full-time/part-time employees not entered as overtime — Saturday ordinary hours need an arrangement (cl 13.1(a)(i)) that isn't known",
      "Gross-only payslips",
    ],
    unsupported: [
      "Sunday overtime — the rate depends on whether it is harvest season (cl 21), which AwardPay cannot know",
      "Shiftwork", "Piecework", "Classifications not listed in the pack",
    ],
  },
];

export function coverageRegistry(): AwardCoverage[] {
  // Only expose awards that actually have a rule pack registered.
  return ENTRIES.filter(e => RULE_PACKS[e.code]);
}
