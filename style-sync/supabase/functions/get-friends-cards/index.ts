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
    // STEP 6: GET PEOPLE YOU FOLLOW
    // ============================================
    // Get requests where current user is sender (people you follow)
    // This allows viewing feeds of people you follow (one-way is fine)
    const { data: friendships, error: friendshipsError } = await supabase
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
          shop_public_id,
          bio,
          interests
        )
      `)
      .eq('sender_id', currentUser.id)
      .eq('status', 'accepted')
    
    if (friendshipsError) {
      console.error('Error fetching friendships:', friendshipsError)
      return errorResponse('Failed to fetch friends', 500)
    }
    
    // ============================================
    // STEP 7: FORMAT FOLLOWING AND GET CARD PROFILES
    // ============================================
    const friends = (friendships || []).map(friendship => {
      const friendProfile = friendship.receiver_profile
      const friendId = friendship.receiver_id
      
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
        // Get friend's profile first (needed for cache validation and recalculation)
        const { data: friendProfile, error: profileError } = await supabase
          .from('userprofiles')
          .select('id, interests')
          .eq('shop_public_id', friend.shop_public_id)
          .single()

        if (profileError || !friendProfile) {
          console.error(`Error fetching friend profile for ${friend.shop_public_id}:`, profileError)
          // Return default values if profile fetch fails
          return {
            userId: friend.shop_public_id,
            username: friend.username,
            displayName: friend.display_name || friend.username,
            avatarUrl: friend.profile_pic || null,
            bio: friend.bio || '',
            interests: friend.interests || [],
            rank: '2' as CardRank,
            suit: 'hearts' as CardSuit,
            stats: {
              friendsCount: 0
            }
          }
        }

        // ALWAYS recalculate - disable cache temporarily to ensure 100% accuracy
        // TODO: Re-enable cache once we verify this works correctly
        console.log(`🔄 Always recalculating card profile for friend (cache disabled): ${friend.shop_public_id}`)
        
        // Get friend's following count (how many people this friend follows)
        // Use exact same query as get-card-profile to ensure consistent counting
        // Filter out any records where receiver_profile is null (orphaned records)
        const { data: friendFriendships } = await supabase
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
          .eq('status', 'accepted')
          .eq('sender_id', friendProfile.id)  // Only count people this friend follows

        // Filter out any records with null receiver_profile (same as get-following does)
        const validFriendFriendships = (friendFriendships || []).filter(f => {
          if (!f.receiver_profile) {
            console.log(`⚠️ Filtering out orphaned follow for friend ${friend.shop_public_id}:`, f.id)
            return false
          }
          return true
        })
        const friendsCount = validFriendFriendships.length

        // Compute rank
        const rank = getRankFromFriendsCount(friendsCount)

        // Compute suit from interests
        const suit = getSuitFromInterests(friendProfile.interests || [])

        // Update cache (but don't rely on it - we always recalculate above)
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

