// Display-only reconciliation of a saved v1 result. Never changes stored values.
export const TOTAL_UNAVAILABLE =
  "Not available for this estimate — this result was estimated across several levels, so no single award pay total was recorded.";
export const TOTAL_MISSING =
  "Not recorded for this report — the headline is the saved preliminary estimate.";
export const NOT_RECONCILED =
  "The headline is the saved preliminary estimate. Award pay total minus actually paid does not equal it (the calculation may include items not itemised here), so treat the itemised figures as a guide only.";

export type Reconciliation = {
  awardTotal: number | null; // null = don't show a dollar figure
  totalNote: string | null; // shown instead of a dollar figure
  note: string | null; // limitation note under the table
};

export function reconcile(result: any, actualPaid: unknown, owed: number): Reconciliation {
  if (result?.mode === "unsure") return { awardTotal: null, totalNote: TOTAL_UNAVAILABLE, note: null };
  const total = Number(result?.awardPayTotal);
  if (!Number.isFinite(total) || total <= 0) return { awardTotal: null, totalNote: TOTAL_MISSING, note: null };
  const paid = parseFloat(String(actualPaid ?? ""));
  // Only compare when both components are known and comparable.
  if (!Number.isFinite(paid)) return { awardTotal: total, totalNote: null, note: null };
  const diff = Math.max(0, total - paid);
  const matches = Math.abs(diff - owed) < 0.01;
  return { awardTotal: total, totalNote: null, note: matches ? null : NOT_RECONCILED };
}
