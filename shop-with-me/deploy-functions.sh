#!/bin/bash

# Deploy Supabase Edge Functions
echo "🚀 Deploying Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "supabase login"
    exit 1
fi

# Generate JWT secret if not exists
if [ -z "$JWT_SECRET_KEY" ]; then
    echo "⚠️  JWT_SECRET_KEY not set. Generating one..."
    JWT_SECRET_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    echo "Generated JWT_SECRET_KEY: $JWT_SECRET_KEY"
    echo "Please set this in your Supabase secrets:"
    echo "supabase secrets set JWT_SECRET_KEY=\"$JWT_SECRET_KEY\""
fi

# Check if SHOP_MINIS_ADMIN_API_KEY is set
if [ -z "$SHOP_MINIS_ADMIN_API_KEY" ]; then
    echo "⚠️  SHOP_MINIS_ADMIN_API_KEY not set."
    echo "Please set this in your Supabase secrets:"
    echo "supabase secrets set SHOP_MINIS_ADMIN_API_KEY=\"your_api_key_here\""
fi

# Deploy functions with --no-verify-jwt flag (required for custom JWT)
echo "📦 Deploying auth function..."
if ! supabase functions deploy auth --no-verify-jwt; then
    echo "❌ Failed to deploy auth function"
    exit 1
fi

echo "📦 Deploying user-profile function..."
if ! supabase functions deploy user-profile --no-verify-jwt; then
    echo "❌ Failed to deploy user-profile function"
    exit 1
fi

echo "📦 Deploying check-username function..."
if ! supabase functions deploy check-username --no-verify-jwt; then
    echo "❌ Failed to deploy check-username function"
    exit 1
fi

echo "✅ All functions deployed successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Set your secrets:"
echo "   supabase secrets set JWT_SECRET_KEY=\"your_generated_key\""
echo "   supabase secrets set SHOP_MINIS_ADMIN_API_KEY=\"your_api_key\""
echo ""
echo "2. Test the functions:"
echo "   supabase functions logs auth --follow"
echo ""
echo "3. Run your app and test authentication!"
echo ""
echo "4. Check function status:"
echo "   supabase functions list"


