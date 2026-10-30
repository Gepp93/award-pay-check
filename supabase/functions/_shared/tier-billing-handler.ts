import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { AssessmentBody } from "./engine-v2/requestSchema.ts";
import { assessConfirmed, reportSellable } from "./engine-v2/eligibility.ts";
import { isTierProduct, TIER_PRODUCTS, subscriptionAccess } from "./tier-products.ts";
import { tierAccess, projectTierResult } from "./tier-access.ts";
import { createPaidPdf } from "./tier-pdf.ts";
import { stripeRuntime, tierDatabase, runtimeLink, runtimeWebhook, type TierMode } from "./tier-runtime.ts";

const Body = z.object({ action: z.enum(["configuration", "save", "checkout", "report", "reports", "status", "pdf", "portal", "cancel"]), product: z.string().optional(), reportId: z.string().uuid().optional(), request: AssessmentBody.optional() });
export function tierBillingHandler(mode: TierMode) {
return async (req: Request) => {
  const stripe = stripeRuntime(mode);
  const resolveLink = (product: Parameters<typeof runtimeLink>[0]) => runtimeLink(product, mode, stripe.get);
  const webhookReadiness = () => runtimeWebhook(mode, stripe.get);
  const webhookSecretName = mode === "sandbox" ? "STRIPE_TEST_WEBHOOK_SECRET" : "STRIPE_TIER_WEBHOOK_SECRET";
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL"), anon = Deno.env.get("SUPABASE_ANON_KEY"), service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return json({ error: "unavailable" }, 503);
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
  const client = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: claims, error: claimError } = await client.auth.getClaims(auth.slice(7));
  const userId = claims?.claims?.sub;
  if (claimError || typeof userId !== "string" || claims?.claims?.role !== "authenticated") return json({ error: "unauthorized" }, 401);
  const db = tierDatabase(createClient(url, service, { auth: { persistSession: false } }), mode);
  const { data: admin, error: roleError } = await db.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (roleError || admin !== true) return json({ error: "forbidden" }, 403);
  try {
    const raw = await req.text();
    if (raw.length > 60000) return json({ error: "too_large" }, 413);
    const parsed = Body.safeParse(JSON.parse(raw));
    if (!parsed.success) return json({ error: "invalid_input" }, 400);
    const b = parsed.data;
    if (b.action === "configuration") {
      const links = {} as Record<string, unknown>;
      for (const product of Object.keys(TIER_PRODUCTS)) if (isTierProduct(product)) links[product] = await resolveLink(product);
      return json({ links, webhookConfigured: !!Deno.env.get(webhookSecretName), webhook: await webhookReadiness() });
    }
    if (b.action === "status") {
      const access = await tierAccess(db, userId, undefined, stripe.get, mode === "live");
      return json({ active: access.active, subscriptions: access.subscriptions });
    }
    if (b.action === "reports") {
      const { data, error } = await db.from("v2_paid_reports").select("id,created_at,assessment_status,assessment_unlocked,pdf_unlocked").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return json({ reports: data });
    }
    if (b.action === "save") {
      if (!b.request) return json({ error: "request_required" }, 400);
      const result = assessConfirmed(b.request as Parameters<typeof assessConfirmed>[0], b.request.eligibility);
      if (!reportSellable(result)) return json({ error: "assessment_not_supported", result }, 422);
      const { data, error } = await db.from("v2_paid_reports").insert({ user_id: userId, request: b.request, result, assessment_status: result.status }).select("id").single();
      if (error) throw error;
      return json({ reportId: data.id });
    }
    const { data: report, error: reportError } = b.reportId ? await db.from("v2_paid_reports").select("*").eq("id", b.reportId).eq("user_id", userId).maybeSingle() : { data: null, error: null };
    if (reportError) throw reportError;
    if (b.action === "portal" || b.action === "cancel") {
      const { data: transactions, error } = await db.from("tier_transactions").select("*").eq("user_id", userId).eq("product", "pay_protection");
      if (error) throw error;
      const transaction = transactions?.[0];
      if (!transaction?.stripe_customer_id || !transaction.stripe_subscription_id) return json({ error: "subscription_not_found" }, 404);
      await tierAccess(db, userId, undefined, stripe.get, mode === "live");
      if (b.action === "cancel") {
        await stripe.post(`subscriptions/${transaction.stripe_subscription_id}`, { cancel_at_period_end: "true" });
        return json({ scheduled: true });
      }
      const origin = safeOrigin(req);
      const portal = await stripe.post("billing_portal/sessions", { customer: transaction.stripe_customer_id, return_url: `${origin}/v2/reports${mode === "sandbox" ? "?billing=sandbox" : ""}` });
      return json({ url: portal.url });
    }
    if (b.action === "report" || b.action === "pdf") {
      if (!report) return json({ error: "not_found" }, 404);
      const r = report.result as any;
      const access = await tierAccess(db, userId, report.id, stripe.get, mode === "live");
      const assessmentUnlocked = access.assessment, pdfUnlocked = access.detailed;
      if (b.action === "pdf") {
        if (!pdfUnlocked) return json({ error: "pdf_forbidden" }, 403);
        return new Response(createPaidPdf(report.id, r), { headers: { ...corsHeaders, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="AwardPay-${report.id}.pdf"`, "Cache-Control": "private, no-store" } });
      }
      // No detailed result is sent to a locked client. PDF uses this same access-checked response.
      return json({ id: report.id, createdAt: report.created_at, status: report.assessment_status, assessmentUnlocked, pdfUnlocked, result: projectTierResult(r, assessmentUnlocked, pdfUnlocked), summary: { status: r.status, underpaymentCents: r.status === "complete" ? r.underpaymentCents : null, exclusions: r.exclusions } });
    }
    if (!isTierProduct(b.product)) return json({ error: "invalid_product" }, 400);
    if (!Deno.env.get(webhookSecretName)) return json({ error: "webhook_not_configured" }, 503);
    if (!(await webhookReadiness()).ready) return json({ error: "webhook_events_missing" }, 503);
    if (b.product !== "pay_protection" && !report) return json({ error: "supported_report_required" }, 422);
    if (report && !reportSellable(report.result as any)) return json({ error: "assessment_not_supported" }, 422);
    const config = await resolveLink(b.product);
    const { data: user } = await client.auth.getUser();
    if (!user.user?.email_confirmed_at) return json({ error: "confirmed_account_required" }, 403);
    const id = crypto.randomUUID();
    const { error } = await db.from("tier_purchases").insert({ id, user_id: userId, checkout_account_email: user.user.email?.toLowerCase(), report_id: report?.id ?? null, product: b.product, payment_link_id: config.linkId, price_id: config.priceId });
    if (error) throw error;
    const checkout = new URL(config.url);
    const origin = safeOrigin(req);
    // Session creation reuses the verified Price without changing shared Payment Link settings.
    const session = await stripe.post("checkout/sessions", { mode: TIER_PRODUCTS[b.product].mode, "line_items[0][price]": config.priceId, "line_items[0][quantity]": "1", client_reference_id: id, customer_email: user.user.email ?? "", "metadata[awardpay_purchase]": id, "metadata[awardpay_link]": config.linkId, success_url: `${origin}/v2/payment-return?purchase=${id}&billing=${mode}&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/v2/${report ? `report/${report.id}` : "pricing"}?billing=${mode}`, ...(TIER_PRODUCTS[b.product].mode === "payment" ? { customer_creation: "always" } : {}) });
    checkout.searchParams.set("client_reference_id", id);
    if (user.user.email) checkout.searchParams.set("prefilled_email", user.user.email);
    return json({ url: session.url, purchaseId: id });
  } catch (e) {
    const reason = e instanceof Error && /^stripe_[a-z_]+$/.test(e.message) ? e.message : "billing_unavailable";
    console.warn("Tier billing request failed", { reason });
    return json({ error: reason }, 503);
  }
};
}

function safeOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (origin === "http://localhost:8080" || origin === "https://www.awardpay.com.au" || origin === "https://awardpay.com.au" || origin === "https://award-pay-check.lovable.app" || origin?.match(/^https:\/\/id-preview--[a-z0-9-]+\.lovable\.app$/)) return origin;
  return "https://www.awardpay.com.au";
}
