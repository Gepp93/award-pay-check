import type { IndustryId } from "./industries";

/**
 * Homepage illustrative payslip examples.
 * Rule: a row may only carry figures (`paid`/`award` per hour and `hours`) once
 * the award rate has been verified against a published Fair Work pay guide.
 * Until then rows are conceptual ("what we'd check") and no total is shown.
 */
export interface ExampleRow {
  label: string;
  /** What the check looks at for this scenario. */
  detail: string;
  figures?: { hours: number; paidCents: number; awardCents: number };
}

export interface IndustryExample {
  industry: Exclude<IndustryId, "other">;
  award: string;
  scenario: string;
  rows: ExampleRow[];
}

export const EXAMPLES: Record<IndustryExample["industry"], IndustryExample> = {
  construction: { industry: "construction", award: "Building and Construction General On-site Award (MA000020)",
    scenario: "Full-time labourer who works a Saturday and uses their own tools",
    rows: [
      { label: "Ordinary hours", detail: "Hourly rate vs your classification level" },
      { label: "Saturday overtime", detail: "Saturday work paid at overtime rates" },
      { label: "Tool allowance", detail: "Applies to tradespeople supplying their own tools" },
      { label: "RDO accrual", detail: "Hours banked toward a rostered day off" },
    ] },
  hospitality: { industry: "hospitality", award: "Hospitality Industry (General) Award (MA000009)",
    scenario: "Casual waiter working Friday night and Sunday shifts",
    rows: [
      { label: "Casual loading", detail: "25% loading on top of the base rate" },
      { label: "Evening penalty", detail: "Extra per-hour amount after 7pm" },
      { label: "Sunday penalty", detail: "Sunday rate for casual employees" },
    ] },
  retail: { industry: "retail", award: "General Retail Industry Award (MA000004)",
    scenario: "Part-time retail assistant working Saturdays and a late-night shift",
    rows: [
      { label: "Ordinary hours", detail: "Hourly rate vs your retail employee level" },
      { label: "Saturday penalty", detail: "Saturday rate for part-time employees" },
      { label: "Evening penalty", detail: "Hours worked after 6pm on weekdays" },
      { label: "Meal break", detail: "Breaks required for longer shifts" },
    ] },
  healthcare: { industry: "healthcare", award: "Nurses Award (MA000034)",
    scenario: "Full-time enrolled nurse on rotating weekend and night shifts",
    rows: [
      { label: "Ordinary hours", detail: "Rate for your nursing classification and pay point" },
      { label: "Night shift loading", detail: "Loading for shifts finishing after midnight" },
      { label: "Weekend penalty", detail: "Saturday and Sunday rates" },
    ] },
  manufacturing: { industry: "manufacturing", award: "Manufacturing and Associated Industries and Occupations Award (MA000010)",
    scenario: "Full-time process worker on afternoon shift with weekday overtime",
    rows: [
      { label: "Ordinary hours", detail: "Rate for your classification level" },
      { label: "Afternoon shift loading", detail: "Loading for afternoon shiftwork" },
      { label: "Overtime", detail: "Time-and-a-half, then double time" },
    ] },
  transport: { industry: "transport", award: "Road Transport and Distribution Award (MA000038)",
    scenario: "Full-time truck driver with early starts and long days",
    rows: [
      { label: "Ordinary hours", detail: "Rate for your transport worker grade" },
      { label: "Early morning shift", detail: "Loading for shifts starting before 5:30am" },
      { label: "Overtime", detail: "Hours beyond your ordinary daily hours" },
      { label: "Meal allowance", detail: "When overtime runs past set limits" },
    ] },
  agriculture: { industry: "agriculture", award: "Horticulture Award (MA000028)",
    scenario: "Casual fruit picker paid hourly across a harvest week",
    rows: [
      { label: "Minimum hourly rate", detail: "Applies even when paid per piece" },
      { label: "Casual loading", detail: "25% loading on top of the base rate" },
      { label: "Overtime", detail: "Hours beyond the award's ordinary hours" },
    ] },
  education: { industry: "education", award: "Children's Services Award (MA000120)",
    scenario: "Full-time early childhood educator holding a Certificate III",
    rows: [
      { label: "Ordinary hours", detail: "Rate for your level and qualification" },
      { label: "Overtime", detail: "Hours beyond your rostered ordinary hours" },
      { label: "Laundry allowance", detail: "When you wash your own uniform" },
    ] },
};

export const rowDiffCents = (r: ExampleRow) =>
  r.figures ? Math.round(r.figures.hours * (r.figures.awardCents - r.figures.paidCents)) : 0;

/** Total only when every row has verified figures; otherwise null (conceptual example). */
export const exampleTotalCents = (e: IndustryExample): number | null =>
  e.rows.every((r) => r.figures) ? e.rows.reduce((s, r) => s + rowDiffCents(r), 0) : null;
