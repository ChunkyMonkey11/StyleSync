/**
 * Friends API Client
 * Handles friend cards fetching and following/followers
 */

import { apiRequestJson } from '../apiClient'
import { FriendCard } from '../../types/card'

interface GetFriendsCardsResponse {
  cards: FriendCard[]
}

export interface FollowingUser {
  id: string
  user_id: string
  shop_public_id: string
  user_profile: {
    username: string
    display_name: string
    profile_pic: string
    shop_public_id: string
  }
  followed_at: string
}

export interface FollowerUser {
  id: string
  user_id: string
  shop_public_id: string
  user_profile: {
    username: string
    display_name: string
    profile_pic: string
    shop_public_id: string
  }
  followed_at: string
}

interface GetFollowingResponse {
  following: FollowingUser[]
}

interface GetFollowersResponse {
  followers: FollowerUser[]
}

/**
 * Get friend cards with their poker card profiles
 */
export async function getFriendsCards(): Promise<FriendCard[]> {
  const response = await apiRequestJson<GetFriendsCardsResponse>('get-friends-cards', {
    method: 'GET'
  })
  return response.cards
}

/**
 * Get list of people the current user is following
 */
export async function getFollowing(): Promise<FollowingUser[]> {
  const response = await apiRequestJson<GetFollowingResponse>('get-following', {
    method: 'GET'
  })
  return response.following
}

/**
 * Get list of people following the current user
 */
export async function getFollowers(): Promise<FollowerUser[]> {
  const response = await apiRequestJson<GetFollowersResponse>('get-followers', {
    method: 'GET'
  })
  return response.followers
}

