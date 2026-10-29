import { describe, expect, test } from "bun:test";
import { assess, penaltyRateCents } from "../../supabase/functions/_shared/engine-v2/engine";
import { CASES } from "./cases";

describe("engine v2 — hand-worked Fair Work cases", () => {
  for (const c of CASES) {
    test(`${c.id} ${c.title}`, () => {
      const r = assess(c.input);
      expect(r.status).toBe(c.expect.status);
      if (c.expect.entitlementCents != null) expect(r.assessedEntitlementCents).toBe(c.expect.entitlementCents);
      if (c.expect.comparableCents !== undefined) expect(r.paid.comparableCents).toBe(c.expect.comparableCents);
      if (c.expect.underpaymentCents !== undefined) expect(r.underpaymentCents).toBe(c.expect.underpaymentCents);
      if (r.status !== "complete") expect(r.underpaymentCents).toBeNull();
      if (r.status === "unsupported") expect(r.lines.length).toBe(0);
      expect(r.engine).toBe("v2");
    });
  }
});

describe("engine v2 — rules", () => {
  test("percent rounding matches Schedule B (half up to the cent)", () => {
    expect(penaltyRateCents(2781, 125)).toBe(3476); // 34.7625
    expect(penaltyRateCents(2781, 150)).toBe(4172); // 41.715
    expect(penaltyRateCents(2781, 250)).toBe(6953); // 69.525
  });
  test("no invented allowances: v2 output never contains a $20 or $15 flat item", () => {
    const r = assess(CASES.find(c => c.id === "R7")!.input);
    expect(r.lines.every(l => l.sources.length > 0)).toBe(true);
    expect(r.lines.some(l => l.category.toLowerCase().includes("allowance"))).toBe(false);
  });
  test("every line cites a Fair Work record and operative date", () => {
    for (const c of CASES) for (const l of assess(c.input).lines) for (const s of l.sources) {
      expect(s.id).toBeDefined(); expect(s.operativeFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
