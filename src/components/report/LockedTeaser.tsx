import { Lock, Sparkles } from "lucide-react";

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
  const previewNames = allowances.slice(0, 3).map((a) => a.name);
  const moreCount = Math.max(0, allowances.length - previewNames.length);

  return (
    <div
      className="rounded-2xl p-6 space-y-4 relative overflow-hidden"
      style={{
        background: "hsl(var(--muted) / 0.4)",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "hsl(var(--primary) / 0.12)" }}
        >
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold">
            We found {issueCount || allowances.length || "potential"}{" "}
            {issueCount === 1 ? "item" : "items"} that may be missing from your pay
          </h3>
          {previewNames.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              Including <strong className="text-foreground">{previewNames.join(", ")}</strong>
              {moreCount > 0 ? ` and ${moreCount} more` : ""}.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Including overtime, penalty rates and allowances under your award.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-background/60 border border-border/60 p-4 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Unlock the full report to see each item, the exact amounts you may be owed, and a
          step-by-step guide to claim it back from your employer.
        </p>
      </div>
    </div>
  );
}