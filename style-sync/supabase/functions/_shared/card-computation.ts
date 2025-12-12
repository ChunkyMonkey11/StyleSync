/**
 * Card Computation Utilities
 * Handles rank determination from friends count and suit assignment from interests
 */

export type CardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'
export type CardSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs'

// Rank thresholds based on friends count
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

// Suit interest mappings (based on final recommendations)
const SPADES_INTERESTS = [
  'Streetwear', 'Urban', 'Sneakers', 'Techwear'
]

const HEARTS_INTERESTS = [
  'Lifestyle', 'Athletic', 'Comfort', 'Everyday', 'Athleisure', 'Essentials'
]

const DIAMONDS_INTERESTS = [
  'Luxury', 'Formal', 'Jewelry', 'Accessories', 'Designer', 'Premium'
]

const CLUBS_INTERESTS = [
  'Vintage', 'Retro', 'Thrift', 'Sustainable'
]

/**
 * Determine rank from friends count
 */
export function getRankFromFriendsCount(friendsCount: number): CardRank {
  for (const [rank, range] of Object.entries(RANK_THRESHOLDS)) {
    if (friendsCount >= range.min && friendsCount <= range.max) {
      return rank as CardRank
    }
  }
  return '2' // Default fallback
}

/**
 * Determine suit from interests
 * Counts matching interests per suit and returns the suit with highest count
 * Defaults to 'hearts' if no matches
 */
export function getSuitFromInterests(interests: string[] = []): CardSuit {
  // Count matches for each suit (case-insensitive)
  const counts = {
    spades: interests.filter(i => 
      SPADES_INTERESTS.some(s => s.toLowerCase() === i.toLowerCase())
    ).length,
    hearts: interests.filter(i => 
      HEARTS_INTERESTS.some(s => s.toLowerCase() === i.toLowerCase())
    ).length,
    diamonds: interests.filter(i => 
      DIAMONDS_INTERESTS.some(s => s.toLowerCase() === i.toLowerCase())
    ).length,
    clubs: interests.filter(i => 
      CLUBS_INTERESTS.some(s => s.toLowerCase() === i.toLowerCase())
    ).length
  }

  // Find max count
  const maxCount = Math.max(counts.spades, counts.hearts, counts.diamonds, counts.clubs)

  // If no matches, default to hearts
  if (maxCount === 0) {
    return 'hearts'
  }

  // Return suit with highest count
  // Tie-breaking order: hearts > diamonds > spades > clubs
  if (counts.hearts === maxCount) return 'hearts'
  if (counts.diamonds === maxCount) return 'diamonds'
  if (counts.spades === maxCount) return 'spades'
  return 'clubs'
}

/**
 * Get rank progression info for UI
 */
export function getRankProgression(currentRank: CardRank): {
  currentRank: CardRank
  nextRank: CardRank | null
  friendsToNextRank: number
  rankRangeMin: number
  rankRangeMax: number
} {
  const currentRange = RANK_THRESHOLDS[currentRank]
  const ranks: CardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
  const currentIndex = ranks.indexOf(currentRank)
  const nextRank = currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : null

  return {
    currentRank,
    nextRank,
    friendsToNextRank: nextRank ? RANK_THRESHOLDS[nextRank].min - currentRange.min : 0,
    rankRangeMin: currentRange.min,
    rankRangeMax: currentRange.max === Infinity ? 999999 : currentRange.max
  }
}

