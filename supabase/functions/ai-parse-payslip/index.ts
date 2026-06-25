import { guardPublicFunction } from "../_shared/guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Abuse protection: origin allow-list + per-IP rate limit (vision calls cost money).
  const blocked = await guardPublicFunction(req, { fn: "ai-parse-payslip", limit: 8, windowSeconds: 300 });
  if (blocked) return blocked;

  try {
    // `image` is a base64 data URL, e.g. "data:image/jpeg;base64,/9j/4AAQ..."
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return new Response(JSON.stringify({ error: "No payslip image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 900,
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
      const t = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${t}`);
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
    console.error("ai-parse-payslip error:", err);
    return new Response(JSON.stringify({ error: String((err as Error)?.message || err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});