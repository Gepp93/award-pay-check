import { supabase } from "@/integrations/supabase/client";
import type { Answers, RosterShift } from "./model";
import { shiftHours } from "./model";

/** Adapter only: existing official calculation contract and math are unchanged. */
export async function calculateAnswers(a: Answers, stage: (value: number) => void) {
  stage(0);
  const award = await supabase.functions.invoke("get-awards", { body: { search: a.awardCode } });
  if (award.error) throw new Error("We couldn't match your award. Please try again.");
  stage(1);
  if (a.classificationId) {
    const rate = await supabase.functions.invoke("get-pay-rates", { body: { awardId: a.awardCode, classificationFixedId: a.classificationId } });
    if (rate.error) throw new Error("Official rates are unavailable. Your answers are saved; please try again.");
  } else {
    const levels = await supabase.functions.invoke("get-classifications", { body: { awardId: a.awardCode } });
    if (levels.error) throw new Error("Official levels are unavailable. Please try again.");
  }
  stage(2);
  const rosterHours = a.shifts.reduce((total, s) => total + shiftHours(s), 0);
  const hours = a.usePayslipHours ? Number(a.hours) + a.hours150 + a.hours200 : rosterHours;
  if (!(hours > 0)) throw new Error("Add your hours before checking your pay.");
  const actualPaid = a.gross !== "" ? Number(a.gross) : Number(a.rate) * hours;
  const effectiveRate = a.rate !== "" ? Number(a.rate) : actualPaid / hours;
  const shifts: RosterShift[] = a.usePayslipHours
    ? [{ date: a.weekStart, day_of_week: new Date(`${a.weekStart}T12:00:00`).toLocaleDateString("en-AU", { weekday: "long" }), start: "09:00", finish: "17:00", break_minutes: 30 }]
    : a.shifts;
  const responses: any[] = [];
  for (const shift of shifts) {
    const share = a.usePayslipHours ? 1 : shiftHours(shift) / hours;
    const advancedPayslip = {
      payslipBaseRate: effectiveRate,
      hoursAtBase: a.usePayslipHours ? Number(a.hours) : shiftHours(shift),
      hoursAt150: a.hours150 * share, hoursAt200: a.hours200 * share,
      paidAllowances: a.allowances.some(x => x.received) ? "yes" : "no",
      allowanceDetails: a.allowances.filter(x => x.received).map(x => `${x.type}: ${x.amount_per_period}`).join(", ") || null,
    };
    const weekend = [0, 6].includes(new Date(`${shift.date}T12:00:00`).getDay());
    const { data, error } = await supabase.functions.invoke("calculate-shift-pay", {
      body: {
        awardCode: a.awardCode, classificationId: a.classificationId, employmentType: a.employmentType,
        workArea: a.workArea || undefined, date: shift.date, startTime: shift.start, finishTime: shift.finish,
        breakMinutes: shift.break_minutes, workedWeekend: weekend, workedPublicHoliday: Boolean(shift.publicHoliday),
        droveOwnCar: Boolean(a.conditions.droveOwnCar), workedOver10Hours: shiftHours(shift) > 10,
        actualPaid: actualPaid * share, advancedPayslip, allowanceConditions: a.conditions,
      },
    });
    if (error || !data || data.error) throw new Error("We couldn't finish checking every shift. Your answers are saved; please try again.");
    responses.push(data);
  }
  // Aggregate returned official results only. Never average or invent official rates.
  const first = responses[0];
  const result = { ...first, awardName: a.awardName, classification: a.classificationName, actualPaid,
    shiftResults: responses.map((r, i) => ({ ...r, shift: shifts[i] })),
  };
  const sum = (key: string) => responses.reduce((v, r) => v + (Number(r[key]) || 0), 0);
  if (first.mode === "unsure") {
    const candidates = new Map<string, any>();
    for (const r of responses) for (const candidate of r.likelyClassifications ?? []) {
      const id = candidate.classificationId; const prev = candidates.get(id);
      candidates.set(id, { ...candidate, count: (prev?.count ?? 0) + 1,
        awardPayTotal: (prev?.awardPayTotal ?? 0) + (Number(candidate.awardPayTotal) || 0),
        possibleUnderpayment: (prev?.possibleUnderpayment ?? 0) + (Number(candidate.possibleUnderpayment) || 0),
      });
    }
    const complete = [...candidates.values()].filter(x => x.count === responses.length);
    result.overallMinUnderpayment = complete.length ? Math.min(...complete.map(x => x.possibleUnderpayment)) : sum("overallMinUnderpayment");
    result.overallMaxUnderpayment = complete.length ? Math.max(...complete.map(x => x.possibleUnderpayment)) : sum("overallMaxUnderpayment");
    result.likelyClassifications = complete;
  } else {
    result.underpayment = sum("underpayment"); result.awardPayTotal = sum("awardPayTotal");
  }
  result.reasons = [...new Set(responses.flatMap(r => r.reasons ?? []))];
  result.potentialAllowances = [...new Map(responses.flatMap(r => r.potentialAllowances ?? []).map(x => [x.id ?? x.name, x])).values()];
  const advancedPayslip = { payslipBaseRate: effectiveRate, hoursAtBase: a.usePayslipHours ? Number(a.hours) : hours, hoursAt150: a.hours150, hoursAt200: a.hours200, paidAllowances: "no", allowanceDetails: null };
  return { result, shiftDetails: { awardCode: a.awardCode, classificationId: a.classificationId, employmentType: a.employmentType, date: a.weekStart, startTime: shifts[0]?.start, finishTime: shifts[0]?.finish, breakMinutes: shifts[0]?.break_minutes, actualPaid: actualPaid.toFixed(2), hours_worked: a.usePayslipHours ? [] : shifts, payPeriodType: a.frequency, hoursOnly: a.usePayslipHours, state: a.state, age: a.age }, advancedPayslip };
}