import type { ParsedPayslip } from "@/lib/payslipReader";

export type FieldSource = "payslip" | "missing" | "user";
export type FieldKey =
  | "employer_name" | "job_title" | "pay_period_start" | "pay_period_end" | "employment_type" | "base_hourly_rate"
  | "ordinary_hours" | "ordinary_pay" | "overtime_hours" | "overtime_pay"
  | "weekend_pay" | "public_holiday_pay" | "allowances" | "gross_pay";

export interface Field { key: FieldKey; label: string; value: string; source: FieldSource; kind: "text" | "number" | "date" | "money"; hint?: string }

const LABELS: Record<FieldKey, [string, Field["kind"]]> = {
  employer_name: ["Employer name", "text"],
  job_title: ["Job title (as printed)", "text"],
  pay_period_start: ["Pay period start", "date"],
  pay_period_end: ["Pay period end", "date"],
  employment_type: ["Employment type", "text"],
  base_hourly_rate: ["Base hourly rate ($)", "money"],
  ordinary_hours: ["Ordinary hours", "number"],
  ordinary_pay: ["Ordinary pay ($)", "money"],
  overtime_hours: ["Overtime hours", "number"],
  overtime_pay: ["Overtime pay ($)", "money"],
  weekend_pay: ["Weekend pay ($)", "money"],
  public_holiday_pay: ["Public holiday pay ($)", "money"],
  allowances: ["Allowances", "text"],
  gross_pay: ["Gross pay ($)", "money"],
};

type Line = NonNullable<ParsedPayslip["line_items"]>[number];
const round = (n: number) => Math.round(n * 100) / 100;
/** Sum a printed column; undefined when no matching line printed that value (never zero-filled). */
const sum = (lines: Line[], pick: (l: Line) => number | undefined) => {
  const vals = lines.map(pick).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  return vals.length ? round(vals.reduce((a, b) => a + b, 0)) : undefined;
};
const PH = /public\s*hol/i;
const WEEKEND = /saturday|sunday|\bsat\b|\bsun\b|weekend/i;

/** Map a scan to the confirmation fields. Values only come from what was printed. */
export function fieldsFromPayslip(p: ParsedPayslip): Field[] {
  const lines = p.line_items ?? [];
  const ordinary = lines.filter(l => l.type === "ordinary" && !PH.test(l.description) && !WEEKEND.test(l.description));
  const overtime = lines.filter(l => l.type === "overtime");
  const weekend = lines.filter(l => l.type !== "overtime" && l.type !== "allowance" && WEEKEND.test(l.description) && !PH.test(l.description));
  const holiday = lines.filter(l => l.type !== "allowance" && PH.test(l.description));
  const allowances = lines.filter(l => l.type === "allowance");

  const raw: Record<FieldKey, string | number | undefined> = {
    employer_name: p.employer_name,
    job_title: p.classification_or_role,
    pay_period_start: p.pay_period_start,
    pay_period_end: p.pay_period_end,
    employment_type: p.employment_type,
    base_hourly_rate: p.base_hourly_rate,
    ordinary_hours: p.ordinary_hours ?? sum(ordinary, l => l.hours),
    ordinary_pay: sum(ordinary, l => l.amount),
    overtime_hours: sum(overtime, l => l.hours),
    overtime_pay: sum(overtime, l => l.amount),
    weekend_pay: sum(weekend, l => l.amount),
    public_holiday_pay: sum(holiday, l => l.amount),
    allowances: allowances.length
      ? allowances.map(l => typeof l.amount === "number" ? `${l.description} $${l.amount.toFixed(2)}` : l.description).join("; ")
      : undefined,
    gross_pay: p.gross_pay ?? p.total_paid,
  };
  return (Object.keys(LABELS) as FieldKey[]).map(key => {
    const v = raw[key];
    const present = v !== undefined && v !== null && String(v).trim() !== "";
    return { key, label: LABELS[key][0], kind: LABELS[key][1], value: present ? String(v) : "", source: present ? "payslip" : "missing" };
  });
}

export function editField(fields: Field[], key: FieldKey, value: string): Field[] {
  return fields.map(f => f.key === key ? { ...f, value, source: value.trim() ? "user" : "missing" } : f);
}
