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
];

export function coverageRegistry(): AwardCoverage[] {
  // Only expose awards that actually have a rule pack registered.
  return ENTRIES.filter(e => RULE_PACKS[e.code]);
}
