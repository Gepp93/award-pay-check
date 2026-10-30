// TEMPORARY development-only proxy for downloading raw Fair Work pay database
// pages while building engine-v2 snapshots. Delete after use.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED = /^awards\/MA000(018|010|038|028|120)\/(pay-rates|penalties|wage-allowances|classifications)\?page=\d+&limit=100$/

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { path } = await req.json()
    if (typeof path !== 'string' || !ALLOWED.test(path)) {
      return new Response(JSON.stringify({ error: 'path not allowed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const fwcApiKey = Deno.env.get('FWC_API_KEY')
    const response = await fetch(`https://api.fwc.gov.au/api/v1/${path}`, {
      headers: { 'Ocp-Apim-Subscription-Key': fwcApiKey || '', 'Accept': 'application/json' },
    })
    const text = await response.text()
    return new Response(text, {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
