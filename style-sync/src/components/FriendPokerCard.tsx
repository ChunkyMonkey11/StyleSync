import { FriendCard } from '../types/card'
import { SUIT_ICONS, SUIT_COLORS } from '../types/card'

interface FriendPokerCardProps {
  card: FriendCard
  onClick: () => void
  isGrid?: boolean
}

export function FriendPokerCard({ card, onClick, isGrid = false }: FriendPokerCardProps) {
  const suitConfig = SUIT_COLORS[card.suit]
  const suitIcon = SUIT_ICONS[card.suit]
  const cornerSize = isGrid ? 'text-xl' : 'text-3xl'
  const cornerPosition = isGrid ? 'top-2 left-2' : 'top-6 left-6'
  const cornerPositionBottom = isGrid ? 'bottom-2 right-2' : 'bottom-6 right-6'

  return (
    <div className="perspective-1000 w-full max-w-xs mx-auto">
      <div
        className={`relative w-full aspect-[2.5/3.5] rounded-xl border-2 ${suitConfig.border} bg-gradient-to-br ${suitConfig.gradient} shadow-2xl p-6 flex flex-col poker-card-text cursor-pointer hover:scale-105 active:scale-100 transition-transform duration-200`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
        aria-label={`View ${card.username}'s profile`}
      >
        {/* Rank + Suit (Top Left) */}
        <div className={`text-white ${cornerSize} font-bold absolute ${cornerPosition}`}>
          {card.rank}
          <span className="ml-0.5">{suitIcon}</span>
        </div>

        {/* Center Avatar with Username and Display Name */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-white/30 overflow-hidden bg-white/20 mb-3">
            {card.avatarUrl ? (
              <img src={card.avatarUrl} alt={card.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-3xl">
                {card.username[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="font-bold text-lg text-white mb-1">@{card.username}</div>
          {card.displayName && card.displayName !== card.username && (
            <div className="text-white text-center text-sm opacity-90">
              {card.displayName}
            </div>
          )}
          {card.stats?.friendsCount !== undefined && (
            <div className="text-white text-xs mt-2 opacity-75">
              Following {card.stats.friendsCount}
            </div>
          )}
        </div>

        {/* Rank + Suit (Bottom Right - Rotated) */}
        <div className={`absolute ${cornerPositionBottom} text-white ${cornerSize} font-bold transform rotate-180`}>
          {card.rank}
          <span className="ml-0.5">{suitIcon}</span>
        </div>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
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

