import { TIER_PRODUCTS, type TierProduct } from "./tier-products.ts";
export type TierMode = "live" | "sandbox";
export function tierDatabase(db: any, mode: TierMode) {
  const names: Record<string, string> = { v2_paid_reports: "tier_sandbox_reports", tier_purchases: "tier_sandbox_purchases", tier_transactions: "tier_sandbox_transactions", tier_transaction_events: "tier_sandbox_events" };
  return { from: (name: string) => db.from(mode === "sandbox" ? names[name] ?? name : name), rpc: (name: string, args: any) => db.rpc(mode === "sandbox" && name === "record_tier_transaction" ? "record_tier_sandbox_transaction" : name, args) };
}
export function stripeRuntime(mode: TierMode) {
  const request = async (method: string, path: string, params: Record<string, string> = {}) => {
    const key = Deno.env.get(mode === "sandbox" ? "STRIPE_TEST_SECRET_KEY" : "STRIPE_SECRET_KEY");
    if (!key || (mode === "sandbox" && !/^sk_test_/.test(key))) throw new Error("stripe_not_configured");
    const url = new URL(`https://api.stripe.com/v1/${path}`);
    const form = new URLSearchParams(params);
    if (method === "GET") url.search = form.toString();
    const response = await fetch(url, { method, headers: { Authorization: `Bearer ${key}`, "Stripe-Version": "2024-06-20", ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) }, ...(method === "POST" ? { body: form } : {}) });
    const data = await response.json();
    if (!response.ok) throw new Error("stripe_verification_unavailable");
    if (typeof data.livemode === "boolean" && data.livemode !== (mode === "live")) throw new Error("stripe_mode_mismatch");
    return data;
  };
  return { get: (path: string, params?: Record<string, string>) => request("GET", path, params), post: (path: string, params?: Record<string, string>) => request("POST", path, params) };
}
export async function runtimeLink(product: TierProduct, mode: TierMode, get: (path: string, params?: Record<string, string>) => Promise<any>) {
  const list = await get("payment_links", { limit: "100" });
  if (list.has_more) throw new Error("stripe_catalog_incomplete");
  const link = list.data?.find((l: any) => mode === "live" ? l.id === TIER_PRODUCTS[product].linkId && l.url === TIER_PRODUCTS[product].link : l.metadata?.awardpay_sandbox_product === product);
  if (!link?.active || link.livemode !== (mode === "live")) throw new Error("stripe_link_not_found");
  const lines = await get(`payment_links/${link.id}/line_items`, { limit: "100" });
  const p = lines.data?.[0]?.price, offer = TIER_PRODUCTS[product];
  if (lines.has_more || lines.data?.length !== 1 || lines.data[0].quantity !== 1 || p?.livemode !== (mode === "live") || p.currency !== "aud" || p.unit_amount !== offer.amountCents || (offer.mode === "subscription" ? p.type !== "recurring" || p.recurring?.interval !== "year" || p.recurring.interval_count !== 1 : p.type !== "one_time")) throw new Error("stripe_link_mismatch");
  return { linkId: link.id, priceId: p.id, url: link.url };
}
export async function runtimeWebhook(mode: TierMode, get: (path: string, params?: Record<string, string>) => Promise<any>) {
  const expected = `${Deno.env.get("SUPABASE_URL")}/functions/v1/${mode === "sandbox" ? "stripe-tier-sandbox-webhook" : "stripe-tier-webhook"}`;
  const endpoints = await get("webhook_endpoints", { limit: "100" });
  const events = ["checkout.session.completed", "checkout.session.async_payment_succeeded", "customer.subscription.updated", "customer.subscription.deleted", "invoice.paid", "invoice.payment_failed", "charge.refunded", "charge.dispute.created"];
  const endpoint = endpoints.data?.find((e: any) => e.url === expected && e.livemode === (mode === "live") && e.status === "enabled");
  const missingEvents = events.filter(e => !endpoint?.enabled_events?.includes(e) && !endpoint?.enabled_events?.includes("*"));
  return { ready: !!endpoint && !endpoints.has_more && missingEvents.length === 0, missingEvents };
}