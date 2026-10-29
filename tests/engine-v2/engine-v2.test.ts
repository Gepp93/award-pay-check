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

// Safety regressions for the accuracy-verification phase. Dollar figures are
// Schedule B (MA000004 B.1.1 / B.2.1, 2026-07-01): L1 ord $27.81, after 6pm and
// Saturday $34.76, Sunday $41.72, PH $62.57.
const R = "MA000004";
const ft = { allShiftsInPeriodIncluded: true, workedToRoster: true };
const base = (over: any = {}) => ({ awardCode: R, classificationFixedId: 112, employmentType: "full_time" as const, rateType: "adult" as const, state: "VIC" as const, payPeriod: { start: "2026-07-06", end: "2026-07-19" }, arrangement: ft, ...over });

describe("engine v2 — safety regressions", () => {
  test("missing break on a shift over 5 hours is Partial and asks for the break", () => {
    const r = assess(base({ shifts: [{ date: "2026-07-07", start: "09:00", finish: "17:00" }] }));
    expect(r.status).toBe("partial");
    expect(r.notAssessed.some(n => n.item === "Break" && n.question)).toBe(true);
  });
  test("a 5-hour shift needs no break answer (Retail cl 16: more than 5 hours)", () => {
    expect(assess(base({ shifts: [{ date: "2026-07-07", start: "09:00", finish: "14:00" }] })).status).toBe("complete");
  });
  test("break without a time on a uniform-rate shift is complete: 7.5 h × $27.81 = $208.58", () => {
    const r = assess(base({ shifts: [{ date: "2026-07-07", start: "09:00", finish: "17:00", breakMinutes: 30 }] }));
    expect(r.status).toBe("complete"); expect(r.assessedEntitlementCents).toBe(20858);
  });
  test("break without a time across rate bands is Partial (never auto-allocated)", () => {
    const r = assess(base({ shifts: [{ date: "2026-07-07", start: "14:00", finish: "20:00", breakMinutes: 30 }] }));
    expect(r.status).toBe("partial");
  });
  test("break with a start time across bands: 3.5 h × $27.81 + 2 h × $34.76 = $166.86", () => {
    const r = assess(base({ shifts: [{ date: "2026-07-07", start: "14:00", finish: "20:00", breakMinutes: 30, breakStart: "16:00" }] }));
    expect(r.status).toBe("complete"); expect(r.assessedEntitlementCents).toBe(9734 + 6952);
  });
  test("full-time without roster confirmation is Partial even with a full week of shifts", () => {
    const shifts = ["2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10"].map(date => ({ date, start: "09:00", finish: "13:00", breakMinutes: 0 }));
    expect(assess(base({ arrangement: { allShiftsInPeriodIncluded: true }, shifts })).status).toBe("partial");
  });
  test("part-time without guaranteed hours is Partial; hours beyond guaranteed hours are Partial", () => {
    const shifts = [{ date: "2026-07-07", start: "09:00", finish: "14:00", breakMinutes: 0 }];
    expect(assess(base({ employmentType: "part_time", arrangement: ft, shifts })).status).toBe("partial");
    expect(assess(base({ employmentType: "part_time", arrangement: { ...ft, guaranteedMinutesPerWeek: 4 * 60 }, shifts })).status).toBe("partial");
    expect(assess(base({ employmentType: "part_time", arrangement: { ...ft, guaranteedMinutesPerWeek: 5 * 60 }, shifts })).status).toBe("complete");
  });
  test("casual over 38 ordinary hours in a week is Partial (Table 10)", () => {
    const shifts = ["2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10"].map(date => ({ date, start: "08:00", finish: "16:00", breakMinutes: 0 }));
    const r = assess(base({ employmentType: "casual", arrangement: { allShiftsInPeriodIncluded: true }, shifts }));
    expect(r.status).toBe("partial");
    expect(r.notAssessed.some(n => n.reason.includes("more than 38"))).toBe(true);
  });
  test("Retail allows one 11-hour ordinary day per week, not two (cl 15.5)", () => {
    const one = [{ date: "2026-07-07", start: "07:00", finish: "18:00", breakMinutes: 0 }];
    expect(assess(base({ shifts: one })).status).toBe("complete");
    const two = [...one, { date: "2026-07-08", start: "07:00", finish: "18:00", breakMinutes: 0 }];
    expect(assess(base({ shifts: two })).status).toBe("partial");
  });
  test("stated overtime does not hide hours outside the span", () => {
    const r = assess(base({ shifts: [{ date: "2026-07-07", start: "13:00", finish: "23:00", breakMinutes: 0, overtimeMinutes: 60 }] }));
    expect(r.status).toBe("partial");
  });
  test("gross-only is always Partial; indicative figure is not an underpayment", () => {
    const shifts = [{ date: "2026-07-07", start: "09:00", finish: "13:00", breakMinutes: 0 }];
    const r = assess(base({ shifts, paid: { grossCents: 10000, grossCoversOnlyTheseShifts: true } }));
    expect(r.status).toBe("partial"); expect(r.underpaymentCents).toBeNull();
    expect(r.paid.indicativeDifferenceCents).toBe(11124 - 10000);
  });
  test("unconfirmed pay lines are Partial; confirmed lines give the difference", () => {
    const shifts = [{ date: "2026-07-07", start: "09:00", finish: "13:00", breakMinutes: 0 }];
    expect(assess(base({ shifts, paid: { lines: [{ kind: "ordinary", amountCents: 10000 }] } })).status).toBe("partial");
    const r = assess(base({ shifts, paid: { lines: [{ kind: "ordinary", amountCents: 10000 }], linesCoverAllWages: true } }));
    expect(r.status).toBe("complete"); expect(r.underpaymentCents).toBe(1124);
  });
  test("pay lines adding to more than gross (possible double count) are Partial", () => {
    const shifts = [{ date: "2026-07-07", start: "09:00", finish: "13:00", breakMinutes: 0 }];
    const r = assess(base({ shifts, paid: { grossCents: 10000, lines: [{ kind: "ordinary", amountCents: 10000 }, { kind: "allowance", amountCents: 500 }], linesCoverAllWages: true } }));
    expect(r.status).toBe("partial"); expect(r.underpaymentCents).toBeNull();
  });
  test("components: Saturday overpaid, weekday underpaid — shortfall kept separate from net", () => {
    // Weekday 4 h = $111.24; Saturday 4 h × $34.76 = $139.04.
    const shifts = [{ date: "2026-07-07", start: "09:00", finish: "13:00", breakMinutes: 0 }, { date: "2026-07-11", start: "09:00", finish: "13:00", breakMinutes: 0 }];
    const r = assess(base({ shifts, paid: { lines: [{ kind: "ordinary", amountCents: 10000 }, { kind: "saturday", amountCents: 15000 }], linesCoverAllWages: true } }));
    expect(r.status).toBe("complete");
    expect(r.differenceCents).toBe(25028 - 25000);
    expect(r.componentShortfallCents).toBe(1124);
    expect(r.paid.components!.find(c => c.kind === "saturday")!.differenceCents).toBe(13904 - 15000);
  });
  test("casual loading line on a full-time employee is Partial", () => {
    const shifts = [{ date: "2026-07-07", start: "09:00", finish: "13:00", breakMinutes: 0 }];
    expect(assess(base({ shifts, paid: { lines: [{ kind: "ordinary", amountCents: 9000 }, { kind: "casual_loading", amountCents: 2200 }], linesCoverAllWages: true } })).status).toBe("partial");
  });
  test("midnight crossing into a public holiday splits at midnight (NSW 25 Dec 2026)", () => {
    // Casual Retail span Thu 24 Dec: hours after 9pm are outside span, so Partial; the PH split still applies.
    const r = assess({ awardCode: R, classificationFixedId: 112, employmentType: "full_time", rateType: "adult", state: "NSW", payPeriod: { start: "2026-12-21", end: "2027-01-03" }, arrangement: ft, shifts: [{ date: "2026-12-24", start: "22:00", finish: "02:00", breakMinutes: 0 }] });
    expect(r.lines.find(l => l.kind === "public_holiday")!.minutes).toBe(120);
  });
  test("QLD Christmas Eve 2026 is a part-day holiday from 6pm", () => {
    const r = assess(base({ state: "QLD", payPeriod: { start: "2026-12-21", end: "2027-01-03" }, shifts: [{ date: "2026-12-24", start: "16:00", finish: "20:00", breakMinutes: 0 }] }));
    expect(r.lines.find(l => l.kind === "public_holiday")!.minutes).toBe(120);
  });
  test("regional holiday (Melbourne Cup 2026) asks for confirmation, then uses the answer", () => {
    const shifts = [{ date: "2026-11-03", start: "09:00", finish: "13:00", breakMinutes: 0 }];
    const pp = { start: "2026-11-02", end: "2026-11-15" };
    expect(assess(base({ payPeriod: pp, shifts })).status).toBe("partial");
    const r = assess(base({ payPeriod: pp, shifts, holidayConfirmation: { publicHolidayDates: ["2026-11-03"] } }));
    expect(r.status).toBe("complete"); expect(r.assessedEntitlementCents).toBe(4 * 6257);
  });
  test("NSW Bank Holiday is not treated as a general public holiday", () => {
    const r = assess(base({ state: "NSW", payPeriod: { start: "2026-08-03", end: "2026-08-16" }, shifts: [{ date: "2026-08-03", start: "09:00", finish: "13:00", breakMinutes: 0 }] }));
    expect(r.status).toBe("complete"); expect(r.assessedEntitlementCents).toBe(4 * 2781);
  });
  test("historical rate: a 2024 pay period uses the 2024-25 rate ($25.65)", () => {
    const r = assess(base({ payPeriod: { start: "2024-10-14", end: "2024-10-27" }, shifts: [{ date: "2024-10-15", start: "09:00", finish: "13:00", breakMinutes: 0 }] }));
    expect(r.assessedEntitlementCents).toBe(10260);
  });
  test("below minimum engagement is Partial (casual 2 h Retail; minimum 3 h, cl 11.2)", () => {
    const r = assess(base({ employmentType: "casual", arrangement: { allShiftsInPeriodIncluded: true }, shifts: [{ date: "2026-07-07", start: "09:00", finish: "11:00", breakMinutes: 0 }] }));
    expect(r.status).toBe("partial");
  });
  test("junior rates are never replaced by adult rates", () => {
    const r = assess(base({ rateType: "junior", shifts: [{ date: "2026-07-07", start: "09:00", finish: "13:00", breakMinutes: 0 }] }));
    expect(r.status).toBe("unsupported"); expect(r.lines.length).toBe(0);
  });
});

// Pay-mapping phase. Figures: MA000004 Schedule B.1.1 (2026-07-01) L1 ordinary $27.81, Saturday 125% $34.76.
// 8 h Saturday = $278.08 award minimum; as ordinary base 8 × $27.81 = $222.48 plus loading $55.60.
describe("engine v2 — total vs loading pay lines", () => {
  const sat = CASES.find(c => c.id === "R2")!.input;
  const run = (lines: { kind: string; amountCents: number; basis?: "total" | "loading" | "unknown" }[]) =>
    assess({ ...sat, paid: { lines: lines as never, linesCoverAllWages: true } });
  test("combined Saturday payment and ordinary + loading lines give the same comparison (paid correctly)", () => {
    const a = run([{ kind: "saturday", amountCents: 27808 }]);
    const b = run([{ kind: "ordinary", amountCents: 22248 }, { kind: "saturday", amountCents: 5560, basis: "loading" }]);
    expect(a.status).toBe("complete"); expect(b.status).toBe("complete");
    expect(a.underpaymentCents).toBe(0); expect(b.underpaymentCents).toBe(0);
    expect(b.paid.components!.find(c => c.kind === "saturday")!.entitledCents).toBe(5560);
    expect(b.paid.components!.find(c => c.kind === "ordinary")!.entitledCents).toBe(22248);
  });
  test("same equivalence when underpaid by $10.00", () => {
    const a = run([{ kind: "saturday", amountCents: 26808 }]);
    const b = run([{ kind: "ordinary", amountCents: 22248 }, { kind: "saturday", amountCents: 4560, basis: "loading" }]);
    expect(a.underpaymentCents).toBe(1000); expect(b.underpaymentCents).toBe(1000);
  });
  test("loading line with no ordinary line, unknown basis, or mixed basis → Partial", () => {
    expect(run([{ kind: "saturday", amountCents: 5560, basis: "loading" }]).status).toBe("partial");
    expect(run([{ kind: "saturday", amountCents: 27808, basis: "unknown" }]).status).toBe("partial");
    expect(run([{ kind: "ordinary", amountCents: 22248 }, { kind: "saturday", amountCents: 5560, basis: "loading" }, { kind: "saturday", amountCents: 100 }]).status).toBe("partial");
  });
  test("an unidentified line is never treated as ordinary → Partial", () => {
    const r = run([{ kind: "other", amountCents: 27808 }]);
    expect(r.status).toBe("partial"); expect(r.underpaymentCents).toBeNull();
  });
});

// Retail cl 15.2: (a) newsagency from 5 am, (b) video shop until midnight, (c) until 11 pm all days if trading
// extends beyond 9 pm Mon–Fri or 6 pm Sat/Sun. Monday 2026-07-06 14:00–22:00 casual L1.
describe("engine v2 — Retail extended trading (cl 15.2)", () => {
  const base = CASES.find(c => c.id === "R5")!.input;
  const mk = (spanExceptions?: string[]) => assess({ ...base, arrangement: { ...base.arrangement, spanExceptions }, shifts: [{ date: "2026-07-06", start: "14:00", finish: "22:00", breakMinutes: 0 }] });
  test("not known → Partial with the cl 15.2 question", () => {
    const r = mk(undefined);
    expect(r.status).toBe("partial");
    expect(r.notAssessed.some(n => n.question?.includes("trades beyond 9 pm"))).toBe(true);
  });
  test("store trades late (cl 15.2(c)) → 9–10 pm is ordinary; no span item", () => {
    const r = mk(["late_trading"]);
    expect(r.notAssessed.some(n => n.reason.includes("span"))).toBe(false);
  });
  test("none apply → hours after 9 pm are overtime, which isn't entered → Partial", () => {
    const r = mk([]); expect(r.status).toBe("partial");
    expect(r.notAssessed.some(n => n.reason.includes("Those hours are overtime"))).toBe(true);
  });
  test("newsagency exception does not extend the evening → still outside span", () => {
    expect(mk(["newsagency"]).notAssessed.some(n => n.reason.includes("outside the span"))).toBe(true);
  });
  test("cl 15.2(c) ends at 11 pm: a shift to 11.30 pm is still partly outside", () => {
    const r = assess({ ...base, arrangement: { ...base.arrangement, spanExceptions: ["late_trading"] }, shifts: [{ date: "2026-07-06", start: "15:30", finish: "23:30", breakMinutes: 0 }] });
    expect(r.notAssessed.some(n => n.reason.includes("0.50 hours outside the span"))).toBe(true);
  });
});
