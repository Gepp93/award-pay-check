import { TIER_PRODUCTS, isTierProduct } from "./tier-products.ts";

/** Injected dependencies keep tests charge-free. Event snapshots are notifications, not entitlement truth. */
export async function processTierEvent(event: any, db: any, get: (path: string, params?: Record<string, string>) => Promise<any>) {
  const object = event.data?.object;
  if (!object?.id) return;
  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    const session = await get(`checkout/sessions/${object.id}`);
    if (!session.client_reference_id) return;
    const { data: purchase, error } = await db.from("tier_purchases").select("*").eq("id", session.client_reference_id).maybeSingle();
    if (error) throw error;
    if (!purchase || !isTierProduct(purchase.product)) return;
    if (!session.livemode || session.payment_status !== "paid" || session.currency !== "aud" || session.payment_link !== purchase.payment_link_id || session.mode !== TIER_PRODUCTS[purchase.product].mode) throw new Error("checkout_verification_failed");
    const lines = await get(`checkout/sessions/${session.id}/line_items`, { limit: "100" });
    if (lines.has_more || lines.data?.length !== 1 || lines.data[0].quantity !== 1 || lines.data[0].price?.id !== purchase.price_id) throw new Error("checkout_price_mismatch");
    const customer = typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (!customer) throw new Error("checkout_customer_missing");
    const sub = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    const fulfilled = await db.rpc("fulfil_tier_purchase", { p_event_id: event.id, p_purchase_id: purchase.id, p_session_id: session.id, p_customer_id: customer, p_subscription_id: sub ?? null, p_price_id: purchase.price_id });
    if (fulfilled.error) throw fulfilled.error;
    if (sub) await syncSubscription(sub, event, db, get, `${event.id}:subscription`);
    return;
  }
  if (event.type.startsWith("customer.subscription.")) {
    await syncSubscription(object.id, event, db, get, event.id);
    return;
  }
  if (["invoice.paid", "invoice.payment_failed", "invoice.payment_action_required"].includes(event.type)) {
    const invoice = await get(`invoices/${object.id}`);
    const subscription = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
    if (subscription) await syncSubscription(subscription, event, db, get, event.id);
    return;
  }
  if (["charge.refunded", "charge.dispute.created"].includes(event.type)) {
    const chargeId = event.type === "charge.refunded" ? object.id : object.charge;
    if (typeof chargeId !== "string") return;
    const charge = await get(`charges/${chargeId}`);
    if (!charge.livemode || (!charge.refunded && !charge.disputed)) return;
    const intent = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
    if (!intent) return;
    const sessions = await get("checkout/sessions", { payment_intent: intent, limit: "100" });
    for (const session of sessions.data ?? []) {
      const revoked = await db.rpc("revoke_tier_purchase", { p_event_id: `${event.id}:${session.id}`, p_session_id: session.id });
      if (revoked.error) throw revoked.error;
    }
  }
}

async function syncSubscription(id: string, event: any, db: any, get: (path: string, params?: Record<string, string>) => Promise<any>, eventId: string) {
  const { data: purchase, error } = await db.from("tier_purchases").select("*").eq("stripe_subscription_id", id).eq("status", "paid").maybeSingle();
  if (error) throw error;
  if (!purchase || purchase.product !== "pay_protection") return;
  const sub = await get(`subscriptions/${id}`);
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!sub.livemode || customer !== purchase.stripe_customer_id || sub.items?.data?.length !== 1 || sub.items.data[0].price?.id !== purchase.price_id) throw new Error("subscription_verification_failed");
  const invoiceId = typeof sub.latest_invoice === "string" ? sub.latest_invoice : sub.latest_invoice?.id;
  const invoice = invoiceId ? await get(`invoices/${invoiceId}`) : null;
  // Do not mint access from a trial, scheduled cancellation or an unpaid invoice.
  const paid = invoice?.status === "paid" && invoice?.paid === true && invoice.currency === "aud";
  const end = sub.current_period_end ?? sub.items.data[0].current_period_end;
  const status = sub.status === "active" && !paid ? "unpaid" : sub.status;
  const synced = await db.rpc("sync_tier_subscription", {
    p_event_id: eventId, p_event_created: event.created, p_subscription_id: id, p_customer_id: customer,
    p_price_id: purchase.price_id, p_status: status, p_paid_through: paid && Number.isFinite(end) ? new Date(end * 1000).toISOString() : null,
    p_cancel_at_period_end: sub.cancel_at_period_end === true,
  });
  if (synced.error) throw synced.error;
}