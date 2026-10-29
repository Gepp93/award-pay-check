import { AlertTriangle } from "lucide-react";

/** Shown wherever v1 results appear (new results, saved reports, PDFs). Display only. */
export const PRELIMINARY_NOTICE =
  "Important: This checker currently uses simplified pay rules and may not reflect all conditions of your award. Results are preliminary estimates, not verified underpayment amounts.";
export const ESTIMATE_LABEL = "Preliminary estimate";
export const MULTI_LEVEL_LABEL = "Estimated across several levels — may not match your classification";
export const UNRELIABLE_LABEL = "Possible issue — not calculated reliably";

export default function PreliminaryNotice({ className = "" }: { className?: string }) {
  return (
    <div role="note" className={`flex gap-3 rounded-md border border-gold bg-gold-soft p-4 text-sm font-medium text-foreground ${className}`}>
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-foreground" aria-hidden="true" />
      <p>{PRELIMINARY_NOTICE}</p>
    </div>
  );
}
