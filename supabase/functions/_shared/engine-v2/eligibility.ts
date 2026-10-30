import { RULE_PACKS } from "./rulepacks.ts";
import { assess, type AssessmentInput, type AssessmentResult } from "./engine.ts";

export interface Eligibility {
  enterpriseAgreement: "yes" | "no" | "unknown";
  shiftworker: "yes" | "no" | "unknown";
  specialArrangement: "yes" | "no" | "unknown";
  awardConfirmed: boolean;
  classificationConfirmed: boolean;
  rateConfirmed: boolean;
}
/** Scope checks live outside rate math. Unknown is never silently converted to no. */
export function eligibilityIssues(input: AssessmentInput, e?: Eligibility): string[] {
  const issues: string[] = [];
  if (!e?.awardConfirmed) issues.push("Confirm your award coverage.");
  if (!e?.classificationConfirmed || input.classificationFixedId <= 0) issues.push("Confirm a classification supported by your award.");
  if (!e?.rateConfirmed) issues.push("Confirm which pay-rate category applies.");
  if (e?.enterpriseAgreement !== "no") issues.push("Award coverage is unresolved or an enterprise agreement applies; no reliable award comparison can be made.");
  if (e?.shiftworker !== "no") issues.push("Shiftworker arrangements are outside this checker; confirm you are a day worker.");
  if (e?.specialArrangement !== "no") issues.push("Special arrangements (daily hire, piecework, oil distribution, vehicle-manufacturing special rates, casino gaming or managerial salary arrangements) are not supported.");
  if (RULE_PACKS[input.awardCode]?.rdoAccrual && input.employmentType !== "casual" && typeof input.arrangement?.rdoAccrual !== "boolean") issues.push("Confirm whether your roster accrues an RDO or ADO.");
  return issues;
}
export function assessConfirmed(input: AssessmentInput, e?: Eligibility): AssessmentResult {
  const issues = eligibilityIssues(input, e);
  if (!issues.length) return assess(input);
  // Use the engine's unsupported response shape; never calculate under an invented award.
  const blocked = assess({ ...input, flags: { ...input.flags, enterpriseAgreement: true } });
  return { ...blocked, reasons: issues, notAssessed: issues.map(reason => ({ item: "Eligibility", reason, material: true })) };
}
export function reportSellable(result: Pick<AssessmentResult, "status" | "paid" | "underpaymentCents">): boolean {
  return result.status === "complete" && result.paid.comparison === "complete" && result.underpaymentCents !== null;
}