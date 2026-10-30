import type { AssessmentResult } from "./engine-v2/engine.ts";
import { verifiedOneTimeAccess, verifiedSubscription } from "./tier-webhook.ts";
import { subscriptionAccess } from "./tier-products.ts";

/** Explicit allowlist: assessment-only buyers never receive detailed lines, sources or PDF inputs. */
export function projectTierResult(result: AssessmentResult, assessment: boolean, detailed: boolean) {
  if (detailed) return result;
  if (!assessment) return null;
  return { status: result.status, underpaymentCents: result.underpaymentCents, assessedEntitlementCents: result.assessedEntitlementCents, classification: result.classification, award: result.rulePack?.name, exclusions: result.exclusions };
}

export async function tierAccess(db: any, owner: string, report: string | undefined, get: (path: string, params?: Record<string, string>) => Promise<any>, live = true) {
  const { data: transactions, error } = await db.from("tier_transactions").select("*").eq("user_id", owner);
  if (error) throw error;
  let assessment = false, detailed = false, active = false;
  const subscriptions: any[] = [];
  for (const transaction of transactions ?? []) {
    if (transaction.product === "pay_protection") {
      const state = await verifiedSubscription(transaction, get, live);
      subscriptions.push({ ...state, transactionId: transaction.stripe_session_id });
      if (subscriptionAccess(state.status, state.paid_through)) { active = true; assessment = true; detailed = true; }
    } else if (transaction.report_id === report && await verifiedOneTimeAccess(transaction, get, live)) {
      assessment = true;
      if (transaction.product === "underpayment_report") detailed = true;
    }
  }
  return { assessment, detailed, active, subscriptions };
}