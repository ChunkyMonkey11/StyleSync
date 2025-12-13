/**
 * StyleSync Get Friends Cards Function
 * Retrieves list of accepted friends with their card profiles (rank + suit)
 * Computes card profiles lazily if cache is > 24h old
 */

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
    console.log('Getting friends cards for user:', currentUserPublicId);
    
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
          shop_public_id,
          bio,
          interests
        ),
        receiver_profile:userprofiles!friend_requests_receiver_id_fkey(
          id,
          username,
          display_name,
          profile_pic,
          shop_public_id,
          bio,
          interests
        )
      `)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
    
    if (friendshipsError) {
      console.error('Error fetching friendships:', friendshipsError)
      return errorResponse('Failed to fetch friends', 500)
    }
    
    // ============================================
    // STEP 7: FORMAT FRIENDS AND GET CARD PROFILES
    // ============================================
    const friends = (friendships || []).map(friendship => {
      const isSender = friendship.sender_id === currentUser.id
      const friendProfile = isSender ? friendship.receiver_profile : friendship.sender_profile
      const friendId = isSender ? friendship.receiver_id : friendship.sender_id
      
      return {
        id: friendId,
        shop_public_id: friendProfile.shop_public_id,
        username: friendProfile.username,
        display_name: friendProfile.display_name,
        profile_pic: friendProfile.profile_pic,
        bio: friendProfile.bio || '',
        interests: friendProfile.interests || [],
        created_at: friendship.created_at
      }
    })

    // ============================================
    // STEP 8: GET OR COMPUTE CARD PROFILES FOR EACH FRIEND
    // ============================================
    const friendCards = await Promise.all(
      friends.map(async (friend) => {
        // Check cache
        const { data: cachedProfile } = await supabase
          .from('user_card_profile')
          .select('*')
          .eq('shop_public_id', friend.shop_public_id)
          .single()

        const now = new Date()
        const cacheExpiry = cachedProfile?.computed_at
          ? new Date(new Date(cachedProfile.computed_at).getTime() + CACHE_DURATION_HOURS * 60 * 60 * 1000)
          : null

        let rank: CardRank
        let suit: CardSuit
        let friendsCount: number

        // Use cached if valid
        if (cachedProfile && cacheExpiry && now < cacheExpiry) {
          rank = cachedProfile.rank as CardRank
          suit = cachedProfile.suit as CardSuit
          friendsCount = cachedProfile.friends_count
        } else {
          // Compute fresh profile
          console.log(`Computing fresh card profile for friend: ${friend.shop_public_id}`)

          // Get friend's profile with interests
          const { data: friendProfile, error: profileError } = await supabase
            .from('userprofiles')
            .select('id, interests')
            .eq('shop_public_id', friend.shop_public_id)
            .single()

          if (profileError || !friendProfile) {
            console.error(`Error fetching friend profile for ${friend.shop_public_id}:`, profileError)
            // Default values if profile fetch fails
            rank = '2'
            suit = 'hearts'
            friendsCount = 0
          } else {
            // Get friend's friends count
            const { data: friendFriendships } = await supabase
              .from('friend_requests')
              .select('id')
              .eq('status', 'accepted')
              .or(`sender_id.eq.${friendProfile.id},receiver_id.eq.${friendProfile.id}`)

            friendsCount = friendFriendships?.length || 0

            // Compute rank
            rank = getRankFromFriendsCount(friendsCount)

            // Compute suit from interests
            suit = getSuitFromInterests(friendProfile.interests || [])

            // Upsert cache
            await supabase
              .from('user_card_profile')
              .upsert({
                user_id: friendProfile.id,
                shop_public_id: friend.shop_public_id,
                rank,
                suit,
                friends_count: friendsCount,
                computed_at: new Date().toISOString(),
                version: 1
              }, {
                onConflict: 'user_id'
              })
          }
        }

        return {
          userId: friend.shop_public_id,
          username: friend.username,
          displayName: friend.display_name || friend.username,
          avatarUrl: friend.profile_pic || null,
          bio: friend.bio || '',
          interests: friend.interests || [],
          rank,
          suit,
          stats: {
            friendsCount
          }
        }
      })
    )

    // ============================================
    // STEP 9: RETURN SUCCESS
    // ============================================
    // Sort by username for stable ordering
    friendCards.sort((a, b) => a.username.localeCompare(b.username))

    return successResponse({
      cards: friendCards
    })

  } catch (error) {
    console.error('Error in get-friends-cards:', error)
    return errorResponse('Internal server error', 500)
  }
})

