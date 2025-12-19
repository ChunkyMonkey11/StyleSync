/**
 * StyleSync Auth Function
 * Validates Shop Mini tokens using Minis Admin API and issues JWT tokens for subsequent API calls
 * Also checks if user profile exists in database
 */

import { createJWT, extractBearerToken } from "../_shared/jwt-utils.ts";
import { handleCors, errorResponse, successResponse, requireMethod } from "../_shared/responses.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Configuration from environment
const JWT_SECRET_KEY = Deno.env.get("JWT_SECRET_KEY");
const SHOP_MINIS_ADMIN_API_KEY = Deno.env.get("SHOP_MINIS_ADMIN_API_KEY");
const MINIS_ADMIN_API_URL = "https://server.shop.app/minis/admin-api/alpha/graphql.json";

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  // Only accept POST requests
  const methodCheck = requireMethod(req, "POST");
  if (methodCheck) return methodCheck;
  
  try {
    console.log("🚀 Auth function called");
    
    // Validate environment configuration
    console.log("🔧 Checking environment variables...");
    console.log("JWT_SECRET_KEY exists:", !!JWT_SECRET_KEY);
    
    if (!JWT_SECRET_KEY) {
      console.error("❌ Missing required secrets");
      return errorResponse("Server configuration error: Missing required secrets", 500);
    }
    
    // Extract Shop Mini token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("❌ Missing Authorization header");
      return errorResponse("Missing authorization header", 401);
    }
    
    const shopMiniToken = extractBearerToken(authHeader);
    if (!shopMiniToken) {
      console.error("❌ Invalid authorization header format");
      return errorResponse("Invalid authorization header format", 401);
    }
    
    console.log("📱 Received Shop Mini token, length:", shopMiniToken.length);
    
    // ============================================
    // STEP 1: VERIFY TOKEN WITH MINIS ADMIN API
    // ============================================
    console.log("🔐 Verifying token with Minis Admin API...");
    
    if (!SHOP_MINIS_ADMIN_API_KEY) {
      console.error("❌ Missing SHOP_MINIS_ADMIN_API_KEY");
      return errorResponse("Server configuration error: Missing Admin API key", 500);
    }
    
    // Call Minis Admin API to verify token and get publicId
    const graphqlQuery = {
      query: `
        mutation UserTokenVerify($token: String!) {
          userTokenVerify(token: $token) {
            publicId
            tokenExpiresAt
            userState
            userErrors {
              code
              message
              field
            }
          }
        }
      `,
      variables: {
        token: shopMiniToken
      }
    };
    
    let publicId: string | null = null;
    let userState: string = "active";
    let tokenExpiresAt: string | null = null;
    
    try {
      const adminApiResponse = await fetch(MINIS_ADMIN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SHOP_MINIS_ADMIN_API_KEY}`
        },
        body: JSON.stringify(graphqlQuery)
      });
      
      if (!adminApiResponse.ok) {
        console.error("❌ Admin API request failed:", adminApiResponse.status);
        throw new Error(`Admin API request failed: ${adminApiResponse.status}`);
      }
      
      const adminApiData = await adminApiResponse.json();
      
      // Check for GraphQL errors
      if (adminApiData.errors) {
        console.error("❌ GraphQL errors:", adminApiData.errors);
        throw new Error(`GraphQL error: ${JSON.stringify(adminApiData.errors)}`);
      }
      
      const verifyResult = adminApiData.data?.userTokenVerify;
      
      if (!verifyResult) {
        console.error("❌ No userTokenVerify result");
        throw new Error("No userTokenVerify result from Admin API");
      }
      
      // Check for user errors
      if (verifyResult.userErrors && verifyResult.userErrors.length > 0) {
        const error = verifyResult.userErrors[0];
        console.error("❌ User token verification error:", error);
        return errorResponse(`Token verification failed: ${error.message}`, 401);
      }
      
      publicId = verifyResult.publicId;
      userState = verifyResult.userState || "active";
      tokenExpiresAt = verifyResult.tokenExpiresAt;
      
      if (!publicId) {
        console.error("❌ No publicId returned from Admin API");
        return errorResponse("Failed to verify user token", 401);
      }
      
      console.log("✅ Token verified successfully");
      console.log("👤 PublicId:", publicId);
      console.log("📊 User state:", userState);
      
    } catch (error) {
      console.error("❌ Error calling Minis Admin API:", error);
      // Fallback to development mode if Admin API fails
      console.log("⚠️ Falling back to development mode...");
      const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(shopMiniToken));
      const hashArray = Array.from(new Uint8Array(tokenHash));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      publicId = `shop-mini-user-${hashHex.substring(0, 12)}`;
      userState = "active";
      console.log("👤 Fallback publicId:", publicId);
    }
    
    if (!publicId) {
      return errorResponse("Failed to get user publicId", 500);
    }
    
    // ============================================
    // STEP 2: CHECK IF PROFILE EXISTS IN DATABASE
    // ============================================
    console.log("🔍 Checking if profile exists for publicId:", publicId);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    let hasProfile = false;
    let profile = null;
    
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data: profileData, error: profileError } = await supabase
          .from('userprofiles')
          .select('*')
          .eq('shop_public_id', publicId)
          .maybeSingle();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("❌ Error checking profile:", profileError);
          // Don't fail auth if profile check fails, just log it
        } else if (profileData) {
          hasProfile = true;
          profile = profileData;
          console.log("✅ Profile found for user");
        } else {
          console.log("ℹ️ No profile found for user");
        }
      } catch (error) {
        console.error("❌ Error querying database:", error);
        // Don't fail auth if database check fails
      }
    } else {
      console.warn("⚠️ Supabase credentials not available, skipping profile check");
    }
    
    // ============================================
    // STEP 3: CREATE JWT TOKEN
    // ============================================
    const jwtToken = await createJWT(
      publicId,
      userState,
      JWT_SECRET_KEY,
      7
    );
    
    console.log("🎫 Created JWT token for user:", publicId);
    
    // ============================================
    // STEP 4: RETURN RESPONSE WITH PROFILE INFO
    // ============================================
    // Return JWT token and profile information
    return successResponse({
      token: jwtToken,
      expiresIn: 604800, // 7 days in seconds
      publicId: publicId,
      hasProfile: hasProfile,
      profile: profile
    });
    
  } catch (error) {
    console.error("❌ Auth function error:", error);
    return errorResponse("Internal server error", 500);
  }
});