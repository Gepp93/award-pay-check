import { describe, expect, it } from "vitest";
import { editField, fieldsFromPayslip } from "../src/features/v2/payslipFields";

const get = (fs: ReturnType<typeof fieldsFromPayslip>, k: string) => fs.find(f => f.key === k)!;

describe("payslip confirmation fields", () => {
  const full = fieldsFromPayslip({
    employer_name: "Sunrise Building Pty Ltd", base_hourly_rate: 30.5, ordinary_hours: 60, gross_pay: 2479.52,
    line_items: [
      { description: "Ordinary Hours", hours: 60, rate: 30.5, amount: 1830, type: "ordinary" },
      { description: "Saturday Penalty 125%", hours: 8, amount: 305.04, type: "penalty" },
      { description: "Overtime First 2 Hrs", hours: 4, amount: 183, type: "overtime" },
      { description: "Overtime After 2 Hrs", hours: 2, amount: 122, type: "overtime" },
      { description: "Tool Allowance", amount: 39.48, type: "allowance" },
    ],
  });

  it("sums printed overtime lines", () => {
    expect(get(full, "overtime_hours").value).toBe("6");
    expect(get(full, "overtime_pay").value).toBe("305");
  });
  it("separates weekend pay and lists allowances", () => {
    expect(get(full, "weekend_pay").value).toBe("305.04");
    expect(get(full, "allowances").value).toBe("Tool Allowance $39.48");
  });
  it("marks unprinted fields missing instead of filling them", () => {
    expect(get(full, "employment_type")).toMatchObject({ value: "", source: "missing" });
    expect(get(full, "public_holiday_pay")).toMatchObject({ value: "", source: "missing" });
    expect(get(full, "pay_period_start").source).toBe("missing");
  });
  it("marks edits as entered by the user", () => {
    const edited = editField(full, "employment_type", "Casual");
    expect(get(edited, "employment_type")).toMatchObject({ value: "Casual", source: "user" });
    expect(get(editField(edited, "employment_type", ""), "employment_type").source).toBe("missing");
  });
});
