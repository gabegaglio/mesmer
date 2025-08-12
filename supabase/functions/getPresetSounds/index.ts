import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Get the request body
    const body = await req.json()
    const { presetId } = body

    if (!presetId) {
      throw new Error('Preset ID is required')
    }

    // Verify the preset belongs to the user
    const { data: preset, error: presetError } = await supabaseClient
      .from('sound_presets')
      .select('id')
      .eq('id', presetId)
      .eq('user_id', user.id)
      .single()

    if (presetError || !preset) {
      throw new Error('Preset not found or access denied')
    }

    // Get preset sounds
    const { data, error } = await supabaseClient
      .from('preset_sounds')
      .select('*')
      .eq('preset_id', presetId)
      .order('sort_order', { ascending: true })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
