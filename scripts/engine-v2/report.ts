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
const verified: Record<string, number> = {};
const corrections: string[] = [];
for (const c of CASES) {
  const r = assess(c.input);
  const ok = r.status === c.expect.status
    && (c.expect.entitlementCents == null || r.assessedEntitlementCents === c.expect.entitlementCents)
    && (c.expect.underpaymentCents === undefined || r.underpaymentCents === c.expect.underpaymentCents)
    && (c.expect.comparableCents === undefined || r.paid.comparableCents === c.expect.comparableCents);
  if (ok) pass++;
  const verif = c.expect.status === "unsupported" ? "Rule check (clause cited)"
    : c.input.payPeriod?.start?.startsWith("2026") || c.input.shifts[0].date >= "2026-07-01" ? "Source-verified: Schedule B figure"
    : "Source-derived: FWC dated rate × award %";
  verified[verif] = (verified[verif] ?? 0) + 1;
  if (c.corrected) corrections.push(`- **${c.id}** — ${c.corrected}`);
  const i = c.input; const s = i.shifts.map(x => `${x.date} ${x.start}–${x.finish}${x.breakMinutes ? ` (−${x.breakMinutes}m)` : ""}${x.overtimeMinutes ? ` OT ${x.overtimeMinutes}m` : ""}`).join("; ");
  const why = r.status === "complete" ? "" : (r.reasons[0] ?? "") + (r.notAssessed[0] ? ` ${r.notAssessed[0].reason}` : "");
  rows.push(`| ${c.id} | ${c.title} | ${i.awardCode} / ${r.classification ?? i.classificationFixedId} | ${i.employmentType}, ${i.rateType} | ${i.state} | ${s} | ${c.expect.status} ${$(c.expect.entitlementCents)} | ${r.status} ${$(r.assessedEntitlementCents)}${r.underpaymentCents != null ? `, owed ${$(r.underpaymentCents)}` : ""} | ${c.working}${why ? `<br>Engine: ${why}` : ""} | ${c.source} | ${verif} | ${ok ? "PASS" : "**FAIL**"} |`);
}
md += `**${pass} / ${CASES.length} cases pass.**\n\n| ID | Case | Award / level | Employment | State | Shifts | Expected | Actual | Working | Source | Verification | Result |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n${rows.join("\n")}\n\n## Source verification\n\n${Object.entries(verified).map(([k, v]) => `- ${k}: ${v} cases`).join("\n")}\n\nEvery 2026-27 dollar figure used in expectations was found verbatim in the award's Schedule B on awards.fairwork.gov.au. Earlier-year expectations multiply the dated Fair Work API rate by the award percentage by hand. No expectation was changed to match engine output; each correction below follows from award text.\n\n## Corrections and discrepancies\n\n${corrections.join("\n")}\n- **Retail casual overtime** — earlier text said it was absent from the award. It exists (cl 21.2 Table 11 column 3: 175% / 225% / 225% / 275%); only the Fair Work pay database lacks records, so it stays Not assessed.\n- **Hospitality penalty table** — previously cited as Table 12; it is cl 29.2 Table 14. Midnight–7am addition (record 11954, $4.42 from 2026-07-01) matches the award text.\n- **Breaks** — unspecified breaks were previously taken from the highest-paid minutes and reported Complete. Now only allowed when every minute pays the same; otherwise Partial with a question.\n- **Overtime** — a full set of shifts no longer counts as proof of no overtime: full-time and Hospitality/Fast Food part-time need roster confirmation, Retail/Fast Food part-time need guaranteed hours, and weekly checks need the pay period and every shift.\n- **Pay comparison** — gross-only is always Partial; pay lines need confirmation they cover all wages; lines exceeding gross or a casual loading on a non-casual employee are Partial.\n- **Public holidays** — added 2026 calendars from all eight state/territory governments; NSW Bank Holiday and TAS Easter Tuesday marked restricted; Melbourne Cup, Brisbane show and similar marked regional (needs confirmation); Christmas/New Year's Eve part-days in SA, NT and QLD; VIC AFL Grand Final 2025 added. WA King's Birthday is marked regional because some areas observe a different date.\n\n`;

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
