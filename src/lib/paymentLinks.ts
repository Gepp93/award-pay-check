// Stripe Payment Link URLs. Paste your Payment Links here.
// Each link MUST be configured in Stripe to:
//   - allow client_reference_id (passed as ?client_reference_id=<reportId>)
//   - set metadata.product = 'full_report' OR 'backpay_pack' (or rely on amount: 1000 / 3000)
// Both links should redirect back to `${origin}/report/<reportId>` after success.

export const FULL_REPORT_LINK = "https://buy.stripe.com/REPLACE_ME_FULL_REPORT_10";
export const BACKPAY_LINK = "https://buy.stripe.com/REPLACE_ME_BACKPAY_PACK_30";

export function buildCheckoutUrl(link: string, reportId: string): string {
  const u = new URL(link);
  u.searchParams.set("client_reference_id", reportId);
  return u.toString();
}