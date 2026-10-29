// AwardPay 2.0 preview ↔ Engine v2. Pure functions (unit tested in tests/v2).
// The frontend never decides Complete / Partial / Unsupported: it only turns
// confirmed answers into an engine request. Unknown answers are omitted.
import { RULE_PACKS } from "../../../../supabase/functions/_shared/engine-v2/rulepacks";
import type { Field } from "../payslipFields";

export type Emp = "full_time" | "part_time" | "casual";
export type Src = "payslip" | "user";
export const AWARDS = [
  { code: "MA000004", label: "General Retail Industry Award" },
  { code: "MA000009", label: "Hospitality Industry (General) Award" },
  { code: "MA000003", label: "Fast Food Industry Award" },
] as const;
export const OTHER_AWARD = "OTHER";

export function classificationsFor(code: string): { id: number; label: string }[] {
  const p = RULE_PACKS[code];
  return p ? Object.entries(p.classifications).map(([id, c]) => ({ id: Number(id), label: c.label })) : [];
}
export function overtimeRules(code: string, emp: Emp) {
  const p = RULE_PACKS[code];
  if (!p) return null;
  return { needs: p.overtimeNeeds[emp], clause: p.overtimeNeedsClause[emp], daily: p.dailyMaxClause, span: p.span?.clause, breakClause: p.breakClause };
}

export interface ShiftDraft { date: string; start: string; finish: string; breakMinutes: string; breakStart: string; overtimeMinutes: string }
/** kind "" = not chosen yet (must be chosen before continuing). basis "" = not answered yet. */
export type Basis = "" | "total" | "loading" | "unknown";
export interface PayLineDraft { kind: string; amount: string; source: Src; label: string; basis: Basis }
/** Categories where an amount can be either the whole payment for those hours or only the extra loading. */
export const BASIS_KINDS = ["saturday", "sunday", "public_holiday", "overtime", "evening"];
export const needsBasis = (kind: string) => BASIS_KINDS.includes(kind);
export const lineReady = (l: PayLineDraft) => !!l.kind && (!needsBasis(l.kind) || !!l.basis);
export type Tri = "yes" | "no" | "unknown" | "";

export interface EngineDraft {
  awardCode: string;
  classificationFixedId: number | null; // 0 = not sure
  employmentType: Emp | "";
  rateType: "adult" | "junior" | "apprentice" | "trainee" | "";
  enterpriseAgreement: Tri;
  state: string;
  periodStart: string; periodEnd: string;
  shifts: ShiftDraft[];
  allShifts: Tri;
  workedToRoster: Tri;
  guaranteedHours: string; // "" = not given
  rosterCycleWeeks: string; // "" = not given
  payLines: PayLineDraft[];
  grossPay: string; grossSource: Src | "";
  linesCoverAllWages: Tri;
  holidayAnswers: Record<string, boolean>;
  /** Retail cl 15.2 exceptions the user confirmed. null = not answered / not sure; [] = none apply. */
  spanExceptions: string[] | null;
}

export const emptyDraft: EngineDraft = {
  awardCode: "", classificationFixedId: null, employmentType: "", rateType: "", enterpriseAgreement: "", state: "",
  periodStart: "", periodEnd: "", shifts: [], allShifts: "", workedToRoster: "", guaranteedHours: "", rosterCycleWeeks: "",
  payLines: [], grossPay: "", grossSource: "", linesCoverAllWages: "", holidayAnswers: {}, spanExceptions: null,
};

const money = (s: string) => { const n = Number(String(s).replace(/[$,\s]/g, "")); return s.trim() !== "" && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null; };
const int = (s: string) => { const n = Number(s); return s.trim() !== "" && Number.isFinite(n) && n >= 0 ? Math.round(n) : null; };
const dayOf = (d: string) => new Date(`${d}T00:00:00Z`).getUTCDay();

/** Prefill from CONFIRMED payslip fields only. Each pay line comes from exactly one field, so nothing is counted twice. */
export function prefillFromPayslip(draft: EngineDraft, fields: Field[]): EngineDraft {
  const f = (k: Field["key"]) => fields.find(x => x.key === k);
  const filled = (k: Field["key"]) => { const x = f(k); return x && x.source !== "missing" && x.value.trim() ? x : null; };
  const emp = filled("employment_type")?.value.toLowerCase() ?? "";
  const lines: PayLineDraft[] = [];
  // Only a clearly named line keeps its category. A combined "weekend" line has no single category, so the user must choose.
  // Whether a penalty/overtime amount is the whole payment or only the loading is never guessed.
  const push = (k: Field["key"], kind: string, label: string, basis: Basis) => { const x = filled(k); if (x) lines.push({ kind, amount: x.value, source: x.source as Src, label, basis }); };
  push("ordinary_pay", "ordinary", "Ordinary pay", "total");
  push("weekend_pay", "", "Weekend pay — please confirm the category", "");
  push("public_holiday_pay", "public_holiday", "Public holiday pay", "");
  push("overtime_pay", "overtime", "Overtime pay", "");
  const g = filled("gross_pay");
  return {
    ...draft,
    employmentType: draft.employmentType || (emp.startsWith("full") ? "full_time" : emp.startsWith("part") ? "part_time" : emp.startsWith("casual") ? "casual" : ""),
    periodStart: draft.periodStart || filled("pay_period_start")?.value || "",
    periodEnd: draft.periodEnd || filled("pay_period_end")?.value || "",
    payLines: draft.payLines.length ? draft.payLines : lines,
    grossPay: draft.grossPay || g?.value || "", grossSource: draft.grossSource || (g ? (g.source as Src) : ""),
  };
}

/** Shifts with ordinary-span exposure for awards whose span has confirmable exceptions (Retail cl 15.2). */
export function outsideStandardSpan(d: EngineDraft): boolean {
  const span = RULE_PACKS[d.awardCode]?.span;
  if (!span?.exceptions?.length) return false;
  return d.shifts.some(s => {
    if (!s.date || !/^\d{2}:\d{2}$/.test(s.start) || !/^\d{2}:\d{2}$/.test(s.finish)) return false;
    const m = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
    const a = m(s.start); let b = m(s.finish); if (b <= a) b += 1440;
    const [lo, hi] = span.byDow[dayOf(s.date) as 0];
    return a < lo || b > hi;
  });
}

/** Build the request. Unknown answers are left out, so the engine applies its own rules. */
export function buildRequest(d: EngineDraft) {
  const tri = (t: Tri) => (t === "yes" ? true : t === "no" ? false : undefined);
  const lines = d.payLines
    // Unchosen or unidentified categories go to the engine as "other", which makes the comparison Partial.
    .map(l => {
      const kind = !l.kind || l.kind === "weekend" ? "other" : l.kind;
      const basis = needsBasis(kind) ? (l.basis === "total" || l.basis === "loading" ? l.basis : "unknown") : "total";
      return { kind, amountCents: money(l.amount), label: l.label.slice(0, 80) || undefined, basis };
    })
    .filter((l): l is { kind: string; amountCents: number; label: string | undefined; basis: "total" | "loading" | "unknown" } => l.amountCents != null);
  const gross = money(d.grossPay);
  const gh = Number(d.guaranteedHours);
  const g = d.guaranteedHours.trim() !== "" && Number.isFinite(gh) && gh >= 0 ? Math.round(gh * 60) : null;
  const cycle = int(d.rosterCycleWeeks);
  const holidayDates = Object.entries(d.holidayAnswers).filter(([, v]) => v).map(([k]) => k);
  return {
    awardCode: d.awardCode || OTHER_AWARD,
    classificationFixedId: d.classificationFixedId ?? 0,
    employmentType: d.employmentType || "full_time",
    rateType: d.rateType || "adult",
    state: d.state,
    payPeriod: d.periodStart && d.periodEnd ? { start: d.periodStart, end: d.periodEnd } : undefined,
    shifts: d.shifts.filter(s => s.date && s.start && s.finish).map(s => ({
      date: s.date, start: s.start, finish: s.finish,
      breakMinutes: int(s.breakMinutes) ?? undefined,
      breakStart: s.breakStart || undefined,
      overtimeMinutes: int(s.overtimeMinutes) ?? undefined,
    })),
    arrangement: {
      allShiftsInPeriodIncluded: tri(d.allShifts),
      workedToRoster: tri(d.workedToRoster),
      guaranteedMinutesPerWeek: g ?? undefined,
      rosterCycleWeeks: cycle ?? undefined,
      spanExceptions: outsideStandardSpan(d) && d.spanExceptions ? d.spanExceptions : undefined,
    },
    holidayConfirmation: Object.keys(d.holidayAnswers).length ? { publicHolidayDates: holidayDates } : undefined,
    paid: lines.length || gross != null ? { lines: lines.length ? lines : undefined, grossCents: gross ?? undefined, linesCoverAllWages: tri(d.linesCoverAllWages) } : undefined,
    flags: d.enterpriseAgreement === "yes" ? { enterpriseAgreement: true } : undefined,
  };
}

/** Which questions apply. Order matters: the questionnaire shows them one at a time. */
export type StepId = "award" | "classification" | "employment" | "rate" | "state" | "period" | "shifts" | "allShifts" | "roster" | "guaranteed" | "cycle" | "extended" | "pay";
export function stepsFor(d: EngineDraft): StepId[] {
  const s: StepId[] = ["award"];
  if (d.awardCode === OTHER_AWARD || d.enterpriseAgreement === "yes") return s;
  s.push("classification", "employment", "rate", "state", "period", "shifts", "allShifts");
  const rules = d.awardCode && d.employmentType ? overtimeRules(d.awardCode, d.employmentType) : null;
  if (rules?.needs.includes("roster")) s.push("roster");
  if (rules?.needs.includes("guaranteed")) s.push("guaranteed");
  if (d.employmentType === "casual") s.push("cycle");
  if (outsideStandardSpan(d)) s.push("extended");
  s.push("pay");
  return s;
}
