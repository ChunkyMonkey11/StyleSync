/**
 * StyleSync Get Followers Function
 * Retrieves list of people following the authenticated user
 * Uses publicId from JWT (Minis Admin API integration)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyJWT, extractBearerToken } from '../_shared/jwt-utils.ts'
import { errorResponse, successResponse, requireMethod } from '../_shared/responses.ts'

// Main function that handles incoming requests
Deno.serve(async (req) => {
  // ============================================
  // STEP 1: HANDLE CORS PREFLIGHT
  // ============================================
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

  // ============================================
  // STEP 2: VERIFY HTTP METHOD
  // ============================================
  const methodCheck = requireMethod(req, 'GET')
  if (methodCheck) return methodCheck

  try {
    // ============================================
    // STEP 3: VERIFY JWT TOKEN AND EXTRACT publicId
    // ============================================
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401)
    }

    const token = extractBearerToken(authHeader)
    if (!token) {
      return errorResponse('Invalid authorization header format', 401)
    }
    
    const jwtSecret = Deno.env.get('JWT_SECRET_KEY')
    if (!jwtSecret) {
      return errorResponse('Server configuration error: Missing JWT secret', 500)
    }
    
    let payload;
    try {
      payload = await verifyJWT(token, jwtSecret);
    } catch (error) {
      console.error('JWT verification failed:', error);
      return errorResponse('Invalid or expired token', 401);
    }
    
    if (!payload || !payload.publicId) {
      return errorResponse('Invalid or expired token', 401);
    }

    const currentUserPublicId = payload.publicId;
    console.log('Getting followers list for user:', currentUserPublicId);
    
    // ============================================
    // STEP 4: INITIALIZE SUPABASE CLIENT
    // ============================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      return errorResponse('Server configuration error', 500)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // ============================================
    // STEP 5: GET CURRENT USER'S UUID
    // ============================================
    const { data: currentUser, error: currentUserError } = await supabase
      .from('userprofiles')
      .select('id')
      .eq('shop_public_id', currentUserPublicId)
      .single()
    
    if (currentUserError || !currentUser) {
      return errorResponse('User not found', 404)
    }
    
    // ============================================
    // STEP 6: GET PEOPLE FOLLOWING YOU
    // ============================================
    // Get requests where current user is receiver and status is 'accepted'
    // This means they're following you
    const { data: followers, error: followersError } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        created_at,
        sender_profile:userprofiles!friend_requests_sender_id_fkey(
          id,
          username,
          display_name,
          profile_pic,
          shop_public_id
        )
      `)
      .eq('receiver_id', currentUser.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
    
    if (followersError) {
      console.error('Error fetching followers:', followersError)
      return errorResponse('Failed to fetch followers list', 500)
    }
    
    // ============================================
    // STEP 7: FORMAT RESPONSE
    // ============================================
    const followersList = (followers || []).map(request => ({
      id: request.id,
      user_id: request.sender_id,
      shop_public_id: request.sender_profile.shop_public_id,
      user_profile: {
        username: request.sender_profile.username,
        display_name: request.sender_profile.display_name,
        profile_pic: request.sender_profile.profile_pic,
        shop_public_id: request.sender_profile.shop_public_id
      },
      followed_at: request.created_at
    }))
    
    // ============================================
    // STEP 8: RETURN SUCCESS
    // ============================================
    return successResponse({
      followers: followersList
    })

  } catch (error) {
    console.error('Error in get-followers:', error)
    return errorResponse('Internal server error', 500)
  }
})
