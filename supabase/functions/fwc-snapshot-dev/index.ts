// TEMPORARY development-only helper: pages through public Fair Work Commission
// data for the three engine-v2 awards so snapshots can be committed. Deleted
// after snapshotting. Whitelisted awards/resources only; no user data.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const AWARDS = new Set(["MA000004", "MA000009", "MA000003"]);
const RESOURCES = new Set(["pay-rates", "penalties", "classifications", "wage-allowances", "expense-allowances"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const key = Deno.env.get("FWC_API_KEY");
  const body = await req.json().catch(() => ({}));
  const { award, resource, page = 1, year } = body;
  if (!key || !AWARDS.has(award) || !RESOURCES.has(resource) || !Number.isInteger(page) || page < 1 || page > 500) {
    return new Response(JSON.stringify({ error: "bad request" }), { status: 400, headers: corsHeaders });
  }
  const qs = new URLSearchParams({ page: String(page), limit: "100" });
  if (year && /^\d{4}$/.test(String(year))) { qs.set("operative_from", `${year}-01-01`); qs.set("operative_to", `${year}-12-31`); }
  const r = await fetch(`https://api.fwc.gov.au/api/v1/awards/${award}/${resource}?${qs}`, {
    headers: { "Ocp-Apim-Subscription-Key": key, Accept: "application/json" },
  });
  return new Response(await r.text(), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
