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
  style_preferences?: string[]
  created_at: string
  updated_at?: string
}

// Main function that handles incoming requests
Deno.serve(async (req) => {
  // Step 1: Handle CORS preflight requests (browsers send these before POST)
  if (req.method === 'OPTIONS') {
    return handleCors(req)
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
    const payload = await verifyJWT(token, jwtSecret)
    
    // If verification failed, verifyJWT returns null
    if (!payload) {
      return errorResponse('Invalid or expired token', 401)
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

    // Validate required fields
    // These fields MUST be present or the database insert will fail
    if (!profileData.username) {
      return errorResponse('Username is required', 400)
    }
    
    if (!profileData.display_name) {
      return errorResponse('Display name is required', 400)
    }
    
    // Override shop_public_id with the verified user's publicId from JWT
    // This ensures users can only create profiles for themselves, not others!
    // Security: Even if someone tries to send a different shop_public_id, we ignore it
    profileData.shop_public_id = payload.publicId
    
    console.log('Creating profile for:', profileData.username)
    

    // ============================================
    // STEP 5: INITIALIZE SUPABASE CLIENT
    // ============================================
    // To interact with the database, we need a Supabase client
    // This is server-side, so we use the SERVICE_ROLE_KEY (has full database access)
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    // These should be automatically available in Supabase Edge Functions
    // If missing, something is wrong with the deployment
    if (!supabaseUrl || !supabaseKey) {
      return errorResponse('Server configuration error', 500)
    }

    // Create the Supabase client
    // This gives us access to .from('table_name') for database operations
    const supabase = createClient(supabaseUrl, supabaseKey)
    

    // ============================================
    // STEP 6: INSERT PROFILE INTO DATABASE
    // ============================================
    // Now we insert the validated profile data into the 'userprofiles' table
    
    // supabase.from('userprofiles') - Select the table
    // .insert([profileData]) - Insert one profile (array allows bulk inserts)
    // .select() - Return the inserted data (including auto-generated fields)
    const { data, error } = await supabase
      .from('userprofiles')
      .insert([profileData])
      .select()
    
    // Check if the database operation failed
    if (error) {
      console.error('Database error:', error)
      
      // Provide helpful error messages for common issues
      if (error.code === '23505') {
        // Unique constraint violation (duplicate username or shop_public_id)
        return errorResponse('Username already exists', 409)
      }
      
      // Generic database error
      return errorResponse(`Failed to create profile: ${error.message}`, 500)
    }
    
    // Ensure we got data back
    if (!data || data.length === 0) {
      return errorResponse('Profile created but no data returned', 500)
    }
    
    console.log('Profile created successfully:', data[0].id)


    // ============================================
    // STEP 7: RETURN SUCCESS RESPONSE
    // ============================================
    // Send the created profile back to the Mini app
    // data[0] is the first (and only) inserted profile
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

