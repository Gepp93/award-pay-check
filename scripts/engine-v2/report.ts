// Generates tests/engine-v2/REPORT.md: every hand-worked case with expected vs
// actual, plus v1 vs v2 comparisons. v1 maths is loaded verbatim from
// supabase/functions/calculate-shift-pay/index.ts (computePeriodComparison) and
// fed the same inputs v1 receives, including its newest-rate-only selection.
// Run: bun scripts/engine-v2/report.ts
import { readFileSync, writeFileSync } from "node:fs";
import { assess } from "../../supabase/functions/_shared/engine-v2/engine";
import { CASES } from "../../tests/engine-v2/cases";
import retail from "../../supabase/functions/_shared/engine-v2/data/MA000004.json";
import hosp from "../../supabase/functions/_shared/engine-v2/data/MA000009.json";
import ff from "../../supabase/functions/_shared/engine-v2/data/MA000003.json";

const $ = (c: number | null | undefined) => (c == null ? "—" : `$${(c / 100).toFixed(2)}`);

// ---- load v1 function verbatim ----
const src = readFileSync("supabase/functions/calculate-shift-pay/index.ts", "utf8");
const startAt = src.indexOf("function computePeriodComparison(");
let depth = 0, end = src.indexOf("{", src.indexOf(") {", startAt));
for (let i = end; i < src.length; i++) { if (src[i] === "{") depth++; if (src[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } } }
const js = new Bun.Transpiler({ loader: "ts" }).transformSync(src.slice(startAt, end));
const v1 = new Function(`${js}; return computePeriodComparison;`)() as (a: any) => any;
// v1 picks the newest operative rate (sorted by operative_from desc).
const newest = (snap: any, id: number) => snap.payRates.filter((r: any) => r.classificationFixedId === id && r.employeeRateType === "AD" && r.calculatedRate != null).sort((a: any, b: any) => b.operativeFrom.localeCompare(a.operativeFrom))[0].calculatedRate;
const SN: Record<string, any> = { MA000004: retail, MA000009: hosp, MA000003: ff };

let md = `# Engine v2 — accuracy report\n\nGenerated ${new Date().toISOString().slice(0, 10)} by \`bun scripts/engine-v2/report.ts\`. Expected values are hand-worked from official sources (see each row) and written into \`tests/engine-v2/cases.ts\`; they are never produced by the engine. Passing these cases shows the engine matches these worked examples only — it is not proof of accuracy for every situation.\n\n`;
let pass = 0;
const rows: string[] = [];
for (const c of CASES) {
  const r = assess(c.input);
  const ok = r.status === c.expect.status
    && (c.expect.entitlementCents == null || r.assessedEntitlementCents === c.expect.entitlementCents)
    && (c.expect.underpaymentCents === undefined || r.underpaymentCents === c.expect.underpaymentCents)
    && (c.expect.comparableCents === undefined || r.paid.comparableCents === c.expect.comparableCents);
  if (ok) pass++;
  const i = c.input; const s = i.shifts.map(x => `${x.date} ${x.start}–${x.finish}${x.breakMinutes ? ` (−${x.breakMinutes}m)` : ""}${x.overtimeMinutes ? ` OT ${x.overtimeMinutes}m` : ""}`).join("; ");
  const why = r.status === "complete" ? "" : (r.reasons[0] ?? "") + (r.notAssessed[0] ? ` ${r.notAssessed[0].reason}` : "");
  rows.push(`| ${c.id} | ${c.title} | ${i.awardCode} / ${r.classification ?? i.classificationFixedId} | ${i.employmentType}, ${i.rateType} | ${i.state} | ${s} | ${c.expect.status} ${$(c.expect.entitlementCents)} | ${r.status} ${$(r.assessedEntitlementCents)}${r.underpaymentCents != null ? `, owed ${$(r.underpaymentCents)}` : ""} | ${c.working}${why ? `<br>Engine: ${why}` : ""} | ${c.source} | ${ok ? "PASS" : "**FAIL**"} |`);
}
md += `**${pass} / ${CASES.length} cases pass.**\n\n| ID | Case | Award / level | Employment | State | Shifts | Expected | Actual | Working | Source | Result |\n|---|---|---|---|---|---|---|---|---|---|---|\n${rows.join("\n")}\n\n`;

// ---- v1 vs v2 ----
md += `## v1 vs v2 on the same shifts\n\nv1 = live \`calculate-shift-pay\` maths (newest rate, flat +50% weekend, +150% public holiday on top of base, daily 7.6 h overtime). Each shift is checked as one v1 call with no payslip hours.\n\n| ID | Shift | v1 award pay | v2 award pay | Difference (v1 − v2) |\n|---|---|---|---|---|\n`;
for (const id of ["R2", "R3", "R4", "R6", "R7", "R8", "R11", "R12", "R27", "H1", "H4", "F1", "F2", "F5"]) {
  const c = CASES.find(x => x.id === id)!; const sh = c.input.shifts[0];
  const dow = new Date(`${sh.date}T00:00:00Z`).getUTCDay();
  const ph = assess(c.input).lines.some(l => l.category === "Public holiday");
  const out = v1({
    baseRate: Number(newest(SN[c.input.awardCode], c.input.classificationFixedId)),
    employmentType: c.input.employmentType === "casual" ? "Casual" : "Full-time",
    startTime: sh.start, finishTime: sh.finish, breakMinutes: sh.breakMinutes ?? 0,
    workedWeekend: dow === 0 || dow === 6, workedPublicHoliday: ph, droveOwnCar: false, workedOver10Hours: false,
    advancedPayslip: null, actualPaid: 0,
  });
  const v1c = Math.round(out.expectedPay * 100); const v2c = assess(c.input).assessedEntitlementCents;
  md += `| ${id} | ${c.title} | ${$(v1c)} | ${$(v2c)} | ${v1c - v2c >= 0 ? "+" : "−"}${$(Math.abs(v1c - v2c))} |\n`;
}
writeFileSync("tests/engine-v2/REPORT.md", md);
console.log(`${pass}/${CASES.length} pass; report written`);
