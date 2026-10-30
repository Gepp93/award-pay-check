import { describe, expect, test } from "bun:test";
import { projectLegacySummary } from "../supabase/functions/_shared/tier-access";

describe("$9 Pay Check view of a public-checker report", () => {
  const full = { awardName: "General Retail", baseRate: 26.55, underpayment: 120, breakdown: { ordinary: 400 }, shifts: [{ day: "Mon" }], potentialAllowances: [{ id: "a", name: "Meal", amount: 15.2, reason: "x" }], reasons: ["Saturday penalty"] };
  const view = projectLegacySummary(full) as any;
  test("never includes $29-only line detail", () => {
    expect(view.breakdown).toBeUndefined();
    expect(view.shifts).toBeUndefined();
    expect(view.potentialAllowances).toEqual([{ id: "a", name: "Meal" }]);
  });
  test("keeps the headline and issue list", () => {
    expect(view.underpayment).toBe(120);
    expect(view.reasons).toEqual(["Saturday penalty"]);
  });
});
