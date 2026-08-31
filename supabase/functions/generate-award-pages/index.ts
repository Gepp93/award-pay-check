import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

interface AwardRow {
  award_code: string;
  name: string;
  slug: string;
  industry: string | null;
  effective_date: string | null;
  rates_json: Record<string, unknown>;
}

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing Supabase admin credentials");
  return createClient(url, key, { auth: { persistSession: false } });
}

function authClient(req: Request) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key) throw new Error("Missing Supabase credentials");
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { Authorization: req.headers.get("authorization") || "" } },
  });
}

async function isAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;

  const supabase = authClient(req);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;

  const admin = adminClient();
  const { data, error: roleError } = await admin
    .rpc("has_role", { _user_id: user.id, _role: "admin" })
    .single<boolean>();

  if (roleError) {
    console.error("has_role error:", roleError.message);
    return false;
  }
  return !!data;
}

async function fetchUnprocessedAwards(supabase: ReturnType<typeof adminClient>): Promise<AwardRow[]> {
  const { data, error } = await supabase
    .from("awards")
    .select("award_code,name,slug,industry,effective_date,rates_json")
    .not("award_code", "in", supabase.from("award_pages").select("award_code"));

  if (error) throw new Error(`Failed to fetch awards: ${error.message}`);
  return (data as AwardRow[]) || [];
}

function buildPrompt(awardName: string, ratesJson: Record<string, unknown>): string {
  const ratesString = JSON.stringify(ratesJson);
  return `You are writing SEO content for AwardPay, an Australian payslip-checking tool that helps workers find out if they are being underpaid. Write a landing page for the "${awardName}". CRITICAL RULE: use ONLY the pay rates in this data, never invent or adjust any figure: ${ratesString}. If a figure isn't in the data, tell the reader to check their own payslip instead. Return ONLY a valid JSON object, no markdown or backticks, with exactly these keys: title (SEO title under 60 chars including the award name), meta_description (under 155 chars, mentions checking for underpayment), h1, intro (2 short paragraphs, plain Australian English, no invented facts), underpayment_signs (array of 4-6 specific signs), rates_note (1 paragraph saying rates are from the provided data and to verify their own payslip), faq (array of 4-5 {q,a}), cta_copy (one short line urging them to check their payslip for $10).`;
}

async function generateForAward(award: AwardRow, apiKey: string): Promise<Record<string, unknown> | null> {
  const prompt = buildPrompt(award.name, award.rates_json);

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Anthropic API error for ${award.award_code}:`, response.status, text);
    return null;
  }

  const json = await response.json();
  const content = json?.content?.[0]?.text;
  if (!content || typeof content !== "string") {
    console.error(`No content returned for ${award.award_code}`);
    return null;
  }

  try {
    const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);

    const required = ["title", "meta_description", "h1", "intro", "underpayment_signs", "rates_note", "faq", "cta_copy"];
    const missing = required.filter((k) => !(k in parsed));
    if (missing.length > 0) {
      console.error(`Missing keys for ${award.award_code}:`, missing.join(", "));
      return null;
    }

    return parsed;
  } catch (e) {
    console.error(`JSON parse failed for ${award.award_code}:`, e instanceof Error ? e.message : e);
    console.error("Raw content:", content);
    return null;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!(await isAdmin(req))) {
      return new Response(JSON.stringify({ error: "Forbidden — admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = adminClient();
    const awards = await fetchUnprocessedAwards(supabase);
    const results: { slug: string; status: "created" | "skipped"; error?: string }[] = [];

    for (const award of awards) {
      const body = await generateForAward(award, apiKey);
      if (!body) {
        results.push({ slug: award.slug, status: "skipped", error: "generation or parse failed" });
        await delay(500);
        continue;
      }

      const title = String(body.title || "");
      const metaDescription = String(body.meta_description || "");

      const { error } = await supabase.from("award_pages").upsert(
        {
          slug: award.slug,
          award_code: award.award_code,
          title,
          meta_description: metaDescription,
          body_json: body,
          status: "published",
          generated_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      );

      if (error) {
        console.error(`Upsert failed for ${award.award_code}:`, error.message);
        results.push({ slug: award.slug, status: "skipped", error: error.message });
      } else {
        results.push({ slug: award.slug, status: "created" });
      }

      await delay(500);
    }

    return new Response(JSON.stringify({ processed: awards.length, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-award-pages error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
