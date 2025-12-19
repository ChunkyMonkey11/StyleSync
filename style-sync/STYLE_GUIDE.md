# StyleSync UI/UX Style Guide

**Last Updated:** October 26, 2025  
**Purpose:** Reference guide for maintaining consistent UI/UX across the StyleSync Shop Mini

---

## 📱 Core Platform Requirements

### Mobile-First Design
- **Platform:** Shop Mini running inside Shopify Shop App WebView
- **Target Devices:** iOS and Android phones only
- **Testing:** Always test on actual mobile simulators/devices (i/a/q keys in dev mode)
- **No Desktop Support:** This is a mobile-only application

### SDK-First Development
- **Primary:** Use `@shopify/shop-minis-react` components whenever possible
- **Fallback:** Only build custom components if SDK doesn't provide
- **Current SDK Version:** 0.2.0
- **Documentation:** https://shopify.dev/docs/api/shop-minis

---

## 🎨 Design System

### Color Palette

#### Primary Colors
- **Purple Primary:** `purple-600` (#9333ea) - Main brand color, primary buttons
- **Purple Hover:** `purple-700` - Hover states for primary buttons
- **Purple Light:** `purple-50` - Background highlights, hover states
- **Purple Dark:** `purple-800` - Text on light purple backgrounds

#### Secondary Colors
- **Blue Primary:** `blue-500` (#3b82f6) - Selected states, tags
- **Blue Light:** `blue-100` - Tag backgrounds
- **Blue Text:** `blue-800` - Tag text

#### Neutral Colors
- **Gray Scale:**
  - `gray-50` - Subtle backgrounds (`bg-gray-50`)
  - `gray-100` - Light backgrounds, inactive states
  - `gray-200` - Borders, disabled states
  - `gray-300` - Border light, secondary elements
  - `gray-400` - Placeholder text
  - `gray-500` - Secondary text
  - `gray-600` - Body text, secondary headings
  - `gray-700` - Primary text
  - `gray-800` - Headings

#### Semantic Colors
- **Error Red:** `red-600` - Error messages, destructive actions
- **Success Green:** `green-600` - Success states, accept buttons
- **Warning Yellow:** Not currently used, reserved for future

### Typography
- **Headings:**
  - H1: `text-2xl font-bold` - Page titles, card headers
  - H2: `font-semibold` - Section headers
  - Body: Default (base) size
  - Small: `text-sm` - Metadata, captions
  - Extra Small: `text-xs` - Tags, timestamps

- **Font Weights:**
  - Bold: `font-bold` - Primary headings
  - Semibold: `font-semibold` - Secondary headings
  - Medium: `font-medium` - Emphasized text
  - Regular: Default (400) - Body text

### Spacing System
- **Page Container:** `p-4` (16px padding on all sides)
- **Max Width:** `max-w-md` (448px) for content containers
- **Section Spacing:** `mb-6` (24px) between major sections
- **Element Spacing:** `mb-4` (16px) between related elements
- **Small Spacing:** `mb-2` (8px) between tightly related elements
- **Gap for Flex/Grid:** `gap-2` (8px), `gap-3` (12px), `gap-4` (16px)

### Border Radius
- **Small:** `rounded` (4px) - Buttons, inputs
- **Medium:** `rounded-lg` (8px) - Cards, containers
- **Large:** `rounded-full` - Pills, tags, avatars

### Shadows
- **Small:** `shadow-sm` - Cards, elevated buttons
- **Medium:** `shadow-md` - Modal dialogs (if used)
- **Hover:** `hover:shadow-lg` - Interactive elements

---

## 🧩 Component Patterns

### Cards
```tsx
// Standard card pattern
<div className="bg-white p-4 rounded-lg border shadow-sm">
  <h2 className="font-semibold mb-2">Title</h2>
  <p className="text-sm text-gray-600">Content</p>
</div>
```

**Usage:**
- All content sections in MainApp use card pattern
- Consistent padding: `p-4`
- Border with subtle shadow for depth
- White background on pages

### Buttons

#### Primary Buttons
```tsx
<Button className="w-full">
  Submit
</Button>
```
- Use SDK `Button` component when possible
- Full width: `w-full` for mobile-friendliness
- Purple theme inherited from SDK defaults

#### Custom Primary Buttons
```tsx
<button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
  Action
</button>
```
- Purple background: `bg-purple-600`
- White text
- Padding: `py-2 px-4` (8px vertical, 16px horizontal)
- Hover state with color transition

#### Secondary Buttons
```tsx
<button className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors">
  Cancel
</button>
```
- Gray background
- Smaller padding for compact actions
- Smaller text size

#### Icon/Control Buttons
```tsx
<button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
  ← Back
</button>
```
- Minimal padding
- Circular hover effect
- For navigation, close buttons

### Input Fields

#### Standard Text Input
```tsx
<Input
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Placeholder text"
  className="w-full"
/>
```
- Use SDK `Input` component
- Full width
- Clear placeholder text

#### Custom Text Input
```tsx
<input
  type="text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Enter username"
  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
/>
```
- Padding: `p-3` for comfortable touch targets
- Border: `border border-gray-300`
- Focus ring: `focus:ring-2 focus:ring-purple-500`
- Remove border on focus: `focus:border-transparent`

### Form Layout
```tsx
<div className="mb-4">
  <label className="block text-sm font-medium mb-1">
    Label Text
  </label>
  <Input 
    value={value}
    onChange={handleChange}
    className="w-full"
  />
  {error && (
    <p className="text-sm text-red-600 mt-1">{error}</p>
  )}
</div>
```
- Label above input
- Error message below input in red
- Consistent spacing: `mb-4` between fields

### Tabs
```tsx
<div className="flex bg-gray-100 rounded-lg p-1">
  <button
    onClick={() => setTab('tab1')}
    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
      tab === 'tab1'
        ? 'bg-white text-purple-600 shadow-sm'
        : 'text-gray-600 hover:text-gray-800'
    }`}
  >
    Tab 1
  </button>
</div>
```
- Background: `bg-gray-100`
- Active state: White background, purple text
- Inactive state: Gray text
- Smooth transitions

### Tags/Pills
```tsx
// Selected tags
<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
  Tag Name
</span>

// Clickable tag buttons
<button
  onClick={toggleTag}
  className={`p-2 text-sm rounded-lg border transition-colors ${
    isSelected
      ? 'bg-blue-500 text-white border-blue-500'
      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
  }`}
>
  Tag
</button>
```

### Interest Bubbles (Custom Pattern)
```tsx
{/* Existing bubbles */}
<div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm border-2 border-blue-200">
  <span>Interest Name</span>
  <button onClick={remove} className="text-blue-600 hover:text-blue-800 ml-1 font-bold">
    ×
  </button>
</div>

{/* Add new bubble button */}
<button
  onClick={addNew}
  className="bg-gray-100 border-2 border-dashed border-gray-300 text-gray-500 px-3 py-2 rounded-full text-sm hover:bg-gray-200"
>
  + Add Interest
</button>
```
- Full rounded: `rounded-full`
- Blue theme for selected/added items
- Dashed border for "add new" state
- Remove button (×) on each bubble

### Grid Layouts
```tsx
// 2-column grid for style preferences
<div className="grid grid-cols-2 gap-2">
  {items.map(item => <Button key={item}>{item}</Button>)}
</div>

// 3-column grid for quick add buttons
<div className="grid grid-cols-3 gap-3">
  {items.map(item => <Button key={item}>{item}</Button>)}
</div>
```
- Use CSS Grid for responsive layouts
- Different columns for different content types
- Consistent gap spacing

---

## 🧭 Layout Patterns

### Page Structure
```tsx
<div className="p-4 max-w-md mx-auto">
  {/* Header */}
  <div className="text-center mb-6">
    <h1 className="text-2xl font-bold mb-2">Page Title</h1>
    <p className="text-gray-600">Subtitle</p>
  </div>

  {/* Content */}
  <div className="space-y-4">
    {/* Cards, sections, etc. */}
  </div>
</div>
```
- Page padding: `p-4`
- Max width: `max-w-md` with auto margins for centering
- Consistent header pattern
- Vertical stacking with spacing

### Back Navigation
```tsx
<div className="flex items-center mb-6">
  <button onClick={onBack} className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors">
    ← Back
  </button>
  <h1 className="text-2xl font-bold">Page Title</h1>
</div>
```
- Back button on the left
- Inline with page title
- Circular hover effect
- Proper spacing between elements

### Empty States
```tsx
<div className="bg-white p-4 rounded-lg border shadow-sm text-center">
  <p className="text-gray-600">No items yet</p>
</div>
```
- Card container
- Centered text
- Neutral gray color
- Descriptive message

---

## 🎭 Interactive States

### Hover States
```tsx
// Buttons
className="... hover:bg-purple-700 hover:shadow-lg"

// Links/Controls
className="... hover:bg-gray-100 hover:text-gray-800"

// Cards/Items
className="... hover:scale-105 hover:shadow-lg"

// All hovers include transition-colors or transition-all
```
- Always include transitions
- Use `transition-colors` for color changes
- Use `transition-all` for multiple property changes
- Subtle scale effects on interactive cards

### Active/Pressed States
```tsx
className="... active:scale-95"
```
- Slight scale down on press
- Gives tactile feedback

### Disabled States
```tsx
className="... disabled:bg-gray-300 disabled:cursor-not-allowed"
```
- Gray background
- Cursor change
- Reduced opacity is optional

### Loading States
```tsx
<Button disabled={isSubmitting}>
  {isSubmitting ? 'Creating...' : 'Create Profile'}
</Button>
```
- Disable button during loading
- Change button text
- Consider adding spinner (future enhancement)

### Error States
```tsx
<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
  {errorMessage}
</div>

<input 
  className="..."
  aria-invalid={!!error}
/>
<p className="text-sm text-red-600 mt-1">{error}</p>
```
- Red-themed container
- Light red background
- Red text
- Border for emphasis
- Error text below inputs in red

---

## ✨ Animation Guidelines

### Transitions
- **Duration:** Default (150-300ms) - no custom durations needed
- **Easing:** Default ease-in-out
- **Properties:** Always include transitions on interactive elements

### Transform Effects
```tsx
// Hover lift
className="... hover:scale-105"

// Press down
className="... active:scale-95"

// Float animation (when needed)
className="... animate-float"
```

### Custom Animations
- Only use for specific interactions (interest bubbles, confirmation states)
- Keep animations subtle and purposeful
- Consider accessibility (respect `prefers-reduced-motion`)

---

## 🎯 Accessibility

### Touch Targets
- **Minimum Size:** 44x44px for all interactive elements
- **Padding:** At least 8px padding on all touch targets
- **Spacing:** Adequate spacing between interactive elements

### Color Contrast
- Text must meet WCAG AA standards (4.5:1 for normal text)
- Current palette meets these standards
- Never rely solely on color to convey information

### Focus States
```tsx
className="... focus:ring-2 focus:ring-purple-500 focus:border-transparent"
```
- All interactive elements need visible focus indicators
- Purple ring on focus
- Remove default border to show ring clearly

### Screen Reader Support
```tsx
<button aria-label="Close dialog">×</button>
<input aria-invalid={!!error} />
```
- Use appropriate ARIA attributes
- Provide alternative text for icons
- Label all form inputs

---

## 📐 Spacing Reference

| Purpose | Class | Value |
|---------|-------|-------|
| Page padding | `p-4` | 16px |
| Section margin | `mb-6` | 24px |
| Element margin | `mb-4` | 16px |
| Small margin | `mb-2` | 8px |
| Gap small | `gap-2` | 8px |
| Gap medium | `gap-3` | 12px |
| Gap large | `gap-4` | 16px |
| Button padding | `py-2 px-4` | 8px/16px |
| Input padding | `p-3` | 12px |
| Icon padding | `p-2` | 8px |

---

## 🚫 Anti-Patterns to Avoid

1. **❌ Hover-only interactions** - Mobile has no hover, always provide tap targets
2. **❌ Desktop-specific layouts** - Never design for desktop
3. **❌ Small touch targets** - Never use anything smaller than 44x44px
4. **❌ Inline styles** - Always use Tailwind classes
5. **❌ Custom components** - Use SDK components first
6. **❌ localStorage/sessionStorage** - Use SDK `useSecureStorage`
7. **❌ External navigation** - No links to outside sites
8. **❌ Base64 images** - Use blob URLs or proper image URLs
9. **❌ Non-virtualized long lists** - Use SDK `<List>` for >50 items
10. **❌ Missing loading states** - Always show feedback during async operations

---

## 📝 Code Style Notes

### File Organization
- Pages: `src/pages/`
- Components: `src/components/`
- Hooks: `src/hooks/`
- Styles: `src/index.css` (imports only, all styles via Tailwind)

### Import Order
1. React imports
2. Shopify SDK imports
3. Third-party imports
4. Local imports (pages, components, hooks)
5. Styles

### Naming Conventions
- Components: PascalCase (`OnboardingPage.tsx`)
- Functions: camelCase (`handleSubmit`)
- Variables: camelCase (`username`)
- Constants: UPPER_SNAKE_CASE (`MAX_LENGTH`)
- Props interfaces: PascalCase + Props (`OnboardingPageProps`)

### Component Structure
```tsx
// 1. Imports
import ... from ...
import ... from ...

// 2. Types/Interfaces
interface Props {
  ...
}

// 3. Component
export function Component({ prop }: Props) {
  // State
  const [state, setState] = useState(...)
  
  // Hooks
  const { data } = useHook()
  
  // Handlers
  const handleAction = () => {...}
  
  // Computed values
  const computed = state.map(...)
  
  // Render
  return (
    <div>
      ...
    </div>
  )
}
```

---

## 🔄 State Management Patterns

### Local State
```tsx
const [value, setValue] = useState('')
const [items, setItems] = useState<string[]>([])
const [isLoading, setIsLoading] = useState(false)
```

### Derived State
```tsx
const isSelected = items.includes(item)
const hasErrors = Object.keys(errors).length > 0
```

### Async Operations
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  try {
    const result = await asyncOperation()
    // Handle success
  } catch (error) {
    // Handle error
  } finally {
    setIsLoading(false)
  }
}
```

---

## ✅ Quick Checklist

Before submitting code, ensure:
- [ ] All touch targets are at least 44x44px
- [ ] All buttons are full-width or properly sized
- [ ] Loading states are implemented
- [ ] Error states are handled
- [ ] No hover-only interactions
- [ ] Tailwind classes only (no inline styles)
- [ ] SDK components used where possible
- [ ] Consistent spacing throughout
- [ ] Colors match the design system
- [ ] Transitions on interactive elements
- [ ] Focus states visible
- [ ] Tested on mobile simulator/device

---

**Remember:** This is a mobile-first, SDK-first application. Every design decision should prioritize touch interfaces and leverage Shopify's Shop Minis React SDK to its fullest.
