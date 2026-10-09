import { describe, expect, test } from "bun:test";
import { applyPayslip, defaults, industryAwards, matchAwards, shiftHours, typicalShifts } from "../src/features/check/model";

const awards = [
  { code: "MA000002", name: "Clerks Private Sector Award" },
  { code: "MA000004", name: "General Retail Industry Award" },
  { code: "MA000009", name: "Hospitality Industry General Award" },
  { code: "MA000018", name: "Aged Care Award" },
  { code: "MA000100", name: "Social Community Home Care and Disability Services Industry Award" },
];
describe("guided payslip suggestions", () => {
  for (const [role, code] of [["Level 3 Retail Employee", "MA000004"], ["Food and Beverage Grade 2", "MA000009"], ["SCHADS Level 2", "MA000100"], ["Clerk Level 1", "MA000002"], ["Aged care grade 2", "MA000018"]]) {
    test(role, () => expect(matchAwards(role, awards)[0]?.code).toBe(code));
  }
  test("printed code outranks employer and role guesses", () => expect(matchAwards("Clerk Level 1", awards, "MA000004", "Retail shop")[0]?.code).toBe("MA000004"));
  test("employer keywords work and generic levels suggest nothing", () => {
    expect(matchAwards("Level 3 Employee", awards, "", "Retail store")[0]?.code).toBe("MA000004");
    expect(matchAwards("Level 3 Employee", awards)).toEqual([]);
    expect(industryAwards("Healthcare", awards).map(x => x.code)).toEqual(["MA000018", "MA000100"]);
    expect(industryAwards("Other", awards)).toEqual([]);
  });
  test("printed day buckets survive in editable roster without duplicated multipliers", () => {
    const p = { ordinary_hours: 30, pay_period_start: "2026-10-05", pay_period_end: "2026-10-11", line_items: [{ description: "Ordinary weekday", hours: 30 }, { description: "Saturday 150%", hours: 5 }, { description: "Sunday 200%", hours: 4 }, { description: "Public holiday", hours: 3 }] };
    const a = applyPayslip(defaults(), p, awards, new Set());
    expect(a.usePayslipHours).toBe(false);
    expect(a.shifts.find(s => s.day_of_week === "Saturday")?.date).toBe("2026-10-10");
    expect(a.shifts.find(s => s.publicHoliday)?.fromPayslip).toBe(true);
    expect(a.shifts.reduce((sum, s) => sum + shiftHours(s), 0)).toBe(42);
    expect(a.rosterScope).toBe("period");
    expect(a.fromPayslip).toContain("shifts");
  });
  test("night and evening clocks survive, ordinary-only remains hours-only", () => {
    const a = applyPayslip(defaults(), { ordinary_hours: 8, line_items: [{ description: "Night", hours: 8 }, { description: "Evening", hours: 4 }] }, awards, new Set());
    expect(a.shifts.some(s => s.start === "22:00" && s.finish === "06:00")).toBe(true);
    expect(a.shifts.some(s => s.start === "16:00" && s.finish === "20:00")).toBe(true);
    expect(applyPayslip(defaults(), { ordinary_hours: 38 }, awards, new Set()).usePayslipHours).toBe(true);
  });
  test("user-confirmed shifts are never overwritten", () => {
    const a = { ...defaults(), shifts: typicalShifts("2026-10-05", 3) };
    expect(applyPayslip(a, { ordinary_hours: 8, line_items: [{ description: "Saturday", hours: 8 }] }, awards, new Set(["shifts"])).shifts).toEqual(a.shifts);
    expect(typicalShifts("2026-10-10").every(s => !["Saturday", "Sunday"].includes(s.day_of_week))).toBe(true);
  });
});