import { expect, test } from "bun:test";
import { projectTierResult } from "../supabase/functions/_shared/tier-access";
import { tierDatabase } from "../supabase/functions/_shared/tier-runtime";
import { assessConfirmed } from "../supabase/functions/_shared/engine-v2/eligibility";
import { CASES } from "./engine-v2/cases";
const input = CASES.find(c => c.id === "MF1")?.input;
if (!input) throw new Error("Missing hand-worked fixture");
const result = assessConfirmed({ ...input, paid: { lines: [{ kind: "ordinary", amountCents: 20000 }], linesCoverAllWages: true } }, { enterpriseAgreement: "no", shiftworker: "no", specialArrangement: "no", awardConfirmed: true, classificationConfirmed: true, rateConfirmed: true });
test("$9 projection has no PDF source lines, official sources or paid components", () => {
  const projected = projectTierResult(result, true, false);
  expect(projected).toEqual({ status: "complete", underpaymentCents: 3560, assessedEntitlementCents: 23560, classification: result.classification, award: result.rulePack?.name, exclusions: result.exclusions });
  for (const field of ["lines", "sources", "paid", "notes", "rulePack", "request", "engineVersion"]) expect(projected).not.toHaveProperty(field);
});
test("unknown future detailed fields cannot leak into $9 projection", () => { expect(projectTierResult({ ...result, privilegedFutureField: "private" } as any, true, false)).not.toHaveProperty("privilegedFutureField"); });
test("locked report has no result", () => { expect(projectTierResult(result, false, false)).toBeNull(); });
test("$29 or paid $59 gets detailed authoritative result", () => { expect(projectTierResult(result, true, true)).toBe(result); });
test("sandbox report, purchase, transaction and event calls stay isolated", () => {
  const calls: string[] = []; const db = { from: (s: string) => { calls.push(s); }, rpc: (s: string) => { calls.push(s); } };
  const sandbox = tierDatabase(db, "sandbox");
  for (const table of ["v2_paid_reports", "tier_purchases", "tier_transactions", "tier_transaction_events"]) sandbox.from(table);
  sandbox.rpc("record_tier_transaction", {});
  expect(calls).toEqual(["tier_sandbox_reports", "tier_sandbox_purchases", "tier_sandbox_transactions", "tier_sandbox_events", "record_tier_sandbox_transaction"]);
});
test("live transaction calls never use sandbox tables", () => { const calls: string[] = []; const live = tierDatabase({ from: (s: string) => calls.push(s), rpc: (s: string) => calls.push(s) }, "live"); live.from("tier_transactions"); live.rpc("record_tier_transaction", {}); expect(calls).toEqual(["tier_transactions", "record_tier_transaction"]); });