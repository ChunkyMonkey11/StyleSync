/**
 * Card API Client
 * Handles card profile fetching
 */

import { apiRequestJson } from '../apiClient'

export type CardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'
export type CardSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs'

export interface RankProgression {
  currentRank: CardRank
  nextRank: CardRank | null
  friendsToNextRank: number
  rankRangeMin: number
  rankRangeMax: number
  current_friends_in_range: number
}

export interface CardProfileResponse {
  rank: CardRank
  suit: CardSuit
  friends_count: number
  username: string
  display_name: string
  avatar_url: string
  bio: string
  interests: string[]
  next_rank_progress: RankProgression
}

/**
 * Get user's card profile
 */
export async function getCardProfile(): Promise<CardProfileResponse> {
  return apiRequestJson<CardProfileResponse>('get-card-profile', {
    method: 'GET'
  })
}

