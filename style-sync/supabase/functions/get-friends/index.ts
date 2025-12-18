/**
 * StyleSync Get Friends Function
 * Retrieves list of mutual follows (both users follow each other)
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
    console.log('Getting mutual follows for user:', currentUserPublicId);
    
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
    // STEP 6: GET MUTUAL FOLLOWS
    // ============================================
    // Get requests where current user is sender (people you follow)
    const { data: youFollow, error: youFollowError } = await supabase
      .from('friend_requests')
      .select(`
        receiver_id,
        receiver_profile:userprofiles!friend_requests_receiver_id_fkey(
          id,
          username,
          display_name,
          profile_pic,
          shop_public_id
        )
      `)
      .eq('sender_id', currentUser.id)
      .eq('status', 'accepted')
    
    if (youFollowError) {
      console.error('Error fetching people you follow:', youFollowError)
      return errorResponse('Failed to fetch friends', 500)
    }
    
    // Get requests where current user is receiver (people following you)
    const { data: followYou, error: followYouError } = await supabase
      .from('friend_requests')
      .select(`
        sender_id,
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
    
    if (followYouError) {
      console.error('Error fetching people following you:', followYouError)
      return errorResponse('Failed to fetch friends', 500)
    }
    
    // ============================================
    // STEP 7: FIND MUTUAL FOLLOWS
    // ============================================
    // Create sets for quick lookup
    const youFollowIds = new Set((youFollow || []).map(f => f.receiver_id))
    const followYouIds = new Set((followYou || []).map(f => f.sender_id))
    
    // Find users where both directions exist (mutual follows)
    const mutualUserIds = new Set<string>()
    youFollowIds.forEach(userId => {
      if (followYouIds.has(userId)) {
        mutualUserIds.add(userId)
      }
    })
    
    // Build friends list from mutual follows
    const friends = Array.from(mutualUserIds).map(userId => {
      // Find the profile from either list
      const fromYouFollow = (youFollow || []).find(f => f.receiver_id === userId)
      const fromFollowYou = (followYou || []).find(f => f.sender_id === userId)
      
      const profile = fromYouFollow?.receiver_profile || fromFollowYou?.sender_profile
      
      return {
        id: userId, // Use user ID as identifier
        friend_id: userId, // friend's UUID id (for remove-friend)
        shop_public_id: profile.shop_public_id,
        friend_profile: {
          username: profile.username,
          display_name: profile.display_name,
          profile_pic: profile.profile_pic,
          shop_public_id: profile.shop_public_id
        },
        created_at: fromYouFollow ? new Date().toISOString() : new Date().toISOString()
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

