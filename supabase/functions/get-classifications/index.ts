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

    const { awardId } = await req.json();
    
    if (!awardId) {
      return new Response(
        JSON.stringify({ error: 'awardId parameter required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all classifications with pagination (API limit is 100 per page)
    let allResults: any[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      const fwcUrl = `https://api.fwc.gov.au/api/v1/awards/${awardId}/classifications?page=${currentPage}&limit=100`;
      console.log(`Fetching page ${currentPage} from FWC API:`, fwcUrl);
      
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

      const pageData = await fwcResponse.json();
      allResults = allResults.concat(pageData.results || []);
      
      // Check if there are more pages
      hasMorePages = pageData._meta?.has_more_results === true;
      currentPage++;
      
      // Safety limit to prevent infinite loops
      if (currentPage > 20) {
        console.warn('Reached maximum page limit (20)');
        hasMorePages = false;
      }
    }

    console.log(`Retrieved ${allResults.length} total classifications across ${currentPage - 1} pages`);

    return new Response(
      JSON.stringify({ 
        results: allResults,
        _meta: {
          total_count: allResults.length,
          pages_fetched: currentPage - 1
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-classifications:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
