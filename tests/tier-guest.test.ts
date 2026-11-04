import { expect, test } from "bun:test";
import { processTierEvent } from "../supabase/functions/_shared/tier-webhook";

const purchase = (extra: Record<string, unknown>) => ({ id: "p1", product: "pay_check", payment_link_id: "plink_x", price_id: "price_9", user_id: null, ...extra });
const session = (email: string, over: Record<string, unknown> = {}) => ({ id: "cs_1", client_reference_id: "p1", livemode: true, payment_status: "paid", currency: "aud", mode: "payment", metadata: { awardpay_purchase: "p1", awardpay_link: "plink_x" }, customer: "cus_1", customer_details: { email }, payment_intent: "pi_1", ...over });
function run(p: any, s: any) {
  const rpcs: any[] = [];
  const db = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: p, error: null }) }) }) }), rpc: async (name: string, args: any) => { rpcs.push({ name, args }); return { data: true, error: null }; } };
  const get = async (path: string) => path.endsWith("line_items") ? { has_more: false, data: [{ quantity: 1, price: { id: "price_9" } }] } : s;
  return processTierEvent({ id: "evt_1", type: "checkout.session.completed", data: { object: { id: "cs_1" } } }, db, get, true).then(() => rpcs, e => { throw e; });
}

test("guest payment records Stripe's payer email for later claiming", async () => {
  const rpcs = await run(purchase({ guest: true, checkout_account_email: null }), session("Payer@Example.com"));
  expect(rpcs[0].args.p_payer_email).toBe("payer@example.com");
});
test("guest payment with wrong price is rejected", async () => {
  const p = purchase({ guest: true, checkout_account_email: null, price_id: "price_29" });
  await expect(run(p, session("a@b.com"))).rejects.toThrow();
});
test("guest payment that isn't paid is rejected", async () => {
  await expect(run(purchase({ guest: true, checkout_account_email: null }), session("a@b.com", { payment_status: "unpaid" }))).rejects.toThrow("checkout_verification_failed");
});
test("signed-in purchase still requires the account email to match", async () => {
  await expect(run(purchase({ guest: false, user_id: "u1", checkout_account_email: "owner@x.com" }), session("other@x.com"))).rejects.toThrow("checkout_account_mismatch");
});
test("signed-in purchase never sends a payer email binding", async () => {
  const rpcs = await run(purchase({ guest: false, user_id: "u1", checkout_account_email: "owner@x.com" }), session("owner@x.com"));
  expect(rpcs[0].args).not.toHaveProperty("p_payer_email");
});
