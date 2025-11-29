import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const fwcApiKey = Deno.env.get('FWC_API_KEY')
    
    // Fetch with max allowed page size (100 is the API limit)
    const url = `https://api.fwc.gov.au/api/v1/awards/MA000020/classifications?page=1&limit=100`
    
    console.log(`Fetching classifications from FWC API: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': fwcApiKey || '',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('FWC API error:', response.status, response.statusText)
      throw new Error(`FWC API returned ${response.status}`)
    }

    const data = await response.json()
    
    console.log(`Retrieved ${data.results?.length || 0} classifications out of ${data._meta?.result_count || 0} total`)

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )
  } catch (error) {
    console.error('Error fetching classifications:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      },
    )
  }
})
