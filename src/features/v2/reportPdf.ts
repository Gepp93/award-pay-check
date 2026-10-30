import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AssessmentResult } from "../../../supabase/functions/_shared/engine-v2/engine";
export function makeTierPdf(id: string, r: AssessmentResult) {
  if (r.status !== "complete" || r.paid.comparison !== "complete") throw new Error("Incomplete assessments cannot be sold as underpayment reports");
  const doc = new jsPDF();
  const money = (n: number | null | undefined) => n == null ? "Not assessed" : `$${(n / 100).toFixed(2)}`;
  doc.setFontSize(18); doc.text("AwardPay — Supported wage assessment", 14, 20);
  doc.setFontSize(10);
  autoTable(doc, { startY: 28, body: [["Report", id], ["Scope", "Complete for assessed wage items only; not a verified debt or legal advice"], ["Award", r.rulePack?.name ?? ""], ["Classification", r.classification ?? ""], ["Potential comparable difference", money(r.underpaymentCents)], ["Engine", r.engineVersion]], styles: { fontSize: 9 } });
  autoTable(doc, { head: [["Date", "Item", "Working and official sources", "Award minimum"]], body: r.lines.map(l => [l.date, l.category, `${l.explanation}\n${l.sources.map(s => `${s.description}; ${s.clause ?? ""}; operative ${s.operativeFrom}`).join("\n")}`, money(l.amountCents)]), styles: { fontSize: 8 }, columnStyles: { 2: { cellWidth: 105 } } });
  autoTable(doc, { head: [["Category", "Paid", "Minimum", "Difference"]], body: (r.paid.components ?? []).map(c => [c.kind, money(c.paidCents), money(c.entitledCents), money(c.differenceCents)]), styles: { fontSize: 9 } });
  autoTable(doc, { head: [["Excluded / limitations"]], body: [...r.exclusions, ...r.notes, "Results depend on confirmed award coverage and information supplied. AwardPay is independent of Fair Work. Category differences may offset each other; only comparable wage items are assessed."].map(x => [x]), styles: { fontSize: 9 } });
  return doc;
}