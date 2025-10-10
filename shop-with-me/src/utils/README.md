# 🛠️ Utilities

Helper functions and utility modules used across the application.

---

## 📋 Purpose

Utilities are pure, reusable functions that:
- Format and transform data
- Validate inputs
- Parse complex data structures
- Provide common operations
- Have no side effects (pure functions)
- Don't depend on app state

---

## 📝 Planned Utility Modules

### **formatters.ts**
Data formatting utilities
```typescript
- formatPrice(amount, currency) → "$19.99"
- formatDate(date, format) → "Oct 10, 2025"
- formatUsername(username) → "@username"
- formatProductTitle(title, maxLength) → "Product Na..."
- formatReviewCount(count) → "1.2K reviews"
```

### **validators.ts**
Input validation functions
```typescript
- isValidUsername(username) → boolean
- isValidEmail(email) → boolean
- isValidBio(bio) → boolean
- validateUserProfile(data) → ValidationResult
- sanitizeInput(input) → string
```

### **parsers.ts**
Shop SDK data parsers
```typescript
- parseProductData(rawProduct) → Product
- parseBuyerAttributes(attributes) → BuyerAttributes
- parseRecentProducts(products) → Product[]
- extractShopInfo(product) → ShopInfo
```

### **dateUtils.ts**
Date/time utilities
```typescript
- getTimeAgo(date) → "2 hours ago"
- isToday(date) → boolean
- formatTimestamp(timestamp) → string
- getRelativeTime(date) → "just now" | "5m" | "2h"
```

### **arrayUtils.ts**
Array manipulation utilities
```typescript
- unique(array) → array (dedupe)
- groupBy(array, key) → grouped object
- sortBy(array, key) → sorted array
- chunk(array, size) → array of chunks
- shuffle(array) → shuffled array
```

### **stringUtils.ts**
String manipulation utilities
```typescript
- truncate(text, length) → string
- slugify(text) → "slug-format"
- capitalize(text) → "Capitalized"
- extractHashtags(text) → string[]
- highlightSearch(text, query) → JSX with highlights
```

### **urlUtils.ts**
URL and image utilities
```typescript
- buildProductUrl(productId) → string
- buildUserProfileUrl(username) → string
- optimizeImageUrl(url, size) → string
- getImageDimensions(url) → { width, height }
```

---

## 🎯 Utility Design Principles

### 1. Pure Functions
No side effects, same input = same output:
```typescript
// Good ✅
export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Bad ❌ (side effect)
let cachedPrice = '';
export function formatPrice(amount: number, currency: string): string {
  cachedPrice = ...; // Mutation
  return cachedPrice;
}
```

### 2. Single Purpose
Each function does one thing well:
```typescript
// Good ✅
export function formatPrice(amount: number, currency: string): string
export function formatDate(date: Date, format: string): string

// Bad ❌ (too much responsibility)
export function formatEverything(data: any, type: string): string
```

### 3. Type Safety
Strong typing for inputs and outputs:
```typescript
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};
```

### 4. Documentation
Clear JSDoc comments:
```typescript
/**
 * Format a price with currency symbol
 * @param amount - Price amount (e.g., 19.99)
 * @param currency - Currency code (e.g., "USD")
 * @returns Formatted price string (e.g., "$19.99")
 */
export function formatPrice(amount: number, currency: string): string {
  // Implementation
}
```

---

## 📦 Utility File Template

```typescript
// formatters.ts

/**
 * Format a price with currency symbol
 * @param amount - Price amount
 * @param currency - Currency code (ISO 4217)
 * @returns Formatted price string
 * 
 * @example
 * formatPrice(19.99, "USD") // "$19.99"
 * formatPrice(99, "EUR") // "€99.00"
 */
export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format review count with K/M suffixes
 * @param count - Review count
 * @returns Formatted count string
 * 
 * @example
 * formatReviewCount(1234) // "1.2K reviews"
 * formatReviewCount(5) // "5 reviews"
 */
export function formatReviewCount(count: number): string {
  if (count === 0) return 'No reviews';
  if (count === 1) return '1 review';
  if (count < 1000) return `${count} reviews`;
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K reviews`;
  return `${(count / 1000000).toFixed(1)}M reviews`;
}

// More formatters...
```

---

## 🔌 Usage Examples

### In Components
```typescript
import { formatPrice, formatReviewCount } from '@/utils/formatters';
import { isValidUsername } from '@/utils/validators';

function ProductCard({ product }) {
  return (
    <div>
      <h3>{product.title}</h3>
      <p>{formatPrice(product.price.amount, product.price.currencyCode)}</p>
      <p>{formatReviewCount(product.reviewAnalytics.reviewCount)}</p>
    </div>
  );
}

function UsernameInput({ value, onChange }) {
  const isValid = isValidUsername(value);
  return (
    <input
      value={value}
      onChange={onChange}
      className={isValid ? 'valid' : 'invalid'}
    />
  );
}
```

### In Services
```typescript
import { parseProductData } from '@/utils/parsers';
import { validateUserProfile } from '@/utils/validators';

export async function createUserProfile(data) {
  const validation = validateUserProfile(data);
  if (!validation.isValid) {
    return { error: validation.errors };
  }
  // Continue...
}
```

---

## 🧪 Testing Utilities

Utilities should be thoroughly tested:

```typescript
// formatters.test.ts

import { formatPrice, formatReviewCount } from './formatters';

describe('formatters', () => {
  describe('formatPrice', () => {
    it('should format USD correctly', () => {
      expect(formatPrice(19.99, 'USD')).toBe('$19.99');
    });
    
    it('should handle whole numbers', () => {
      expect(formatPrice(20, 'USD')).toBe('$20.00');
    });
    
    it('should handle different currencies', () => {
      expect(formatPrice(99, 'EUR')).toContain('€');
    });
  });
  
  describe('formatReviewCount', () => {
    it('should format large numbers with K suffix', () => {
      expect(formatReviewCount(1234)).toBe('1.2K reviews');
    });
    
    it('should handle zero reviews', () => {
      expect(formatReviewCount(0)).toBe('No reviews');
    });
  });
});
```

---

## 📁 File Organization

```
utils/
├── README.md          ← You are here
├── formatters.ts      ← Data formatting
├── validators.ts      ← Input validation
├── parsers.ts         ← Data parsing
├── dateUtils.ts       ← Date/time utilities
├── arrayUtils.ts      ← Array operations
├── stringUtils.ts     ← String manipulation
├── urlUtils.ts        ← URL utilities
├── index.ts           ← Barrel export
└── __tests__/         ← Unit tests
    ├── formatters.test.ts
    ├── validators.test.ts
    └── ...
```

### Barrel Export
```typescript
// index.ts
export * from './formatters';
export * from './validators';
export * from './parsers';
export * from './dateUtils';
export * from './arrayUtils';
export * from './stringUtils';
export * from './urlUtils';

// Usage
import { formatPrice, isValidUsername } from '@/utils';
```

---

## 🚀 Next Steps

1. **Start with formatters.ts** - Most immediately useful
2. **Add validators.ts** - Critical for forms
3. **Create parsers.ts** - For Shop SDK data
4. **Write tests** - High coverage for utils
5. **Document edge cases** - Clear examples

---

## 💡 Best Practices

### ✅ Do
- Keep functions pure (no side effects)
- Make functions composable
- Handle edge cases gracefully
- Return early for invalid inputs
- Document with JSDoc
- Write comprehensive tests
- Use TypeScript strictly

### ❌ Don't
- Mutate input parameters
- Rely on external state
- Make API calls (use services instead)
- Import from components
- Create overly complex functions
- Mix concerns (formatting + validation)

---

## 📚 Common Patterns

### Safe Access with Defaults
```typescript
export function getNestedValue(obj: any, path: string, defaultValue: any) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? defaultValue;
}

// Usage
const rating = getNestedValue(product, 'reviewAnalytics.averageRating', 0);
```

### Debounce/Throttle
```typescript
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
```

### Type Guards
```typescript
export function isProduct(obj: any): obj is Product {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string';
}
```

---

Return to [Project Navigation](../../../NAVIGATION.md)

