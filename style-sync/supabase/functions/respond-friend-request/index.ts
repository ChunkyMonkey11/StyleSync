/**
 * StyleSync Respond Friend Request Function
 * Accepts or declines a friend request received by the authenticated user
 * Uses publicId from JWT (Minis Admin API integration)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyJWT, extractBearerToken } from '../_shared/jwt-utils.ts'
import { errorResponse, successResponse, requireMethod } from '../_shared/responses.ts'

interface RespondFriendRequestBody {
  request_id: string
  response: 'accepted' | 'declined'
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
    let body: RespondFriendRequestBody
    try {
      body = await req.json()
    } catch (error) {
      return errorResponse('Invalid request body', 400)
    }
    
    if (!body.request_id || typeof body.request_id !== 'string') {
      return errorResponse('Missing or invalid request_id', 400)
    }
    
    if (!body.response || (body.response !== 'accepted' && body.response !== 'declined')) {
      return errorResponse('Missing or invalid response. Must be "accepted" or "declined"', 400)
    }
    
    console.log(`User ${currentUserPublicId} ${body.response} friend request: ${body.request_id}`)
    
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
    // STEP 7: GET FRIEND REQUEST
    // ============================================
    const { data: friendRequest, error: requestError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', body.request_id)
      .single()
    
    if (requestError || !friendRequest) {
      return errorResponse('Friend request not found', 404)
    }
    
    // ============================================
    // STEP 8: VERIFY AUTHORIZATION
    // ============================================
    // Only the receiver can respond to a friend request
    if (friendRequest.receiver_id !== currentUser.id) {
      return errorResponse('Unauthorized: You can only respond to requests sent to you', 403)
    }
    
    // Handle pending requests (normal flow) and accepted requests (one-way follows)
    if (friendRequest.status === 'declined') {
      return errorResponse('Friend request already declined', 409)
    }
    
    // ============================================
    // STEP 9: HANDLE REQUEST RESPONSE
    // ============================================
    // For accepted requests (one-way follows from public profiles):
    // - Accept = create reverse request (follow back) to make it mutual
    // - Decline = delete the request (remove follower)
    if (friendRequest.status === 'accepted') {
      if (body.response === 'declined') {
        // Delete the request to remove the follower
        const { error: deleteError } = await supabase
          .from('friend_requests')
          .delete()
          .eq('id', body.request_id)
        
        if (deleteError) {
          console.error('Error deleting friend request:', deleteError)
          return errorResponse('Failed to remove follower', 500)
        }
        
        return successResponse({
          request: null,
          message: 'Follower removed successfully'
        })
      } else {
        // Accept = create reverse request (B→A) to follow them back
        // Check if reverse request already exists
        const { data: existingReverse, error: reverseCheckError } = await supabase
          .from('friend_requests')
          .select('id, status')
          .eq('sender_id', currentUser.id)
          .eq('receiver_id', friendRequest.sender_id)
          .maybeSingle()
        
        if (reverseCheckError) {
          console.error('Error checking reverse request:', reverseCheckError)
          return errorResponse('Failed to check existing follow', 500)
        }
        
        if (existingReverse) {
          if (existingReverse.status === 'accepted') {
            // Already following back (mutual)
            return successResponse({
              request: friendRequest,
              message: 'Already following back'
            })
          } else {
            // Update existing reverse request to accepted
            const { data: updatedReverse, error: updateReverseError } = await supabase
              .from('friend_requests')
              .update({
                status: 'accepted',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingReverse.id)
              .select()
              .single()
            
            if (updateReverseError) {
              console.error('Error updating reverse request:', updateReverseError)
              return errorResponse('Failed to follow back', 500)
            }
            
            return successResponse({
              request: updatedReverse,
              message: 'Follow back successful'
            })
          }
        } else {
          // Create new reverse request (B→A) with status='accepted'
          const { data: newReverseRequest, error: createReverseError } = await supabase
            .from('friend_requests')
            .insert({
              sender_id: currentUser.id,
              receiver_id: friendRequest.sender_id,
              status: 'accepted',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()
          
          if (createReverseError) {
            console.error('Error creating reverse request:', createReverseError)
            return errorResponse('Failed to follow back', 500)
          }
          
          return successResponse({
            request: newReverseRequest,
            message: 'Follow back successful'
          })
        }
      }
    }
    
    // For pending requests: normal accept/decline flow
    const { data: updatedRequest, error: updateError } = await supabase
      .from('friend_requests')
      .update({
        status: body.response,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.request_id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating friend request:', updateError)
      return errorResponse('Failed to update friend request', 500)
    }
    
    // ============================================
    // STEP 10: RETURN SUCCESS
    // ============================================
    return successResponse({
      request: updatedRequest,
      message: `Friend request ${body.response} successfully`
    })

  } catch (error) {
    console.error('Error in respond-friend-request:', error)
    return errorResponse('Internal server error', 500)
  }
})


