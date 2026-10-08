import { Check, Lock } from "lucide-react";

interface PotentialAllowance {
  id: string;
  name: string;
}

interface Props {
  result: any;
}

/**
 * Free teaser shown on Step 3 and on /report/:id when payment_status !== 'paid'.
 * Reveals only count + 2-3 category names. No dollar amounts, no reasons.
 */
export function LockedTeaser({ result }: Props) {
  const allowances: PotentialAllowance[] = result?.potentialAllowances || [];
  const reasonsCount = Array.isArray(result?.reasons) ? result.reasons.length : 0;
  const issueCount = allowances.length + reasonsCount;

  const includes = [
    "Your award, classification and the exact hourly rate you should be on",
    "A shift-by-shift breakdown of what you were paid vs what you were owed",
    "Every penalty, overtime and allowance line that was missed",
    "The exact shortfall figure for the period",
    "A dated PDF you can send to your employer or Fair Work",
  ];

  return (
    <div
      className="rounded-lg p-6 space-y-4 relative overflow-hidden text-left"
      style={{
        background: "hsl(var(--muted) / 0.4)",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
          style={{ background: "hsl(var(--primary) / 0.12)" }}
        >
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">
            Your full report shows exactly where the money went missing
          </h3>
          <p className="text-sm text-muted-foreground">
            {issueCount > 0
              ? `We found ${issueCount} item${issueCount === 1 ? "" : "s"} to explain. Here's what you get for $10:`
              : "Here's what you get for $10:"}
          </p>
        </div>
      </div>

      <ul className="rounded-lg bg-background/60 border border-border/60 p-4 space-y-2">
        {includes.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}