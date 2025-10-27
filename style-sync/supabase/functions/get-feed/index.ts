/**
 * StyleSync Get Feed Function
 * Retrieves posts from user's friends for the feed
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyJWT, extractBearerToken } from '../_shared/jwt-utils.ts'
import { errorResponse, successResponse, requireMethod } from '../_shared/responses.ts'

interface FeedPost {
  id: string
  shop_public_id: string
  post_type: 'style' | 'product'
  content: string
  product_url?: string
  product_image?: string
  product_title?: string
  product_price?: string
  created_at: string
  updated_at: string
  user: {
    username: string
    display_name: string
    profile_pic: string
  }
  interaction_counts: {
    likes: number
    upvotes: number
    downvotes: number
    comments: number
  }
  user_interaction?: 'like' | 'upvote' | 'downvote'
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
  const methodCheck = requireMethod(req, 'GET')
  if (methodCheck) return methodCheck

  try {
    // ============================================
    // STEP 3: VERIFY JWT TOKEN
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
    
    if (!payload) {
      return errorResponse('Invalid or expired token', 401);
    }
    
    // ============================================
    // STEP 4: PARSE QUERY PARAMETERS
    // ============================================
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    if (limit > 50) {
      return errorResponse('Limit cannot exceed 50', 400)
    }
    
    console.log(`Getting feed for user: ${payload.publicId}, limit: ${limit}, offset: ${offset}`)
    
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
    // STEP 6: GET FRIENDS LIST
    // ============================================
    const { data: friends, error: friendsError } = await supabase
      .from('friends')
      .select('friend_shop_public_id')
      .eq('user_shop_public_id', payload.publicId)
      .eq('status', 'accepted')
    
    if (friendsError) {
      console.error('Error fetching friends:', friendsError)
      return errorResponse('Failed to fetch friends', 500)
    }
    
    // Include user's own posts in feed
    const friendIds = friends?.map(f => f.friend_shop_public_id) || []
    friendIds.push(payload.publicId)
    
    // ============================================
    // STEP 7: GET POSTS WITH USER INFO
    // ============================================
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        shop_public_id,
        post_type,
        content,
        product_url,
        product_image,
        product_title,
        product_price,
        created_at,
        updated_at,
        userprofiles!inner(
          username,
          display_name,
          profile_pic
        )
      `)
      .in('shop_public_id', friendIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return errorResponse('Failed to fetch posts', 500)
    }
    
    // ============================================
    // STEP 8: GET INTERACTION COUNTS AND USER INTERACTIONS
    // ============================================
    const postIds = posts?.map(p => p.id) || []
    
    if (postIds.length === 0) {
      return successResponse({
        posts: [],
        has_more: false,
        total_count: 0
      })
    }
    
    // Get interaction counts
    const { data: interactions, error: interactionsError } = await supabase
      .from('post_interactions')
      .select('post_id, interaction_type')
      .in('post_id', postIds)
    
    if (interactionsError) {
      console.error('Error fetching interactions:', interactionsError)
      return errorResponse('Failed to fetch interactions', 500)
    }
    
    // Get user's interactions
    const { data: userInteractions, error: userInteractionsError } = await supabase
      .from('post_interactions')
      .select('post_id, interaction_type')
      .in('post_id', postIds)
      .eq('shop_public_id', payload.publicId)
    
    if (userInteractionsError) {
      console.error('Error fetching user interactions:', userInteractionsError)
      return errorResponse('Failed to fetch user interactions', 500)
    }
    
    // Get comment counts
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds)
    
    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
      return errorResponse('Failed to fetch comments', 500)
    }
    
    // ============================================
    // STEP 9: PROCESS AND FORMAT DATA
    // ============================================
    const processedPosts: FeedPost[] = posts?.map(post => {
      // Count interactions by type
      const postInteractions = interactions?.filter(i => i.post_id === post.id) || []
      const likes = postInteractions.filter(i => i.interaction_type === 'like').length
      const upvotes = postInteractions.filter(i => i.interaction_type === 'upvote').length
      const downvotes = postInteractions.filter(i => i.interaction_type === 'downvote').length
      const commentCount = comments?.filter(c => c.post_id === post.id).length || 0
      
      // Get user's interaction
      const userInteraction = userInteractions?.find(i => i.post_id === post.id)?.interaction_type
      
      return {
        id: post.id,
        shop_public_id: post.shop_public_id,
        post_type: post.post_type,
        content: post.content,
        product_url: post.product_url,
        product_image: post.product_image,
        product_title: post.product_title,
        product_price: post.product_price,
        created_at: post.created_at,
        updated_at: post.updated_at,
        user: {
          username: post.userprofiles.username,
          display_name: post.userprofiles.display_name,
          profile_pic: post.userprofiles.profile_pic
        },
        interaction_counts: {
          likes,
          upvotes,
          downvotes,
          comments: commentCount
        },
        user_interaction: userInteraction
      }
    }) || []
    
    // ============================================
    // STEP 10: RETURN SUCCESS
    // ============================================
    return successResponse({
      posts: processedPosts,
      has_more: posts.length === limit,
      total_count: processedPosts.length
    })

  } catch (error) {
    console.error('Error in get-feed:', error)
    return errorResponse('Internal server error', 500)
  }
})

// DEPLOYMENT INSTRUCTIONS:
// npx supabase functions deploy get-feed --no-verify-jwt

// TESTING:
// First get a JWT token by calling the auth endpoint
// Then test this endpoint:
// curl -X GET "https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/get-feed?limit=10&offset=0" \
//   -H "Authorization: Bearer YOUR_JWT_TOKEN"
