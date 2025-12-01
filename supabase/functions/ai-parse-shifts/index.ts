import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { freeTextShifts } = await req.json();

    console.log('Parsing free-text shift input:', freeTextShifts);

    // TODO: Implement AI-powered parsing using Lovable AI Gateway
    // Parse text like "Mon 6am-2:30pm, Tue 3:30pm-4am, Sat 6am-1:30pm, no lunch Saturday"
    // into structured HoursWorked[] format
    
    // For now, return a stub response
    const parsedShifts = [
      {
        date: "2025-01-06",
        day_of_week: "Mon",
        start: "06:00",
        finish: "14:30",
        break_minutes: 30,
      },
      {
        date: "2025-01-07",
        day_of_week: "Tue",
        start: "15:30",
        finish: "04:00",
        break_minutes: 30,
      },
      {
        date: "2025-01-11",
        day_of_week: "Sat",
        start: "06:00",
        finish: "13:30",
        break_minutes: 0,
      },
    ];

    return new Response(
      JSON.stringify({
        message: 'AI parsing coming soon - returning example data',
        shifts: parsedShifts,
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
