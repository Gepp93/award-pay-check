import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guardPublicFunction } from "../_shared/guard.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["shifts"],
  properties: {
    shifts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["date", "day_of_week", "start", "finish", "break_minutes"],
        properties: {
          date: { type: "string", description: "YYYY-MM-DD" },
          day_of_week: { type: "string", description: "Mon, Tue, Wed, Thu, Fri, Sat, Sun" },
          start: { type: "string", description: "HH:MM 24-hour" },
          finish: { type: "string", description: "HH:MM 24-hour" },
          break_minutes: { type: "number" },
        },
      },
    },
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const blocked = await guardPublicFunction(req, { fn: 'ai-parse-shifts', limit: 10, windowSeconds: 300 });
  if (blocked) return blocked;

  try {
    const { freeTextShifts, weekStartDate } = await req.json();
    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) return json({ error: 'AI is not configured' }, 500);

    const startDate = weekStartDate ? new Date(weekStartDate) : new Date();
    const dateContext = `The week starts on ${startDate.toISOString().split('T')[0]}. Today is ${new Date().toISOString().split('T')[0]}.`;

    const instructions = `You are a shift schedule parser. Parse the user's natural language description of their work shifts into structured data.

${dateContext}

Rules:
- Convert day names to actual dates based on the week start date provided
- Times should be in 24-hour format (HH:MM)
- If a shift crosses midnight (e.g., 10pm-6am), the finish time is on the next day
- Default break_minutes to 30 for shifts over 5 hours, 0 for shorter shifts, unless specified
- If "no break" or "no lunch" is mentioned, set break_minutes to 0
- Handle ranges like "Monday to Friday" or "Mon-Fri" as multiple days
- Common formats: "6am", "6:00am", "06:00", "1830" should all be parsed correctly`;

    const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': key,
        'X-Lovable-AIG-SDK': 'fetch',
      },
      body: JSON.stringify({
        model: 'openai/gpt-6-astra',
        instructions,
        input: String(freeTextShifts ?? ''),
        stream: true,
        store: false,
        reasoning: { effort: 'low' },
        text: { format: { type: 'json_schema', name: 'parse_shifts', strict: true, schema } },
      }),
    });

    if (!res.ok || !res.body) {
      const t = await res.text();
      console.error('AI gateway error:', res.status, t);
      const msg = res.status === 429 ? 'Too many requests right now — please try again shortly.'
        : res.status === 402 ? 'AI credits have run out. Please try again later.'
        : 'AI service error';
      return json({ error: msg }, res.status === 429 || res.status === 402 ? res.status : 500);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '', text = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === 'response.output_text.delta') text += ev.delta ?? '';
          else if (ev.type === 'error' || ev.type === 'response.failed') console.error('Stream error:', payload);
        } catch { /* ignore partial */ }
      }
    }

    const parsed = JSON.parse(text || '{"shifts":[]}');
    return json({ message: 'Shifts parsed successfully', shifts: parsed.shifts ?? [] });
  } catch (error) {
    console.error('Error in ai-parse-shifts:', error);
    return json({ error: (error as Error).message }, 500);
  }
});
