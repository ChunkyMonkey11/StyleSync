/**
 * StyleSync Get Friends Function
 * Retrieves list of accepted friends for the authenticated user
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
      // Fallback if handleCors returns null
      return new Response(null, {
        status: 200,
        headers: corsHeaders()
      })
    } catch (error) {
      console.error('Error handling OPTIONS request:', error)
      // Always return success for OPTIONS even if there's an error
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
    console.log('Getting friends for user:', currentUserPublicId);
    
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
    // STEP 6: GET ACCEPTED FRIENDSHIPS
    // ============================================
    // Get friendships where current user is either sender or receiver and status is 'accepted'
    const { data: friendships, error: friendshipsError } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        created_at,
        sender_profile:userprofiles!friend_requests_sender_id_fkey(
          id,
          username,
          display_name,
          profile_pic,
          shop_public_id
        ),
        receiver_profile:userprofiles!friend_requests_receiver_id_fkey(
          id,
          username,
          display_name,
          profile_pic,
          shop_public_id
        )
      `)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
    
    if (friendshipsError) {
      console.error('Error fetching friendships:', friendshipsError)
      return errorResponse('Failed to fetch friends', 500)
    }
    
    // ============================================
    // STEP 7: FORMAT RESPONSE
    // ============================================
    // Transform friendships to friend objects
    const friends = (friendships || []).map(friendship => {
      // Determine which user is the friend (not the current user)
      const isSender = friendship.sender_id === currentUser.id
      const friendProfile = isSender ? friendship.receiver_profile : friendship.sender_profile
      const friendId = isSender ? friendship.receiver_id : friendship.sender_id
      
      return {
        id: friendship.id, // friend_requests.id
        friend_id: friendId, // friend's UUID id (for remove-friend)
        shop_public_id: friendProfile.shop_public_id, // friend's shop_public_id (for get-friend-feed)
        friend_profile: {
          username: friendProfile.username,
          display_name: friendProfile.display_name,
          profile_pic: friendProfile.profile_pic,
          shop_public_id: friendProfile.shop_public_id
        },
        created_at: friendship.created_at
      }
    })
    
    // ============================================
    // STEP 8: RETURN SUCCESS
    // ============================================
    return successResponse({
      friends: friends
    })

  } catch (error) {
    console.error('Error in get-friends:', error)
    return errorResponse('Internal server error', 500)
  }
})

