import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const fwcApiKey = Deno.env.get('FWC_API_KEY');
    
    if (!fwcApiKey) {
      console.error('FWC_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'FWC API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Testing FWC API connection...');
    
    const fwcResponse = await fetch('https://api.fwc.gov.au/api/v1/awards?limit=5', {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': fwcApiKey,
        'Accept': 'application/json',
      },
    });

    if (!fwcResponse.ok) {
      console.error('FWC API error:', fwcResponse.status, fwcResponse.statusText);
      const errorText = await fwcResponse.text();
      console.error('Error response:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'FWC API request failed', 
          status: fwcResponse.status,
          details: errorText 
        }),
        { status: fwcResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await fwcResponse.json();
    console.log('FWC API test successful. Retrieved awards:', data.results?.length || 0);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'FWC API connection verified',
        awards_count: data.results?.length || 0,
        data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in test-fwc-api function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
