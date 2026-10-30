import { describe, expect, test } from "bun:test";
import { TIER_PRODUCTS, subscriptionAccess } from "../supabase/functions/_shared/tier-products";
import { assessConfirmed, eligibilityIssues, reportSellable, type Eligibility } from "../supabase/functions/_shared/engine-v2/eligibility";
import { buildRequest, emptyDraft } from "../src/features/v2/engine/model";
import { CASES } from "./engine-v2/cases";
import { processTierEvent, verifiedOneTimeAccess, verifiedSubscription } from "../supabase/functions/_shared/tier-webhook";
import { makeTierPdf } from "../src/features/v2/reportPdf";
const confirmed: Eligibility = { enterpriseAgreement: "no", shiftworker: "no", specialArrangement: "no", awardConfirmed: true, classificationConfirmed: true, rateConfirmed: true };
const input = CASES.find(c => c.id === "MF1")?.input;
if (!input) throw new Error("Missing independently worked Manufacturing case");

describe("approved products and eligibility", () => {
  test("$9 is one assessment, no PDF, exact link", () => { expect(TIER_PRODUCTS.pay_check).toMatchObject({ amountCents: 900, mode: "payment", pdf: false, link: "https://buy.stripe.com/bJeeVeffe7Rf7675Nz6AM09" }); });
  test("$29 is one assessment with PDF, exact link", () => { expect(TIER_PRODUCTS.underpayment_report).toMatchObject({ amountCents: 2900, mode: "payment", pdf: true, link: "https://buy.stripe.com/3cI6oI5EE1sRcqr4Jv6AM08" }); });
  test("$59 is recurring annually with reports, exact link", () => { expect(TIER_PRODUCTS.pay_protection).toMatchObject({ amountCents: 5900, mode: "subscription", pdf: true, link: "https://buy.stripe.com/fZu3cw2ss3AZgGHa3P6AM07" }); });
  test("only active and unexpired subscriptions grant access", () => { const now = Date.parse("2026-10-30"); expect(subscriptionAccess("active", "2027-10-30", now)).toBe(true); for (const status of ["canceled", "past_due", "unpaid", "trialing", "revoked"]) expect(subscriptionAccess(status, "2027-10-30", now)).toBe(false); expect(subscriptionAccess("active", "2026-10-29", now)).toBe(false); });
  test("unknown agreement cannot produce a definitive report", () => { const r = assessConfirmed(input, { ...confirmed, enterpriseAgreement: "unknown" }); expect(r.status).toBe("unsupported"); expect(r.underpaymentCents).toBeNull(); expect(reportSellable(r)).toBe(false); });
  test("missing eligibility cannot bypass confirmation", () => { expect(assessConfirmed(input).status).toBe("unsupported"); });
  for (const field of ["shiftworker", "specialArrangement"] as const) test(`${field} yes is ineligible`, () => { expect(assessConfirmed(input, { ...confirmed, [field]: "yes" }).status).toBe("unsupported"); });
  test("RDO is required and explicit no is preserved", () => { const c = CASES.find(c => c.id === "C1"); if (!c) throw new Error("No Construction case"); expect(eligibilityIssues({ ...c.input, arrangement: { ...c.input.arrangement, rdoAccrual: undefined } }, confirmed)).toHaveLength(1); expect(eligibilityIssues(c.input, confirmed)).toEqual([]); const r = buildRequest({ ...emptyDraft, rdoAccrual: "no", enterpriseAgreement: "unknown" }); expect(r.arrangement.rdoAccrual).toBe(false); expect(r.eligibility.enterpriseAgreement).toBe("unknown"); });
  test("Partial cannot be sold or rendered as paid PDF", () => { const r = assessConfirmed({ ...input, paid: { grossCents: 20000 } }, confirmed); expect(r.status).toBe("partial"); expect(reportSellable(r)).toBe(false); expect(() => makeTierPdf("fixture", r)).toThrow(); });
  test("confirmed complete PDF contains persisted result", () => { const r = assessConfirmed({ ...input, paid: { lines: [{ kind: "ordinary", amountCents: 20000 }], linesCoverAllWages: true } }, confirmed); expect(reportSellable(r)).toBe(true); const bytes = makeTierPdf("safe-synthetic-fixture", r).output(); expect(bytes.startsWith("%PDF")).toBe(true); expect(r.assessedEntitlementCents).toBe(23560); expect(r.underpaymentCents).toBe(3560); });
});

function fixture(over: any = {}) {
  const purchase = { id: "purchase", user_id: "owner", checkout_account_email: "owner@example.invalid", product: "pay_protection", price_id: "price_fixture", payment_link_id: "plink_fixture", stripe_customer_id: "cus_fixture", stripe_subscription_id: "sub_fixture", stripe_session_id: "cs_fixture", ...over };
  const calls: any[] = [];
  const db = { from: () => { const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: purchase, error: null }) }; return q; }, rpc: async (name: string, args: any) => { calls.push({ name, args }); return { data: true, error: null }; } };
  const state: any = { status: "active", cancel_at_period_end: false, paid: true, customer: "cus_fixture", price: "price_fixture", period: 1824940800, email: "owner@example.invalid", refunded: false, disputed: false, amount_refunded: 0, mode: "subscription" };
  const get = async (path: string) => {
    if (path.includes("line_items")) return { data: [{ quantity: 1, price: { id: state.price } }], has_more: false };
    if (path === "charges") return { data: [{ refunded: state.refunded, disputed: state.disputed, amount_refunded: state.amount_refunded }], has_more: false };
    if (path.startsWith("charges/")) return { livemode: true, refunded: state.refunded, disputed: state.disputed, amount_refunded: state.amount_refunded, invoice: "in_fixture", customer: state.customer };
    if (path.startsWith("checkout/sessions/")) return { id: "cs_fixture", client_reference_id: "purchase", livemode: true, payment_status: state.paid ? "paid" : "unpaid", currency: "aud", mode: state.mode, payment_link: "plink_fixture", customer: state.customer, subscription: state.mode === "subscription" ? "sub_fixture" : null, payment_intent: "pi_fixture", customer_details: { email: state.email } };
    if (path.startsWith("subscriptions/")) return { id: "sub_fixture", livemode: true, customer: state.customer, status: state.status, cancel_at_period_end: state.cancel_at_period_end, current_period_end: state.period, items: { data: [{ price: { id: state.price } }] }, latest_invoice: "in_fixture" };
    if (path.startsWith("invoices/")) return { id: "in_fixture", livemode: true, customer: state.customer, payment_intent: "pi_fixture", subscription: "sub_fixture", paid: state.paid, status: state.paid ? "paid" : "open", currency: "aud" };
    throw new Error("Unexpected retrieval");
  };
  return { purchase, db, calls, get, state };
}
const event = (type: string, id = "evt_fixture") => ({ id, created: 1793318400, type, data: { object: { id: type.startsWith("invoice") ? "in_fixture" : type.startsWith("customer") ? "sub_fixture" : "cs_fixture" } } });
describe("isolated verified subscription lifecycle", () => {
  test("one-time access reads verified payment, not a redirect or saved unlock flag", async () => { const f = fixture({ product: "pay_check" }); f.state.mode = "payment"; expect(await verifiedOneTimeAccess(f.purchase, f.get)).toBe(true); f.state.refunded = true; expect(await verifiedOneTimeAccess(f.purchase, f.get)).toBe(false); });
  test("subscription access reads current cancellation despite stale webhook cache", async () => { const f = fixture(); f.state.status = "canceled"; const state = await verifiedSubscription(f.purchase, f.get); expect(subscriptionAccess(state.status, state.paid_through)).toBe(false); });
  test("buyer email cannot reassign another account's purchase", async () => { const f = fixture(); f.state.email = "other@example.invalid"; await expect(processTierEvent(event("checkout.session.completed"), f.db, f.get)).rejects.toThrow("account_mismatch"); expect(f.calls).toHaveLength(0); });
  for (const product of ["pay_check", "underpayment_report"]) test(`${product} can fulfil without Stripe Customer creation`, async () => { const f = fixture({ product }); f.state.mode = "payment"; f.state.customer = null; await processTierEvent(event("checkout.session.completed"), f.db, f.get); expect(f.calls).toHaveLength(1); expect(f.calls[0].args.p_customer_id).toBeNull(); });
  test("unpaid checkout cannot fulfil", async () => { const f = fixture(); f.state.paid = false; await expect(processTierEvent(event("checkout.session.completed"), f.db, f.get)).rejects.toThrow("verification_failed"); expect(f.calls).toHaveLength(0); });
  test("partial refund preserves the purchased one-time scope", async () => { const f = fixture({ product: "pay_check" }); f.state.mode = "payment"; f.state.amount_refunded = 1; expect(await verifiedOneTimeAccess(f.purchase, f.get)).toBe(true); });
  test("checkout records a verified per-session transaction", async () => { const f = fixture(); await processTierEvent(event("checkout.session.completed"), f.db, f.get); expect(f.calls).toHaveLength(1); expect(f.calls[0]).toMatchObject({ name: "record_tier_transaction", args: { p_purchase_id: "purchase", p_session_id: "cs_fixture", p_price_id: "price_fixture" } }); });
  test("false transaction attachment is never acknowledged as fulfilled", async () => { const f = fixture(); f.db.rpc = async () => ({ data: false, error: null }); await expect(processTierEvent(event("checkout.session.completed"), f.db, f.get)).rejects.toThrow("transaction_not_recorded"); });
  test("wrong checkout Price is rejected", async () => { const f = fixture(); f.state.price = "wrong"; await expect(processTierEvent(event("checkout.session.completed"), f.db, f.get)).rejects.toThrow("price_mismatch"); });
  test("scheduled cancellation preserves only paid coverage", async () => { const f = fixture(); f.state.cancel_at_period_end = true; const state = await verifiedSubscription(f.purchase, f.get); expect(state.status).toBe("active"); expect(state.cancel_at_period_end).toBe(true); });
  test("failed renewal denies access and subsequent paid renewal restores it", async () => { const f = fixture(); f.state.paid = false; expect((await verifiedSubscription(f.purchase, f.get)).status).toBe("unpaid"); f.state.paid = true; expect((await verifiedSubscription(f.purchase, f.get)).status).toBe("active"); });
  test("wrong subscription customer is rejected", async () => { const f = fixture(); f.purchase.stripe_customer_id = "other"; await expect(verifiedSubscription(f.purchase, f.get)).rejects.toThrow("verification_failed"); });
  test("sandbox rejects live objects", async () => { const f = fixture(); await expect(processTierEvent(event("checkout.session.completed"), f.db, f.get, false)).rejects.toThrow("verification_failed"); });
});
