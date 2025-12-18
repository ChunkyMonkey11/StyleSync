/**
 * StyleSync Get Public Profiles Function
 * Retrieves list of public profiles excluding current user and existing friends
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
    console.log('Getting public profiles for user:', currentUserPublicId);
    
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
    // STEP 6: GET EXISTING FRIEND IDs AND PENDING/ACCEPTED REQUESTS
    // ============================================
    // Get all friend requests where current user is involved (both sent and received)
    // This includes accepted (friends) and pending requests
    const { data: friendships, error: friendshipsError } = await supabase
      .from('friend_requests')
      .select('sender_id, receiver_id, status')
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .in('status', ['accepted', 'pending'])
    
    if (friendshipsError) {
      console.error('Error fetching friendships:', friendshipsError)
      return errorResponse('Failed to fetch existing friends', 500)
    }
    
    // Collect all user IDs to exclude (friends + users with pending/accepted requests)
    const excludedIds = new Set<string>()
    if (friendships) {
      friendships.forEach(friendship => {
        if (friendship.sender_id === currentUser.id) {
          // Current user sent the request - exclude the receiver
          excludedIds.add(friendship.receiver_id)
        } else {
          // Current user received the request - exclude the sender
          excludedIds.add(friendship.sender_id)
        }
      })
    }
    
    // ============================================
    // STEP 7: GET PUBLIC PROFILES
    // ============================================
    // Get all public profiles excluding current user
    const { data: allPublicProfiles, error: profilesError } = await supabase
      .from('userprofiles')
      .select('id, shop_public_id, username, display_name, profile_pic, bio, interests, is_public, created_at')
      .eq('is_public', true)
      .neq('id', currentUser.id)
      .neq('shop_public_id', currentUserPublicId)
      .order('created_at', { ascending: false })
    
    if (profilesError) {
      console.error('Error fetching public profiles:', profilesError)
      return errorResponse('Failed to fetch public profiles', 500)
    }
    
    // Filter out users we've already interacted with (friends or pending/accepted requests)
    const publicProfiles = (allPublicProfiles || []).filter(profile => !excludedIds.has(profile.id))
    
    if (profilesError) {
      console.error('Error fetching public profiles:', profilesError)
      return errorResponse('Failed to fetch public profiles', 500)
    }
    
    // ============================================
    // STEP 8: RETURN SUCCESS
    // ============================================
    return successResponse({
      profiles: publicProfiles || []
    })

  } catch (error) {
    console.error('Error in get-public-profiles:', error)
    return errorResponse('Internal server error', 500)
  }
})


