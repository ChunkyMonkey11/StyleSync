/**
 * StyleSync Post Interact Function
 * Handles likes, upvotes, and downvotes on posts
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyJWT, extractBearerToken } from '../_shared/jwt-utils.ts'
import { errorResponse, successResponse, requireMethod } from '../_shared/responses.ts'

interface PostInteractRequest {
  post_id: string
  interaction_type: 'like' | 'upvote' | 'downvote'
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
    // STEP 4: VALIDATE REQUEST DATA
    // ============================================
    const { post_id, interaction_type }: PostInteractRequest = await req.json()
    
    if (!post_id) {
      return errorResponse('Missing post_id', 400)
    }
    
    if (!interaction_type || !['like', 'upvote', 'downvote'].includes(interaction_type)) {
      return errorResponse('Invalid interaction_type. Must be "like", "upvote", or "downvote"', 400)
    }
    
    console.log(`User ${payload.publicId} ${interaction_type}ing post ${post_id}`)
    
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
    // STEP 6: VERIFY POST EXISTS AND USER CAN ACCESS IT
    // ============================================
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(`
        id,
        shop_public_id,
        userprofiles!inner(username)
      `)
      .eq('id', post_id)
      .single()
    
    if (postError || !post) {
      return errorResponse('Post not found', 404)
    }
    
    // Check if user can interact with this post (must be from friends or own post)
    const { data: friends, error: friendsError } = await supabase
      .from('friends')
      .select('id')
      .eq('user_shop_public_id', payload.publicId)
      .eq('friend_shop_public_id', post.shop_public_id)
      .eq('status', 'accepted')
      .single()
    
    const isOwnPost = post.shop_public_id === payload.publicId
    const isFriendPost = friends && !friendsError
    
    if (!isOwnPost && !isFriendPost) {
      return errorResponse('Cannot interact with this post', 403)
    }
    
    // ============================================
    // STEP 7: CHECK FOR EXISTING INTERACTION
    // ============================================
    const { data: existingInteraction, error: existingError } = await supabase
      .from('post_interactions')
      .select('id, interaction_type')
      .eq('post_id', post_id)
      .eq('shop_public_id', payload.publicId)
      .eq('interaction_type', interaction_type)
      .single()
    
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing interaction:', existingError)
      return errorResponse('Failed to check existing interaction', 500)
    }
    
    // ============================================
    // STEP 8: TOGGLE INTERACTION
    // ============================================
    if (existingInteraction) {
      // Remove existing interaction (toggle off)
      const { error: deleteError } = await supabase
        .from('post_interactions')
        .delete()
        .eq('id', existingInteraction.id)
      
      if (deleteError) {
        console.error('Error removing interaction:', deleteError)
        return errorResponse('Failed to remove interaction', 500)
      }
      
      console.log(`Removed ${interaction_type} from post ${post_id}`)
      
      return successResponse({
        action: 'removed',
        interaction_type: interaction_type,
        message: `${interaction_type} removed`
      })
    } else {
      // Remove any other interaction types for this post by this user
      const { error: deleteOtherError } = await supabase
        .from('post_interactions')
        .delete()
        .eq('post_id', post_id)
        .eq('shop_public_id', payload.publicId)
      
      if (deleteOtherError) {
        console.error('Error removing other interactions:', deleteOtherError)
        return errorResponse('Failed to remove other interactions', 500)
      }
      
      // Add new interaction
      const { error: insertError } = await supabase
        .from('post_interactions')
        .insert({
          post_id: post_id,
          shop_public_id: payload.publicId,
          interaction_type: interaction_type
        })
      
      if (insertError) {
        console.error('Error adding interaction:', insertError)
        return errorResponse('Failed to add interaction', 500)
      }
      
      console.log(`Added ${interaction_type} to post ${post_id}`)
      
      return successResponse({
        action: 'added',
        interaction_type: interaction_type,
        message: `${interaction_type} added`
      })
    }

  } catch (error) {
    console.error('Error in post-interact:', error)
    return errorResponse('Internal server error', 500)
  }
})

// DEPLOYMENT INSTRUCTIONS:
// npx supabase functions deploy post-interact --no-verify-jwt

// TESTING:
// First get a JWT token by calling the auth endpoint
// Then test this endpoint:
// curl -X POST https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/post-interact \
//   -H "Authorization: Bearer YOUR_JWT_TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{"post_id": "POST_ID", "interaction_type": "like"}'
