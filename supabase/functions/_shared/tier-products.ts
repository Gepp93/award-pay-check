/** Owner-approved links. Never identify a paid product by amount or display name alone. */
export const TIER_PRODUCTS = {
  pay_check: { name: "Pay Check", amountCents: 900, mode: "payment", pdf: false, link: "https://buy.stripe.com/bJeeVeffe7Rf7675Nz6AM09" },
  underpayment_report: { name: "Underpayment Report", amountCents: 2900, mode: "payment", pdf: true, link: "https://buy.stripe.com/3cI6oI5EE1sRcqr4Jv6AM08" },
  pay_protection: { name: "Pay Protection", amountCents: 5900, mode: "subscription", pdf: true, link: "https://buy.stripe.com/fZu3cw2ss3AZgGHa3P6AM07" },
} as const;
export type TierProduct = keyof typeof TIER_PRODUCTS;
export const isTierProduct = (value: unknown): value is TierProduct => typeof value === "string" && Object.prototype.hasOwnProperty.call(TIER_PRODUCTS, value);
export function subscriptionAccess(status: string, paidThrough: string | null, now = Date.now()) {
  return status === "active" && paidThrough !== null && Date.parse(paidThrough) > now;
}