// Stripe Payment Link URLs. Paste your Payment Links here.
// Each link MUST be configured in Stripe to:
//   - allow client_reference_id (passed as ?client_reference_id=<reportId>)
//   - set metadata.product = 'full_report' OR 'backpay_pack' (or rely on amount: 1000 / 3000)
// Both links should redirect back to `${origin}/report/<reportId>` after success.

export const FULL_REPORT_LINK = "https://buy.stripe.com/5kQ00k2ss5J7623gsd6AM05";
export const BACKPAY_LINK = "https://buy.stripe.com/aFa4gA4AA5J7bmn1xj6AM06";

export function buildCheckoutUrl(link: string, reportId: string): string {
  const u = new URL(link);
  u.searchParams.set("client_reference_id", reportId);
  return u.toString();
}