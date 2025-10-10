// User Profile Types
export interface UserProfile {
  user_id: string              // Hidden reference ID (UUID)
  username: string             // StyleSync @ username (unique)
  display_name: string         // From Shopify currentUser
  profile_pic: string          // Profile photo URL
  bio?: string                 // Optional bio
  created_at: string
  last_active?: string
}

// Auth Data stored in secure storage
export interface AuthData {
  userId: string               // Our generated UUID
  createdAt: string
}

