import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { AssessmentBody } from "../_shared/engine-v2/requestSchema.ts";
import { assessConfirmed, reportSellable } from "../_shared/engine-v2/eligibility.ts";
import { isTierProduct, TIER_PRODUCTS, subscriptionAccess } from "../_shared/tier-products.ts";
import { resolveLink } from "../_shared/tier-stripe.ts";

const Body = z.object({ action: z.enum(["configuration", "save", "checkout", "report", "reports", "status"]), product: z.string().optional(), reportId: z.string().uuid().optional(), request: AssessmentBody.optional() });
Deno.serve(async req => {
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
  const db = createClient(url, service, { auth: { persistSession: false } });
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
      return json({ links, webhookConfigured: !!Deno.env.get("STRIPE_TIER_WEBHOOK_SECRET") });
    }
    if (b.action === "status") {
      const { data, error } = await db.from("tier_subscriptions").select("status,paid_through,cancel_at_period_end").eq("user_id", userId);
      if (error) throw error;
      return json({ active: (data ?? []).some(s => subscriptionAccess(s.status, s.paid_through)), subscriptions: data });
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
    if (b.action === "report") {
      if (!report) return json({ error: "not_found" }, 404);
      const r = report.result as any;
      const { data: subscriptions, error: subError } = await db.from("tier_subscriptions").select("status,paid_through").eq("user_id", userId);
      if (subError) throw subError;
      const active = (subscriptions ?? []).some(s => subscriptionAccess(s.status, s.paid_through));
      const assessmentUnlocked = report.assessment_unlocked || active;
      const pdfUnlocked = report.pdf_unlocked || active;
      // No detailed result is sent to a locked client. PDF uses this same access-checked response.
      return json({ id: report.id, createdAt: report.created_at, status: report.assessment_status, assessmentUnlocked, pdfUnlocked, result: assessmentUnlocked ? r : null, summary: { status: r.status, underpaymentCents: r.status === "complete" ? r.underpaymentCents : null, exclusions: r.exclusions } });
    }
    if (!isTierProduct(b.product)) return json({ error: "invalid_product" }, 400);
    if (!Deno.env.get("STRIPE_TIER_WEBHOOK_SECRET")) return json({ error: "webhook_not_configured" }, 503);
    if (b.product !== "pay_protection" && !report) return json({ error: "supported_report_required" }, 422);
    if (report && !reportSellable(report.result as any)) return json({ error: "assessment_not_supported" }, 422);
    const config = await resolveLink(b.product);
    const { data: user } = await client.auth.getUser();
    if (!user.user?.email_confirmed_at) return json({ error: "confirmed_account_required" }, 403);
    const id = crypto.randomUUID();
    const { error } = await db.from("tier_purchases").insert({ id, user_id: userId, report_id: report?.id ?? null, product: b.product, payment_link_id: config.linkId, price_id: config.priceId });
    if (error) throw error;
    const checkout = new URL(TIER_PRODUCTS[b.product].link);
    checkout.searchParams.set("client_reference_id", id);
    if (user.user.email) checkout.searchParams.set("prefilled_email", user.user.email);
    return json({ url: checkout.toString(), purchaseId: id });
  } catch (e) {
    const reason = e instanceof Error && /^stripe_[a-z_]+$/.test(e.message) ? e.message : "billing_unavailable";
    console.warn("Tier billing request failed", { reason });
    return json({ error: reason }, 503);
  }
});