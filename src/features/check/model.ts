import type { ParsedPayslip } from "@/lib/payslipReader";

export type Step = "start" | "job" | "industry" | "award" | "employment" | "level" | "age" | "pay" | "hours" | "allowances" | "review" | "loading" | "result";
export interface Award { code: string; name: string }
export interface Classification { classification_fixed_id: string; classification: string; clause_description?: string }
export interface RosterShift { date: string; day_of_week: string; start: string; finish: string; break_minutes: number; publicHoliday?: boolean; fromPayslip?: boolean }
export interface Answers {
  job: string; industry: string; awardCode: string; awardName: string; employmentType: string;
  classificationId: string | null; classificationName: string; workArea: string; age?: number;
  state: string; frequency: "weekly" | "fortnightly" | "monthly"; rate: string; gross: string;
  hours: string; hours150: number; hours200: number; usePayslipHours: boolean; weekStart: string;
  shifts: RosterShift[]; conditions: Record<string, boolean>; allowances: { type: string; received: boolean; amount_per_period: number }[];
  fromPayslip: string[];
  rosterScope?: "period" | "typical-week";
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

const INDUSTRY_WORDS: Record<string, string[]> = {
  Retail: ["retail", "shop", "store", "sales"],
  Hospitality: ["hospitality", "restaurant", "cafe", "hotel", "food", "beverage", "barista"],
  Healthcare: ["health", "medical", "nurse", "nurses", "aged", "care", "disability", "schads", "social", "community"],
  Construction: ["construction", "building", "plumber", "plumbing", "electrical", "electrician", "carpentry", "carpenter"],
  Manufacturing: ["manufacturing", "factory", "production"], Education: ["education", "school", "teacher", "teachers", "childcare", "children"],
  Transport: ["transport", "logistics", "driver", "warehouse", "storage", "road"],
};
const words = (text: string) => text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
const overlap = (a: string[], b: string[]) => a.filter(w => b.includes(w)).length;
export function industryAwards(industry: string, awards: Award[]): Award[] {
  const keywords = INDUSTRY_WORDS[industry] ?? [];
  return awards.filter(a => overlap(words(a.name), keywords) > 0);
}
/** Suggestions only: the worker always confirms the official award. */
export function matchAwards(role: string, awards: Award[], hint = "", employer = ""): Award[] {
  const roleWords = words(role), hintWords = words(hint), employerWords = words(employer);
  const all = [...roleWords, ...hintWords, ...employerWords];
  const scored = awards.map(award => {
    const nameWords = words(award.name);
    let score = overlap(nameWords, roleWords) * 5 + overlap(nameWords, hintWords) * 8 + overlap(nameWords, employerWords);
    if (hint.toLowerCase().includes(award.code.toLowerCase()) || (hint && hint.toLowerCase() === award.name.toLowerCase())) score += 1000;
    for (const job of JOBS) if (job.codes.includes(award.code)) score += overlap(words(job.title), roleWords) * 4;
    for (const [industry, keywords] of Object.entries(INDUSTRY_WORDS)) {
      if (industryAwards(industry, [award]).length) score += overlap(all, keywords) * 2;
    }
    if (all.some(w => ["clerk", "clerks", "admin", "administration", "office"].includes(w)) && award.code === "MA000002") score += 40;
    if (all.some(w => ["schads", "social", "community", "disability"].includes(w)) && award.code === "MA000100") score += 60;
    if (all.includes("aged") && award.code === "MA000018") score += 70;
    // Generic classification words do not establish an industry.
    if (!all.some(w => !["level", "grade", "employee", "worker", "award", "the", "and", "of"].includes(w) && !/^\d+$/.test(w))) score = 0;
    return { award, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(x => x.award);
}

export function typicalShifts(start: string, count = 5): RosterShift[] {
  return Array.from({ length: 7 }, (_, i) => dateOffset(start, i))
    .filter(date => ![0, 6].includes(new Date(`${date}T12:00:00`).getDay())).slice(0, count)
    .map(date => ({ date, day_of_week: new Date(`${date}T12:00:00`).toLocaleDateString("en-AU", { weekday: "long" }), start: "09:00", finish: "17:00", break_minutes: 30 }));
}

export function payslipRoster(p: ParsedPayslip, start: string): RosterShift[] {
  const lines = (p.line_items ?? []).filter(l => (l.hours ?? 0) > 0 && /saturday|sunday|public\s*holiday|evening|night/i.test(l.description));
  if (!lines.length) return [];
  const periodDays = p.pay_period_end ? Math.max(1, Math.round((new Date(`${p.pay_period_end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / 86400000) + 1) : p.pay_frequency === "fortnightly" ? 14 : p.pay_frequency === "monthly" ? 31 : 7;
  const dates = Array.from({ length: Math.min(periodDays, 62) }, (_, i) => dateOffset(start, i));
  const roster: RosterShift[] = [];
  const add = (hours: number, candidates: string[], begin: number, holiday = false) => {
    if (!(hours > 0) || !candidates.length) return;
    const count = Math.min(candidates.length, Math.max(1, Math.ceil(hours / 8)));
    for (let i = 0; i < count; i++) {
      const date = candidates[i];
      const minutes = Math.round(hours / count * 60);
      const finish = (begin * 60 + minutes) % 1440;
      roster.push({ date, day_of_week: new Date(`${date}T12:00:00`).toLocaleDateString("en-AU", { weekday: "long" }), start: `${String(begin).padStart(2, "0")}:00`, finish: `${String(Math.floor(finish / 60)).padStart(2, "0")}:${String(finish % 60).padStart(2, "0")}`, break_minutes: 0, publicHoliday: holiday, fromPayslip: true });
    }
  };
  for (const line of lines) {
    const holiday = /public\s*holiday/i.test(line.description), saturday = /saturday/i.test(line.description), sunday = /sunday/i.test(line.description);
    const candidates = dates.filter(date => { const day = new Date(`${date}T12:00:00`).getDay(); return saturday ? day === 6 : sunday ? day === 0 : ![0, 6].includes(day); });
    add(line.hours ?? 0, candidates, /night/i.test(line.description) ? 22 : /evening/i.test(line.description) ? 16 : 9, holiday);
  }
  const ordinaryLine = (p.line_items ?? []).find(l => /ordinary|weekday|base/i.test(l.description) && !/saturday|sunday|public\s*holiday|evening|night/i.test(l.description) && (l.hours ?? 0) > 0);
  const ordinary = ordinaryLine?.hours ?? p.ordinary_hours ?? 0;
  const weekdays = dates.filter(date => ![0, 6].includes(new Date(`${date}T12:00:00`).getDay()));
  const unused = weekdays.filter(date => !roster.some(s => s.date === date));
  add(ordinary, unused.length ? unused : weekdays.length ? weekdays : dates, 9);
  return roster.sort((a, b) => a.date.localeCompare(b.date));
}

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
  const award = matchAwards(p.classification_or_role ?? "", awards, p.award_name_or_code, p.employer_name)[0];
  if (award) { put("awardCode", award.code); put("awardName", award.name); }
  // Only printed multipliers are bucketed; a generic "penalty" is never guessed as 150%.
  let h150 = 0, h200 = 0;
  for (const line of p.line_items ?? []) {
    if (/200%|double time|\b2x\b/i.test(line.description)) h200 += line.hours ?? 0;
    else if (/150%|time.and.a.half|1\.5x/i.test(line.description)) h150 += line.hours ?? 0;
  }
  put("hours150", h150); put("hours200", h200);
  const roster = payslipRoster(p, p.pay_period_start ?? a.weekStart);
  if (roster.length && !touched.has("shifts") && !touched.has("usePayslipHours")) {
    put("shifts", roster); put("usePayslipHours", false); put("rosterScope", "period");
  }
  return { ...a, ...patch, fromPayslip: [...tags] };
}