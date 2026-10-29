import { describe, expect, test } from "bun:test";
import { buildRequest, emptyDraft, prefillFromPayslip, resolveKind, stepsFor } from "../../src/features/v2/engine/model";
import type { Field } from "../../src/features/v2/payslipFields";

const F = (key: Field["key"], value: string, source: Field["source"]): Field => ({ key, value, source, label: key, kind: "text" });

describe("2.0 preview → Engine v2 mapping", () => {
  test("only confirmed values prefill; missing fields stay empty", () => {
    const d = prefillFromPayslip(emptyDraft, [F("pay_period_start", "2026-07-06", "payslip"), F("pay_period_end", "", "missing"), F("employment_type", "Casual", "user"), F("ordinary_pay", "250.32", "payslip"), F("overtime_pay", "", "missing")]);
    expect(d.periodStart).toBe("2026-07-06");
    expect(d.periodEnd).toBe("");
    expect(d.employmentType).toBe("casual");
    expect(d.payLines).toEqual([{ kind: "ordinary", amount: "250.32", source: "payslip", label: "Ordinary pay" }]);
  });
  test("each pay line comes from one field — no double counting", () => {
    const d = prefillFromPayslip(emptyDraft, [F("ordinary_pay", "100", "payslip"), F("weekend_pay", "50", "payslip"), F("public_holiday_pay", "20", "user"), F("overtime_pay", "30", "payslip"), F("gross_pay", "200", "payslip")]);
    expect(d.payLines.map(l => l.kind)).toEqual(["ordinary", "weekend", "public_holiday", "overtime"]);
    expect(d.payLines.reduce((t, l) => t + Number(l.amount), 0)).toBe(200);
    expect(d.grossPay).toBe("200");
  });
  test("combined weekend pay only maps to a day when all weekend shifts share it", () => {
    const sh = (date: string) => ({ date, start: "09:00", finish: "13:00", breakMinutes: "", breakStart: "", overtimeMinutes: "" });
    expect(resolveKind("weekend", [sh("2026-07-11")])).toBe("saturday");
    expect(resolveKind("weekend", [sh("2026-07-12")])).toBe("sunday");
    expect(resolveKind("weekend", [sh("2026-07-11"), sh("2026-07-12")])).toBe("other");
  });
  test("unknown answers are omitted, never filled in", () => {
    const r = buildRequest({ ...emptyDraft, awardCode: "MA000004", classificationFixedId: 112, employmentType: "full_time", rateType: "adult", state: "NSW", allShifts: "unknown", workedToRoster: "",
      shifts: [{ date: "2026-07-07", start: "09:00", finish: "17:00", breakMinutes: "", breakStart: "", overtimeMinutes: "" }] });
    expect(r.shifts[0].breakMinutes).toBeUndefined();
    expect(r.shifts[0].overtimeMinutes).toBeUndefined();
    expect(r.arrangement.allShiftsInPeriodIncluded).toBeUndefined();
    expect(r.arrangement.workedToRoster).toBeUndefined();
    expect(r.payPeriod).toBeUndefined();
    expect(r.paid).toBeUndefined();
  });
  test("break of 0 is sent as 0; guaranteed hours convert to minutes", () => {
    const r = buildRequest({ ...emptyDraft, awardCode: "MA000004", classificationFixedId: 112, employmentType: "part_time", rateType: "adult", state: "NSW", guaranteedHours: "20",
      shifts: [{ date: "2026-07-07", start: "09:00", finish: "17:00", breakMinutes: "0", breakStart: "", overtimeMinutes: "" }] });
    expect(r.shifts[0].breakMinutes).toBe(0);
    expect(r.arrangement.guaranteedMinutesPerWeek).toBe(1200);
  });
  test("other award / not-sure classification are sent so the engine decides", () => {
    const r = buildRequest({ ...emptyDraft, awardCode: "OTHER", state: "NSW", shifts: [{ date: "2026-07-07", start: "09:00", finish: "13:00", breakMinutes: "0", breakStart: "", overtimeMinutes: "" }] });
    expect(r.awardCode).toBe("OTHER");
    expect(r.classificationFixedId).toBe(0);
  });
  test("questions follow the award's overtime rules", () => {
    const base = { ...emptyDraft, enterpriseAgreement: "no" as const };
    expect(stepsFor({ ...base, awardCode: "MA000004", employmentType: "part_time" })).toContain("guaranteed");
    expect(stepsFor({ ...base, awardCode: "MA000004", employmentType: "part_time" })).not.toContain("roster");
    expect(stepsFor({ ...base, awardCode: "MA000009", employmentType: "part_time" })).toContain("roster");
    expect(stepsFor({ ...base, awardCode: "MA000003", employmentType: "part_time" })).toEqual(expect.arrayContaining(["roster", "guaranteed"]));
    expect(stepsFor({ ...base, awardCode: "MA000004", employmentType: "casual" })).toEqual(expect.arrayContaining(["cycle"]));
    expect(stepsFor({ ...base, awardCode: "OTHER" })).toEqual(["award"]);
  });
});
