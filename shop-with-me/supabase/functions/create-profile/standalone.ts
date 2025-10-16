// ============================================================================
// Standalone Create Profile Edge Function
// ============================================================================
// All dependencies inlined - ready to paste into Supabase Dashboard
//
// How to deploy:
// 1. Go to Supabase Dashboard > Edge Functions
// 2. Create new function named: create-profile
// 3. Copy/paste this ENTIRE file
// 4. Click Deploy
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// CORS Configuration
// ============================================================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

function handleCors(req: Request): boolean {
  return req.method === 'OPTIONS'
}

// ============================================================================
// Response Helpers
// ============================================================================
function successResponse(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function errorResponse(message: string, status: number = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ============================================================================
// Rate Limiting (Simple in-memory)
// ============================================================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

// ============================================================================
// Validation Functions
// ============================================================================
const validateUsername = (username: string): string | null => {
  if (!username) return 'Username is required'
  if (username.length < 3) return 'Username must be at least 3 characters'
  if (username.length > 20) return 'Username must be less than 20 characters'
  if (!/^[a-z0-9_]+$/.test(username)) return 'Username can only contain lowercase letters, numbers, and underscores'
  return null
}

const validateBio = (bio: string | null): string | null => {
  if (bio && bio.length > 150) return 'Bio must be less than 150 characters'
  return null
}

// ============================================================================
// Main Handler
// ============================================================================
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  // Handle CORS preflight
  if (handleCors(req)) {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    if (!rateLimit(`create-profile:${clientIP}`, 10, 60000)) {
      return errorResponse('Rate limit exceeded. Please try again later.', 429)
    }

    // Only accept POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405)
    }

    // Parse request body
    const body = await req.json()
    console.log('📋 Received profile creation request')

    const { username, bio, display_name, pfp_url } = body

    // Validate username (required)
    const usernameError = validateUsername(username)
    if (usernameError) {
      return errorResponse(usernameError, 400)
    }

    // Validate bio (optional)
    const bioError = validateBio(bio)
    if (bioError) {
      return errorResponse(bioError, 400)
    }

    // display_name and pfp_url are optional - Shop SDK may not always provide them

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .single()

    if (existingUser) {
      return errorResponse('Username already taken', 409)
    }

    // Prepare insert data
    const insertData = {
      username: username.toLowerCase(),
      bio: bio || null,
      display_name: display_name || null,
      pfp_url: pfp_url || null,
    }

    console.log('💾 Creating user profile:', { username: insertData.username })

    // Insert into user_profiles table
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ Profile creation error:', error)
      
      // Handle unique violation
      if (error.code === '23505') {
        return errorResponse('Username already taken', 409)
      }
      
      return errorResponse(error.message, 400)
    }

    console.log('✅ Profile created successfully:', data.sync_id)
    return successResponse(data)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
})

