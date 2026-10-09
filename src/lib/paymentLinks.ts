import { supabase } from "@/integrations/supabase/client";
import { THREE_MONTH_PASS } from "@/lib/plans";

// Stripe Payment Link URLs. Paste your Payment Links here.
// Each link MUST be configured in Stripe to:
//   - allow client_reference_id (passed as ?client_reference_id=<id>)
//   - set metadata.product = 'full_report' OR 'backpay_pack' (or rely on amount: 1000 / 3000)
// Both links should redirect back to `${origin}/payment-complete` after success.

export const FULL_REPORT_LINK = "https://buy.stripe.com/5kQ00k2ss5J7623gsd6AM05";
export const BACKPAY_LINK = "https://buy.stripe.com/aFa4gA4AA5J7bmn1xj6AM06";

export function buildCheckoutUrl(link: string, reportId: string, email?: string): string {
  const u = new URL(link);
  u.searchParams.set("client_reference_id", reportId);
  if (email) u.searchParams.set("prefilled_email", email);
  return u.toString();
}

/**
 * Start a pass purchase, retaining support for legacy yearly purchases.
 * Creates a pending row, stores its id in localStorage, and redirects to Stripe.
 */
export async function startSubscriptionCheckout(
  product: "yearly_access" | "three_month_pass" = "three_month_pass",
  email?: string,
  userId?: string | null,
  reportId?: string | null
): Promise<string | null> {
  // Generate the reference before INSERT: guests cannot SELECT purchase rows.
  const purchaseId = crypto.randomUUID();
  const { error } = await supabase
    .from("subscription_purchases")
    .insert({
      id: purchaseId,
      user_id: userId ?? null,
      email: email || null,
      product,
      status: "pending",
      report_id: reportId ?? null,
    });

  if (error) {
    console.error("startSubscriptionCheckout error:", error);
    return null;
  }

  localStorage.setItem("pendingSubscriptionId", purchaseId);
  if (email) localStorage.setItem("pendingPassEmail", email);
  else localStorage.removeItem("pendingPassEmail");

  const u = new URL(product === "three_month_pass" ? THREE_MONTH_PASS.link : FULL_REPORT_LINK);
  u.searchParams.set("client_reference_id", purchaseId);
  if (email) u.searchParams.set("prefilled_email", email);
  return u.toString();
}
