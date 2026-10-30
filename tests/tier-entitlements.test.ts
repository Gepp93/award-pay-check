import { describe, expect, test } from "bun:test";
import { processTierEvent, verifiedOneTimeAccess } from "../supabase/functions/_shared/tier-webhook";
import { subscriptionAccess } from "../supabase/functions/_shared/tier-products";

/** Stateful service boundary fixture, never a live charge or customer row. */
function fixture(product: string) {
  const purchase: any = { id: "purchase", user_id: "owner", product, status: "pending", price_id: "price", payment_link_id: "link", checkout_account_email: "owner@example.invalid", stripe_session_id: null, stripe_subscription_id: null, stripe_customer_id: null };
  const report = { assessment: false, pdf: false };
  const seen = new Set<string>();
  let mutations = 0;
  const state = { refunded: false, disputed: false, paid: true, email: "owner@example.invalid", status: "active", cancel: false, end: Math.floor(Date.now() / 1000) + 86400, subscription: null as any };
  const db = {
    from: () => {
      const filters: [string, unknown][] = [];
      const q: any = { select: () => q, eq: (k: string, v: unknown) => { filters.push([k, v]); return q; }, maybeSingle: async () => ({ data: filters.every(([k, v]) => purchase[k] === v) ? purchase : null, error: null }) };
      return q;
    },
    rpc: async (name: string, args: any) => {
      if (seen.has(args.p_event_id)) return { data: true, error: null };
      if (name === "record_tier_transaction") {
        if (purchase.status === "paid") return { data: true, error: null };
        if (purchase.status !== "pending") return { error: new Error("Purchase no longer pending") };
        purchase.status = "paid"; purchase.stripe_session_id = args.p_session_id; purchase.stripe_subscription_id = args.p_subscription_id; purchase.stripe_customer_id = args.p_customer_id;
        report.assessment = product !== "pay_protection"; report.pdf = product === "underpayment_report";
      } else if (name === "sync_tier_subscription") {
        if (purchase.status !== "paid") return { data: false, error: null };
        state.subscription = { status: args.p_status, paidThrough: args.p_paid_through };
      } else if (name === "revoke_tier_purchase") {
        if (purchase.stripe_session_id !== args.p_session_id) return { data: false, error: null };
        purchase.status = "revoked"; report.assessment = false; report.pdf = false; state.subscription = null;
      } else throw new Error("Unexpected RPC");
      seen.add(args.p_event_id); mutations++; return { data: true, error: null };
    },
  };
  const get = async (path: string) => {
    const session = { id: "cs", client_reference_id: purchase.id, livemode: true, payment_status: state.paid ? "paid" : "unpaid", currency: "aud", mode: product === "pay_protection" ? "subscription" : "payment", payment_link: "link", customer: "cus", subscription: product === "pay_protection" ? "sub" : null, payment_intent: "pi", customer_details: { email: state.email } };
    const charge = { livemode: true, refunded: state.refunded, disputed: state.disputed, amount_refunded: state.refunded ? 900 : 0, payment_intent: "pi", customer: "cus", invoice: product === "pay_protection" ? "in" : null };
    if (path.endsWith("line_items")) return { data: [{ quantity: 1, price: { id: "price" } }], has_more: false };
    if (path === "checkout/sessions") return { data: [session], has_more: false };
    if (path.startsWith("checkout/sessions/")) return session;
    if (path === "charges") return { data: [charge], has_more: false };
    if (path.startsWith("charges/")) return charge;
    if (path.startsWith("subscriptions/")) return { id: "sub", livemode: true, customer: "cus", status: state.status, cancel_at_period_end: state.cancel, current_period_end: state.end, items: { data: [{ price: { id: "price" } }] }, latest_invoice: "in" };
    if (path.startsWith("invoices/")) return { id: "in", livemode: true, customer: "cus", subscription: "sub", payment_intent: "pi", paid: state.paid, status: state.paid ? "paid" : "open", currency: "aud" };
    throw new Error("Unexpected Stripe retrieval");
  };
  const deliver = (type: string, id = "evt", created = 1793318400) => processTierEvent({ id, created, type, data: { object: { id: type.startsWith("charge") ? "ch" : type.startsWith("invoice") ? "in" : type.startsWith("customer") ? "sub" : "cs", charge: "ch" } } }, db, get);
  return { purchase, report, state, get, deliver, mutations: () => mutations };
}

describe("stateful transaction boundary (simulated services)", () => {
  for (const product of ["pay_check", "underpayment_report", "pay_protection"]) test(`${product} duplicate transaction delivery is idempotent`, async () => {
    const f = fixture(product); await f.deliver("checkout.session.completed"); const count = f.mutations(); await f.deliver("checkout.session.completed"); expect(f.mutations()).toBe(count); expect(f.purchase.status).toBe("paid");
  });
  test("refund after fulfillment denies access without destroying transaction recovery", async () => { const f = fixture("underpayment_report"); await f.deliver("checkout.session.completed"); f.state.refunded = true; expect(await verifiedOneTimeAccess(f.purchase, f.get)).toBe(false); expect(f.purchase.status).toBe("paid"); });
  test("unmatched buyer never records an entitlement", async () => { const f = fixture("pay_check"); f.state.email = "other@example.invalid"; await expect(f.deliver("checkout.session.completed")).rejects.toThrow("account_mismatch"); expect(f.mutations()).toBe(0); });
});
