import { supabase } from "@/integrations/supabase/client";

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
 * Start a 12-month unlimited access subscription purchase.
 * Creates a pending row, stores its id in localStorage, and redirects to Stripe.
 */
export async function startSubscriptionCheckout(
  product: "yearly_access" = "yearly_access",
  email?: string,
  userId?: string | null
): Promise<string | null> {
  const { data, error } = await (supabase as any)
    .from("subscription_purchases")
    .insert({
      user_id: userId ?? null,
      email: email || null,
      product,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("startSubscriptionCheckout error:", error);
    return null;
  }

  const purchaseId = data.id as string;
  localStorage.setItem("pendingSubscriptionId", purchaseId);

  const u = new URL(FULL_REPORT_LINK);
  u.searchParams.set("client_reference_id", purchaseId);
  if (email) u.searchParams.set("prefilled_email", email);
  return u.toString();
}
