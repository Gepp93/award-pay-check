import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

// Employer enquiry intake. Stores the enquiry (service role only; no browser access).
// Email notification to support is added once a verified sending domain exists.
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
  let raw: any;
  try { raw = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  // Bots: honeypot filled or submitted too fast → quiet success, nothing stored.
  if (raw?.website || typeof raw?.elapsedMs !== "number" || raw.elapsedMs < 3000) return json({ ok: true });
  const p = Body.safeParse(raw);
  if (!p.success) return json({ error: "Please check the highlighted fields." }, 400);
  const d = p.data;

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const senderHash = await sha256(`${ip}|employer-enquiry`);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from("employer_enquiries").select("id", { count: "exact", head: true })
    .eq("sender_hash", senderHash).gte("created_at", since);
  if ((count ?? 0) >= 5) return json({ error: "Too many enquiries from this connection. Please try again later or email support@awardpay.com.au." }, 429);

  const { error } = await db.from("employer_enquiries").insert({
    business_name: d.businessName, contact_name: d.contactName, work_email: d.workEmail.toLowerCase(),
    phone: d.phone || null, industry: d.industry, employee_count: d.employeeCount, service: d.service,
    message: d.message, consent: true, sender_hash: senderHash,
  });
  if (error) { console.error("employer-enquiry insert failed", error.code); return json({ error: "We couldn't save your enquiry. Please try again." }, 500); }
  console.log("employer-enquiry stored");
  return json({ ok: true });
});
