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

    // Fetch pay rates for the classification - get current operative rates
    const today = new Date().toISOString().split('T')[0];
    const fwcUrl = `https://api.fwc.gov.au/api/v1/awards/${awardId}/pay-rates?classification_fixed_id=${classificationFixedId}&operative_from=${today}`;
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
    console.log('First rate sample:', data.results?.[0]);

    // Extract the base rate from the pay rates response
    let baseRate = null;
    if (data.results && data.results.length > 0) {
      // Look for base_pay_rate_id or calculated_pay_rate_id
      for (const rate of data.results) {
        // Try base_rate first
        if (rate.base_rate && parseFloat(rate.base_rate) > 0) {
          baseRate = parseFloat(rate.base_rate);
          console.log('Found base_rate:', baseRate);
          break;
        }
        // Try calculated_rate as fallback
        if (rate.calculated_rate && parseFloat(rate.calculated_rate) > 0) {
          baseRate = parseFloat(rate.calculated_rate);
          console.log('Found calculated_rate:', baseRate);
          break;
        }
      }
    }

    if (!baseRate) {
      console.log('No valid rate found in results, returning full data for inspection');
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