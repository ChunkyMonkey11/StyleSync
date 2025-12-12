import { useState, useEffect } from 'react'
import { getCardProfile, type CardProfileResponse } from '../../utils/api/card'
import { PokerCardPreview } from '../../components/PokerCardPreview'
import { SuitCard } from '../../components/SuitCard'
import { CardRank, CardSuit, RANK_LABELS, SUIT_ICONS, RANK_THRESHOLDS } from '../../types/card'
import { apiRequestJson } from '../../utils/apiClient'

interface DeckGuidePageProps {
  onBack: () => void
}

interface UserProfile {
  id: string
  shop_public_id: string
  username: string
  display_name: string
  profile_pic: string
  bio: string
  interests: string[]
  created_at: string
  updated_at: string
}

const RANKS: CardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
const SUITS: CardSuit[] = ['spades', 'hearts', 'diamonds', 'clubs']

export function DeckGuidePage({ onBack }: DeckGuidePageProps) {
  const [cardProfile, setCardProfile] = useState<CardProfileResponse | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBreakdown, setShowBreakdown] = useState(false)

  useEffect(() => {
    fetchCardProfile()
  }, [])

  const fetchCardProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch card profile
      const cardData = await getCardProfile()
      setCardProfile(cardData)
      
      // Also fetch regular profile for interests (as fallback)
      const result = await apiRequestJson<{ hasProfile?: boolean; profile?: any }>('check-profile', {
        method: 'GET'
      })
      if (result.hasProfile && result.profile) {
        setUserProfile(result.profile)
      }
    } catch (err) {
      console.error('Error fetching card profile:', err)
      // Extract more detailed error message
      let errorMessage = 'Failed to load card profile'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message)
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 max-w-md mx-auto">
        <div className="flex items-center mb-6 pt-4">
          <button
            onClick={onBack}
            className="mr-3 px-4 py-2.5 rounded-2xl backdrop-blur-xl bg-white/20 border border-white/30 shadow-lg hover:bg-white/30 active:scale-95 transition-all duration-200 text-white font-medium"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">Deck Guide</h1>
        </div>
        <div className="text-center text-white/80">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 max-w-md mx-auto">
        <div className="flex items-center mb-6 pt-4">
          <button
            onClick={onBack}
            className="mr-3 px-4 py-2.5 rounded-2xl backdrop-blur-xl bg-white/20 border border-white/30 shadow-lg hover:bg-white/30 active:scale-95 transition-all duration-200 text-white font-medium"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">Deck Guide</h1>
        </div>
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center">
          <p className="text-white mb-3">{error || 'Load failed'}</p>
          <button
            onClick={fetchCardProfile}
            className="bg-white text-purple-600 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const currentRank = cardProfile?.rank || '2'
  const currentSuit = cardProfile?.suit || 'hearts'
  const progression = cardProfile?.next_rank_progress

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center mb-6 pt-4">
        <button
          onClick={onBack}
          className="mr-3 px-4 py-2.5 rounded-2xl backdrop-blur-xl bg-white/20 border border-white/30 shadow-lg hover:bg-white/30 active:scale-95 transition-all duration-200 text-white font-medium"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-white">Deck Guide</h1>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">The StyleSync Deck</h2>
        <p className="text-white/80 mb-6">Your style. Your circle. Your rank.</p>

        {/* Current Card Preview */}
        {cardProfile && (
          <div className="mb-6">
            <PokerCardPreview
              username={cardProfile.username}
              displayName={cardProfile.display_name}
              avatarUrl={cardProfile.avatar_url}
              bio={cardProfile.bio}
              rank={cardProfile.rank}
              suit={cardProfile.suit}
              stats={{
                friends_count: cardProfile.friends_count,
                interests: cardProfile.interests || userProfile?.interests || []
              }}
            />
          </div>
        )}

        {/* Current Tier Chip */}
        {cardProfile && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <span className="text-white font-semibold">
              Current Tier: {cardProfile.rank}{SUIT_ICONS[cardProfile.suit]}
            </span>
          </div>
        )}
      </div>

      {/* Ranks Section */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Ranks</h3>
        <div className="space-y-2">
          {RANKS.map((rank) => {
            const range = RANK_THRESHOLDS[rank]
            const isCurrent = rank === currentRank
            return (
              <div
                key={rank}
                className={`p-4 rounded-lg border-2 ${
                  isCurrent
                    ? 'bg-purple-500/20 border-purple-400'
                    : 'bg-white/10 border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-white">{rank}</span>
                      <span className="text-white font-semibold">{RANK_LABELS[rank]}</span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded">You</span>
                      )}
                    </div>
                    <p className="text-white/70 text-sm mt-1">
                      {range.min} - {range.max === Infinity ? '∞' : range.max} friends
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Suits Section */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-2 text-center">Suits</h3>
        <p className="text-white text-sm mb-4 text-center opacity-90">
          Tap any suit card to learn more about it
        </p>
        <div className="grid grid-cols-2 gap-4">
          {SUITS.map((suit) => {
            const isCurrent = suit === currentSuit
            return (
              <SuitCard
                key={suit}
                suit={suit}
                isCurrent={isCurrent}
              />
            )
          })}
        </div>
      </div>

      {/* How to Level Up */}
      {progression && progression.nextRank && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">How to Level Up</h3>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-white/80 mb-2">
                <span>Progress to {progression.nextRank}</span>
                <span>
                  {progression.current_friends_in_range} / {progression.friendsToNextRank} friends
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (progression.current_friends_in_range / progression.friendsToNextRank) * 100)}%`
                  }}
                />
              </div>
            </div>
            <div className="space-y-2 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Add friends to climb ranks</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      {cardProfile && (
        <div className="mb-8">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full text-left p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white font-semibold flex items-center justify-between"
          >
            <span>How it's calculated</span>
            <span>{showBreakdown ? '−' : '+'}</span>
          </button>
          {showBreakdown && (
            <div className="mt-2 p-4 bg-white/5 rounded-lg border border-white/10 text-white text-sm space-y-2">
              <div className="flex justify-between">
                <span>Friends Count</span>
                <span className="font-bold">{cardProfile.friends_count}</span>
              </div>
              <div className="text-white/70 text-xs mt-2">
                Rank is determined by your total number of accepted friends.
              </div>
              <div className="flex justify-between font-bold mt-2 pt-2 border-t border-white/20">
                <span>Current Rank</span>
                <span>{cardProfile.rank} - {RANK_LABELS[cardProfile.rank]}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

