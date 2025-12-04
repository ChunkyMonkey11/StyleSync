/**
 * StyleSync Get Friend Requests Function
 * Retrieves sent or received friend requests for the authenticated user
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
    return handleCors(req)
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
    
    // ============================================
    // STEP 4: PARSE QUERY PARAMETERS
    // ============================================
    const url = new URL(req.url)
    const type = url.searchParams.get('type') // 'sent' or 'received'
    
    if (!type || (type !== 'sent' && type !== 'received')) {
      return errorResponse('Missing or invalid type parameter. Use ?type=sent or ?type=received', 400)
    }
    
    console.log(`Getting ${type} friend requests for user:`, currentUserPublicId);
    
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
    // STEP 7: GET FRIEND REQUESTS
    // ============================================
    let query = supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        created_at,
        updated_at,
        sender_profile:userprofiles!friend_requests_sender_id_fkey(
          username,
          display_name,
          profile_pic
        ),
        receiver_profile:userprofiles!friend_requests_receiver_id_fkey(
          username,
          display_name,
          profile_pic
        )
      `)
      .order('created_at', { ascending: false })
    
    if (type === 'sent') {
      query = query.eq('sender_id', currentUser.id)
    } else {
      query = query.eq('receiver_id', currentUser.id)
    }
    
    const { data: requests, error: requestsError } = await query
    
    if (requestsError) {
      console.error('Error fetching friend requests:', requestsError)
      return errorResponse('Failed to fetch friend requests', 500)
    }
    
    // ============================================
    // STEP 8: RETURN SUCCESS
    // ============================================
    return successResponse({
      requests: requests || []
    })

  } catch (error) {
    console.error('Error in get-friend-requests:', error)
    return errorResponse('Internal server error', 500)
  }
})


