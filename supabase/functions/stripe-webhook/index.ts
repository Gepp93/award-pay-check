import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  if (!sig || !webhookSecret) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Bad signature", { status: 400 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const reportId = session.client_reference_id;
      if (!reportId) {
        console.warn("checkout.session.completed missing client_reference_id");
        return new Response("ok", { status: 200 });
      }

      // Determine product. Metadata wins; otherwise infer from amount.
      let product = (session.metadata?.product as string | undefined) ?? null;
      if (!product) {
        if (session.amount_total === 1000) product = "full_report";
        else if (session.amount_total === 3000) product = "backpay_pack";
      }
      if (product !== "full_report" && product !== "backpay_pack") {
        console.warn("Unknown product for session", session.id, session.amount_total);
        return new Response("ok", { status: 200 });
      }

      // Idempotency: skip if this session already applied.
      const { data: existing } = await admin
        .from("reports")
        .select("id, user_id, stripe_session_id, payment_status")
        .eq("id", reportId)
        .maybeSingle();
      if (!existing) {
        console.warn("Report not found for session", reportId);
        return new Response("ok", { status: 200 });
      }
      if (existing.stripe_session_id === session.id) {
        return new Response("ok", { status: 200 });
      }

      // Mark the report paid.
      await admin
        .from("reports")
        .update({ payment_status: "paid", stripe_session_id: session.id })
        .eq("id", reportId);

      // Back-pay pack also grants 5 credits to that report's owner.
      if (product === "backpay_pack" && existing.user_id) {
        const { data: existingCredits } = await admin
          .from("user_credits")
          .select("credits")
          .eq("user_id", existing.user_id)
          .maybeSingle();
        const current = (existingCredits?.credits as number) ?? 0;
        await admin
          .from("user_credits")
          .upsert(
            {
              user_id: existing.user_id,
              credits: current + 5,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("stripe-webhook handler error:", e);
    return new Response("error", { status: 500 });
  }
});