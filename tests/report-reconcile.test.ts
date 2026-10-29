import { describe, expect, test } from "bun:test";
import { reconcile, TOTAL_UNAVAILABLE, TOTAL_MISSING, NOT_RECONCILED } from "../src/components/report/reconcile";

describe("saved report reconciliation (display only)", () => {
  test("historical range report shows explanation, not $0.00", () => {
    const r = reconcile({ mode: "unsure", awardPayTotal: 0 }, "904.88", 669.09);
    expect(r.awardTotal).toBeNull();
    expect(r.totalNote).toBe(TOTAL_UNAVAILABLE);
    expect(r.note).toBeNull();
  });
  test("missing award total is not compared", () => {
    const r = reconcile({ underpayment: 50 }, "500", 50);
    expect(r.awardTotal).toBeNull();
    expect(r.totalNote).toBe(TOTAL_MISSING);
    expect(r.note).toBeNull();
  });
  test("comparable figures that reconcile get no note", () => {
    expect(reconcile({ awardPayTotal: 800 }, "700", 100).note).toBeNull();
  });
  test("comparable figures that differ get a limitation note", () => {
    expect(reconcile({ awardPayTotal: 800 }, "700", 150).note).toBe(NOT_RECONCILED);
  });
  test("unknown actual paid is not compared", () => {
    expect(reconcile({ awardPayTotal: 800 }, undefined, 150).note).toBeNull();
  });
});
