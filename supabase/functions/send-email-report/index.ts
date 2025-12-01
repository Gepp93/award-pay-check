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
    const { result, shiftDetails, userEmail } = await req.json();

    console.log('Sending email report to:', userEmail);

    // TODO: Implement email sending using Resend
    // User will need to configure RESEND_API_KEY secret
    // For now, return a stub response
    
    return new Response(
      JSON.stringify({
        message: 'Email sending coming soon',
        recipientEmail: userEmail,
        data: {
          result,
          shiftDetails,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-email-report:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
