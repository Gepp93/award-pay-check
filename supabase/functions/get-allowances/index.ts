import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FWC_API_KEY = Deno.env.get('FWC_API_KEY');
    
    if (!FWC_API_KEY) {
      throw new Error('FWC_API_KEY not configured');
    }

    const { awardId } = await req.json();

    if (!awardId) {
      return new Response(
        JSON.stringify({ error: 'awardId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching allowances for award: ${awardId}`);

    const fwcUrl = `https://api.fwc.gov.au/api/v1/awards/${awardId}/allowances`;
    
    const fwcResponse = await fetch(fwcUrl, {
      headers: {
        'Ocp-Apim-Subscription-Key': FWC_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!fwcResponse.ok) {
      const errorText = await fwcResponse.text();
      console.error('FWC API error:', errorText, 'Status:', fwcResponse.status);
      
      // If 404, return empty array (some awards may not have allowances)
      if (fwcResponse.status === 404) {
        console.log('No allowances found for award:', awardId);
        return new Response(
          JSON.stringify({ allowances: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch allowances from FWC API',
          details: errorText 
        }),
        { status: fwcResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await fwcResponse.json();
    console.log('Successfully fetched allowances:', data?.allowances?.length || 0);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-allowances function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});