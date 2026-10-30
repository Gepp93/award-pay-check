import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";
import { saveAndNotify } from "./delivery.ts";

// Employer enquiry intake. Stores the enquiry (service role only; no browser access).
// Notifications are sent only after durable storage, with a stored-ID dedupe key.
const Body = z.object({
  businessName: z.string().trim().min(1).max(150),
  contactName: z.string().trim().min(1).max(100),
  workEmail: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).regex(/^[0-9+()\s-]*$/).optional().or(z.literal("")),
  industry: z.string().trim().min(1).max(80),
  employeeCount: z.enum(["1", "2-9", "10-49", "50-199", "200+"]),
  service: z.enum(["new-employee", "existing-review", "compliance-risk", "not-sure"]),
  message: z.string().trim().min(10).max(2000),
  consent: z.literal(true),
  website: z.string().max(0).optional().or(z.literal("")), // honeypot
  elapsedMs: z.number().int().min(0),
  submissionId: z.string().uuid().optional(),
});

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sha256(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const p = Body.safeParse(raw);
  if (!p.success) return json({ error: "Please check the highlighted fields." }, 400);
  const d = p.data;
  if (d.elapsedMs < 3000) return json({ error: "Please wait a moment before submitting." }, 400);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const senderHash = await sha256(`${ip}|employer-enquiry`);
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "Enquiries are temporarily unavailable." }, 500);
  const db = createClient(url, key);
  const payload = {
    business_name: d.businessName, contact_name: d.contactName, work_email: d.workEmail.toLowerCase(),
    phone: d.phone || null, industry: d.industry, employee_count: d.employeeCount, service: d.service,
    message: d.message, consent: true, sender_hash: senderHash,
  };
  // Stable across retries; bind to validated content so callers cannot claim another enquiry.
  const hash = await sha256(JSON.stringify([d.submissionId ?? "legacy", payload]));
  const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
  const { data: existing, error: lookupError } = await db.from("employer_enquiries")
    .select("id, notified_at").eq("id", id).maybeSingle();
  if (lookupError) return json({ error: "We couldn't save your enquiry. Please try again." }, 500);

  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count, error: countError } = await db.from("employer_enquiries").select("id", { count: "exact", head: true })
    .eq("sender_hash", senderHash).gte("created_at", since);
  if (countError) return json({ error: "Enquiries are temporarily unavailable." }, 500);
  if (!existing && (count ?? 0) >= 5) return json({ error: "Too many enquiries from this connection. Please try again later or email support@awardpay.com.au." }, 429);

  const services = {
    "new-employee": "New employee award and classification research",
    "existing-review": "Existing employee pay and entitlement review",
    "compliance-risk": "Payroll compliance risk review",
    "not-sure": "Not sure yet",
  };
  try {
    const result = await saveAndNotify(async () => {
      const { error } = await db.from("employer_enquiries").upsert({ id, ...payload }, { onConflict: "id", ignoreDuplicates: true });
      if (error) throw new Error("save_failed");
      const { data: row, error: readError } = await db.from("employer_enquiries").select("id, notified_at").eq("id", id).single();
      if (readError || !row) throw new Error("save_unconfirmed");
      return { id: row.id, notifiedAt: row.notified_at };
    }, (savedId) => sendTemplateEmail("employer-enquiry", "support@awardpay.com.au", {
      templateData: { businessName: d.businessName, contactName: d.contactName, contactEmail: d.workEmail, industry: d.industry, service: services[d.service], message: d.message },
      replyTo: d.workEmail,
      idempotencyKey: `employer-enquiry-${savedId}`,
    }), async (savedId) => {
      const { error } = await db.from("employer_enquiries").update({ notified_at: new Date().toISOString() }).eq("id", savedId);
      if (error) throw new Error("notification_marker_failed");
    });
    return json(result);
  } catch {
    console.error("employer-enquiry save failed");
    return json({ error: "We couldn't save your enquiry. Please try again." }, 500);
  }
});
