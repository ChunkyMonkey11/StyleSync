import { AuthData } from '../hooks/useAuth'

// Your Supabase project URL
const API_BASE = 'https://aedyzminlpeiyhhyuefc.supabase.co/functions/v1'

export class DatabaseApi {
  private authData: AuthData

  constructor(authData: AuthData) {
    this.authData = authData
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.authData.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  // User Profile Operations
  async getUserProfile(userId: string) {
    return this.makeRequest(`/user-profile?userId=${userId}`)
  }

  async createUserProfile(profileData: {
    user_id: string
    username: string
    display_name: string
    profile_pic?: string
    bio?: string
  }) {
    return this.makeRequest('/user-profile', {
      method: 'POST',
      body: JSON.stringify(profileData)
    })
  }

  async updateUserProfile(userId: string, updates: {
    username?: string
    display_name?: string
    profile_pic?: string
    bio?: string
  }) {
    return this.makeRequest(`/user-profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async checkUsernameAvailability(username: string) {
    return this.makeRequest(`/check-username?username=${username}`)
  }

  // Feed Operations
  async getUserFeed(userId: string) {
    return this.makeRequest(`/user-feed?userId=${userId}`)
  }

  async addToFeed(feedData: {
    user_id: string
    product_id: string
    product_data: any
    activity_type: string
  }) {
    return this.makeRequest('/user-feed', {
      method: 'POST',
      body: JSON.stringify(feedData)
    })
  }

  // Friends Operations
  async getFollowers(userId: string) {
    return this.makeRequest(`/followers?userId=${userId}`)
  }

  async getFollowing(userId: string) {
    return this.makeRequest(`/following?userId=${userId}`)
  }

  async followUser(targetUserId: string) {
    return this.makeRequest('/follow', {
      method: 'POST',
      body: JSON.stringify({ targetUserId })
    })
  }

  async unfollowUser(targetUserId: string) {
    return this.makeRequest('/unfollow', {
      method: 'POST',
      body: JSON.stringify({ targetUserId })
    })
  }

  // Shared Items Operations
  async getSharedItems(userId?: string) {
    const endpoint = userId ? `/shared-items?userId=${userId}` : '/shared-items'
    return this.makeRequest(endpoint)
  }

  async shareItem(shareData: {
    user_id: string
    product_id: string
    product_data: any
    share_message?: string
  }) {
    return this.makeRequest('/shared-items', {
      method: 'POST',
      body: JSON.stringify(shareData)
    })
  }

  async voteOnItem(itemId: string, voteType: 'like' | 'dislike') {
    return this.makeRequest(`/shared-items/${itemId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ voteType })
    })
  }

  // Get current user's public ID
  getPublicId(): string {
    return this.authData.publicId
  }
}
