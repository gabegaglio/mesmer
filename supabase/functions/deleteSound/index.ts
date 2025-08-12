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
    const { soundId } = body

    if (!soundId) {
      throw new Error('Sound ID is required')
    }

    // First get the sound record to verify ownership and get file path
    const { data: soundRecord, error: fetchError } = await supabaseClient
      .from('sounds')
      .select('*')
      .eq('id', soundId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !soundRecord) {
      throw new Error('Sound not found or access denied')
    }

    // Mark sound as inactive
    const { error: updateError } = await supabaseClient
      .from('sounds')
      .update({ is_active: false })
      .eq('id', soundId)
      .eq('user_id', user.id)

    if (updateError) {
      throw updateError
    }

    // Remove from storage (optional - you might want to keep files)
    try {
      await supabaseClient.storage
        .from('user-sounds')
        .remove([soundRecord.file_path])
    } catch (storageError) {
      console.warn('Failed to remove file from storage:', storageError)
      // Don't fail the operation if storage cleanup fails
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Sound deleted successfully' }),
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
