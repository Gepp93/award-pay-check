// Engine v2 HTTP wrapper — INTERNAL TESTING ONLY.
// Server-enforced access: a signed-in user whose account holds the `admin`
// role (public.user_roles, checked server-side). No anonymous access.
// Pure calculation, no storage; logs carry only status and counts.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { AssessmentBody } from "../_shared/engine-v2/requestSchema.ts";
import { assessConfirmed } from "../_shared/engine-v2/eligibility.ts";


const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: claims, error: claimErr } = await userClient.auth.getClaims(auth.slice(7));
  const userId = claims?.claims?.sub;
  if (claimErr || !userId || claims.claims.role !== "authenticated") return json({ error: "unauthorized" }, 401);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: isTester, error: roleErr } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (roleErr || isTester !== true) {
    console.log("v2 calc denied: not an authorised tester");
    return json({ error: "forbidden" }, 403);
  }

  const raw = await req.text();
  if (raw.length > 50_000) return json({ error: "too_large" }, 413);
  let body: unknown = null;
  try { body = JSON.parse(raw); } catch { /* handled below */ }
  const parsed = AssessmentBody.safeParse(body);
  if (!parsed.success) return json({ error: "invalid_input", fields: Object.keys(parsed.error.flatten().fieldErrors) }, 400);

  const result = assessConfirmed(parsed.data as Parameters<typeof assessConfirmed>[0], parsed.data.eligibility);
  console.log("v2 calc", { status: result.status, shifts: parsed.data.shifts.length, notAssessed: result.notAssessed.length });
  return json(result);
});
