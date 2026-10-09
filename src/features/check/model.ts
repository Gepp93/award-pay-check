import type { ParsedPayslip } from "@/lib/payslipReader";

export type Step = "start" | "job" | "industry" | "award" | "employment" | "level" | "age" | "pay" | "hours" | "allowances" | "review" | "loading" | "result";
export interface Award { code: string; name: string }
export interface Classification { classification_fixed_id: string; classification: string; clause_description?: string }
export interface RosterShift { date: string; day_of_week: string; start: string; finish: string; break_minutes: number; publicHoliday?: boolean }
export interface Answers {
  job: string; industry: string; awardCode: string; awardName: string; employmentType: string;
  classificationId: string | null; classificationName: string; workArea: string; age?: number;
  state: string; frequency: "weekly" | "fortnightly" | "monthly"; rate: string; gross: string;
  hours: string; hours150: number; hours200: number; usePayslipHours: boolean; weekStart: string;
  shifts: RosterShift[]; conditions: Record<string, boolean>; allowances: { type: string; received: boolean; amount_per_period: number }[];
  fromPayslip: string[];
}
export const SAVE_KEY = "awardpay-guided-check";
export const INDUSTRIES = ["Retail", "Hospitality", "Healthcare", "Construction", "Manufacturing", "Education", "Transport", "Other"];
export const JOBS: { title: string; codes: string[] }[] = [
  ["Retail assistant", "MA000004"], ["Barista", "MA000009", "MA000119"], ["Waiter", "MA000009", "MA000119"], ["Kitchen hand", "MA000009", "MA000119"],
  ["Chef", "MA000119", "MA000009"], ["Cook", "MA000119", "MA000009"], ["Aged care worker", "MA000018"], ["Disability support worker", "MA000100"],
  ["Childcare educator", "MA000120"], ["Nurse", "MA000034"], ["Cleaner", "MA000022"], ["Security officer", "MA000016"],
  ["Warehouse worker", "MA000084"], ["Storeperson", "MA000084"], ["Truck driver", "MA000038"], ["Construction labourer", "MA000020"],
  ["Electrician", "MA000025"], ["Hairdresser", "MA000005"], ["Fast food crew", "MA000003"], ["Call centre operator", "MA000002"],
  ["Administration assistant", "MA000002"], ["Receptionist", "MA000002"], ["Pharmacy assistant", "MA000012"], ["Farm hand", "MA000035"],
  ["Fruit picker", "MA000028"], ["Sales assistant", "MA000004"], ["Checkout operator", "MA000004"], ["Shelf stacker", "MA000004"],
  ["Retail supervisor", "MA000004"], ["Hotel receptionist", "MA000009"], ["Bartender", "MA000009", "MA000119"], ["Housekeeper", "MA000009"],
  ["Food service attendant", "MA000009", "MA000119"], ["Restaurant manager", "MA000119"], ["Cafe manager", "MA000119", "MA000009"],
  ["Personal care assistant", "MA000018"], ["Home care worker", "MA000100"], ["Community support worker", "MA000100"],
  ["Enrolled nurse", "MA000034"], ["Registered nurse", "MA000034"], ["Early childhood assistant", "MA000120"],
  ["Commercial cleaner", "MA000022"], ["Office cleaner", "MA000022"], ["Security guard", "MA000016"], ["Crowd controller", "MA000016"],
  ["Forklift operator", "MA000084"], ["Pick packer", "MA000084"], ["Delivery driver", "MA000038"], ["Carpenter", "MA000020"],
  ["Bricklayer", "MA000020"], ["Painter", "MA000020"], ["Apprentice electrician", "MA000025"], ["Salon assistant", "MA000005"],
  ["Beauty therapist", "MA000005"], ["Fast food cook", "MA000003"], ["Office administrator", "MA000002"], ["Data entry clerk", "MA000002"],
  ["Accounts clerk", "MA000002"], ["Pharmacy technician", "MA000012"], ["Gardener", "MA000028"], ["Harvest worker", "MA000028"], ["Livestock worker", "MA000035"],
].map(([title, ...codes]) => ({ title, codes }));

export function weekStartDate(): string {
  const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return localDate(d);
}
export function localDate(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
export function dateOffset(start: string, days: number): string {
  const d = new Date(`${start}T12:00:00`); d.setDate(d.getDate() + days); return localDate(d);
}
export function defaults(): Answers {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const state = zone.includes("Perth") ? "WA" : zone.includes("Adelaide") ? "SA" : zone.includes("Brisbane") ? "QLD" : zone.includes("Darwin") ? "NT" : zone.includes("Melbourne") ? "VIC" : zone.includes("Hobart") ? "TAS" : "NSW";
  return { job: "", industry: "", awardCode: "", awardName: "", employmentType: "Full-time", classificationId: null, classificationName: "Not sure — check across all levels", workArea: "", state, frequency: "weekly", rate: "", gross: "", hours: "", hours150: 0, hours200: 0, usePayslipHours: false, weekStart: weekStartDate(), shifts: [], conditions: {}, allowances: [], fromPayslip: [] };
}
export function shiftHours(s: RosterShift): number {
  const [a, b] = s.start.split(":").map(Number), [c, d] = s.finish.split(":").map(Number);
  let minutes = c * 60 + d - a * 60 - b; if (minutes <= 0) minutes += 1440;
  return Math.max(0, (minutes - s.break_minutes) / 60);
}
export function applyPayslip(a: Answers, p: ParsedPayslip, awards: Award[], touched: Set<string>): Answers {
  const patch: Partial<Answers> = {}; const tags = new Set(a.fromPayslip);
  const put = <K extends keyof Answers>(key: K, value: Answers[K]) => { if (!touched.has(key)) { patch[key] = value; tags.add(key); } };
  if (p.classification_or_role) put("job", p.classification_or_role);
  if (p.employment_type) put("employmentType", p.employment_type);
  if (p.pay_frequency) put("frequency", p.pay_frequency);
  if (typeof p.base_hourly_rate === "number") put("rate", String(p.base_hourly_rate));
  const gross = p.gross_pay ?? p.total_paid;
  if (typeof gross === "number") put("gross", String(gross));
  if (typeof p.ordinary_hours === "number") { put("hours", String(p.ordinary_hours)); put("usePayslipHours", true); }
  if (p.pay_period_start && /^\d{4}-\d{2}-\d{2}$/.test(p.pay_period_start)) put("weekStart", p.pay_period_start);
  if (typeof p.employee_age === "number") put("age", p.employee_age);
  const hint = p.award_name_or_code?.toLowerCase();
  const award = hint && awards.find(x => x.code.toLowerCase() === hint || x.name.toLowerCase() === hint || hint.includes(x.code.toLowerCase()));
  if (award) { put("awardCode", award.code); put("awardName", award.name); }
  // Only printed multipliers are bucketed; a generic "penalty" is never guessed as 150%.
  let h150 = 0, h200 = 0;
  for (const line of p.line_items ?? []) {
    if (/200%|double time|\b2x\b/i.test(line.description)) h200 += line.hours ?? 0;
    else if (/150%|time.and.a.half|1\.5x/i.test(line.description)) h150 += line.hours ?? 0;
  }
  put("hours150", h150); put("hours200", h200);
  return { ...a, ...patch, fromPayslip: [...tags] };
}