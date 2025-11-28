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

    // Support both query params and body
    const url = new URL(req.url);
    let search = url.searchParams.get('search') || '';
    
    // Try to get from body if not in query params
    if (!search && req.method === 'POST') {
      try {
        const body = await req.json();
        search = body.search || '';
      } catch {
        // No body, continue with empty search
      }
    }
    
    // Fetch all pages of awards
    let allAwards: any[] = [];
    let currentPage = 1;
    let hasMore = true;
    const limit = 100; // Maximum allowed by FWC API
    
    while (hasMore && currentPage <= 2) { // Max 2 pages to get all 156 awards
      let fwcUrl = `https://api.fwc.gov.au/api/v1/awards?limit=${limit}&page=${currentPage}`;
      if (search) {
        fwcUrl += `&search=${encodeURIComponent(search)}`;
      }

      console.log(`Fetching awards page ${currentPage} from FWC API:`, fwcUrl);
      
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
      allAwards = allAwards.concat(data.results || []);
      hasMore = data._meta?.has_more_results || false;
      currentPage++;
      
      console.log(`Retrieved ${data.results?.length || 0} awards on page ${currentPage - 1}, total so far: ${allAwards.length}`);
    }

    console.log('Total awards retrieved:', allAwards.length);

    return new Response(
      JSON.stringify({
        _meta: {
          current_page: 1,
          page_count: 1,
          limit: allAwards.length,
          result_count: allAwards.length,
          first_row_on_page: 1,
          last_row_on_page: allAwards.length,
          has_more_results: false,
          has_previous_results: false
        },
        results: allAwards
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-awards:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
