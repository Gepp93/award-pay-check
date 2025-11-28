import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const fwcApiKey = Deno.env.get('FWC_API_KEY');
    
    if (!fwcApiKey) {
      console.error('FWC_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { awardId, classificationId } = await req.json();
    
    if (!awardId || !classificationId) {
      return new Response(
        JSON.stringify({ error: 'awardId and classificationId parameters required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fwcUrl = `https://api.fwc.gov.au/api/v1/awards/${awardId}/classifications/${classificationId}`;
    console.log('Fetching classification details from FWC API:', fwcUrl);
    
    const fwcResponse = await fetch(fwcUrl, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': fwcApiKey,
        'Accept': 'application/json',
      },
    });

    if (!fwcResponse.ok) {
      const errorText = await fwcResponse.text();
      console.error('FWC API error:', fwcResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'FWC API request failed', details: errorText }),
        { status: fwcResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await fwcResponse.json();
    console.log('Retrieved classification details');

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-classification-details:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
