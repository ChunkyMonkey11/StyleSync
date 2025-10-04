# StyleSync - Social Shopping Platform

StyleSync is a social shopping platform built for Shopify Shop Minis that allows users to discover products through their friends' recommendations, share items they love, and build a social shopping experience.

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Deploy Edge Functions**:
   ```bash
   ./deploy-functions.sh
   ```

For detailed setup instructions, see [Running the Server](docs/RUNNING_THE_SERVER.md).

## 📚 Documentation

### Core Documentation
- **[Codebase Structure](docs/CODEBASE_STRUCTURE.md)** - Complete overview of the application architecture, components, and data flow
- **[Database Implementation](docs/DATABASE_IMPLEMENTATION.md)** - Database schema, Edge Functions, authentication flow, and security
- **[Next Steps](docs/NEXT_STEPS.md)** - Development roadmap, priorities, and future features
- **[Running the Server](docs/RUNNING_THE_SERVER.md)** - Setup, deployment, and troubleshooting guide

### Migration Documentation
- **[Database Migration Script](DATABASE_MIGRATION_SCRIPT.sql)** - SQL script to migrate from old to new schema
- **[New Database Schema](NEW_DATABASE_SCHEMA.sql)** - Complete database schema with Shopify Public IDs
- **[Setup Guide](SETUP_GUIDE.md)** - Step-by-step setup instructions

## 🏗️ Architecture

StyleSync uses a modern tech stack:

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Custom JWT system with Shopify integration
- **Platform**: Shopify Shop Minis

## ✨ Key Features

- **Social Shopping**: Share and discover products through friends
- **User Profiles**: Custom usernames with Shopify Public ID integration
- **Activity Feeds**: Real-time updates on friends' activities
- **Product Sharing**: Easy sharing of products with messages
- **Follow System**: Follow friends to see their recommendations
- **Dark/Light Theme**: Responsive design with theme switching

## 🔧 Development

### Prerequisites
- Node.js 18+
- Supabase account
- Shopify Partner account

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Project Structure
```
src/
├── components/      # React components
├── hooks/          # Custom React hooks
├── services/       # API services
├── lib/            # Utility libraries
└── App.tsx         # Main application

supabase/functions/ # Edge Functions
├── auth/           # Authentication
├── user-profile/   # User management
└── check-username/ # Username validation
```

## 🚨 Current Status

### ✅ Completed
- **Authentication System**: Fixed with real `useGenerateUserToken` hook implementation
- **Database Schema**: Complete migration to Shopify Public IDs with RLS policies
- **Security Enhancements**: Rate limiting, input validation, and comprehensive error handling
- **Edge Functions**: All functions deployed with proper token verification
- **Username Selection**: Real-time availability checking with suggestions
- **Performance Optimization**: Database indexes and query optimization

### 🚀 Ready for Deployment
- **Authentication**: Fully functional with Shopify Admin API integration
- **Database**: Complete schema with migration script ready
- **Security**: Production-ready security measures implemented
- **API**: All endpoints secured and optimized

### 📋 Manual Tasks Required
1. **Environment Setup**: Set JWT_SECRET_KEY and SHOP_MINIS_ADMIN_API_KEY in Supabase
2. **Database Migration**: Run the provided migration script
3. **Privacy Policy**: Create privacy policy for app store submission
4. **Terms of Service**: Create terms of service document

## 🎉 Deployment Ready!

All critical issues have been resolved. The app is now fully functional and ready for deployment to the Shopify Shop App.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check the docs/ directory for detailed guides
- **Issues**: Create GitHub issues for bugs or feature requests
- **Community**: Join our Discord server for discussions

---

**Built with ❤️ for the Shopify Shop Minis community**




