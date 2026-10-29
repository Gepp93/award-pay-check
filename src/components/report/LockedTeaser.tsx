import { Check, Lock } from "lucide-react";

interface PotentialAllowance {
  id: string;
  name: string;
}

interface Props {
  result: any;
}

/**
 * Locked teaser shown on Step 3 and on /report/:id when payment_status !== 'paid'.
 * Reveals only count + 2-3 category names. No dollar amounts, no reasons.
 */
export function LockedTeaser({ result }: Props) {
  const allowances: PotentialAllowance[] = result?.potentialAllowances || [];
  const reasonsCount = Array.isArray(result?.reasons) ? result.reasons.length : 0;
  const issueCount = allowances.length + reasonsCount;

  return (
    <section className="checker-findings">
      <h3>Possible issues to check</h3>
      {allowances.slice(0, 3).map((item) => (
        <div key={item.id || item.name} className="checker-finding-row">
          <div className="min-w-0"><span className="ledger-missing">POSSIBLE</span><span>{item.name}</span></div>
          <span className="checker-locked-detail"><Lock className="h-3.5 w-3.5" />In full report</span>
        </div>
      ))}
      {reasonsCount > 0 && (
        <div className="checker-finding-row">
          <div className="min-w-0"><span className="ledger-missing">POSSIBLE</span><span>{reasonsCount} pay item{reasonsCount === 1 ? "" : "s"} to explain</span></div>
          <span className="checker-locked-detail"><Lock className="h-3.5 w-3.5" />In full report</span>
        </div>
      )}
      {issueCount === 0 && <p className="text-sm text-muted-foreground">Your full report shows the preliminary estimate, line by line.</p>}
    </section>
  );
}

export function ReportIncludes() {
  const includes = [
    "Your award, classification and the base hourly rate we compared against",
    "A shift-by-shift comparison of what you were paid and our preliminary estimate",
    "Possible penalty, overtime and allowance issues to check",
    "The preliminary estimated shortfall for the period",
    "A dated PDF you can send to your employer or Fair Work",
  ];

  return (
    <ul className="checker-includes">
      {includes.map((item) => (
        <li key={item}><Check className="h-4 w-4 text-primary shrink-0" /><span>{item}</span></li>
      ))}
    </ul>
  );
}
