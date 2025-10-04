import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, corsHeaders } from '../_shared/cors.ts'
import { successResponse, errorResponse, requireMethod, rateLimit, sanitizeString } from '../_shared/responses.ts'
import { verifyJWT, extractBearerToken } from '../_shared/jwt-utils.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const JWT_SECRET_KEY = Deno.env.get('JWT_SECRET_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  if (handleCors(req)) {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    requireMethod(req, 'GET')

    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    if (!rateLimit(`check-username:${clientIP}`, 100, 60000)) { // 100 requests per minute
      return errorResponse('Rate limit exceeded', 429)
    }

    // Verify JWT token
    const token = extractBearerToken(req.headers.get('Authorization'))
    if (!token) {
      return errorResponse('Missing authorization token', 401)
    }

    await verifyJWT(token, JWT_SECRET_KEY)

    // Get username from query params
    const url = new URL(req.url)
    const username = url.searchParams.get('username')

    if (!username) {
      return errorResponse('Missing username parameter', 400)
    }

    // Sanitize username input
    const sanitizedUsername = sanitizeString(username, 30)

    // Validate username format
    if (sanitizedUsername.length < 3 || sanitizedUsername.length > 30) {
      return successResponse(false)
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedUsername)) {
      return successResponse(false)
    }

    // Check if username exists
    const { data, error } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', sanitizedUsername)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Username is available if no user found
    const isAvailable = data === null
    return successResponse(isAvailable)

  } catch (error) {
    console.error('Check username error:', error)
    return errorResponse(error.message, 500)
  }
})


