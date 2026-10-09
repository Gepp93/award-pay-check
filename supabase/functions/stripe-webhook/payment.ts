export interface CheckoutSession {
  id: string; client_reference_id?: string | null; amount_total?: number | null;
  payment_status?: string; currency?: string; metadata?: Record<string, string> | null;
  customer_details?: { email?: string | null } | null;
}

/** Kept separate so webhook routing can be tested with an in-memory client. */
export async function applyCheckout(admin: any, session: CheckoutSession) {
  const refId = session.client_reference_id;
  if (!refId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(refId)) return;
  if (session.payment_status && session.payment_status !== "paid") return;
  const { data: purchase, error: purchaseError } = await admin.from("subscription_purchases").select("id,product,status,report_id").eq("id", refId).maybeSingle();
  if (purchaseError) throw purchaseError;
  if (purchase) {
    const isThreeMonth = session.amount_total === 3000 || session.metadata?.product === "three_month_pass";
    const product = isThreeMonth ? "three_month_pass" : session.amount_total === 1000 || session.metadata?.product === "yearly_access" ? "yearly_access" : null;
    if (!product || (product === "three_month_pass" && (session.amount_total !== 3000 || session.currency && session.currency !== "aud"))) throw new Error("Unexpected pass price");
    const { error } = await admin.rpc("complete_pass_purchase", {
      p_purchase_id: refId, p_session_id: session.id, p_email: session.customer_details?.email ?? null, p_product: product,
    });
    if (error) throw error;
    return;
  }
  // Only a report reference can retain the legacy $30 back-pay pack meaning.
  const product = session.metadata?.product === "full_report" ? "full_report"
    : session.amount_total === 3000 || session.metadata?.product === "backpay_pack" ? "backpay_pack"
    : session.amount_total === 1000 ? "full_report" : null;
  if (!product) return;
  const { data: report, error } = await admin.from("reports").select("id,user_id,stripe_session_id,payment_status").eq("id", refId).maybeSingle();
  if (error) throw error;
  if (!report || report.stripe_session_id === session.id) return;
  const updated = await admin.from("reports").update({ payment_status: "paid", stripe_session_id: session.id }).eq("id", refId);
  if (updated.error) throw updated.error;
  if (product === "backpay_pack" && report.user_id) {
    const { data: credits } = await admin.from("user_credits").select("credits").eq("user_id", report.user_id).maybeSingle();
    const saved = await admin.from("user_credits").upsert({ user_id: report.user_id, credits: (credits?.credits ?? 0) + 5, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (saved.error) throw saved.error;
  }
}