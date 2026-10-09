import { guardPublicFunction } from "../_shared/guard.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Abuse protection: origin allow-list + per-IP rate limit (vision calls cost money).
  const blocked = await guardPublicFunction(req, { fn: "ai-parse-payslip", limit: 20, windowSeconds: 600 });
  if (blocked) return blocked;

  try {
    // `image` is a base64 data URL, e.g. "data:image/jpeg;base64,/9j/4AAQ..."
    const parsed = z.object({ image: z.string().max(4_000_000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/) }).safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "No payslip image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { image } = parsed.data;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(22_000),
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1800,
        messages: [
          {
            role: "system",
            content:
              "You read Australian payslips and extract structured data. Read ONLY what is printed. " +
              "If a field is not visible or you are unsure, OMIT it — never guess or invent a number. " +
              "Money values are AUD as plain numbers (no $ or commas). Hours are decimal numbers. " +
              "Dates are YYYY-MM-DD.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the fields from this payslip image." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_payslip",
              description: "Extract structured fields from an Australian payslip image.",
              parameters: {
                type: "object",
                properties: {
                  employer_name: { type: "string" },
                  employee_name: { type: "string" },
                  classification_or_role: {
                    type: "string",
                    description: 'Job title / classification exactly as shown, e.g. "Level 3 Retail Employee".',
                  },
                  employment_type: { type: "string", enum: ["Full-time", "Part-time", "Casual"] },
                  pay_frequency: { type: "string", enum: ["weekly", "fortnightly", "monthly"], description: "Only the frequency printed on the payslip; omit if absent." },
                  award_name_or_code: { type: "string", description: "Modern award name or code exactly as printed; never infer from role." },
                  employee_age: { type: "number", description: "Employee age only when explicitly printed. Never infer from name, role or rate." },
                  pay_period_start: { type: "string", description: "YYYY-MM-DD" },
                  pay_period_end: { type: "string", description: "YYYY-MM-DD" },
                  ordinary_hours: { type: "number" },
                  base_hourly_rate: { type: "number" },
                  gross_pay: { type: "number" },
                  net_pay: { type: "number" },
                  total_paid: {
                    type: "number",
                    description: "Total paid this period (usually gross). Used as the amount actually paid.",
                  },
                  line_items: {
                    type: "array",
                    description: "Each pay line shown (ordinary hours, penalties, overtime, allowances).",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        hours: { type: "number" },
                        rate: { type: "number" },
                        amount: { type: "number" },
                        type: { type: "string", enum: ["ordinary", "penalty", "overtime", "allowance", "other"] },
                      },
                      required: ["description"],
                    },
                  },
                  unreadable: {
                    type: "boolean",
                    description: "true if the image is too blurry/cropped to extract reliably.",
                  },
                },
                required: ["unreadable"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_payslip" } },
      }),
    });

    if (!response.ok) {
      await response.text();
      console.error("Payslip provider failure", { status: response.status });
      return new Response(JSON.stringify({ error: "reader_unavailable" }), {
        status: response.status === 429 ? 429 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== "extract_payslip") {
      throw new Error("Failed to extract payslip fields");
    }

    const payslip = JSON.parse(toolCall.function.arguments);

    // PRIVACY: the image is never stored. It exists only for the duration of this request.
    return new Response(JSON.stringify({ success: true, payslip }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-parse-payslip failure", { reason: err instanceof Error ? err.name : "unknown" });
    return new Response(JSON.stringify({ error: "reader_unavailable" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});