import { useState } from 'react'
import { CardRank, CardSuit, SUIT_ICONS, SUIT_COLORS } from '../types/card'

interface PokerCardPreviewProps {
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string
  rank: CardRank
  suit: CardSuit
  stats?: {
    friends_count: number
    interests?: string[]
  }
}

export function PokerCardPreview({
  username,
  displayName: _displayName,
  avatarUrl,
  bio,
  rank,
  suit,
  stats
}: PokerCardPreviewProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const suitConfig = SUIT_COLORS[suit]
  const suitIcon = SUIT_ICONS[suit]

  return (
    <div className="perspective-1000 w-full max-w-xs mx-auto">
      <div
        className={`relative w-full aspect-[2.5/3.5] transition-transform duration-700 transform-style-preserve-3d cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsFlipped(!isFlipped)
          }
        }}
        aria-label="Flip card to see stats"
      >
        {/* Front Side */}
        <div
          className={`absolute inset-0 w-full h-full rounded-xl border-2 ${suitConfig.border} bg-gradient-to-br ${suitConfig.gradient} shadow-2xl backface-hidden p-6 flex flex-col poker-card-text`}
        >
          {/* Rank + Suit (Top Left) */}
          <div className="text-white text-3xl font-bold absolute top-4 left-4">
            {rank}
            <span className="ml-1">{suitIcon}</span>
          </div>

          {/* Center Avatar with Username and Bio */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-white/30 overflow-hidden bg-white/20 mb-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-3xl">
                  {username[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="font-bold text-lg text-white mb-2">@{username}</div>
            {bio && (
              <div className="text-white text-center text-xs line-clamp-2">
                {bio}
              </div>
            )}
          </div>

          {/* Rank + Suit (Bottom Right - Rotated) */}
          <div className="absolute bottom-4 right-4 text-white text-3xl font-bold transform rotate-180">
            {rank}
            <span className="ml-1">{suitIcon}</span>
          </div>
        </div>

        {/* Back Side */}
        <div
          className={`absolute inset-0 w-full h-full rounded-xl border-2 ${suitConfig.border} bg-gradient-to-br ${suitConfig.gradient} shadow-2xl backface-hidden rotate-y-180 p-4 flex flex-col text-white poker-card-text overflow-hidden`}
        >
          {/* Header */}
          <div className="text-center mb-4 flex-shrink-0">
            <div className="text-xl font-bold mb-1">Stats</div>
            <div className="text-xs opacity-75">Tap to flip back</div>
          </div>

          {/* Content - Scrollable */}
          {stats && (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              <div className="space-y-4">
                {/* Friends Count */}
                <div className="flex justify-between items-center px-2">
                  <span className="text-base font-semibold opacity-95">Friends</span>
                  <span className="font-bold text-2xl">{stats.friends_count}</span>
                </div>
                
                {/* Interests */}
                {stats.interests && stats.interests.length > 0 && (
                  <div className="flex-shrink-0">
                    <div className="text-base font-semibold mb-2 opacity-90 px-2">Interests</div>
                    <div className="flex flex-wrap gap-2 justify-center px-2 max-h-[140px] overflow-y-auto">
                      {stats.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 bg-white/25 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/30"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .poker-card-text {
          font-family: "Helvetica Neue", "Helvetica", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
          font-weight: 400;
        }
        .poker-card-text * {
          font-family: inherit;
        }
      `}</style>
    </div>
  )
}

