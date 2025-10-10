import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, corsHeaders } from '../_shared/cors.ts'
import { successResponse, errorResponse, rateLimit } from '../_shared/responses.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  // Handle CORS
  if (handleCors(req)) {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    if (!rateLimit(`create-profile:${clientIP}`, 10, 60000)) { // 10 requests per minute
      return errorResponse('Rate limit exceeded', 429)
    }

    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405)
    }

    const profileData = await req.json()
    console.log('Creating profile:', profileData)

    // Create profile using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single()

    if (error) {
      console.error('Profile creation error:', error)
      return errorResponse(error.message, 400)
    }

    console.log('Profile created successfully:', data)
    return successResponse(data)

  } catch (error) {
    console.error('Create profile error:', error)
    return errorResponse(error.message, 500)
  }
})
