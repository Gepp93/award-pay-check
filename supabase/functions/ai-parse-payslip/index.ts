import { guardPublicFunction, enforceRateLimit } from "../_shared/guard.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

// Lovable AI Gateway, Responses API. Zero data retention on this endpoint per the gateway model listing.
const PAYSLIP_MODEL = "openai/gpt-6-luna";
const MAX_BODY_BYTES = 4_200_000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const s = (description?: string) => ({ type: ["string", "null"], ...(description ? { description } : {}) });
const n = (description?: string) => ({ type: ["number", "null"], ...(description ? { description } : {}) });
const e = (values: string[], description?: string) => ({ type: ["string", "null"], enum: [...values, null], ...(description ? { description } : {}) });

const props = {
  employer_name: s(),
  employee_name: s(),
  classification_or_role: s('Job title / classification exactly as printed, e.g. "Level 3 Retail Employee".'),
  employment_type: e(["Full-time", "Part-time", "Casual"], "Only if explicitly printed."),
  pay_frequency: e(["weekly", "fortnightly", "monthly"], "Only the frequency printed on the payslip."),
  award_name_or_code: s("Modern award name or code exactly as printed; never infer from role."),
  employee_age: n("Only when explicitly printed."),
  pay_period_start: s("YYYY-MM-DD"),
  pay_period_end: s("YYYY-MM-DD"),
  ordinary_hours: n(),
  base_hourly_rate: n(),
  gross_pay: n(),
  net_pay: n(),
  total_paid: n("Total paid this period (usually gross)."),
  line_items: {
    type: "array",
    description: "Every pay line printed (ordinary, weekend/public holiday penalties, overtime, allowances, paid leave). Paid leave lines such as annual leave or personal/carer's leave must be included with type \"leave\".",
    items: {
      type: "object",
      additionalProperties: false,
      required: ["description", "hours", "rate", "amount", "type"],
      properties: {
        description: { type: "string", description: "Line description exactly as printed." },
        hours: n(), rate: n(), amount: n(),
        type: e(["ordinary", "penalty", "overtime", "allowance", "leave", "other"]),
      },
    },
  },
  unreadable: { type: "boolean", description: "true if the image is not a payslip or too blurry/cropped to read reliably." },
};
const schema = { type: "object", additionalProperties: false, required: Object.keys(props), properties: props };

const instructions =
  "You read Australian payslips and extract structured data. Read ONLY what is printed. " +
  "If a field is not visible or you are unsure, return null — never guess, calculate or invent a value. " +
  "Do not infer an award, classification or employment type that is not printed. " +
  "Separately itemised paid leave (annual leave, personal/carer's leave, sick leave, long service leave) is a leave line, never ordinary hours or overtime. " +
  "Money values are AUD as plain numbers (no $ or commas). Hours are decimal numbers. Dates are YYYY-MM-DD.";

/** Drop nulls so clients see the same shape as before (missing = absent). */
function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) if (v !== null && v !== undefined) out[k] = clean(v);
    return out;
  }
  return value;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // Abuse protection: origin allow-list, short-window and daily per-IP limits (each scan costs credits).
  const blocked = await guardPublicFunction(req, { fn: "ai-parse-payslip", limit: 10, windowSeconds: 600 })
    ?? await enforceRateLimit(req, { fn: "ai-parse-payslip-day", limit: 30, windowSeconds: 86_400 });
  if (blocked) return blocked;

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return json({ error: "image_too_large" }, 413);

  try {
    const parsed = z.object({ image: z.string().max(4_000_000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/) })
      .safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "No payslip image provided" }, 400);

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      console.error("Payslip reader configuration missing");
      return json({ error: "reader_unavailable" }, 500);
    }

    const started = Date.now();
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      signal: req.signal,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: PAYSLIP_MODEL,
        instructions,
        input: [{ role: "user", content: [
          { type: "input_text", text: "Extract the fields from this payslip image." },
          { type: "input_image", image_url: parsed.data.image },
        ] }],
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        max_output_tokens: 6000,
        text: { format: { type: "json_schema", name: "extract_payslip", strict: true, schema } },
      }),
    });

    if (!res.ok || !res.body) {
      // Status only — provider bodies may echo request content.
      await res.body?.cancel();
      console.error("Payslip reader gateway failure", { status: res.status, model: PAYSLIP_MODEL });
      const status = [402, 403, 429].includes(res.status) ? res.status : 502;
      return json({ error: res.status === 402 ? "reader_credits" : "reader_unavailable" }, status);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "", text = "", failed = false, refused = false;
    let usage: { input_tokens?: number; output_tokens?: number } | undefined;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
          else if (ev.type === "response.refusal.delta") refused = true;
          else if (ev.type === "response.completed" || ev.type === "response.incomplete") usage = ev.response?.usage;
          else if (ev.type === "error" || ev.type === "response.failed") failed = true;
        } catch { /* partial line */ }
      }
    }

    // Cost/latency log: counts only, never content.
    console.log("Payslip reader usage", {
      model: PAYSLIP_MODEL, ms: Date.now() - started,
      input_tokens: usage?.input_tokens ?? null, output_tokens: usage?.output_tokens ?? null,
      ok: !failed && !refused && !!text,
    });

    if (failed || refused || !text) return json({ error: refused ? "reader_refused" : "reader_unavailable" }, 502);
    const payslip = clean(JSON.parse(text));
    // PRIVACY: the image is never stored. It exists only for the duration of this request.
    return json({ success: true, payslip });
  } catch (err) {
    if (req.signal.aborted) return json({ error: "cancelled" }, 499);
    console.error("ai-parse-payslip failure", { reason: err instanceof Error ? err.name : "unknown" });
    return json({ error: "reader_unavailable" }, 500);
  }
});
