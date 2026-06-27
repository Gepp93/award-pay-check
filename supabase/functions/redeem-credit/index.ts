import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { assertAllowedOrigin } from "../_shared/guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const blocked = assertAllowedOrigin(req);
  if (blocked) return blocked;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authed = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: claimData, error: claimErr } = await authed.auth.getClaims(token);
    if (claimErr || !claimData?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claimData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const reportId = typeof body?.reportId === "string" ? body.reportId : null;
    if (!reportId) return json({ error: "reportId required" }, 400);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Validate the report belongs to the user and is still locked.
    const { data: report, error: rErr } = await admin
      .from("reports")
      .select("id, user_id, payment_status")
      .eq("id", reportId)
      .maybeSingle();
    if (rErr) return json({ error: rErr.message }, 500);
    if (!report) return json({ error: "Report not found" }, 404);
    if (report.user_id !== userId) return json({ error: "Forbidden" }, 403);
    if (report.payment_status === "paid") {
      const { data: cRow } = await admin
        .from("user_credits").select("credits").eq("user_id", userId).maybeSingle();
      return json({ ok: true, remainingCredits: cRow?.credits ?? 0, alreadyPaid: true });
    }

    // Atomic-ish decrement: only succeeds if credits > 0.
    const { data: decRows, error: decErr } = await admin
      .from("user_credits")
      .update({ credits: (await getCredits(admin, userId)) - 1, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .gt("credits", 0)
      .select("credits");
    if (decErr) return json({ error: decErr.message }, 500);
    if (!decRows || decRows.length === 0) {
      return json({ error: "No credits available" }, 402);
    }
    const remaining = decRows[0].credits as number;

    const { error: upErr } = await admin
      .from("reports")
      .update({ payment_status: "paid" })
      .eq("id", reportId)
      .eq("payment_status", "free");
    if (upErr) {
      // best-effort refund of the credit
      await admin.from("user_credits").update({ credits: remaining + 1 }).eq("user_id", userId);
      return json({ error: upErr.message }, 500);
    }

    return json({ ok: true, remainingCredits: remaining });
  } catch (e) {
    console.error("redeem-credit error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

async function getCredits(admin: ReturnType<typeof createClient>, userId: string): Promise<number> {
  const { data } = await admin
    .from("user_credits").select("credits").eq("user_id", userId).maybeSingle();
  return (data?.credits as number) ?? 0;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}