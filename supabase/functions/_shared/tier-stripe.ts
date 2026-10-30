import { TIER_PRODUCTS, type TierProduct } from "./tier-products.ts";
export const STRIPE_VERSION = "2024-06-20";
export async function stripeGet(path: string, params: Record<string, string> = {}) {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("stripe_not_configured");
  const url = new URL(`https://api.stripe.com/v1/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${key}`, "Stripe-Version": STRIPE_VERSION } });
  const body = await response.json();
  if (!response.ok) throw new Error("stripe_verification_unavailable");
  return body;
}
export function checkPrice(price: any, product: TierProduct) {
  const offer = TIER_PRODUCTS[product];
  return price?.livemode === true && price.currency === "aud" && price.unit_amount === offer.amountCents &&
    (offer.mode === "subscription" ? price.type === "recurring" && price.recurring?.interval === "year" && price.recurring?.interval_count === 1 : price.type === "one_time");
}
export async function resolveLink(product: TierProduct) {
  let after = "";
  for (let page = 0; page < 100; page++) {
    const list = await stripeGet("payment_links", { limit: "100", ...(after ? { starting_after: after } : {}) });
    const link = list.data?.find((x: any) => x.url === TIER_PRODUCTS[product].link);
    if (link) {
      const lines = await stripeGet(`payment_links/${link.id}/line_items`, { limit: "100" });
      if (!link.active || !link.livemode || lines.has_more || lines.data?.length !== 1 || lines.data[0].quantity !== 1 || !checkPrice(lines.data[0].price, product)) throw new Error("stripe_link_mismatch");
      return { linkId: link.id as string, priceId: lines.data[0].price.id as string, afterCompletion: link.after_completion };
    }
    if (!list.has_more) break;
    after = list.data?.at(-1)?.id ?? "";
    if (!after) break;
  }
  throw new Error("stripe_link_not_found");
}