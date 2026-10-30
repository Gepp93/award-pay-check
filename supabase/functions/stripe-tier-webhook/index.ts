import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.21.0";
import { processTierEvent } from "../_shared/tier-webhook.ts";
import { stripeGet } from "../_shared/tier-stripe.ts";

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  const secret = Deno.env.get("STRIPE_TIER_WEBHOOK_SECRET");
  const sig = req.headers.get("stripe-signature");
  if (!key || !secret) return json({ error: "billing_not_configured" }, 503);
  if (!sig) return json({ error: "invalid_signature" }, 400);
  const stripe = new Stripe(key, { apiVersion: "2023-10-16", httpClient: Stripe.createFetchHttpClient() });
  let event;
  try { event = await stripe.webhooks.constructEventAsync(await req.text(), sig, secret, undefined, Stripe.createSubtleCryptoProvider()); }
  catch { return json({ error: "invalid_signature" }, 400); }
  const url = Deno.env.get("SUPABASE_URL"); const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) return json({ error: "unavailable" }, 503);
  try {
    await processTierEvent(event, createClient(url, service, { auth: { persistSession: false } }), stripeGet);
    return json({ received: true }, 200);
  } catch { console.warn("Tier webhook processing failed", { type: event.type }); return json({ error: "retry_required" }, 500); }
});