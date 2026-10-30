import type { AssessmentResult } from "./engine-v2/engine.ts";
import { verifiedOneTimeAccess, verifiedSubscription } from "./tier-webhook.ts";
import { subscriptionAccess } from "./tier-products.ts";

/** Explicit allowlist: assessment-only buyers never receive detailed lines, sources or PDF inputs. */
export function projectTierResult(result: AssessmentResult, assessment: boolean, detailed: boolean) {
  if (detailed) return result;
  if (!assessment) return null;
  return { status: result.status, underpaymentCents: result.underpaymentCents, assessedEntitlementCents: result.assessedEntitlementCents, classification: result.classification, award: result.rulePack?.name, exclusions: result.exclusions };
}

export async function tierAccess(db: any, owner: string, report: string | undefined, get: (path: string, params?: Record<string, string>) => Promise<any>, live = true, legacyReport?: string) {
  const { data: transactions, error } = await db.from("tier_transactions").select("*").eq("user_id", owner);
  if (error) throw error;
  let assessment = false, detailed = false, active = false;
  const subscriptions: any[] = [];
  for (const transaction of transactions ?? []) {
    // One unverifiable payment fails closed for itself only; other purchases still count.
    try {
      if (transaction.product === "pay_protection") {
        const state = await verifiedSubscription(transaction, get, live);
        subscriptions.push({ ...state, transactionId: transaction.stripe_session_id });
        if (subscriptionAccess(state.status, state.paid_through)) { active = true; assessment = true; detailed = true; }
      } else if (((report && transaction.report_id === report) || (legacyReport && transaction.legacy_report_id === legacyReport)) && await verifiedOneTimeAccess(transaction, get, live)) {
        assessment = true;
        if (transaction.product === "underpayment_report") detailed = true;
      }
    } catch (e) {
      console.warn("Tier access verification skipped", { reason: e instanceof Error ? e.message : "unknown" });
    }
  }
  return { assessment, detailed, active, subscriptions };
}

/** $9 Pay Check view of a public-checker report: headline and issue names only, no line detail or inputs. */
export function projectLegacySummary(result: any) {
  const allowances = Array.isArray(result?.potentialAllowances) ? result.potentialAllowances : [];
  const reasons = Array.isArray(result?.reasons) ? result.reasons : [];
  return {
    mode: result?.mode ?? null,
    awardName: result?.awardName ?? result?.award_name ?? null,
    classification: typeof result?.classification === "string" ? result.classification : result?.classification?.name ?? null,
    baseRate: Number(result?.baseRate) || null,
    underpayment: Number(result?.underpayment ?? result?.overallMinUnderpayment) || 0,
    potentialAllowances: allowances.map((a: any) => ({ id: a?.id, name: a?.name })),
    reasons,
  };
}