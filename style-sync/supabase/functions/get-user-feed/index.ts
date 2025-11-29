/**
 * StyleSync Get User Feed Function
 * Retrieves product feed for the authenticated user (self)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyJWT, extractBearerToken } from '../_shared/jwt-utils.ts'
import { errorResponse, successResponse, requireMethod } from '../_shared/responses.ts'

// Main function that handles incoming requests
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCors(req)
  }

  // Require GET
  const methodCheck = requireMethod(req, 'GET')
  if (methodCheck) return methodCheck

  try {
    // Auth
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

    if (!payload?.publicId) {
      return errorResponse('Invalid token', 401)
    }

    // Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) {
      return errorResponse('Server configuration error', 500)
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Pagination
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)
    const offset = (page - 1) * limit

    // Fetch user's own feed
    const { data: products, error: productsError } = await supabase
      .from('user_product_feed')
      .select('id, product_id, product_title, product_image, product_url, product_price, product_currency, created_at, source, attributes')
      .eq('shop_public_id', payload.publicId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (productsError) {
      console.error('Error fetching self feed:', productsError)
      return errorResponse('Failed to fetch user feed', 500)
    }

    return successResponse({
      products: products || [],
      has_more: (products?.length || 0) === limit,
      page,
      limit
    })
  } catch (error) {
    console.error('Error in get-user-feed:', error)
    return errorResponse('Internal server error', 500)
  }
})






