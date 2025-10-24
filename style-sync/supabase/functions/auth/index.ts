/**
 * StyleSync Auth Function
 * Validates Shop Mini tokens using development mode and issues JWT tokens for subsequent API calls
 */

import { createJWT, extractBearerToken } from "../_shared/jwt-utils.ts";
import { handleCors, errorResponse, successResponse, requireMethod } from "../_shared/responses.ts";

// Configuration from environment
const JWT_SECRET_KEY = Deno.env.get("JWT_SECRET_KEY");

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
    
    // Development mode: Generate consistent publicId from token hash
    console.log("🔐 Using development mode - generating mock publicId from token hash...");
    
    // Generate a consistent publicId from token hash
    // This ensures the same token always generates the same publicId
    const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(shopMiniToken));
    const hashArray = Array.from(new Uint8Array(tokenHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const publicId = `shop-mini-user-${hashHex.substring(0, 12)}`;
    const userState = "active";
    
    console.log("✅ Development mode: Generated consistent publicId");
    console.log("👤 Mock publicId:", publicId);
    console.log("📊 User state:", userState);
    
    // Create backend JWT token
    const jwtToken = await createJWT(
      publicId,
      userState,
      JWT_SECRET_KEY,
      7
    );
    
    console.log("🎫 Created JWT token for user:", publicId);
    
    // Return JWT token to client
    return successResponse({
      token: jwtToken,
      expiresIn: 604800, // 7 days in seconds
      publicId: publicId
    });
    
  } catch (error) {
    console.error("❌ Auth function error:", error);
    return errorResponse("Internal server error", 500);
  }
});