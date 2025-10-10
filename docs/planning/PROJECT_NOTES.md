# StyleSync - Project Reference Document

**Last Updated:** October 10, 2025  
**Purpose:** Living document to maintain shared understanding and prevent miscommunication

---

## 🎯 Project Vision

### Overview
StyleSync is a social commerce platform within Shop Mini where users can connect with friends to share shopping experiences, discover products through their network, and build a community around style and shopping preferences.

### Tagline Concept
"Get Synced" - See where your friends are shopping, share your style, discover together.

---

## 📋 Product Phases

### Phase 1: Social Shopping Network (CURRENT FOCUS)
- User profiles with onboarding
- Friend connections via "Sync" mechanic (mutual approval)
- Personal curated feeds based on Shop SDK data
- Friends' activity feeds (browsing, saves, purchases)
- Profile visualization (creative concepts: mini islands like Animal Crossing, or customizable closets)

### Phase 2: Social Proof & Collaboration (FUTURE)
- Post specific products publicly
- Request opinions/feedback from synced friends
- Product discussion threads
- Community forums (Reddit-style) around products/styles

### Phase 3: Influencer Economy (FUTURE)
- Verified influencer accounts
- Public influencer shopping feeds visible to fans
- Followers can browse influencer activity on Shop
- Affiliate/partnership revenue model

---

## 🔧 Technical Decisions

### Tech Stack
- **Frontend:** React + TypeScript (Shop Mini SDK)
- **Backend:** Supabase (database + auth + edge functions)
- **Platform:** Shop Mini (Shopify ecosystem)
- **Build Preference:** Use Shop Mini SDK constraints where possible, custom logic when needed

### Data Refresh Model
- **Pull-to-refresh** pattern (not real-time)
- User manually refreshes to see updates

### Shop SDK Integration
- Using `useBuyerAttributes()` hook for user metadata
- Using `useCurrentUser()` for user info
- Using `useRecentProducts()` for browsing history (20 items)
- Using `useSavedProducts()` for favorites (13 items)

---

## 👥 User Profile Structure

### Core Fields
```
User:
  - username: String (unique) - How people search for friends
  - syncId: UUID - Internal tracking ID for all users (future: admin dashboard)
  - bio: String - User bio/description
  - pfp: Image - Profile picture
  - metadata: Object - Additional info from Shop SDK (buyerAttributes, currentUser data)
  - interests: Array<String> - User-selected interests (displayed as bubble tags like LinkedIn skills)
```

### Data Collection Points
**Onboarding captures:**
- 20 Recent Products (browsing history)
- 13 Saved Products (favorites/wishlist)
- 3+ Interests (user-tagged)
- Buyer Attributes from Shop SDK
- Current User info from Shop SDK

---

## 🤝 "Sync" Mechanics

### Connection Model
- **Type:** Mutual approval required (not one-way following)
- **Visibility:** When synced, users can access each other's profile/feed
- **Levels:** Single tier (no close friends vs casual follows) - not for now
- **Discovery:** Search by username

### Feed Access
- Each user has a profile that synced friends can "click into"
- Creative visualization ideas:
  - Mini islands (Animal Crossing style)
  - Customizable closets representing personal feed
  - Profile pages showing their curated feed

---

## 📱 Feed Content Strategy

### What Appears in a User's Feed
✅ **Recent Browsing** - Curated using Shop SDK hooks + onboarding data  
✅ **Saved/Favorited Items** - Products they've saved  
✅ **Actual Purchases** - Shopping history  
✅ **Posts/Reviews** - User-generated content (Phase 2)

### Feed Algorithm Considerations
- Use onboarding data to personalize
- Show friend activity
- Potentially rank by relevance (TBD)

---

## 🔒 Privacy & Permissions

### Current Approach (Phase 1)
- ❌ No granular privacy controls (users can't hide specific items)
- ❌ No shop/category hiding
- ❌ No private browsing mode
- **Note:** All synced friends see full feed

### Future Considerations
- May add privacy controls in later phases
- Question to clarify: "Private browsing mode" meaning?

---

## 📊 Current Project State

### ✅ Completed
- Onboarding form UI built (`OnboardingForm.tsx`)
- Username selection component (`UsernameSelection.tsx`)
- Understanding of Shop SDK hooks and data structure
- Supabase setup (connection established)

### 🚧 In Progress
- **NEXT STEP:** Design database schema for user profiles
- **NEXT STEP:** Connect onboarding to Supabase storage
- **NEXT STEP:** Finalize what metadata to store from Shop SDK

### ❌ Not Started
- Invite/Sync functionality
- Feed system implementation
- Friend discovery/search
- Profile visualization
- Activity tracking

---

## 🗄️ Database Planning

### Tables Needed (Initial thoughts - TBD)
1. **users** - Core user profile data
2. **connections** - Sync relationships between users
3. **user_metadata** - Shop SDK data (interests, browsing history, etc.)
4. **activity_feed** - User actions (saves, purchases, posts)
5. TBD based on schema design session

### Data from Shop SDK to Store
- Recent products array (20 items)
- Saved products array (13+ items)
- Buyer attributes object
- Current user object
- **Question:** Do we store full product objects or just product IDs + timestamps?

---

## 🎨 UX/UI Notes

### Onboarding Form Requirements
- Username input (with uniqueness validation)
- Bio textarea
- Profile picture upload
- **Interest tags:** LinkedIn-style bubble/chip interface
  - Users can add multiple interests
  - Displayed as removable tags/bubbles
  - Visual: rounded pills with X to remove

### Profile Visualization Ideas
- Animal Crossing style islands
- Customizable closet metaphor
- Traditional social feed layout
- **Decision pending:** Which direction to take

---

## 💡 Open Questions

1. **Metadata Storage:** Full product objects vs just IDs + timestamps?
2. **Private Browsing:** What did you mean by this feature?
3. **Shop API Integration:** Do we need additional Shop APIs beyond SDK hooks?
4. **Activity Tracking:** How/when do we capture user actions (saves, views, purchases)?
5. **Feed Algorithm:** Simple chronological or weighted/ranked?
6. **Profile Customization:** How deep do we go with personalization?

---

## 📝 Key Insights from Data Analysis

### User Behavior Patterns (from hook-return-data.txt)
- Users have mixed browsing (men's + women's clothing, fragrances, accessories)
- Saved products show clear preferences (fragrances, quality basics)
- Price sensitivity evident (responds to discounts/sales)
- Values social proof (products with high review counts)
- Shops across multiple brands and price points

### Feed Algorithm Considerations
- Prioritize categories user has saved (not just browsed)
- Include social proof metrics (review counts)
- Show deals/sales prominently
- Mix price points
- Consider brand affinity

---

## 🚀 Immediate Next Steps

### Priority 1: Database Schema Design
- Define user table structure
- Plan metadata storage approach
- Design connections/sync table
- Create migration files

### Priority 2: Onboarding → Database
- Connect form submission to Supabase
- Store user profile data
- Store Shop SDK metadata
- Handle username uniqueness validation

### Priority 3: User Profile Foundation
- Create user profile view
- Display stored data
- Test data retrieval

---

## 📌 Important Decisions Log

### Decision 1: Mutual Sync Model
**Date:** Oct 10, 2025  
**Decision:** Sync requires mutual approval (not one-way follow)  
**Rationale:** Creates more intimate, intentional connections; better for Phase 1 MVP

### Decision 2: Pull-to-Refresh Pattern
**Date:** Oct 10, 2025  
**Decision:** Use pull-to-refresh instead of real-time updates  
**Rationale:** Simpler implementation for MVP; less infrastructure complexity

### Decision 3: No Privacy Controls (Phase 1)
**Date:** Oct 10, 2025  
**Decision:** All synced friends see full feed activity  
**Rationale:** Simplifies MVP; can add granular controls in future phases

---

## 🎯 Success Metrics (TBD)

*To be defined as we build*

- User onboarding completion rate
- Sync/connection rate between users
- Feed engagement metrics
- Product click-through rates
- Time spent in app

---

**Note:** This document will be updated as we make progress and reach new conclusions. Any significant decision should be logged here.

