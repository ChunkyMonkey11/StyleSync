# 🔧 Services

Business logic and API integration layer.

---

## 📋 Purpose

Services encapsulate business logic and external API calls. They:
- Handle data fetching and mutations
- Integrate with Supabase edge functions
- Process and transform data
- Manage complex business rules
- Keep components clean and focused on UI

---

## 🏗️ Architecture Pattern

```
Component → Service → API/Database
   ↓          ↓          ↓
  UI      Business    Data
Layer     Logic      Layer
```

---

## 📝 Planned Services

### **userService.ts**
User profile operations
```typescript
- createUserProfile()
- getUserProfile(syncId)
- updateUserProfile(syncId, data)
- checkUsernameAvailability(username)
- searchUsers(query)
```

### **connectionService.ts**
Friend sync operations
```typescript
- sendSyncRequest(fromUserId, toUserId)
- acceptSyncRequest(requestId)
- rejectSyncRequest(requestId)
- getSyncedFriends(userId)
- getPendingSyncRequests(userId)
- removeSyncConnection(userId, friendId)
```

### **feedService.ts**
Feed and activity operations
```typescript
- getPersonalFeed(userId)
- getFriendsFeed(userId)
- getUserActivity(userId, filters)
- trackProductView(userId, productId)
- trackProductSave(userId, productId)
```

### **productService.ts**
Product data operations
```typescript
- getProductDetails(productId)
- getRecentProducts(userId)
- getSavedProducts(userId)
- saveProduct(userId, productId)
- unsaveProduct(userId, productId)
```

### **metadataService.ts**
User metadata operations
```typescript
- storeShopMetadata(userId, metadata)
- getShopMetadata(userId)
- updateInterests(userId, interests)
- getBuyerAttributes(userId)
```

---

## 🎯 Service Design Principles

### 1. Single Responsibility
Each service handles one domain area:
```typescript
// Good ✅
userService.createUserProfile()
connectionService.sendSyncRequest()

// Bad ❌
userService.sendSyncRequest() // Wrong domain
```

### 2. Error Handling
Always return consistent error objects:
```typescript
type ServiceResponse<T> = {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
};
```

### 3. Type Safety
Full TypeScript types for inputs and outputs:
```typescript
export async function getUserProfile(
  syncId: string
): Promise<ServiceResponse<UserProfile>> {
  // Implementation
}
```

### 4. Async/Await
All service methods are async:
```typescript
export async function createUserProfile(
  data: CreateUserData
): Promise<ServiceResponse<UserProfile>> {
  // Implementation
}
```

---

## 📦 Service Template

```typescript
// userService.ts

import { supabase } from '@/lib/supabase';
import type { UserProfile, CreateUserData } from '@/types';

export type ServiceResponse<T> = {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
};

/**
 * Create a new user profile
 */
export async function createUserProfile(
  userData: CreateUserData
): Promise<ServiceResponse<UserProfile>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      return {
        error: {
          message: error.message,
          code: error.code,
        },
      };
    }

    return { data };
  } catch (err) {
    return {
      error: {
        message: 'Unexpected error creating profile',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get user profile by syncId
 */
export async function getUserProfile(
  syncId: string
): Promise<ServiceResponse<UserProfile>> {
  // Implementation
}

// More functions...
```

---

## 🔌 Integration Examples

### In Components
```typescript
import { createUserProfile } from '@/services/userService';

function OnboardingForm() {
  const handleSubmit = async (formData) => {
    const { data, error } = await createUserProfile(formData);
    
    if (error) {
      showError(error.message);
      return;
    }
    
    onSuccess(data);
  };
}
```

### In Custom Hooks
```typescript
import { getUserProfile } from '@/services/userService';

export function useUserProfile(syncId: string) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function load() {
      const { data, error } = await getUserProfile(syncId);
      if (data) setProfile(data);
      setLoading(false);
    }
    load();
  }, [syncId]);
  
  return { profile, loading };
}
```

---

## 🧪 Testing Services

Services should be unit tested:

```typescript
// userService.test.ts

import { createUserProfile } from './userService';

describe('userService', () => {
  describe('createUserProfile', () => {
    it('should create user profile successfully', async () => {
      const userData = {
        username: 'testuser',
        bio: 'Test bio',
      };
      
      const { data, error } = await createUserProfile(userData);
      
      expect(error).toBeUndefined();
      expect(data).toHaveProperty('syncId');
    });
    
    it('should handle duplicate username error', async () => {
      // Test error case
    });
  });
});
```

---

## 📁 File Organization

```
services/
├── README.md              ← You are here
├── userService.ts         ← User operations
├── connectionService.ts   ← Sync/friend operations
├── feedService.ts         ← Feed & activity
├── productService.ts      ← Product data
├── metadataService.ts     ← User metadata
└── index.ts               ← Barrel export
```

### Barrel Export Pattern
```typescript
// index.ts
export * from './userService';
export * from './connectionService';
export * from './feedService';
export * from './productService';
export * from './metadataService';

// Usage in components
import { createUserProfile, sendSyncRequest } from '@/services';
```

---

## 🚀 Next Steps

1. **Start with userService.ts** - Core functionality
2. **Implement error handling** - Consistent pattern
3. **Add TypeScript types** - Update types.ts as needed
4. **Test each function** - Unit tests
5. **Document edge cases** - Comments in code

---

## 💡 Best Practices

- ✅ Keep services thin - delegate to API
- ✅ Handle errors gracefully
- ✅ Use TypeScript strictly
- ✅ Document complex logic
- ✅ Return consistent response format
- ❌ Don't put UI logic in services
- ❌ Don't directly manipulate DOM
- ❌ Don't import components

---

Return to [Project Navigation](../../../NAVIGATION.md)

