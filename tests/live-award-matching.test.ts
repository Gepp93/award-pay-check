import { describe, expect, test } from "bun:test";
import { applyPayslip, defaults, dedupeClassifications, matchAwards } from "../src/features/check/model";
import awards from "./fixtures/fwc-awards-2026-10.json";

// Classification rows mirror the real get-classifications response for MA000047 (36 rows, 3 IDs).
// Snapshot of the official Fair Work award list (156 awards) fetched 2026-10-30.
const codes = (role: string, hint = "", employer = "") => matchAwards(role, awards, hint, employer).map(a => a.code);
const UNRELATED = ["MA000047", "MA000128"]; // Aircraft Cabin Crew, Queensland Newspapers

describe("live /check award suggestions", () => {
  test("Civil Crew Foreman: no cabin crew, fast food or newspapers; nothing credible", () => {
    const c = codes("Civil Crew Foreman", "", "Queensland Civil Pty Ltd");
    expect(c).toEqual([]);
  });
  test("Electrician -> Electrical Contracting only", () => expect(codes("Electrician")).toEqual(["MA000025"]));
  test("Retail assistant -> General Retail first", () => expect(codes("Retail assistant")[0]).toBe("MA000004"));
  test("Barista -> hospitality awards only", () => expect(codes("Barista")).toEqual(["MA000009", "MA000119"]));
  test("Fast Food worker -> Fast Food only", () => expect(codes("Fast Food worker")).toEqual(["MA000003"]));
  test("unknown occupation suggests nothing", () => expect(codes("Zookeeper")).toEqual([]));
  test("generic words alone suggest nothing", () => {
    for (const r of ["Crew member", "Team leader", "Level 3 employee", "Foreman", "General worker"]) expect(codes(r)).toEqual([]);
  });
  test("never more than 3, never unrelated", () => {
    for (const r of ["Civil Crew Foreman", "Electrician", "Retail assistant", "Barista", "Fast Food worker", "Chef"]) {
      const c = codes(r); expect(c.length).toBeLessThanOrEqual(3);
      for (const u of UNRELATED) expect(c).not.toContain(u);
    }
  });
  test("a payslip never sets the award", () => {
    const a = applyPayslip(defaults(), { classification_or_role: "Retail assistant", award_name_or_code: "MA000004", employer_name: "Shop Pty Ltd" }, awards, new Set());
    expect(a.job).toBe("Retail assistant");
    expect(a.awardCode).toBe("");
    expect(a.awardName).toBe("");
  });
  test("a printed award code is offered as a possible match, still not selected", () => {
    expect(codes("Level 2", "MA000004")[0]).toBe("MA000004");
  });
});

describe("classification de-duplication", () => {
  test("rows repeated across operative dates collapse by ID; distinct IDs stay", () => {
    const rows = [
      ...Array.from({ length: 12 }, () => ({ classification_fixed_id: 1783, classification: "Cabin crew member" })),
      ...Array.from({ length: 12 }, () => ({ classification_fixed_id: 1785, classification: "Cabin crew manager (wide-bodied aircraft)" })),
      ...Array.from({ length: 7 }, () => ({ classification_fixed_id: 1784, classification: "Cabin crew supervisor (narrow-bodied aircraft, 4 or more crew)" })),
      ...Array.from({ length: 5 }, () => ({ classification_fixed_id: 1784, classification: "Cabin crew supervisor (narrow-bodied aircraft, four or more crew)" })),
    ];
    expect(rows.length).toBe(36);
    expect(dedupeClassifications(rows).map(r => r.classification_fixed_id)).toEqual([1783, 1785, 1784]);
  });
  test("junior and adult levels with different IDs are kept separate", () => {
    const rows = [{ classification_fixed_id: 1, classification: "Retail Employee Level 1" }, { classification_fixed_id: 2, classification: "Retail Employee Level 1 - junior 16 years" }];
    expect(dedupeClassifications(rows)).toHaveLength(2);
  });
});
