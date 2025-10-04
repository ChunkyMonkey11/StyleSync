# Running the StyleSync Server

## Prerequisites

### Required Software
- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **Git**: For version control
- **Supabase CLI**: For Edge Functions management

### Required Accounts
- **Supabase Account**: For database and Edge Functions
- **Shopify Partner Account**: For Shop Minis development
- **GitHub Account**: For code repository (optional)

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd StyleSync/shop-with-me
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Supabase CLI
```bash
# Install globally (requires sudo)
sudo npm install -g supabase

# Or install locally in project
npm install supabase
```

### 4. Environment Setup

#### Create Environment File
Create a `.env` file in the project root:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: For local development
SUPABASE_ACCESS_TOKEN=your-supabase-access-token
```

#### Get Supabase Credentials
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the Project URL and anon public key
5. Update your `.env` file

## Database Setup

### 1. Link Supabase Project
```bash
# Link to your Supabase project
npx supabase link --project-ref="your-project-ref"

# Your project ref can be found in your Supabase URL
# Example: https://aedyzminlpeiyhhyuefc.supabase.co
# Project ref: aedyzminlpeiyhhyuefc
```

### 2. Set Up Database Schema
```bash
# Run the database schema (if not already set up)
# You'll need to run this in your Supabase SQL editor
cat NEW_DATABASE_SCHEMA.sql
```

### 3. Configure Secrets
```bash
# Set JWT secret key
npx supabase secrets set JWT_SECRET_KEY="your-generated-jwt-secret"

# Set Shopify Admin API key
npx supabase secrets set SHOP_MINIS_ADMIN_API_KEY="your-shopify-admin-api-key"

# Verify secrets are set
npx supabase secrets list
```

### 4. Deploy Edge Functions
```bash
# Make the deployment script executable
chmod +x deploy-functions.sh

# Deploy all functions
./deploy-functions.sh

# Or deploy individually
npx supabase functions deploy auth --no-verify-jwt
npx supabase functions deploy user-profile --no-verify-jwt
npx supabase functions deploy check-username --no-verify-jwt
```

## Development Server

### 1. Start Development Server
```bash
# Start the Vite development server
npm run dev

# The server will start on http://localhost:5173
# Or http://localhost:5174 if 5173 is busy
```

### 2. Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

### 3. Hot Reload
The development server includes:
- **Hot Module Replacement (HMR)**: Instant updates for code changes
- **TypeScript compilation**: Real-time type checking
- **Tailwind CSS**: Automatic CSS updates
- **ESLint**: Real-time linting feedback

## Testing

### 1. Local Browser Testing
```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
# Test basic functionality and UI
```

### 2. Shop Mini Testing
```bash
# Build the app
npm run build

# Deploy to Shopify Shop Minis platform
# Follow Shopify's deployment process
```

### 3. Database Testing
```bash
# Test Edge Functions locally
npx supabase functions serve

# Test specific function
npx supabase functions invoke auth --data '{"test": "data"}'
```

## Production Deployment

### 1. Build for Production
```bash
# Create production build
npm run build

# The build output will be in the 'dist' directory
```

### 2. Deploy to Shopify
```bash
# Follow Shopify Shop Minis deployment process
# Upload the 'dist' directory contents
```

### 3. Verify Deployment
```bash
# Check Edge Functions status
npx supabase functions list

# Monitor function logs
npx supabase functions logs auth
npx supabase functions logs user-profile
npx supabase functions logs check-username
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# If port 5173 is busy, Vite will automatically use 5174
# Or specify a different port
npm run dev -- --port 3000
```

#### 2. Supabase Connection Issues
```bash
# Check if Supabase project is accessible
curl -H "apikey: your-anon-key" https://your-project.supabase.co/rest/v1/

# Verify secrets are set
npx supabase secrets list
```

#### 3. Edge Functions Not Working
```bash
# Check function deployment status
npx supabase functions list

# View function logs
npx supabase functions logs auth

# Redeploy if needed
npx supabase functions deploy auth --no-verify-jwt
```

#### 4. Authentication Issues
```bash
# Check if useGenerateUserToken is available
# This hook may not exist in the current SDK version
# See NEXT_STEPS.md for resolution
```

#### 5. Database Connection Errors
```bash
# Verify RLS policies are set correctly
# Check if user has proper permissions
# Ensure JWT tokens are valid
```

### Debug Mode

#### Enable Debug Logging
```bash
# Set debug environment variable
export DEBUG=styleSync:*

# Or add to .env file
DEBUG=styleSync:*
```

#### Browser Developer Tools
```bash
# Open browser developer tools (F12)
# Check Console tab for errors
# Check Network tab for API calls
# Check Application tab for stored data
```

## Monitoring

### 1. Application Monitoring
```bash
# Monitor development server logs
npm run dev

# Check browser console for errors
# Monitor network requests in dev tools
```

### 2. Database Monitoring
```bash
# View Supabase dashboard
# Monitor database performance
# Check Edge Function execution logs
```

### 3. Error Tracking
```bash
# Check Edge Function logs
npx supabase functions logs auth --follow
npx supabase functions logs user-profile --follow
npx supabase functions logs check-username --follow
```

## Performance Optimization

### 1. Development Performance
```bash
# Use faster package manager
npm install -g pnpm
pnpm install

# Enable Vite optimizations
# Check vite.config.mjs for optimizations
```

### 2. Build Optimization
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Optimize images and assets
# Use proper image formats and compression
```

### 3. Database Optimization
```bash
# Monitor query performance in Supabase
# Add proper database indexes
# Use connection pooling
```

## Security Considerations

### 1. Environment Variables
```bash
# Never commit .env files to version control
# Use .env.example for template
# Rotate secrets regularly
```

### 2. API Security
```bash
# Verify JWT tokens are properly validated
# Check CORS settings in Edge Functions
# Monitor for suspicious API usage
```

### 3. Database Security
```bash
# Ensure RLS policies are properly configured
# Regularly audit database permissions
# Monitor for unauthorized access
```

## Backup and Recovery

### 1. Code Backup
```bash
# Regular Git commits
git add .
git commit -m "Backup: $(date)"
git push origin main
```

### 2. Database Backup
```bash
# Supabase handles automatic backups
# Manual backup via Supabase dashboard
# Export data for migration purposes
```

### 3. Configuration Backup
```bash
# Backup environment variables
# Document all configuration changes
# Keep deployment scripts in version control
```

## Maintenance

### 1. Regular Updates
```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Update Supabase CLI
npm install -g supabase@latest
```

### 2. Database Maintenance
```bash
# Monitor database performance
# Clean up old data
# Optimize queries and indexes
```

### 3. Function Maintenance
```bash
# Monitor Edge Function performance
# Update function code as needed
# Test functions after updates
```

## Support and Resources

### Documentation
- **Supabase Docs**: https://supabase.com/docs
- **Shopify Shop Minis**: https://shopify.dev/docs/shop-minis
- **Vite Docs**: https://vitejs.dev/guide/
- **React Docs**: https://react.dev/

### Community
- **Supabase Discord**: For database and Edge Function help
- **Shopify Partners**: For Shop Minis support
- **GitHub Issues**: For bug reports and feature requests

### Getting Help
1. Check this documentation first
2. Search existing GitHub issues
3. Ask in relevant community channels
4. Create detailed bug reports with logs
