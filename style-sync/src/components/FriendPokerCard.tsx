import { FriendCard } from '../types/card'
import { SUIT_ICONS, SUIT_COLORS } from '../types/card'

interface FriendPokerCardProps {
  card: FriendCard
  onClick: () => void
}

export function FriendPokerCard({ card, onClick }: FriendPokerCardProps) {
  const suitConfig = SUIT_COLORS[card.suit]
  const suitIcon = SUIT_ICONS[card.suit]

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
        <div className="text-white text-3xl font-bold absolute top-4 left-4">
          {card.rank}
          <span className="ml-1">{suitIcon}</span>
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
              {card.stats.friendsCount} friend{card.stats.friendsCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Rank + Suit (Bottom Right - Rotated) */}
        <div className="absolute bottom-4 right-4 text-white text-3xl font-bold transform rotate-180">
          {card.rank}
          <span className="ml-1">{suitIcon}</span>
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

