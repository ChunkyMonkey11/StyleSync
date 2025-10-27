/**
 * StyleSync Create Post Function
 * Creates new posts for the feed system (style updates or product recommendations)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyJWT, extractBearerToken } from '../_shared/jwt-utils.ts'
import { errorResponse, successResponse, requireMethod } from '../_shared/responses.ts'

interface CreatePostRequest {
  postData: {
    post_type: 'style' | 'product'
    content: string
    product_url?: string
    product_image?: string
    product_title?: string
    product_price?: string
  }
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
    
    console.log('Creating post for user:', payload.publicId)
    
    // ============================================
    // STEP 4: VALIDATE REQUEST DATA
    // ============================================
    const { postData }: CreatePostRequest = await req.json()
    
    if (!postData) {
      return errorResponse('Missing post data', 400)
    }
    
    if (!postData.post_type || !['style', 'product'].includes(postData.post_type)) {
      return errorResponse('Invalid post_type. Must be "style" or "product"', 400)
    }
    
    if (!postData.content || postData.content.trim().length === 0) {
      return errorResponse('Content is required', 400)
    }
    
    if (postData.content.length > 2000) {
      return errorResponse('Content too long. Maximum 2000 characters', 400)
    }
    
    // Validate product-specific fields
    if (postData.post_type === 'product') {
      if (!postData.product_url) {
        return errorResponse('Product URL is required for product posts', 400)
      }
      
      // Basic URL validation
      try {
        new URL(postData.product_url)
      } catch {
        return errorResponse('Invalid product URL format', 400)
      }
    }
    
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
    // STEP 6: CREATE POST
    // ============================================
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        shop_public_id: payload.publicId,
        post_type: postData.post_type,
        content: postData.content.trim(),
        product_url: postData.product_url || null,
        product_image: postData.product_image || null,
        product_title: postData.product_title || null,
        product_price: postData.product_price || null,
      })
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
        updated_at
      `)
      .single()
    
    if (postError) {
      console.error('Database error creating post:', postError)
      return errorResponse(`Failed to create post: ${postError.message}`, 500)
    }
    
    console.log('Post created successfully:', post.id)
    
    // ============================================
    // STEP 7: RETURN SUCCESS
    // ============================================
    return successResponse({
      post: post,
      message: 'Post created successfully'
    })

  } catch (error) {
    console.error('Error in create-post:', error)
    return errorResponse('Internal server error', 500)
  }
})

// DEPLOYMENT INSTRUCTIONS:
// npx supabase functions deploy create-post --no-verify-jwt

// TESTING:
// First get a JWT token by calling the auth endpoint
// Then test this endpoint:
// curl -X POST https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/create-post \
//   -H "Authorization: Bearer YOUR_JWT_TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{"postData": {"post_type": "style", "content": "Just got this amazing outfit!"}}'
