// Edge Function: get-card-profile
// Purpose: Get or compute user's card profile (rank + suit)

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyJWT, extractBearerToken } from '../_shared/jwt-utils.ts'
import { errorResponse, successResponse, requireMethod } from '../_shared/responses.ts'
import {
  getRankFromFriendsCount,
  getSuitFromInterests,
  type CardRank,
  type CardSuit
} from '../_shared/card-computation.ts'

const CACHE_DURATION_HOURS = 24

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    const corsResponse = handleCors(req)
    if (corsResponse) return corsResponse
    return new Response(null, { status: 200, headers: corsHeaders() })
  }

  try {
    // Verify method
    const methodCheck = requireMethod(req, 'GET')
    if (methodCheck) return methodCheck

    // Verify JWT
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

    let payload
    try {
      payload = await verifyJWT(token, jwtSecret)
    } catch (error) {
      console.error('JWT verification failed:', error)
      return errorResponse('Invalid or expired token', 401)
    }

    if (!payload?.publicId) {
      return errorResponse('Invalid token: missing publicId', 401)
    }

    const shopPublicId = payload.publicId

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      return errorResponse('Server configuration error', 500)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user profile first (needed for both cache validation and fresh computation)
    const { data: userProfile, error: profileError } = await supabase
      .from('userprofiles')
      .select('id, username, display_name, profile_pic, bio, interests')
      .eq('shop_public_id', shopPublicId)
      .single()

    if (profileError || !userProfile) {
      return errorResponse('User profile not found', 404)
    }

    // Always recalculate to ensure accuracy

    const userId = userProfile.id

    // Use the EXACT same query as get-following (including .order())
    // This ensures 100% consistency between card profile and Following tab
    const { data: following, error: followingError } = await supabase
      .from('friend_requests')
      .select(`
        id,
        receiver_id,
        created_at,
        receiver_profile:userprofiles!friend_requests_receiver_id_fkey(
          id,
          username,
          display_name,
          profile_pic,
          shop_public_id
        )
      `)
      .eq('sender_id', userId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })

    if (followingError) {
      console.error('Error fetching following:', followingError)
      return errorResponse('Failed to fetch friends count', 500)
    }

    // Filter out records with null receiver_profile (same as get-following does)
    // This ensures we only count valid follows where the receiver user still exists
    const validFollowing = (following || []).filter(f => f.receiver_profile !== null)
    const friendsCount = validFollowing.length

    // Compute rank
    const rank = getRankFromFriendsCount(friendsCount)

    // Compute suit from interests
    const suit = getSuitFromInterests(userProfile.interests || [])

    // Update cache (but don't rely on it - we always recalculate above)
    // This keeps cache in sync for other systems that might use it
    const { error: upsertError } = await supabase
      .from('user_card_profile')
      .upsert({
        user_id: userId,
        shop_public_id: shopPublicId,
        rank,
        suit,
        friends_count: friendsCount,
        computed_at: new Date().toISOString(),
        version: 1
      }, {
        onConflict: 'user_id'
      })

    if (upsertError) {
      console.error('Error upserting card profile:', upsertError)
    }

    return successResponse({
      rank,
      suit,
      friends_count: friendsCount,
      username: userProfile.username || '',
      display_name: userProfile.display_name || '',
      avatar_url: userProfile.profile_pic || '',
      bio: userProfile.bio || '',
      interests: userProfile.interests || []
    })

  } catch (error) {
    console.error('Error in get-card-profile:', error)
    return errorResponse('Internal server error', 500)
  }
})

