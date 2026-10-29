import { describe, expect, it } from "vitest";
import { EXAMPLES, exampleTotalCents, rowDiffCents } from "../src/features/v2/examples";

describe("homepage illustrative examples", () => {
  it("defines all eight industries", () => {
    expect(Object.keys(EXAMPLES).sort()).toEqual(["agriculture","construction","education","healthcare","hospitality","manufacturing","retail","transport"]);
  });
  it("never shows construction-only allowances elsewhere", () => {
    for (const e of Object.values(EXAMPLES)) if (e.industry !== "construction")
      expect(e.rows.some((r) => /tool allowance|RDO/i.test(r.label))).toBe(false);
  });
  it("total equals sum of row differences when figures exist", () => {
    const e = { ...EXAMPLES.retail, rows: [
      { label: "a", detail: "", figures: { hours: 8, paidCents: 3000, awardCents: 3500 } },
      { label: "b", detail: "", figures: { hours: 2, paidCents: 1000, awardCents: 1250 } }] };
    expect(rowDiffCents(e.rows[0])).toBe(4000);
    expect(exampleTotalCents(e)).toBe(4500);
  });
  it("shows no total for conceptual (unverified) examples", () => {
    for (const e of Object.values(EXAMPLES)) expect(exampleTotalCents(e)).toBeNull();
  });
});
