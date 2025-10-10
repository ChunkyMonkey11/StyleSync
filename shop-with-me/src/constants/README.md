# ⚙️ Constants

Application-wide constants, configuration values, and static data.

---

## 📋 Purpose

Constants provide:
- Configuration values used across the app
- Feature flags and toggles
- Static data (categories, options, etc.)
- API endpoints and routes
- Magic numbers and strings
- Environment-independent values

---

## 📝 Planned Constant Modules

### **appConfig.ts**
General app configuration
```typescript
export const APP_NAME = 'StyleSync';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Shop with your friends';

export const LIMITS = {
  MAX_USERNAME_LENGTH: 20,
  MIN_USERNAME_LENGTH: 3,
  MAX_BIO_LENGTH: 150,
  MAX_INTERESTS: 10,
  MAX_SYNCED_FRIENDS: 500,
  FEED_PAGE_SIZE: 20,
} as const;

export const ROUTES = {
  HOME: '/',
  ONBOARDING: '/onboarding',
  PROFILE: '/profile',
  FEED: '/feed',
  FRIENDS: '/friends',
  SETTINGS: '/settings',
} as const;
```

### **apiConfig.ts**
API endpoints and configuration
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ENDPOINTS = {
  AUTH: '/auth',
  USER_PROFILE: '/user-profile',
  CHECK_USERNAME: '/check-username',
  CREATE_PROFILE: '/create-profile',
  CONNECTIONS: '/connections',
  FEED: '/feed',
} as const;

export const API_TIMEOUTS = {
  DEFAULT: 10000, // 10 seconds
  UPLOAD: 30000,  // 30 seconds
  LONG: 60000,    // 1 minute
} as const;
```

### **interests.ts**
Available interest categories
```typescript
export const INTEREST_CATEGORIES = [
  // Fashion
  'Streetwear',
  'Minimalist',
  'Casual',
  'Athletic',
  'Formal',
  'Vintage',
  'Trendy',
  'Luxury',
  
  // Product Types
  'Sneakers',
  'Accessories',
  'Fragrances',
  'Jewelry',
  'Bags',
  'Watches',
  
  // Lifestyle
  'Fitness',
  'Tech',
  'Home Decor',
  'Beauty',
  'Wellness',
  'Outdoor',
] as const;

export type InterestCategory = typeof INTEREST_CATEGORIES[number];
```

### **styles.ts**
Style personas and options
```typescript
export const STYLE_PERSONAS = [
  {
    id: 'streetwear',
    label: 'Streetwear',
    description: 'Urban, hype, trendy',
    emoji: '👟',
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    description: 'Clean, simple, timeless',
    emoji: '⚪',
  },
  // More personas...
] as const;

export const BUDGET_RANGES = [
  {
    id: 'budget',
    label: 'Budget-friendly',
    range: '< $50',
    min: 0,
    max: 50,
  },
  {
    id: 'mid',
    label: 'Mid-range',
    range: '$50 - $150',
    min: 50,
    max: 150,
  },
  {
    id: 'premium',
    label: 'Premium',
    range: '$150+',
    min: 150,
    max: Infinity,
  },
  {
    id: 'mixed',
    label: 'I mix it up',
    range: 'All ranges',
    min: 0,
    max: Infinity,
  },
] as const;
```

### **validation.ts**
Validation rules and patterns
```typescript
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const VALIDATION_MESSAGES = {
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_TOO_SHORT: 'Username must be at least 3 characters',
  USERNAME_TOO_LONG: 'Username cannot exceed 20 characters',
  USERNAME_INVALID_CHARS: 'Username can only contain letters, numbers, and underscores',
  USERNAME_TAKEN: 'This username is already taken',
  
  BIO_TOO_LONG: 'Bio cannot exceed 150 characters',
  
  INTERESTS_REQUIRED: 'Please select at least one interest',
  INTERESTS_TOO_MANY: 'You can select up to 10 interests',
} as const;
```

### **shopSdk.ts**
Shop SDK configuration
```typescript
export const SHOP_SDK_CONFIG = {
  RECENT_PRODUCTS_LIMIT: 20,
  SAVED_PRODUCTS_LIMIT: 50,
  PRODUCT_IMAGE_SIZE: 'medium',
} as const;

export const PRODUCT_SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Viewed' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
] as const;
```

### **featureFlags.ts**
Feature toggles for gradual rollouts
```typescript
export const FEATURES = {
  // Phase 1
  USER_PROFILES: true,
  FRIEND_SYNC: true,
  PERSONAL_FEED: true,
  FRIENDS_FEED: true,
  
  // Phase 2 (disabled for now)
  PRODUCT_POSTS: false,
  COMMENTS: false,
  FORUMS: false,
  
  // Phase 3 (disabled for now)
  INFLUENCER_MODE: false,
  AFFILIATE_LINKS: false,
  
  // Development features
  DEBUG_MODE: import.meta.env.DEV,
  MOCK_DATA: false,
} as const;
```

### **errors.ts**
Error codes and messages
```typescript
export const ERROR_CODES = {
  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Validation
  INVALID_INPUT: 'INVALID_INPUT',
  DUPLICATE_USERNAME: 'DUPLICATE_USERNAME',
  
  // Server
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Network connection error. Please try again.',
  [ERROR_CODES.TIMEOUT]: 'Request timed out. Please try again.',
  [ERROR_CODES.UNAUTHORIZED]: 'You need to log in to continue.',
  [ERROR_CODES.SERVER_ERROR]: 'Something went wrong. Please try again later.',
  // More messages...
} as const;
```

---

## 🎯 Design Principles

### 1. Use `as const` for Type Safety
```typescript
export const ROUTES = {
  HOME: '/',
  PROFILE: '/profile',
} as const;

// Now TypeScript knows the exact string values
type Route = typeof ROUTES[keyof typeof ROUTES]; // '/' | '/profile'
```

### 2. Group Related Constants
```typescript
// Good ✅
export const LIMITS = {
  MAX_USERNAME_LENGTH: 20,
  MAX_BIO_LENGTH: 150,
} as const;

// Bad ❌
export const MAX_USERNAME_LENGTH = 20;
export const MAX_BIO_LENGTH = 150;
```

### 3. Use Descriptive Names
```typescript
// Good ✅
export const MAX_SYNCED_FRIENDS = 500;

// Bad ❌
export const LIMIT = 500;
export const MAX = 500;
```

### 4. Environment Variables for Secrets
```typescript
// Good ✅
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Bad ❌
export const API_BASE_URL = 'https://api.example.com'; // Hardcoded
```

---

## 📦 Constant File Template

```typescript
// appConfig.ts

/**
 * Application configuration constants
 */

export const APP_NAME = 'StyleSync' as const;
export const APP_VERSION = '1.0.0' as const;

/**
 * Application limits and constraints
 */
export const LIMITS = {
  /** Maximum username length */
  MAX_USERNAME_LENGTH: 20,
  
  /** Minimum username length */
  MIN_USERNAME_LENGTH: 3,
  
  /** Maximum bio length */
  MAX_BIO_LENGTH: 150,
  
  /** Maximum number of interests a user can select */
  MAX_INTERESTS: 10,
  
  /** Maximum number of friends a user can sync with */
  MAX_SYNCED_FRIENDS: 500,
  
  /** Number of items per feed page */
  FEED_PAGE_SIZE: 20,
} as const;

/**
 * Application routes
 */
export const ROUTES = {
  HOME: '/',
  ONBOARDING: '/onboarding',
  PROFILE: '/profile/:username',
  FEED: '/feed',
  FRIENDS: '/friends',
  SETTINGS: '/settings',
} as const;

/**
 * Type-safe route helper
 */
export function buildRoute(route: keyof typeof ROUTES, params?: Record<string, string>): string {
  let path = ROUTES[route];
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });
  }
  return path;
}

// Usage:
// buildRoute('PROFILE', { username: 'john' }) → '/profile/john'
```

---

## 🔌 Usage Examples

### In Components
```typescript
import { APP_NAME, LIMITS, ROUTES } from '@/constants/appConfig';
import { INTEREST_CATEGORIES } from '@/constants/interests';

function OnboardingForm() {
  const maxInterests = LIMITS.MAX_INTERESTS;
  
  return (
    <div>
      <h1>Welcome to {APP_NAME}</h1>
      <p>Select up to {maxInterests} interests:</p>
      <InterestPicker options={INTEREST_CATEGORIES} max={maxInterests} />
    </div>
  );
}
```

### In Validators
```typescript
import { LIMITS, USERNAME_PATTERN } from '@/constants';
import { VALIDATION_MESSAGES } from '@/constants/validation';

export function validateUsername(username: string): ValidationResult {
  if (!username) {
    return { isValid: false, error: VALIDATION_MESSAGES.USERNAME_REQUIRED };
  }
  
  if (username.length < LIMITS.MIN_USERNAME_LENGTH) {
    return { isValid: false, error: VALIDATION_MESSAGES.USERNAME_TOO_SHORT };
  }
  
  if (username.length > LIMITS.MAX_USERNAME_LENGTH) {
    return { isValid: false, error: VALIDATION_MESSAGES.USERNAME_TOO_LONG };
  }
  
  if (!USERNAME_PATTERN.test(username)) {
    return { isValid: false, error: VALIDATION_MESSAGES.USERNAME_INVALID_CHARS };
  }
  
  return { isValid: true };
}
```

### With Feature Flags
```typescript
import { FEATURES } from '@/constants/featureFlags';

function FeedPage() {
  return (
    <div>
      <PersonalFeed />
      {FEATURES.FRIENDS_FEED && <FriendsFeed />}
      {FEATURES.PRODUCT_POSTS && <ProductPosts />}
    </div>
  );
}
```

---

## 📁 File Organization

```
constants/
├── README.md          ← You are here
├── appConfig.ts       ← General app config
├── apiConfig.ts       ← API endpoints & config
├── interests.ts       ← Interest categories
├── styles.ts          ← Style personas & budgets
├── validation.ts      ← Validation rules
├── shopSdk.ts         ← Shop SDK config
├── featureFlags.ts    ← Feature toggles
├── errors.ts          ← Error codes & messages
└── index.ts           ← Barrel export
```

### Barrel Export
```typescript
// index.ts
export * from './appConfig';
export * from './apiConfig';
export * from './interests';
export * from './styles';
export * from './validation';
export * from './shopSdk';
export * from './featureFlags';
export * from './errors';

// Usage
import { APP_NAME, LIMITS, INTEREST_CATEGORIES } from '@/constants';
```

---

## 🚀 Next Steps

1. **Create appConfig.ts** - Core app constants
2. **Add validation.ts** - Validation rules & messages
3. **Create interests.ts** - Available interest categories
4. **Add featureFlags.ts** - Control feature rollout
5. **Document all values** - Clear comments

---

## 💡 Best Practices

### ✅ Do
- Use `as const` for immutability
- Group related constants
- Use TypeScript enums or const objects
- Document why values are chosen
- Use environment variables for secrets
- Make constants type-safe
- Keep values DRY (don't repeat)

### ❌ Don't
- Hardcode values throughout the app
- Use magic numbers/strings
- Put secrets in constants
- Make constants mutable
- Create overly granular constants
- Duplicate values across files

---

## 🎨 Advanced Patterns

### Type-Safe Enums
```typescript
export const CONNECTION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS];

// Usage: can only be one of the defined values
function updateConnection(status: ConnectionStatus) {
  // TypeScript enforces valid status values
}
```

### Computed Constants
```typescript
export const LIMITS = {
  MAX_USERNAME_LENGTH: 20,
  MIN_USERNAME_LENGTH: 3,
} as const;

// Derived from other constants
export const USERNAME_LENGTH_RANGE = 
  `${LIMITS.MIN_USERNAME_LENGTH}-${LIMITS.MAX_USERNAME_LENGTH} characters`;
```

### Environment-Based Constants
```typescript
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

export const CONFIG = {
  API_URL: isDev 
    ? 'http://localhost:3000' 
    : import.meta.env.VITE_API_URL,
  
  LOG_LEVEL: isDev ? 'debug' : 'error',
  
  ENABLE_ANALYTICS: isProd,
} as const;
```

---

Return to [Project Navigation](../../../NAVIGATION.md)

