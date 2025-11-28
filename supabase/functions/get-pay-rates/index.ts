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

    const { awardId, classificationFixedId } = await req.json();
    
    if (!awardId || !classificationFixedId) {
      return new Response(
        JSON.stringify({ error: 'awardId and classificationFixedId parameters required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch pay rates for the classification
    const fwcUrl = `https://api.fwc.gov.au/api/v1/awards/${awardId}/pay-rates?classification_fixed_id=${classificationFixedId}`;
    console.log('Fetching pay rates from FWC API:', fwcUrl);
    
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
    console.log('Retrieved pay rates:', data.results?.length || 0);

    // Extract the base rate from the pay rates response
    let baseRate = null;
    if (data.results && data.results.length > 0) {
      // Find the base/ordinary rate (usually the first one or the one with rate_type_name = 'Ordinary')
      const ordinaryRate = data.results.find((rate: any) => 
        rate.rate_type_name === 'Ordinary' || 
        rate.rate_type_name === 'Base' ||
        rate.rate_type_name === 'Minimum'
      ) || data.results[0];
      
      if (ordinaryRate && ordinaryRate.base_pay_rate) {
        baseRate = parseFloat(ordinaryRate.base_pay_rate);
      }
    }

    return new Response(
      JSON.stringify({
        ...data,
        baseRate,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-pay-rates:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});