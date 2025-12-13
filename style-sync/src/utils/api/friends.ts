/**
 * Friends API Client
 * Handles friend cards fetching
 */

import { apiRequestJson } from '../apiClient'
import { FriendCard } from '../../types/card'

interface GetFriendsCardsResponse {
  cards: FriendCard[]
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

