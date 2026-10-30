import { jsPDF } from "npm:jspdf@4.2.1";
import autoTable from "npm:jspdf-autotable@5.0.8";
import type { AssessmentResult } from "./engine-v2/engine.ts";

export function createPaidPdf(id: string, r: AssessmentResult) {
  if (r.status !== "complete" || r.paid.comparison !== "complete") throw new Error("unsupported_pdf");
  const doc = new jsPDF();
  const money = (n: number | null | undefined) => n == null ? "Not assessed" : `$${(n / 100).toFixed(2)}`;
  doc.setFontSize(18); doc.text("AwardPay — Supported wage assessment", 14, 20);
  autoTable(doc, { startY: 28, body: [["Report", id], ["Scope", "Assessed wage items only; not a verified debt or legal advice"], ["Award", r.rulePack?.name ?? ""], ["Classification", r.classification ?? ""], ["Potential comparable difference", money(r.underpaymentCents)]], styles: { fontSize: 9 } });
  autoTable(doc, { head: [["Date", "Item", "Working and sources", "Minimum"]], body: r.lines.map(l => [l.date, l.category, `${l.explanation}\n${l.sources.map(s => `${s.description}; ${s.clause ?? ""}; operative ${s.operativeFrom}`).join("\n")}`, money(l.amountCents)]), styles: { fontSize: 8 } });
  autoTable(doc, { head: [["Category", "Paid", "Minimum", "Difference"]], body: (r.paid.components ?? []).map(c => [c.kind, money(c.paidCents), money(c.entitledCents), money(c.differenceCents)]), styles: { fontSize: 9 } });
  autoTable(doc, { head: [["Limitations"]], body: [...r.exclusions, ...r.notes, "AwardPay is independent of Fair Work. Results depend on confirmed coverage and supplied information."].map(x => [x]), styles: { fontSize: 9 } });
  return new Uint8Array(doc.output("arraybuffer"));
}