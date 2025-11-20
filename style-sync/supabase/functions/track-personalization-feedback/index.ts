// Edge Function: track-personalization-feedback
// Purpose: Store user interactions with personalized recommendations for learning

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyJWT, extractBearerToken } from '../_shared/jwt-utils.ts'
import { errorResponse, successResponse, requireMethod } from '../_shared/responses.ts'

interface PersonalizationEvent {
  eventType: 'view' | 'click' | 'favorite' | 'purchase' | 'dismiss'
  intentName: string
  productId: string
  timestamp: string
  sessionId?: string
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
    // STEP 4: PARSE REQUEST BODY
    // ============================================
    const body = await req.json()
    const { event }: { event: PersonalizationEvent } = body

    if (!event) {
      return errorResponse('Missing event data', 400)
    }

    if (!event.eventType || !event.intentName || !event.productId) {
      return errorResponse('Missing required event fields', 400)
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
    // STEP 6: STORE FEEDBACK EVENT
    // ============================================
    const feedbackData = {
      shop_public_id: payload.publicId,
      event_type: event.eventType,
      intent_name: event.intentName,
      product_id: event.productId,
      session_id: event.sessionId,
      timestamp: event.timestamp
    }

    const { error: insertError } = await supabase
      .from('personalization_feedback')
      .insert([feedbackData])

    if (insertError) {
      console.error('Error inserting feedback:', insertError)
      return errorResponse(`Failed to store feedback: ${insertError.message}`, 500)
    }

    // ============================================
    // STEP 7: UPDATE INTENT SUCCESS RATES (if needed)
    // ============================================
    // This could be done periodically via a cron job or trigger
    // For now, we just store the events

    console.log('Feedback event stored:', feedbackData)

    // ============================================
    // STEP 8: RETURN SUCCESS
    // ============================================
    return successResponse({
      message: 'Feedback tracked successfully',
      eventId: feedbackData
    })

  } catch (error) {
    console.error('Error in track-personalization-feedback:', error)
    return errorResponse('Internal server error', 500)
  }
})






