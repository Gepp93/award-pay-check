import { TIER_PRODUCTS, isTierProduct } from "./tier-products.ts";

/** Injected dependencies keep tests charge-free. Event snapshots are notifications, not entitlement truth. */
export async function processTierEvent(event: any, db: any, get: (path: string, params?: Record<string, string>) => Promise<any>, live = true) {
  const object = event.data?.object;
  if (!object?.id) return;
  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    const session = await get(`checkout/sessions/${object.id}`);
    if (!session.client_reference_id) return;
    const { data: purchase, error } = await db.from("tier_purchases").select("*").eq("id", session.client_reference_id).maybeSingle();
    if (error) throw error;
    if (!purchase || !isTierProduct(purchase.product)) return;
    if (session.livemode !== live || session.payment_status !== "paid" || session.currency !== "aud" || session.payment_link !== purchase.payment_link_id || session.mode !== TIER_PRODUCTS[purchase.product].mode) throw new Error("checkout_verification_failed");
    const lines = await get(`checkout/sessions/${session.id}/line_items`, { limit: "100" });
    if (lines.has_more || lines.data?.length !== 1 || lines.data[0].quantity !== 1 || lines.data[0].price?.id !== purchase.price_id) throw new Error("checkout_price_mismatch");
    const customer = typeof session.customer === "string" ? session.customer : session.customer?.id;
    const email = session.customer_details?.email;
    if (!purchase.checkout_account_email || typeof email !== "string" || email.toLowerCase() !== purchase.checkout_account_email.toLowerCase()) throw new Error("checkout_account_mismatch");
    const sub = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    const intent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    // Record paid transactions even if already refunded: access is independently verified.
    if (sub && !customer) throw new Error("checkout_customer_missing");
    if (sub) await verifiedSubscription({ ...purchase, stripe_customer_id: customer, stripe_subscription_id: sub }, get, live);
    const fulfilled = await db.rpc("record_tier_transaction", { p_event_id: event.id, p_purchase_id: purchase.id, p_session_id: session.id, p_customer_id: customer ?? null, p_subscription_id: sub ?? null, p_price_id: purchase.price_id });
    if (fulfilled.error) throw fulfilled.error;
    if (fulfilled.data !== true) throw new Error("transaction_not_recorded");
    return;
  }
  if (event.type.startsWith("customer.subscription.")) {
    // Access is reconciled from current Stripe payment state, never a cached notification.
    return;
  }
  if (["invoice.paid", "invoice.payment_failed", "invoice.payment_action_required"].includes(event.type)) {
    const invoice = await get(`invoices/${object.id}`);
    const subscription = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
    if (subscription) return;
    return;
  }
  if (["charge.refunded", "charge.dispute.created"].includes(event.type)) {
    const chargeId = event.type === "charge.refunded" ? object.id : object.charge;
    if (typeof chargeId !== "string") return;
    const charge = await get(`charges/${chargeId}`);
    if (charge.livemode !== live || (!charge.refunded && !charge.disputed && !(charge.amount_refunded > 0))) return;
    const invoiceId = typeof charge.invoice === "string" ? charge.invoice : charge.invoice?.id;
    if (invoiceId) {
      const invoice = await get(`invoices/${invoiceId}`);
      const subscription = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
      if (subscription) {
        const { data: purchase, error } = await db.from("tier_transactions").select("*").eq("stripe_subscription_id", subscription).maybeSingle();
        if (error) throw error;
        if (purchase?.product === "pay_protection" && purchase.stripe_customer_id === (typeof charge.customer === "string" ? charge.customer : charge.customer?.id)) {
          await verifiedSubscription(purchase, get, live);
        }
        return;
      }
    }
    const intent = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
    if (!intent) return;
    const sessions = await get("checkout/sessions", { payment_intent: intent, limit: "100" });
    if (sessions.has_more) throw new Error("refund_sessions_incomplete");
    for (const session of sessions.data ?? []) {
      // No irreversible mutation: full refunds/disputes fail the current-state access check.
      // Partial refunds leave the purchased scope in place; unrelated purchases are untouched.
    }
  }
}

async function invalidPayment(id: string, get: (path: string, params?: Record<string, string>) => Promise<any>) {
  const charges = await get("charges", { payment_intent: id, limit: "100" });
  if (charges.has_more) throw new Error("payment_verification_incomplete");
  for (const charge of charges.data ?? []) {
    if (charge.refunded) return true;
    if (charge.disputed) {
      const disputes = await get("disputes", { charge: charge.id, limit: "100" });
      if (disputes.has_more || !disputes.data?.length || disputes.data.some((d: any) => d.status !== "won")) return true;
    }
  }
  return false;
}

export async function verifiedOneTimeAccess(purchase: any, get: (path: string, params?: Record<string, string>) => Promise<any>, live = true) {
  if (!purchase.stripe_session_id || !purchase.checkout_account_email || !isTierProduct(purchase.product) || purchase.product === "pay_protection") return false;
  const session = await get(`checkout/sessions/${purchase.stripe_session_id}`);
  if (session.livemode !== live || session.payment_status !== "paid" || session.currency !== "aud" || session.mode !== "payment" || session.client_reference_id !== (purchase.purchase_id ?? purchase.id) || session.payment_link !== purchase.payment_link_id || session.customer_details?.email?.toLowerCase() !== purchase.checkout_account_email.toLowerCase()) return false;
  const lines = await get(`checkout/sessions/${session.id}/line_items`, { limit: "100" });
  if (lines.has_more || lines.data?.length !== 1 || lines.data[0].quantity !== 1 || lines.data[0].price?.id !== purchase.price_id) return false;
  const intent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  return !!intent && !await invalidPayment(intent, get);
}

/** Current verified Stripe state is also read at access time; cached webhook order cannot mint access. */
export async function verifiedSubscription(purchase: any, get: (path: string, params?: Record<string, string>) => Promise<any>, live = true) {
  const sub = await get(`subscriptions/${purchase.stripe_subscription_id}`);
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (sub.livemode !== live || customer !== purchase.stripe_customer_id || sub.items?.has_more || sub.items?.data?.length !== 1 || sub.items.data[0].price?.id !== purchase.price_id) throw new Error("subscription_verification_failed");
  const invoiceId = typeof sub.latest_invoice === "string" ? sub.latest_invoice : sub.latest_invoice?.id;
  const invoice = invoiceId ? await get(`invoices/${invoiceId}`) : null;
  const invoiceCustomer = typeof invoice?.customer === "string" ? invoice.customer : invoice?.customer?.id;
  const intent = typeof invoice?.payment_intent === "string" ? invoice.payment_intent : invoice?.payment_intent?.id;
  const paid = invoice?.livemode === live && invoiceCustomer === customer && invoice?.status === "paid" && invoice?.paid === true && invoice.currency === "aud";
  const revoked = intent ? await invalidPayment(intent, get) : false;
  const end = sub.current_period_end ?? sub.items.data[0].current_period_end;
  return { status: revoked ? "revoked" : sub.status === "active" && !paid ? "unpaid" : sub.status, paid_through: paid && !revoked && Number.isFinite(end) ? new Date(end * 1000).toISOString() : null, cancel_at_period_end: sub.cancel_at_period_end === true };
}

async function syncSubscription(id: string, event: any, db: any, get: (path: string, params?: Record<string, string>) => Promise<any>, eventId: string) {
  const { data: purchase, error } = await db.from("tier_transactions").select("*").eq("stripe_subscription_id", id).maybeSingle();
  if (error) throw error;
  if (!purchase || purchase.product !== "pay_protection") return;
  const state = await verifiedSubscription(purchase, get);
  const synced = await db.rpc("sync_tier_subscription", {
    p_event_id: eventId, p_event_created: event.created, p_subscription_id: id, p_customer_id: purchase.stripe_customer_id,
    p_price_id: purchase.price_id, p_status: state.status, p_paid_through: state.paid_through,
    p_cancel_at_period_end: state.cancel_at_period_end,
  });
  if (synced.error) throw synced.error;
}