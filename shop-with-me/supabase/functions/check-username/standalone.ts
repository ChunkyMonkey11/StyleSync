// ============================================================================
// Standalone Check Username Edge Function
// ============================================================================
// All dependencies inlined - ready to paste into Supabase Dashboard
//
// How to deploy:
// 1. Go to Supabase Dashboard > Edge Functions
// 2. Create new function named: check-username
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
// Utility Functions
// ============================================================================
function sanitizeString(input: string, maxLength: number): string {
  return input.trim().substring(0, maxLength)
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
    // Only accept GET
    if (req.method !== 'GET') {
      return errorResponse('Method not allowed', 405)
    }

    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    if (!rateLimit(`check-username:${clientIP}`, 100, 60000)) {
      return errorResponse('Rate limit exceeded', 429)
    }

    // Get username from query params
    const url = new URL(req.url)
    const username = url.searchParams.get('username')

    if (!username) {
      return errorResponse('Missing username parameter', 400)
    }

    // Sanitize username
    const sanitizedUsername = sanitizeString(username, 30)

    // Validate username format
    if (sanitizedUsername.length < 3 || sanitizedUsername.length > 30) {
      return successResponse(false) // Not available = invalid format
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedUsername)) {
      return successResponse(false) // Not available = invalid format
    }

    // Check if username exists in user_profiles table
    const { data, error } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', sanitizedUsername.toLowerCase())
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Username is available if no user found
    const isAvailable = data === null
    return successResponse(isAvailable)

  } catch (error) {
    console.error('Check username error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
})

