import { Button } from "@/components/ui/button";
import { Download, CheckCircle, AlertCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Props = {
  result: any;
  shiftDetails: any;
  advancedPayslip?: any;
};

const fmt = (n: number) =>
  `$${(isFinite(n) ? n : 0).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const todayAU = () =>
  new Date().toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function getOwed(result: any): number {
  const isUnsure = result?.mode === "unsure";
  return isUnsure
    ? Number(result?.overallMaxUnderpayment) || 0
    : Number(result?.underpayment) || 0;
}

function getPeriod(shiftDetails: any): string | null {
  const shifts = shiftDetails?.shifts;
  if (Array.isArray(shifts) && shifts.length > 0) {
    const dates = shifts
      .map((s: any) => s?.date)
      .filter(Boolean)
      .sort();
    if (dates.length === 1) return dates[0];
    if (dates.length > 1) return `${dates[0]} → ${dates[dates.length - 1]}`;
  }
  if (shiftDetails?.date) return shiftDetails.date;
  return null;
}

function getHeadline(result: any) {
  const isUnsure = result?.mode === "unsure";
  const min = isUnsure ? Number(result?.overallMinUnderpayment) || 0 : 0;
  const max = isUnsure ? Number(result?.overallMaxUnderpayment) || 0 : 0;
  const exact = isUnsure ? 0 : Number(result?.underpayment) || 0;
  const showRange = isUnsure && min > 0 && min !== max;

  if (isUnsure) {
    if (showRange) {
      return {
        label: "Estimated range",
        amount: `${fmt(min)} – ${fmt(max)}`,
        caveat: "This is an estimate across the likely classification levels for your role. For an exact figure, select your classification.",
      };
    }
    return {
      label: "You may be owed up to",
      amount: `~${fmt(max)}`,
      caveat: "This is an estimate across the likely classification levels for your role. For an exact figure, select your classification.",
    };
  }

  if (exact > 0) {
    return {
      label: "You may be owed",
      amount: fmt(exact),
      caveat: null,
    };
  }

  return {
    label: "Result",
    amount: "Pay looks correct",
    caveat: null,
  };
}

function recoverySteps(result: any, owed: number) {
  const reasons: string[] = Array.isArray(result?.reasons) ? result.reasons : [];
  const allowances: any[] = Array.isArray(result?.potentialAllowances)
    ? result.potentialAllowances
    : [];
  const shortfalls = [
    ...reasons,
    ...allowances.map((a) => `${a.name} (${a.amount})`),
  ];
  return [
    "Save every payslip for this pay period and any others affected.",
    shortfalls.length
      ? `Note the specific shortfalls: ${shortfalls.join("; ")}.`
      : "Note the specific shortfalls from the breakdown above.",
    `Raise it with your employer in writing, quoting your award and the amount owed (${fmt(owed)}).`,
    "If it's not resolved, contact the Fair Work Ombudsman (fairwork.gov.au) or lodge a claim — keep all records.",
  ];
}

function buildPdf(result: any, shiftDetails: any, advancedPayslip: any) {
  const owed = getOwed(result);
  const headline = getHeadline(result);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 48;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 83, 45); // green-ish
  doc.text("AwardPay", 48, y);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Pay Check Report", 48, y + 18);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Generated ${todayAU()}`, pageW - 48, y, { align: "right" });
  const period = getPeriod(shiftDetails);
  if (period) doc.text(`Period: ${period}`, pageW - 48, y + 14, { align: "right" });
  doc.setTextColor(0);
  y += 50;

  // Headline
  doc.setFontSize(11);
  doc.setTextColor(110);
  doc.text(headline.label, 48, y);
  doc.setTextColor(owed > 0 ? 184 : 20, owed > 0 ? 134 : 83, owed > 0 ? 11 : 45);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(headline.amount, 48, y + 28);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  y += 46;
  if (headline.caveat) {
    doc.setFontSize(10);
    doc.setTextColor(110);
    const caveatLines = doc.splitTextToSize(headline.caveat, pageW - 96);
    doc.text(caveatLines, 48, y);
    y += caveatLines.length * 12 + 8;
    doc.setTextColor(0);
  } else {
    y += 10;
  }

  // Your details
  const jobInfo = shiftDetails?.jobInfo || {};
  const details: [string, string][] = [
    ["Award", result?.awardName || jobInfo.award_name || jobInfo.selected_award_code || "—"],
    ["Classification", result?.classification || jobInfo.classification || "—"],
    ["Employment", shiftDetails?.employmentType || "—"],
    ["Base rate", result?.baseRate ? `${fmt(result.baseRate)}/hr` : "—"],
    ["Total paid", shiftDetails?.actualPaid ? fmt(parseFloat(shiftDetails.actualPaid)) : "—"],
  ];
  autoTable(doc, {
    startY: y,
    head: [["Your details", ""]],
    body: details,
    theme: "grid",
    headStyles: { fillColor: [20, 83, 45] },
    styles: { fontSize: 10 },
    margin: { left: 48, right: 48 },
  });
  y = (doc as any).lastAutoTable.finalY + 20;

  // What's missing — expected vs paid
  const bd = result?.breakdown || {};
  const rate = Number(result?.baseRate) || 0;
  const expRows: any[] = [];
  if (bd.regularHours)
    expRows.push([
      `Regular hours (${Number(bd.regularHours).toFixed(2)} × ${fmt(rate)})`,
      fmt(Number(bd.basePay) || 0),
    ]);
  if (bd.overtimeAt150Hours)
    expRows.push([
      `Overtime 1.5x (${Number(bd.overtimeAt150Hours).toFixed(2)} hrs)`,
      fmt(Number(bd.overtimeAt150Hours) * rate * 1.5),
    ]);
  if (bd.overtimeAt200Hours)
    expRows.push([
      `Overtime 2x (${Number(bd.overtimeAt200Hours).toFixed(2)} hrs)`,
      fmt(Number(bd.overtimeAt200Hours) * rate * 2),
    ]);
  expRows.push(["Award pay total", fmt(Number(result?.awardPayTotal) || 0)]);
  expRows.push([
    "Actually paid",
    shiftDetails?.actualPaid ? fmt(parseFloat(shiftDetails.actualPaid)) : "—",
  ]);
  autoTable(doc, {
    startY: y,
    head: [["What's missing", "Amount"]],
    body: expRows,
    theme: "striped",
    headStyles: { fillColor: [20, 83, 45] },
    styles: { fontSize: 10 },
    margin: { left: 48, right: 48 },
  });
  y = (doc as any).lastAutoTable.finalY + 16;

  // Reasons
  const reasons: string[] = Array.isArray(result?.reasons) ? result.reasons : [];
  if (reasons.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Why the difference", 48, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    reasons.forEach((r) => {
      const lines = doc.splitTextToSize(`• ${r}`, pageW - 96);
      doc.text(lines, 48, y);
      y += lines.length * 12;
    });
    y += 8;
  }

  // Allowances
  const allowances: any[] = Array.isArray(result?.potentialAllowances)
    ? result.potentialAllowances
    : [];
  if (allowances.length) {
    autoTable(doc, {
      startY: y,
      head: [["Potential allowance", "Amount", "Est. value"]],
      body: allowances.map((a) => [
        a.name,
        a.amount,
        a.estimatedValue ? fmt(Number(a.estimatedValue)) : "—",
      ]),
      theme: "grid",
      headStyles: { fillColor: [184, 134, 11] },
      styles: { fontSize: 10 },
      margin: { left: 48, right: 48 },
    });
    y = (doc as any).lastAutoTable.finalY + 16;
  }

  // Recovery
  if (y > 720) {
    doc.addPage();
    y = 48;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("How to recover it", 48, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  recoverySteps(result, owed).forEach((step, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${step}`, pageW - 96);
    doc.text(lines, 48, y);
    y += lines.length * 12 + 4;
  });
  y += 8;
  doc.setTextColor(110);
  doc.setFontSize(9);
  doc.text(
    "AwardPay provides general information, not legal advice.",
    48,
    y,
  );
  doc.text(`awardpay.com.au · Generated ${todayAU()}`, 48, y + 14);

  doc.save(`awardpay-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function FullReport({ result, shiftDetails, advancedPayslip }: Props) {
  const owed = getOwed(result);
  const headline = getHeadline(result);
  const isUnderpaid = owed > 0;
  const period = getPeriod(shiftDetails);
  const jobInfo = shiftDetails?.jobInfo || {};
  const reasons: string[] = Array.isArray(result?.reasons) ? result.reasons : [];
  const allowances: any[] = Array.isArray(result?.potentialAllowances)
    ? result.potentialAllowances
    : [];
  const bd = result?.breakdown || {};
  const rate = Number(result?.baseRate) || 0;
  const steps = recoverySteps(result, owed);

  return (
    <article
      className="rounded-2xl border bg-card p-6 md:p-8 space-y-8"
      style={{ borderColor: "hsl(var(--border))" }}
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-primary font-extrabold text-2xl tracking-tight">
            AwardPay
          </div>
          <div className="text-lg font-semibold mt-1">Pay Check Report</div>
          <div className="text-sm text-muted-foreground">
            Generated {todayAU()}
            {period ? ` · Period: ${period}` : ""}
          </div>
        </div>
        <Button
          onClick={() => buildPdf(result, shiftDetails, advancedPayslip)}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download report (PDF)
        </Button>
      </header>

      {/* Headline */}
      {isUnderpaid ? (
        <section
          className="rounded-xl px-6 py-8 text-center"
          style={{
            background: "hsl(var(--gold) / 0.08)",
            border: "1px solid hsl(var(--gold) / 0.3)",
          }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {headline.label}
          </div>
          <div
            className="font-extrabold tabular-nums font-mono mt-2"
            style={{
              color: "hsl(var(--gold))",
              fontSize: "clamp(40px, 7vw, 64px)",
              lineHeight: 1,
            }}
          >
            {headline.amount}
          </div>
          {(reasons.length + allowances.length) > 0 && (
            <div className="mt-3 text-sm text-muted-foreground">
              {reasons.length + allowances.length} issue
              {reasons.length + allowances.length === 1 ? "" : "s"} identified
            </div>
          )}
          {headline.caveat && (
            <div className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
              {headline.caveat}
            </div>
          )}
        </section>
      ) : (
        <section
          className="rounded-xl px-6 py-8 text-center"
          style={{
            background: "hsl(var(--primary) / 0.06)",
            border: "1px solid hsl(var(--primary) / 0.2)",
          }}
        >
          <CheckCircle className="h-8 w-8 mx-auto text-primary mb-2" />
          <div className="text-xl font-bold">Your pay looks correct for this period</div>
        </section>
      )}

      {/* Your details */}
      <section>
        <h3 className="text-base font-bold mb-3">Your details</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
          <Detail label="Award" value={result?.awardName || jobInfo.award_name || jobInfo.selected_award_code} />
          <Detail label="Classification" value={result?.classification || jobInfo.classification} />
          <Detail label="Employment" value={shiftDetails?.employmentType} />
          <Detail label="Base rate" value={rate ? `${fmt(rate)}/hr` : null} mono />
          {advancedPayslip?.hoursAtBase != null && (
            <Detail label="Hours at base" value={`${advancedPayslip.hoursAtBase}`} mono />
          )}
          {advancedPayslip?.hoursAt150 != null && (
            <Detail label="Hours at 1.5x" value={`${advancedPayslip.hoursAt150}`} mono />
          )}
          {advancedPayslip?.hoursAt200 != null && (
            <Detail label="Hours at 2x" value={`${advancedPayslip.hoursAt200}`} mono />
          )}
          <Detail
            label="Total paid"
            value={shiftDetails?.actualPaid ? fmt(parseFloat(shiftDetails.actualPaid)) : null}
            mono
          />
        </dl>
      </section>

      {/* What's missing */}
      <section>
        <h3 className="text-base font-bold mb-3">What's missing</h3>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {bd.regularHours > 0 && (
                <Row
                  label={`Regular hours (${Number(bd.regularHours).toFixed(2)} × ${fmt(rate)})`}
                  value={fmt(Number(bd.basePay) || 0)}
                />
              )}
              {bd.overtimeAt150Hours > 0 && (
                <Row
                  label={`Overtime 1.5x (${Number(bd.overtimeAt150Hours).toFixed(2)} hrs)`}
                  value={fmt(Number(bd.overtimeAt150Hours) * rate * 1.5)}
                />
              )}
              {bd.overtimeAt200Hours > 0 && (
                <Row
                  label={`Overtime 2x (${Number(bd.overtimeAt200Hours).toFixed(2)} hrs)`}
                  value={fmt(Number(bd.overtimeAt200Hours) * rate * 2)}
                />
              )}
              <Row
                label="Award pay total"
                value={fmt(Number(result?.awardPayTotal) || 0)}
                bold
              />
              <Row
                label="Actually paid"
                value={
                  shiftDetails?.actualPaid
                    ? fmt(parseFloat(shiftDetails.actualPaid))
                    : "—"
                }
              />
              {isUnderpaid && (
                <Row
                  label="Shortfall"
                  value={fmt(owed)}
                  bold
                  highlight
                />
              )}
            </tbody>
          </table>
        </div>

        {reasons.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-semibold mb-2">Why this difference</div>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {allowances.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-sm font-semibold">Potential allowances</div>
            {allowances.map((a) => (
              <div
                key={a.id || a.name}
                className="rounded-md border p-3 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="font-medium text-sm">
                    {a.icon ? `${a.icon} ` : ""}
                    {a.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{a.amount}</div>
                  {a.reason && (
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium text-foreground">Why: </span>
                      {a.reason}
                    </div>
                  )}
                </div>
                {a.estimatedValue > 0 && (
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-muted-foreground">Est.</div>
                    <div className="font-mono tabular-nums font-bold text-primary">
                      {fmt(Number(a.estimatedValue))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How to recover it */}
      <section>
        <h3 className="text-base font-bold mb-3">How to recover it</h3>
        <ol className="space-y-3 text-sm">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span
                className="flex-none w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center"
                aria-hidden
              >
                {i + 1}
              </span>
              <span className="flex-1 pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground mt-4 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-none" />
          AwardPay provides general information, not legal advice.
        </p>
      </section>

      <footer className="text-[11px] text-muted-foreground border-t pt-4">
        awardpay.com.au · Generated {todayAU()}
      </footer>
    </article>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: any;
  mono?: boolean;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between border-b border-border/50 pb-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono tabular-nums font-medium" : "font-medium"}>
        {value}
      </dd>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <tr
      className="border-b last:border-0"
      style={
        highlight
          ? { background: "hsl(var(--gold) / 0.08)" }
          : undefined
      }
    >
      <td className={`px-4 py-2 ${bold ? "font-semibold" : ""}`}>{label}</td>
      <td
        className={`px-4 py-2 text-right font-mono tabular-nums ${
          bold ? "font-bold" : ""
        }`}
        style={highlight ? { color: "hsl(var(--gold))" } : undefined}
      >
        {value}
      </td>
    </tr>
  );
}

export default FullReport;