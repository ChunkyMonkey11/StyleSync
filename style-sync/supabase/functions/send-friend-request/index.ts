/**
 * StyleSync Send Friend Request Function
 * Sends a friend request from the authenticated user to another user by username
 * Uses publicId from JWT (Minis Admin API integration)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyJWT, extractBearerToken } from '../_shared/jwt-utils.ts'
import { errorResponse, successResponse, requireMethod } from '../_shared/responses.ts'
import { invalidateCardProfileCache } from '../_shared/card-cache.ts'

interface SendFriendRequestBody {
  receiver_username: string
}

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
    let body: SendFriendRequestBody
    try {
      body = await req.json()
    } catch (error) {
      return errorResponse('Invalid request body', 400)
    }
    
    if (!body.receiver_username || typeof body.receiver_username !== 'string') {
      return errorResponse('Missing or invalid receiver_username', 400)
    }
    
    const receiverUsername = body.receiver_username.trim().toLowerCase()
    
    if (!receiverUsername) {
      return errorResponse('receiver_username cannot be empty', 400)
    }
    
    console.log(`User ${currentUserPublicId} sending friend request to username: ${receiverUsername}`)
    
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
    // STEP 7: GET RECEIVER USER BY USERNAME (INCLUDING IS_PUBLIC)
    // ============================================
    const { data: receiverUser, error: receiverUserError } = await supabase
      .from('userprofiles')
      .select('id, is_public')
      .eq('username', receiverUsername)
      .single()
    
    if (receiverUserError || !receiverUser) {
      return errorResponse('User not found', 404)
    }
    
    // Get the is_public status (default to false if null/undefined)
    const isReceiverPublic = receiverUser.is_public === true
    console.log(`[send-friend-request] Receiver ${receiverUsername} (id: ${receiverUser.id}) is_public: ${receiverUser.is_public}, will auto-accept: ${isReceiverPublic}`)
    
    // ============================================
    // STEP 8: VALIDATE REQUEST
    // ============================================
    // Can't send request to yourself
    if (currentUser.id === receiverUser.id) {
      return errorResponse('Cannot send friend request to yourself', 400)
    }
    
    // ============================================
    // STEP 9: CHECK FOR EXISTING REQUEST
    // ============================================
    const { data: existingRequest, error: existingError } = await supabase
      .from('friend_requests')
      .select('id, status')
      .eq('sender_id', currentUser.id)
      .eq('receiver_id', receiverUser.id)
      .maybeSingle()
    
    if (existingError) {
      console.error('Error checking existing request:', existingError)
      return errorResponse('Failed to check existing request', 500)
    }
    
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return errorResponse('Friend request already sent', 409)
      } else if (existingRequest.status === 'accepted') {
        // If already accepted (one-way follow), don't allow resending
        return errorResponse('You are already following this user', 409)
      } else if (existingRequest.status === 'declined') {
        // Allow resending after decline
        // Will update the existing request below
      }
    }
    
    // ============================================
    // STEP 10: CREATE OR UPDATE FRIEND REQUEST
    // ============================================
    // Auto-accept if receiver has a public profile, otherwise set to pending
    const requestStatus = isReceiverPublic ? 'accepted' : 'pending'
    
    const requestData = {
      sender_id: currentUser.id,
      receiver_id: receiverUser.id,
      status: requestStatus as 'accepted' | 'pending',
      updated_at: new Date().toISOString()
    }
    
    let result;
    if (existingRequest && existingRequest.status === 'declined') {
      // Update declined request with appropriate status (accepted if public, pending if private)
      const { data: updatedRequest, error: updateError } = await supabase
        .from('friend_requests')
        .update(requestData)
        .eq('id', existingRequest.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('Error updating friend request:', updateError)
        return errorResponse('Failed to send friend request', 500)
      }
      result = updatedRequest
    } else {
      // Create new request
      const { data: newRequest, error: insertError } = await supabase
        .from('friend_requests')
        .insert(requestData)
        .select()
        .single()
      
      if (insertError) {
        console.error('Error creating friend request:', insertError)
        // Check if it's a unique constraint violation
        if (insertError.code === '23505') {
          return errorResponse('Friend request already exists', 409)
        }
        return errorResponse('Failed to send friend request', 500)
      }
      result = newRequest
    }
    
    // ============================================
    // STEP 11: INVALIDATE CARD PROFILE CACHE IF REQUEST WAS ACCEPTED
    // ============================================
    // If the request was immediately accepted (public profile), following count changed
    if (result.status === 'accepted') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (supabaseUrl && supabaseKey) {
        await invalidateCardProfileCache(supabaseUrl, supabaseKey, currentUser.id)
      }
    }
    
    // ============================================
    // STEP 12: RETURN SUCCESS
    // ============================================
    return successResponse({
      request: result,
      message: 'Friend request sent successfully'
    })

  } catch (error) {
    console.error('Error in send-friend-request:', error)
    return errorResponse('Internal server error', 500)
  }
})


