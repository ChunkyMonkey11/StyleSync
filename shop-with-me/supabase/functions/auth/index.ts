import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors, corsHeaders } from '../_shared/cors.ts'
import { successResponse, errorResponse, rateLimit, validateEnvVars } from '../_shared/responses.ts'
import { createJWT } from '../_shared/jwt-utils.ts'

const JWT_SECRET_KEY = Deno.env.get('JWT_SECRET_KEY')!

serve(async (req) => {
  // Handle CORS
  if (handleCors(req)) {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate environment variables
    validateEnvVars(['JWT_SECRET_KEY'])
    
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    if (!rateLimit(`auth:${clientIP}`, 10, 60000)) { // 10 requests per minute
      return errorResponse('Rate limit exceeded', 429)
    }

    // Get user ID from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Missing or invalid authorization header', 401)
    }

    const userId = authHeader.substring(7)
    console.log('🔐 Creating JWT for user:', userId)

    // Create JWT token directly (no Shopify verification for Shop Minis environment)
    const jwtToken = await createJWT(
      userId,
      'authenticated',
      JWT_SECRET_KEY,
      7 // 7 days
    )

    console.log('✅ JWT created successfully for user:', userId)

    return successResponse({
      token: jwtToken,
      expiresIn: 604800, // 7 days in seconds
      publicId: userId,
      userState: 'authenticated'
    })

  } catch (error) {
    console.error('Auth error:', error)
    return errorResponse(error.message, 500)
  }
})