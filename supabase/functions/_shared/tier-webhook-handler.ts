import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.21.0";
import { processTierEvent } from "./tier-webhook.ts";
import { stripeRuntime, tierDatabase, type TierMode } from "./tier-runtime.ts";
export function tierWebhookHandler(mode: TierMode) {
  return async (req: Request) => {
    const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    const key = Deno.env.get(mode === "sandbox" ? "STRIPE_TEST_SECRET_KEY" : "STRIPE_SECRET_KEY");
    const secret = Deno.env.get(mode === "sandbox" ? "STRIPE_TEST_WEBHOOK_SECRET" : "STRIPE_TIER_WEBHOOK_SECRET");
    if (!key || !secret) return json({ error: "billing_not_configured" }, 503);
    const sig = req.headers.get("stripe-signature");
    if (!sig) return json({ error: "invalid_signature" }, 400);
    const stripe = new Stripe(key, { apiVersion: "2023-10-16", httpClient: Stripe.createFetchHttpClient() });
    let event;
    try { event = await stripe.webhooks.constructEventAsync(await req.text(), sig, secret, undefined, Stripe.createSubtleCryptoProvider()); }
    catch { return json({ error: "invalid_signature" }, 400); }
    if (event.livemode !== (mode === "live")) return json({ error: "mode_mismatch" }, 400);
    const url = Deno.env.get("SUPABASE_URL"), service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !service) return json({ error: "unavailable" }, 503);
    try {
      await processTierEvent(event, tierDatabase(createClient(url, service, { auth: { persistSession: false } }), mode), stripeRuntime(mode).get, mode === "live");
      return json({ received: true }, 200);
    } catch { console.warn("Tier webhook reconciliation failed", { type: event.type }); return json({ error: "retry_required" }, 500); }
  };
}