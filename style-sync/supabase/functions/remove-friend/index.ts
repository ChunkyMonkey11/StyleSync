/**
 * StyleSync Remove Friend Function
 * Removes a friendship by deleting the accepted friend request
 * Uses publicId from JWT (Minis Admin API integration)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyJWT, extractBearerToken } from '../_shared/jwt-utils.ts'
import { errorResponse, successResponse, requireMethod } from '../_shared/responses.ts'

interface RemoveFriendRequestBody {
  friend_id: string // UUID of the friend to remove
}

// Main function that handles incoming requests
Deno.serve(async (req) => {
  // ============================================
  // STEP 1: HANDLE CORS PREFLIGHT
  // ============================================
  if (req.method === 'OPTIONS') {
    return handleCors(req)
  }

  // ============================================
  // STEP 2: VERIFY HTTP METHOD
  // ============================================
  const methodCheck = requireMethod(req, 'POST')
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
    
    // ============================================
    // STEP 4: PARSE REQUEST BODY
    // ============================================
    let body: RemoveFriendRequestBody
    try {
      body = await req.json()
    } catch (error) {
      return errorResponse('Invalid request body', 400)
    }
    
    if (!body.friend_id || typeof body.friend_id !== 'string') {
      return errorResponse('Missing or invalid friend_id', 400)
    }
    
    console.log(`User ${currentUserPublicId} removing friend: ${body.friend_id}`)
    
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
    // STEP 6: GET CURRENT USER'S UUID
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
    // STEP 7: VERIFY FRIEND_ID IS VALID
    // ============================================
    const { data: friendUser, error: friendUserError } = await supabase
      .from('userprofiles')
      .select('id')
      .eq('id', body.friend_id)
      .single()
    
    if (friendUserError || !friendUser) {
      return errorResponse('Friend not found', 404)
    }
    
    // Can't remove yourself
    if (currentUser.id === friendUser.id) {
      return errorResponse('Cannot remove yourself', 400)
    }
    
    // ============================================
    // STEP 8: FIND ACCEPTED FRIENDSHIP
    // ============================================
    const { data: friendship, error: friendshipError } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('status', 'accepted')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${friendUser.id}),and(sender_id.eq.${friendUser.id},receiver_id.eq.${currentUser.id})`)
      .maybeSingle()
    
    if (friendshipError) {
      console.error('Error finding friendship:', friendshipError)
      return errorResponse('Failed to find friendship', 500)
    }
    
    if (!friendship) {
      return errorResponse('Friendship not found', 404)
    }
    
    // ============================================
    // STEP 9: DELETE FRIEND REQUEST (REMOVE FRIENDSHIP)
    // ============================================
    const { error: deleteError } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', friendship.id)
    
    if (deleteError) {
      console.error('Error deleting friendship:', deleteError)
      return errorResponse('Failed to remove friend', 500)
    }
    
    // ============================================
    // STEP 10: RETURN SUCCESS
    // ============================================
    return successResponse({
      message: 'Friend removed successfully'
    })

  } catch (error) {
    console.error('Error in remove-friend:', error)
    return errorResponse('Internal server error', 500)
  }
})


