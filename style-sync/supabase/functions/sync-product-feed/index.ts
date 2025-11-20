/**
 * StyleSync Sync Product Feed Function
 * Receives Shopify product data from frontend and stores it in the database
 * Frontend calls Shopify hooks and sends the aggregated data here
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyJWT, extractBearerToken } from '../_shared/jwt-utils.ts'
import { errorResponse, successResponse, requireMethod } from '../_shared/responses.ts'

// Feed pruning configuration
const FEED_CAP = 200         // keep at most this many rows per user
const PRUNE_CHUNK = 30       // delete up to this many oldest rows per run

interface Product {
  id: string
  title: string
  featuredImage?: {
    url: string
  } | null
  price: {
    amount: string
    currencyCode: string
  }
  shop: {
    id: string
    name: string
  }
  selectedVariant?: {
    id: string
    image?: {
      url: string
    } | null
  }
}

interface FollowedShop {
  id: string
  name: string
  logoImage?: {
    url: string
  } | null
  primaryDomain: {
    url: string
  }
}

interface SyncProductFeedRequest {
  products: Array<{
    product: Product
    source?: string
    intent_name?: string
    attributes?: Record<string, unknown>
  }>
  followedShops: FollowedShop[]
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
    console.log('🔐 Starting JWT verification...')
    const authHeader = req.headers.get('Authorization')
    console.log('📋 Auth header present:', !!authHeader)
    if (!authHeader) {
      console.error('❌ Missing authorization header')
      return errorResponse('Missing authorization header', 401)
    }

    const token = extractBearerToken(authHeader)
    console.log('📋 Token extracted, length:', token?.length || 0)
    if (!token) {
      console.error('❌ Invalid authorization header format')
      return errorResponse('Invalid authorization header format', 401)
    }
    
    const jwtSecret = Deno.env.get('JWT_SECRET_KEY')
    console.log('📋 JWT_SECRET_KEY present:', !!jwtSecret)
    if (!jwtSecret) {
      console.error('❌ Missing JWT_SECRET_KEY')
      return errorResponse('Server configuration error: Missing JWT secret', 500)
    }
    
    let payload;
    try {
      console.log('🔍 Verifying JWT token...')
      payload = await verifyJWT(token, jwtSecret);
      console.log('✅ JWT verified successfully, publicId:', payload.publicId)
    } catch (error) {
      console.error('❌ JWT verification failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ JWT error details:', {
        errorMessage,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 50),
        hasThreeParts: token.split('.').length === 3,
        partsLengths: token.split('.').map(p => p.length)
      });
      return errorResponse(`Invalid JWT: ${errorMessage}`, 401);
    }
    
    if (!payload) {
      return errorResponse('Invalid or expired token', 401);
    }
    
    if (!payload.publicId) {
      return errorResponse('Invalid token: missing publicId', 401);
    }
    
    // ============================================
    // STEP 4: PARSE REQUEST BODY
    // ============================================
    let body: SyncProductFeedRequest
    try {
      const bodyText = await req.text()
      console.log('📦 Request body size:', bodyText.length, 'chars')
      body = JSON.parse(bodyText)
      console.log('📦 Parsed body:', {
        productsCount: body.products?.length || 0,
        shopsCount: body.followedShops?.length || 0
      })
    } catch (error) {
      console.error('❌ Failed to parse request body:', error)
      return errorResponse('Invalid request body format', 400)
    }
    
    if (!body.products && !body.followedShops) {
      return errorResponse('Missing products or followedShops data', 400)
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
    // STEP 6: UPSERT PRODUCTS WITH DEDUPLICATION
    // ============================================
    if (body.products && body.products.length > 0) {
      // Deduplicate products by product_id (keep first occurrence)
      const seenProductIds = new Set<string>()
      const uniqueProducts: typeof body.products = []

      for (const item of body.products) {
        const productId = item?.product?.id
        if (!productId) {
          continue
        }

        if (seenProductIds.has(productId)) {
          continue
        }

        seenProductIds.add(productId)
        uniqueProducts.push(item)
      }

      console.log(`📦 Deduplicated products: ${body.products.length} → ${uniqueProducts.length}`)

      const productInserts = uniqueProducts.map(item => {
        const product = item.product
        const imageUrl = product.selectedVariant?.image?.url || 
                        product.featuredImage?.url || 
                        null
        
        // Build product URL - try to construct from available data
        let productUrl: string | null = null
        if (product.shop?.primaryDomain?.url) {
          productUrl = `${product.shop.primaryDomain.url}/products/${product.id}`
        } else if (product.shop?.id) {
          // Fallback: try to construct URL from shop ID if domain not available
          productUrl = `https://shop.app/product/${product.id}`
        }

        return {
          shop_public_id: payload.publicId,
          product_id: product.id,
          product_title: product.title,
          product_image: imageUrl,
          product_url: productUrl,
          product_price: product.price.amount,
          product_currency: product.price.currencyCode,
          source: item.source || 'shopify',
          intent_name: item.intent_name || null,
          attributes: item.attributes ? item.attributes as any : null,
          synced_at: new Date().toISOString()
        }
      })

      // Use upsert to handle duplicates gracefully
      // This will insert new products or update existing ones based on the unique constraint
      // Supabase upsert uses the unique constraint automatically when columns are specified
      const { error: productsError } = await supabase
        .from('user_product_feed')
        .upsert(productInserts, {
          onConflict: 'shop_public_id,product_id'
        })

      if (productsError) {
        console.error('Error upserting products:', productsError)
        // If upsert fails, try delete + insert as fallback
        console.log('Attempting fallback: delete + insert')
        const { error: deleteError } = await supabase
          .from('user_product_feed')
          .delete()
          .eq('shop_public_id', payload.publicId)

        if (deleteError) {
          console.error('Error deleting old products in fallback:', deleteError)
          return errorResponse(`Failed to sync products: ${productsError.message}`, 500)
        }

        const { error: insertError } = await supabase
          .from('user_product_feed')
          .insert(productInserts)

        if (insertError) {
          console.error('Error inserting products in fallback:', insertError)
          return errorResponse(`Failed to sync products: ${insertError.message}`, 500)
        }
      }

      console.log(`Synced ${productInserts.length} products`)

      // ============================================
      // STEP 6.1: PRUNE OLDEST ROWS IF ABOVE CAP
      // ============================================
      try {
        // Fetch ids beyond the cap ordered from newest to oldest, then drop the tail
        const { data: overRows } = await supabase
          .from('user_product_feed')
          .select('id')
          .eq('shop_public_id', payload.publicId)
          .order('created_at', { ascending: false })
          .range(FEED_CAP, FEED_CAP + PRUNE_CHUNK - 1)

        if (overRows && overRows.length > 0) {
          const idsToDelete = overRows.map(r => r.id)
          await supabase
            .from('user_product_feed')
            .delete()
            .in('id', idsToDelete)
          console.log(`Pruned ${idsToDelete.length} old products beyond cap ${FEED_CAP}`)
        }
      } catch (pruneErr) {
        console.error('Prune step failed (non-fatal):', pruneErr)
      }

      // ============================================
      // STEP 6.2: UPDATE USER PERSONALIZATION STATE
      // ============================================
      try {
        // Get current state
        const { data: stateRows, error: stateErr } = await supabase
          .from('user_personalization_state')
          .select('id, signals')
          .eq('shop_public_id', payload.publicId)
          .limit(1)

        if (stateErr) {
          console.error('Error reading personalization state:', stateErr)
        } else {
          const existing = stateRows && stateRows.length > 0 ? stateRows[0] : null
          const signals = (existing?.signals as any) || {}
          signals.brand_counts = signals.brand_counts || {}
          signals.category_counts = signals.category_counts || {}
          signals.price = signals.price || { sum: 0, count: 0, min: null, max: null }
          signals.category_price = signals.category_price || {}

          // Apply updates from batch
          for (const item of uniqueProducts) {
            const product = item.product as any
            const attrs = (item as any).attributes || {}
            const brandName =
              product?.shop?.name ||
              attrs?.brand ||
              'Unknown'
            signals.brand_counts[brandName] = (signals.brand_counts[brandName] || 0) + 1

            const category =
              attrs?.category ||
              (attrs?.subcategories && attrs.subcategories[0]) ||
              null
            if (category) {
              signals.category_counts[category] = (signals.category_counts[category] || 0) + 1
            }

            // Price aggregation (global)
            const priceNum = parseFloat(product?.price?.amount ?? '0')
            if (!Number.isNaN(priceNum) && priceNum > 0) {
              signals.price.sum += priceNum
              signals.price.count += 1
              signals.price.min = signals.price.min === null ? priceNum : Math.min(signals.price.min, priceNum)
              signals.price.max = signals.price.max === null ? priceNum : Math.max(signals.price.max, priceNum)
              if (category) {
                signals.category_price[category] = signals.category_price[category] || { sum: 0, count: 0, min: null, max: null }
                const cp = signals.category_price[category]
                cp.sum += priceNum
                cp.count += 1
                cp.min = cp.min === null ? priceNum : Math.min(cp.min, priceNum)
                cp.max = cp.max === null ? priceNum : Math.max(cp.max, priceNum)
              }
            }
          }

          // Upsert state
          if (existing) {
            await supabase
              .from('user_personalization_state')
              .update({ signals, updated_at: new Date().toISOString() })
              .eq('id', existing.id)
          } else {
            await supabase
              .from('user_personalization_state')
              .insert({
                shop_public_id: payload.publicId,
                signals,
                updated_at: new Date().toISOString()
              })
          }
        }
      } catch (stateUpdateErr) {
        console.error('State update failed (non-fatal):', stateUpdateErr)
      }
    }

    // ============================================
    // STEP 7: UPSERT FOLLOWED SHOPS
    // ============================================
    if (body.followedShops && body.followedShops.length > 0) {
      const shopInserts = body.followedShops.map(shop => ({
        shop_public_id: payload.publicId,
        followed_shop_id: shop.id,
        followed_shop_name: shop.name,
        followed_shop_logo: shop.logoImage?.url || null,
        followed_shop_url: shop.primaryDomain.url,
      }))

      // Use upsert to handle duplicates gracefully for followed shops
      // The unique constraint on (shop_public_id, followed_shop_id) ensures no duplicates
      const { error: shopsError } = await supabase
        .from('user_followed_shops')
        .upsert(shopInserts, {
          onConflict: 'shop_public_id,followed_shop_id'
        })

      if (shopsError) {
        console.error('Error upserting followed shops:', shopsError)
        // If upsert fails, try delete + insert as fallback
        console.log('Attempting fallback: delete + insert for shops')
        const { error: deleteShopsError } = await supabase
          .from('user_followed_shops')
          .delete()
          .eq('shop_public_id', payload.publicId)

        if (deleteShopsError) {
          console.error('Error deleting old followed shops in fallback:', deleteShopsError)
          return errorResponse(`Failed to sync followed shops: ${shopsError.message}`, 500)
        }

        const { error: insertShopsError } = await supabase
          .from('user_followed_shops')
          .insert(shopInserts)

        if (insertShopsError) {
          console.error('Error inserting followed shops in fallback:', insertShopsError)
          return errorResponse(`Failed to sync followed shops: ${insertShopsError.message}`, 500)
        }
      }

      console.log(`Synced ${shopInserts.length} followed shops`)

      // Try to reflect shops in shops_catalog for popularity tracking
      try {
        const catalogRows = body.followedShops.map(shop => ({
          shop_id: shop.id,
          shop_name: shop.name,
          primary_domain: shop.primaryDomain?.url || null,
          updated_at: new Date().toISOString()
        }))
        await supabase
          .from('shops_catalog')
          .upsert(catalogRows, { onConflict: 'shop_id' })
      } catch (catalogErr) {
        console.error('Shops catalog upsert failed (non-fatal):', catalogErr)
      }
    }

    // ============================================
    // STEP 8: RETURN SUCCESS
    // ============================================
    return successResponse({
      message: 'Product feed synced successfully',
      products_count: body.products?.length || 0,
      shops_count: body.followedShops?.length || 0
    })

  } catch (error) {
    console.error('Error in sync-product-feed:', error)
    return errorResponse('Internal server error', 500)
  }
})

