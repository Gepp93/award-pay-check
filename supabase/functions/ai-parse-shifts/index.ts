import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guardPublicFunction } from "../_shared/guard.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const blocked = await guardPublicFunction(req, { fn: 'ai-parse-shifts', limit: 10, windowSeconds: 300 });
  if (blocked) return blocked;

  try {
    const { freeTextShifts, weekStartDate } = await req.json();

    console.log('Parsing free-text shift input:', freeTextShifts);
    console.log('Week start date:', weekStartDate);

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Get current date context for the AI
    const startDate = weekStartDate ? new Date(weekStartDate) : new Date();
    const dateContext = `The week starts on ${startDate.toISOString().split('T')[0]}. Today is ${new Date().toISOString().split('T')[0]}.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a shift schedule parser. Parse the user's natural language description of their work shifts into structured data.

${dateContext}

Rules:
- Convert day names to actual dates based on the week start date provided
- Times should be in 24-hour format (HH:MM)
- If a shift crosses midnight (e.g., 10pm-6am), the finish time is on the next day
- Default break_minutes to 30 for shifts over 5 hours, 0 for shorter shifts, unless specified
- If "no break" or "no lunch" is mentioned, set break_minutes to 0
- Handle ranges like "Monday to Friday" or "Mon-Fri" as multiple days
- Common formats: "6am", "6:00am", "06:00", "1830" should all be parsed correctly`
          },
          {
            role: 'user',
            content: freeTextShifts
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_shifts",
              description: "Parse shift descriptions into structured shift data",
              parameters: {
                type: "object",
                properties: {
                  shifts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        date: {
                          type: "string",
                          description: "The date of the shift in YYYY-MM-DD format"
                        },
                        day_of_week: {
                          type: "string",
                          description: "Short day name like Mon, Tue, Wed, Thu, Fri, Sat, Sun"
                        },
                        start: {
                          type: "string",
                          description: "Start time in HH:MM 24-hour format"
                        },
                        finish: {
                          type: "string",
                          description: "Finish time in HH:MM 24-hour format"
                        },
                        break_minutes: {
                          type: "number",
                          description: "Break duration in minutes"
                        }
                      },
                      required: ["date", "day_of_week", "start", "finish", "break_minutes"]
                    }
                  }
                },
                required: ["shifts"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "parse_shifts" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data, null, 2));

    // Extract the parsed shifts from the tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'parse_shifts') {
      throw new Error('Failed to parse shifts from AI response');
    }

    const parsedResult = JSON.parse(toolCall.function.arguments);
    console.log('Parsed shifts:', parsedResult.shifts);

    return new Response(
      JSON.stringify({
        message: 'Shifts parsed successfully',
        shifts: parsedResult.shifts,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ai-parse-shifts:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
