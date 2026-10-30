import { describe, expect, test } from "bun:test";
import { TIER_PRODUCTS, subscriptionAccess } from "../supabase/functions/_shared/tier-products";
import { assessConfirmed, eligibilityIssues, reportSellable, type Eligibility } from "../supabase/functions/_shared/engine-v2/eligibility";
import { buildRequest, emptyDraft } from "../src/features/v2/engine/model";
import { CASES } from "./engine-v2/cases";
import { processTierEvent } from "../supabase/functions/_shared/tier-webhook";
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
  const purchase = { id: "purchase", user_id: "owner", product: "pay_protection", price_id: "price_fixture", payment_link_id: "plink_fixture", stripe_customer_id: "cus_fixture", stripe_subscription_id: "sub_fixture", ...over };
  const calls: any[] = [];
  const db = { from: () => { const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: purchase, error: null }) }; return q; }, rpc: async (name: string, args: any) => { calls.push({ name, args }); return { data: true, error: null }; } };
  const state: any = { status: "active", cancel_at_period_end: false, paid: true, customer: "cus_fixture", price: "price_fixture", period: 1824940800 };
  const get = async (path: string) => {
    if (path.includes("line_items")) return { data: [{ quantity: 1, price: { id: state.price } }], has_more: false };
    if (path.startsWith("checkout/sessions/")) return { id: "cs_fixture", client_reference_id: "purchase", livemode: true, payment_status: "paid", currency: "aud", mode: "subscription", payment_link: "plink_fixture", customer: state.customer, subscription: "sub_fixture" };
    if (path.startsWith("subscriptions/")) return { id: "sub_fixture", livemode: true, customer: state.customer, status: state.status, cancel_at_period_end: state.cancel_at_period_end, current_period_end: state.period, items: { data: [{ price: { id: state.price } }] }, latest_invoice: "in_fixture" };
    if (path.startsWith("invoices/")) return { id: "in_fixture", subscription: "sub_fixture", paid: state.paid, status: state.paid ? "paid" : "open", currency: "aud" };
    throw new Error("Unexpected retrieval");
  };
  return { purchase, db, calls, get, state };
}
const event = (type: string, id = "evt_fixture") => ({ id, created: 1793318400, type, data: { object: { id: type.startsWith("invoice") ? "in_fixture" : type.startsWith("customer") ? "sub_fixture" : "cs_fixture" } } });
describe("isolated verified subscription lifecycle", () => {
  test("checkout binds trusted purchase, exact Price and Stripe customer", async () => { const f = fixture(); await processTierEvent(event("checkout.session.completed"), f.db, f.get); expect(f.calls[0]).toMatchObject({ name: "fulfil_tier_purchase", args: { p_purchase_id: "purchase", p_price_id: "price_fixture", p_customer_id: "cus_fixture", p_subscription_id: "sub_fixture" } }); expect(f.calls[1].args.p_status).toBe("active"); });
  test("wrong checkout Price is rejected", async () => { const f = fixture(); f.state.price = "wrong_price"; await expect(processTierEvent(event("checkout.session.completed"), f.db, f.get)).rejects.toThrow("price_mismatch"); expect(f.calls).toHaveLength(0); });
  test("scheduled cancellation keeps active access through paid period", async () => { const f = fixture(); f.state.cancel_at_period_end = true; await processTierEvent(event("customer.subscription.updated"), f.db, f.get); expect(f.calls[0].args.p_status).toBe("active"); expect(f.calls[0].args.p_cancel_at_period_end).toBe(true); expect(f.calls[0].args.p_paid_through).not.toBeNull(); });
  test("ended subscription is revoked, not extended", async () => { const f = fixture(); f.state.status = "canceled"; await processTierEvent(event("customer.subscription.deleted"), f.db, f.get); expect(f.calls[0].args.p_status).toBe("canceled"); });
  test("renewal reads current paid invoice, not event snapshot", async () => { const f = fixture(); f.state.period += 365 * 86400; await processTierEvent(event("invoice.paid"), f.db, f.get); expect(f.calls[0].args.p_paid_through).toBe(new Date(f.state.period * 1000).toISOString()); });
  test("unpaid renewal does not grant an active entitlement", async () => { const f = fixture(); f.state.paid = false; await processTierEvent(event("invoice.payment_failed"), f.db, f.get); expect(f.calls[0].args.p_status).toBe("unpaid"); expect(f.calls[0].args.p_paid_through).toBeNull(); });
  test("wrong subscription customer is rejected", async () => { const f = fixture(); f.state.customer = "other_customer"; await expect(processTierEvent(event("customer.subscription.updated"), f.db, f.get)).rejects.toThrow("verification_failed"); expect(f.calls).toHaveLength(0); });
  test("duplicate notifications use identical transactional event keys", async () => { const f = fixture(); await processTierEvent(event("invoice.paid"), f.db, f.get); await processTierEvent(event("invoice.paid"), f.db, f.get); expect(f.calls[0].args.p_event_id).toBe(f.calls[1].args.p_event_id); });
  test("database failure propagates to webhook retry", async () => { const f = fixture(); f.db.rpc = async () => { throw new Error("offline"); }; await expect(processTierEvent(event("invoice.paid"), f.db, f.get)).rejects.toThrow("offline"); });
});