import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, corsHeaders } from '../_shared/cors.ts'
import { successResponse, errorResponse, rateLimit, validateEnvVars } from '../_shared/responses.ts'
import { createJWT } from '../_shared/jwt-utils.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const JWT_SECRET_KEY = Deno.env.get('JWT_SECRET_KEY')!
const SHOP_MINIS_ADMIN_API_KEY = Deno.env.get('SHOP_MINIS_ADMIN_API_KEY')!

serve(async (req) => {
  // Handle CORS
  if (handleCors(req)) {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate environment variables
    validateEnvVars(['JWT_SECRET_KEY', 'SHOP_MINIS_ADMIN_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'])
    
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    if (!rateLimit(`auth:${clientIP}`, 10, 60000)) { // 10 requests per minute
      return errorResponse('Rate limit exceeded', 429)
    }

    // Get Shop Mini token from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Missing or invalid authorization header', 401)
    }

    const shopMiniToken = authHeader.substring(7)

    // Verify token with Shopify Admin API
    const verification = await verifyShopMiniToken(shopMiniToken)
    
    // Create JWT token
    const jwtToken = await createJWT(
      verification.publicId,
      verification.userState,
      JWT_SECRET_KEY,
      7 // 7 days
    )

    return successResponse({
      token: jwtToken,
      expiresIn: 604800, // 7 days in seconds
      publicId: verification.publicId,
      userState: verification.userState
    })

  } catch (error) {
    console.error('Auth error:', error)
    return errorResponse(error.message, 500)
  }
})

async function verifyShopMiniToken(token: string) {
  try {
    // Verify token with Shopify Admin API using userTokenVerify mutation
    const response = await fetch('https://shopify.com/admin/api/2024-01/graphql.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOP_MINIS_ADMIN_API_KEY,
      },
      body: JSON.stringify({
        query: `
          mutation userTokenVerify($token: String!) {
            userTokenVerify(token: $token) {
              user {
                id
                publicId
                state
              }
              valid
            }
          }
        `,
        variables: {
          token: token
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors)
      throw new Error('Token verification failed')
    }

    const verification = result.data.userTokenVerify
    
    if (!verification.valid) {
      throw new Error('Invalid token')
    }

    const user = verification.user
    if (!user || !user.publicId) {
      throw new Error('Unable to extract user information from token')
    }

    return {
      publicId: user.publicId,
      userState: user.state || 'authenticated'
    }

  } catch (error) {
    console.error('Token verification error:', error)
    throw new Error('Invalid or expired token')
  }
}
