import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, corsHeaders } from '../_shared/cors.ts'
import { successResponse, errorResponse, requireMethod, rateLimit, validateInput, sanitizeString } from '../_shared/responses.ts'
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
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    if (!rateLimit(`user-profile:${clientIP}`, 50, 60000)) { // 50 requests per minute
      return errorResponse('Rate limit exceeded', 429)
    }

    // Verify JWT token
    const token = extractBearerToken(req.headers.get('Authorization'))
    if (!token) {
      return errorResponse('Missing authorization token', 401)
    }

    const payload = await verifyJWT(token, JWT_SECRET_KEY)

    if (req.method === 'GET') {
      requireMethod(req, 'GET')
      const url = new URL(req.url)
      const userId = url.searchParams.get('userId')
      
      if (!userId) {
        return errorResponse('Missing userId parameter', 400)
      }

      // Get user profile
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return successResponse(null) // User not found
        }
        throw error
      }

      return successResponse(data)

    } else if (req.method === 'POST') {
      requireMethod(req, 'POST')
      const body = await req.json()
      
      // Input validation
      validateInput(body, {
        user_id: (value) => typeof value === 'string' && value.length > 0,
        username: (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{3,30}$/.test(value),
        display_name: (value) => typeof value === 'string' && value.length > 0 && value.length <= 100,
        profile_pic: (value) => !value || (typeof value === 'string' && value.length <= 500),
        bio: (value) => !value || (typeof value === 'string' && value.length <= 500)
      })
      
      const { user_id, username, display_name, profile_pic, bio } = body

      // Sanitize inputs
      const sanitizedData = {
        user_id: sanitizeString(user_id, 100),
        username: sanitizeString(username, 30),
        display_name: sanitizeString(display_name, 100),
        profile_pic: profile_pic ? sanitizeString(profile_pic, 500) : null,
        bio: bio ? sanitizeString(bio, 500) : null
      }

      // Check if username is available
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', sanitizedData.username)
        .single()

      if (existingUser) {
        return errorResponse('Username is already taken', 409)
      }

      // Create user profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: sanitizedData.user_id,
          username: sanitizedData.username,
          display_name: sanitizedData.display_name,
          profile_pic: sanitizedData.profile_pic,
          bio: sanitizedData.bio,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
          username_selected_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return successResponse(data)

    } else if (req.method === 'PUT') {
      requireMethod(req, 'PUT')
      const url = new URL(req.url)
      const userId = url.pathname.split('/').pop()
      const body = await req.json()

      if (!userId) {
        return errorResponse('Missing userId in URL', 400)
      }

      // Update user profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...body,
          last_active: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return successResponse(data)

    } else {
      return errorResponse('Method not allowed', 405)
    }

  } catch (error) {
    console.error('User profile error:', error)
    return errorResponse(error.message, 500)
  }
})


