// Edge Function: check-profile
// Purpose: Check if a user has an existing profile in the database
// Called from: App.tsx on app load to determine if user needs onboarding

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyJWT, extractBearerToken } from '../_shared/jwt-utils.ts'
import { errorResponse, successResponse, requireMethod } from '../_shared/responses.ts'

// Main function that handles incoming requests
Deno.serve(async (req) => {
  // ============================================
  // STEP 1: HANDLE CORS PREFLIGHT
  // ============================================
  // Browser checks if cross-origin requests are allowed
  if (req.method === 'OPTIONS') {
    return handleCors(req)
  }

  // ============================================
  // STEP 2: VERIFY HTTP METHOD
  // ============================================
  // This endpoint only accepts GET requests
  const methodCheck = requireMethod(req, 'GET')
  if (methodCheck) return methodCheck

  try {
    // ============================================
    // STEP 3: VERIFY JWT TOKEN
    // ============================================
    // Extract and verify the JWT token from Authorization header
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401)
    }

    // Extract the token (removes "Bearer " prefix)
    const token = extractBearerToken(authHeader)
    if (!token) {
      return errorResponse('Invalid authorization header format', 401)
    }
    
    // Get JWT secret from environment
    const jwtSecret = Deno.env.get('JWT_SECRET_KEY')
    if (!jwtSecret) {
      return errorResponse('Server configuration error: Missing JWT secret', 500)
    }
    
    // Verify the JWT token and extract the payload
    // Payload contains: { publicId, userState, exp, iat }
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
    
    // Now we know the authenticated user's publicId
    console.log('Checking profile for user:', payload.publicId)
    
    
    // ============================================
    // STEP 4: INITIALIZE SUPABASE CLIENT
    // ============================================
    // Create Supabase client to query the database
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      return errorResponse('Server configuration error', 500)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    

    // ============================================
    // STEP 5: QUERY USER PROFILE
    // ============================================
    // Check if a profile exists for this Shop user ID
    
    const { data, error } = await supabase
      .from('userprofiles')
      .select('*')
      .eq('shop_public_id', payload.publicId)  // Match by Shop user ID
      .single()  // Expect only one profile per user
    
    // Handle database errors
    if (error) {
      // PGRST116 = no rows returned (user has no profile)
      if (error.code === 'PGRST116') {
        console.log('No profile found for user:', payload.publicId)
        return successResponse({ 
          hasProfile: false,
          profile: null
        })
      }
      
      // Other database errors
      console.error('Database error:', error)
      return errorResponse(`Failed to check profile: ${error.message}`, 500)
    }
    
    // Profile exists!
    console.log('Profile found for user:', payload.publicId)
    

    // ============================================
    // STEP 6: RETURN RESULT
    // ============================================
    // Return whether profile exists and the profile data if it does
    
    return successResponse({ 
      hasProfile: true,
      profile: data
    })

  } catch (error) {
    // Catch any unexpected errors
    console.error('Error in check-profile:', error)
    return errorResponse('Internal server error', 500)
  }
})

// DEPLOYMENT INSTRUCTIONS:
// npx supabase functions deploy check-profile --no-verify-jwt

// TESTING:
// First get a JWT token by calling the auth endpoint with a Shop Mini token
// Then test this endpoint:
// curl -X GET https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/check-profile \
//   -H "Authorization: Bearer YOUR_JWT_TOKEN"

