/**
 * StyleSync Get Friend Feed Function
 * Retrieves product feed and followed shops for a specific friend
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyJWT, extractBearerToken } from '../_shared/jwt-utils.ts'
import { errorResponse, successResponse, requireMethod } from '../_shared/responses.ts'

interface FeedProduct {
  id: string
  product_id: string
  product_title: string
  product_image: string | null
  product_url: string | null
  product_price: string
  product_currency: string
  created_at: string
}

interface FeedShop {
  id: string
  followed_shop_id: string
  followed_shop_name: string
  followed_shop_logo: string | null
  followed_shop_url: string
  created_at: string
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
    const friendShopPublicId = url.searchParams.get('friend_shop_public_id')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit
    
    if (!friendShopPublicId) {
      return errorResponse('Missing friend_shop_public_id parameter', 400)
    }
    
    if (limit > 50) {
      return errorResponse('Limit cannot exceed 50', 400)
    }
    
    console.log(`Getting feed for friend: ${friendShopPublicId}, page: ${page}, limit: ${limit}`)
    
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
    // STEP 6: VERIFY FRIENDSHIP
    // ============================================
    // Check if viewing own feed (allow that)
    const isOwnFeed = friendShopPublicId === payload.publicId
    
    if (!isOwnFeed) {
      // Get user IDs for both users
      const { data: currentUser, error: currentUserError } = await supabase
        .from('userprofiles')
        .select('id')
        .eq('shop_public_id', payload.publicId)
        .single()
      
      const { data: friendUser, error: friendUserError } = await supabase
        .from('userprofiles')
        .select('id')
        .eq('shop_public_id', friendShopPublicId)
        .single()
      
      if (currentUserError || friendUserError || !currentUser || !friendUser) {
        return errorResponse('User not found', 404)
      }
      
      // Check if they are friends (either direction)
      const { data: friendship, error: friendshipError } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('status', 'accepted')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${friendUser.id}),and(sender_id.eq.${friendUser.id},receiver_id.eq.${currentUser.id})`)
        .limit(1)
      
      if (friendshipError) {
        console.error('Error checking friendship:', friendshipError)
        return errorResponse('Failed to verify friendship', 500)
      }
      
      if (!friendship || friendship.length === 0) {
        return errorResponse('You can only view feeds from your friends', 403)
      }
    }
    
    // ============================================
    // STEP 7: GET PRODUCTS
    // ============================================
    // Select only the columns that exist (explicitly list them to avoid schema cache issues)
    const { data: products, error: productsError } = await supabase
      .from('user_product_feed')
      .select('id, product_id, product_title, product_image, product_url, product_price, product_currency, created_at')
      .eq('shop_public_id', friendShopPublicId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (productsError) {
      console.error('Error fetching products:', productsError)
      return errorResponse('Failed to fetch products', 500)
    }
    
    // ============================================
    // STEP 8: GET FOLLOWED SHOPS
    // ============================================
    const { data: followedShops, error: shopsError } = await supabase
      .from('user_followed_shops')
      .select('*')
      .eq('shop_public_id', friendShopPublicId)
      .order('created_at', { ascending: false })
    
    if (shopsError) {
      console.error('Error fetching followed shops:', shopsError)
      return errorResponse('Failed to fetch followed shops', 500)
    }
    
    // ============================================
    // STEP 9: FORMAT RESPONSE
    // ============================================
    const formattedProducts: FeedProduct[] = (products || []).map(p => ({
      id: p.id,
      product_id: p.product_id,
      product_title: p.product_title,
      product_image: p.product_image,
      product_url: p.product_url,
      product_price: p.product_price,
      product_currency: p.product_currency,
      created_at: p.created_at
    }))
    
    const formattedShops: FeedShop[] = (followedShops || []).map(s => ({
      id: s.id,
      followed_shop_id: s.followed_shop_id,
      followed_shop_name: s.followed_shop_name,
      followed_shop_logo: s.followed_shop_logo,
      followed_shop_url: s.followed_shop_url,
      created_at: s.created_at
    }))
    
    // ============================================
    // STEP 10: RETURN SUCCESS
    // ============================================
    return successResponse({
      products: formattedProducts,
      followed_shops: formattedShops,
      has_more: (products?.length || 0) === limit,
      page,
      limit
    })

  } catch (error) {
    console.error('Error in get-friend-feed:', error)
    return errorResponse('Internal server error', 500)
  }
})

