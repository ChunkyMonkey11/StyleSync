// Edge Function: get-card-profile
// Purpose: Get or compute user's card profile (rank + suit)

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyJWT, extractBearerToken } from '../_shared/jwt-utils.ts'
import { errorResponse, successResponse, requireMethod } from '../_shared/responses.ts'
import {
  getRankFromFriendsCount,
  getSuitFromInterests,
  getRankProgression,
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

    // Check cache
    const { data: cachedProfile } = await supabase
      .from('user_card_profile')
      .select('*')
      .eq('shop_public_id', shopPublicId)
      .single()

    const now = new Date()
    const cacheExpiry = cachedProfile?.computed_at
      ? new Date(new Date(cachedProfile.computed_at).getTime() + CACHE_DURATION_HOURS * 60 * 60 * 1000)
      : null

    // Return cached if still valid
    if (cachedProfile && cacheExpiry && now < cacheExpiry) {
      // Get user profile for display
      const { data: userProfile } = await supabase
        .from('userprofiles')
        .select('username, display_name, profile_pic, bio, interests')
        .eq('shop_public_id', shopPublicId)
        .single()

      const progression = getRankProgression(cachedProfile.rank as CardRank)

      return successResponse({
        rank: cachedProfile.rank,
        suit: cachedProfile.suit,
        friends_count: cachedProfile.friends_count,
        username: userProfile?.username || '',
        display_name: userProfile?.display_name || '',
        avatar_url: userProfile?.profile_pic || '',
        bio: userProfile?.bio || '',
        interests: userProfile?.interests || [],
        next_rank_progress: {
          ...progression,
          current_friends_in_range: cachedProfile.friends_count - progression.rankRangeMin
        }
      })
    }

    // Compute fresh profile
    console.log('Computing fresh card profile for:', shopPublicId)

    // Get user profile with interests
    const { data: userProfile, error: profileError } = await supabase
      .from('userprofiles')
      .select('id, username, display_name, profile_pic, bio, interests')
      .eq('shop_public_id', shopPublicId)
      .single()

    if (profileError || !userProfile) {
      return errorResponse('User profile not found', 404)
    }

    const userId = userProfile.id

    // Get friends count (accepted friendships where user is sender or receiver)
    const { data: friendships, error: friendsError } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

    if (friendsError) {
      console.error('Error fetching friendships:', friendsError)
      return errorResponse('Failed to fetch friends count', 500)
    }

    const friendsCount = friendships?.length || 0

    // Compute rank
    const rank = getRankFromFriendsCount(friendsCount)

    // Compute suit from interests
    const suit = getSuitFromInterests(userProfile.interests || [])

    // Get progression info
    const progression = getRankProgression(rank)

    // Upsert cache
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
      interests: userProfile.interests || [],
      next_rank_progress: {
        ...progression,
        current_friends_in_range: friendsCount - progression.rankRangeMin
      }
    })

  } catch (error) {
    console.error('Error in get-card-profile:', error)
    return errorResponse('Internal server error', 500)
  }
})

