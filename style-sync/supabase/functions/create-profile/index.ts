// Edge Function: create-profile
// Purpose: Save a new user profile to Supabase database
// Called from: OnboardingPage.tsx when user completes setup

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyJWT, extractBearerToken } from '../_shared/jwt-utils.ts'
import { errorResponse, successResponse, requireMethod } from '../_shared/responses.ts'

// Define the UserProfile interface (matches your TypeScript interface)
interface UserProfile {
  id: string
  shop_public_id: string
  username: string
  display_name: string
  profile_pic?: string
  bio?: string
  interests?: string[]
  gender?: 'MALE' | 'FEMALE' | 'NEUTRAL'
  created_at: string
  updated_at?: string
}

// Main function that handles incoming requests
Deno.serve(async (req) => {
  // Step 1: Handle CORS preflight requests (browsers send these before POST)
  if (req.method === 'OPTIONS') {
    try {
      const corsResponse = handleCors(req)
      if (corsResponse) {
        return corsResponse
      }
      return new Response(null, {
        status: 200,
        headers: corsHeaders()
      })
    } catch (error) {
      console.error('Error handling OPTIONS request:', error)
      return new Response(null, {
        status: 200,
        headers: corsHeaders()
      })
    }
  }

  // Step 2: Verify this is a POST request
  const methodCheck = requireMethod(req, 'POST')
  if (methodCheck) return methodCheck

  try {
    // ============================================
    // STEP 3: VERIFY JWT TOKEN
    // ============================================
    // When your Mini app calls this function, it sends a JWT token in the header.
    // We need to verify this token to ensure the request is legitimate.
    
    // Get the Authorization header from the request
    // Example header: "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = req.headers.get('Authorization')
    
    // If no header exists, reject the request immediately
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401)
    }

    // Extract just the token part (removes "Bearer " prefix)
    // Before: "Bearer eyJhbGc..." → After: "eyJhbGc..."
    const token = extractBearerToken(authHeader)
    
    // If extraction failed (malformed header), reject the request
    if (!token) {
      return errorResponse('Invalid authorization header format', 401)
    }
    
    // Get the JWT secret key from environment variables
    // This is the same key we set with: supabase secrets set JWT_SECRET_KEY="..."
    const jwtSecret = Deno.env.get('JWT_SECRET_KEY')
    
    if (!jwtSecret) {
      return errorResponse('Server configuration error: Missing JWT secret', 500)
    }
    
    // Verify the JWT token is valid and not expired
    // This returns the decoded payload containing: { publicId, userState, exp, iat }
    let payload;
    try {
      payload = await verifyJWT(token, jwtSecret);
    } catch (error) {
      console.error('JWT verification failed:', error);
      return errorResponse('Invalid or expired token', 401);
    }
    
    if (!payload) {
      return errorResponse('Invalid or expired token', 401);
    }
    
    // Now we know this is a legitimate user! payload.publicId is their Shop user ID
    console.log('Authenticated user:', payload.publicId)
    
    
    // ============================================
    // STEP 4: PARSE REQUEST BODY
    // ============================================
    // The Mini app sends profile data as JSON in the request body
    // Example: { "profileData": { "username": "john_doe", "bio": "...", ... } }
    
    const body = await req.json()
    const { profileData } = body
    
    // Ensure profileData exists
    if (!profileData) {
      return errorResponse('Missing profile data', 400)
    }

    // Normalize username if provided
    if (profileData.username) {
      profileData.username = String(profileData.username).toLowerCase()
    }
    // Validate gender if present
    if (profileData.gender) {
      const g = String(profileData.gender).toUpperCase()
      if (!['MALE','FEMALE','NEUTRAL'].includes(g)) {
        return errorResponse('Invalid gender value', 400)
      }
      profileData.gender = g
    }
    
    if (!profileData.display_name) {
      return errorResponse('Display name is required', 400)
    }
    
    // ============================================
    // STEP 5: INITIALIZE SUPABASE CLIENT
    // ============================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      return errorResponse('Server configuration error', 500)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // ============================================
    // STEP 6: INSERT OR UPDATE PROFILE
    // ============================================
    const { data: existingProfile, error: existingError } = await supabase
      .from('userprofiles')
      .select('id, username')
      .eq('shop_public_id', payload.publicId)
      .maybeSingle()

    if (existingError) {
      console.error('Error checking existing profile:', existingError)
      return errorResponse('Failed to check existing profile', 500)
    }

    const isCreating = !existingProfile

    if (isCreating && !profileData.username) {
      return errorResponse('Username is required', 400)
    }
    
    // Override shop_public_id with the verified user's publicId from JWT
    profileData.shop_public_id = payload.publicId
    
    if (existingProfile) {
      console.log('Updating profile for:', existingProfile.username)

      if (profileData.username && profileData.username !== existingProfile.username) {
        return errorResponse('Username cannot be changed once set', 409)
      }

      const updatePayload = {
        display_name: profileData.display_name,
        profile_pic: profileData.profile_pic ?? null,
        bio: profileData.bio ?? null,
        interests: profileData.interests ?? [],
        gender: profileData.gender ?? null,
        updated_at: profileData.updated_at ?? new Date().toISOString()
      }

      const { data: updatedData, error: updateError } = await supabase
        .from('userprofiles')
        .update(updatePayload)
        .eq('id', existingProfile.id)
        .select()
        .single()

      if (updateError) {
        console.error('Database error updating profile:', updateError)
        return errorResponse(`Failed to update profile: ${updateError.message}`, 500)
      }

      console.log('Profile updated successfully:', updatedData.id)
      return successResponse({ 
        profile: updatedData,
        message: 'Profile updated successfully'
      })
    }

    console.log('Creating profile for:', profileData.username)

    const { data, error } = await supabase
      .from('userprofiles')
      .insert([profileData])
      .select()
    
    if (error) {
      console.error('Database error:', error)
      
      if (error.code === '23505') {
        return errorResponse('Username already exists', 409)
      }
      
      return errorResponse(`Failed to create profile: ${error.message}`, 500)
    }
    
    if (!data || data.length === 0) {
      return errorResponse('Profile created but no data returned', 500)
    }
    
    console.log('Profile created successfully:', data[0].id)
    return successResponse({ 
      profile: data[0],
      message: 'Profile created successfully'
    })


  } catch (error) {
    // Catch any unexpected errors
    console.error('Error in create-profile:', error)
    return errorResponse('Internal server error', 500)
  }
})

// LEARNING RESOURCES:
// 1. JWT verification: Check ../auth/index.ts for examples
// 2. Supabase client: https://supabase.com/docs/reference/javascript
// 3. Response helpers: Check ../_shared/responses.ts
// 4. CORS handling: Check ../_shared/cors.ts

// TESTING THIS FUNCTION:
// Once you've filled in the TODOs, deploy with:
// npx supabase functions deploy create-profile --no-verify-jwt

// Test with curl:
// curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-profile \
//   -H "Authorization: Bearer YOUR_JWT_TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{"profileData": {...}}'

