/**
 * Card-related types and constants
 */

export type CardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'
export type CardSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs'

export const RANK_LABELS: Record<CardRank, string> = {
  '2': 'Rookie',
  '3': 'Rookie',
  '4': 'Rookie',
  '5': 'Rookie',
  '6': 'Rookie',
  '7': 'Regular',
  '8': 'Regular',
  '9': 'Regular',
  '10': 'Regular',
  'J': 'Connector',
  'Q': 'Trendsetter',
  'K': 'Influencer',
  'A': 'Tastemaker'
}

export const SUIT_LABELS: Record<CardSuit, string> = {
  spades: 'Edge',
  hearts: 'Everyday',
  diamonds: 'Premium',
  clubs: 'Archive'
}

export const SUIT_ICONS: Record<CardSuit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣'
}

export const SUIT_COLORS: Record<CardSuit, { gradient: string; border: string; bg: string }> = {
  spades: {
    gradient: 'from-gray-900 to-black',
    border: 'border-gray-800',
    bg: 'bg-gray-900/20'
  },
  hearts: {
    gradient: 'from-red-500 to-pink-500',
    border: 'border-red-400',
    bg: 'bg-red-500/20'
  },
  diamonds: {
    gradient: 'from-blue-500 to-cyan-500',
    border: 'border-blue-400',
    bg: 'bg-blue-500/20'
  },
  clubs: {
    gradient: 'from-green-600 to-emerald-600',
    border: 'border-green-500',
    bg: 'bg-green-600/20'
  }
}

// Rank thresholds for display
export const RANK_THRESHOLDS = {
  '2': { min: 0, max: 2 },
  '3': { min: 3, max: 5 },
  '4': { min: 6, max: 9 },
  '5': { min: 10, max: 14 },
  '6': { min: 15, max: 19 },
  '7': { min: 20, max: 29 },
  '8': { min: 30, max: 39 },
  '9': { min: 40, max: 49 },
  '10': { min: 50, max: 69 },
  'J': { min: 70, max: 99 },
  'Q': { min: 100, max: 149 },
  'K': { min: 150, max: 249 },
  'A': { min: 250, max: Infinity }
} as const


