import { useState, useEffect } from 'react'
import { FriendCard } from '../../types/card'
import { getFriendsCards } from '../../utils/api/friends'
import { FriendPokerCard } from '../../components/FriendPokerCard'

interface FeedPageProps {
  onBack: () => void
  onFriendClick?: (friendCard: FriendCard) => void
}

type ViewMode = 'grid' | 'list'

export function FeedPage({ onBack, onFriendClick }: FeedPageProps) {
  const [cards, setCards] = useState<FriendCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo({ top: 0, behavior: 'instant' })
    fetchFriendCards()
  }, [])

  const fetchFriendCards = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const friendCards = await getFriendsCards()
      setCards(friendCards)
    } catch (err) {
      console.error('Error fetching friend cards:', err)
      setError(err instanceof Error ? err.message : 'Failed to load friend cards')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter cards by search query
  const filteredCards = cards.filter(card => {
    const query = searchQuery.toLowerCase()
    return (
      card.username.toLowerCase().includes(query) ||
      (card.displayName?.toLowerCase().includes(query) ?? false)
    )
  })

  // Handle card click - navigate to friend feed
  const handleCardClick = (card: FriendCard) => {
    if (onFriendClick) {
      onFriendClick(card)
    } else {
      console.log('Navigate to friend profile:', card.userId)
    }
  }

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto" style={{ paddingTop: 'max(env(safe-area-inset-top, 1rem), 1rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-4">
        <button
          onClick={onBack}
          className="px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          ← Back
        </button>
        <div className="flex-1 text-center">
          <h1
            className="text-2xl font-bold text-white"
            style={{
              fontFamily: "'Inter', sans-serif",
              textShadow: '0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.15)'
            }}
          >
            Feeds
          </h1>
        </div>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          style={{ fontFamily: "'Inter', sans-serif" }}
        />
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white'
            }`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white'
            }`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            List
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 shadow-lg animate-pulse"
            >
              <div className="h-48 bg-white/20 rounded mb-2"></div>
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-xl p-4 text-center">
          <p className="text-red-100 mb-3">{error}</p>
          <button
            onClick={fetchFriendCards}
            className="bg-white text-red-600 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredCards.length === 0 && (
        <div className="text-center py-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)] p-8">
          <div className="text-5xl mb-4">🃏</div>
          <p className="text-lg font-semibold text-white mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
            {searchQuery ? 'No friends found' : 'No friends yet'}
          </p>
          <p className="text-sm text-white/70" style={{ fontFamily: "'Inter', sans-serif" }}>
            {searchQuery
              ? 'Try a different search term'
              : "Add friends to deal your deck."}
          </p>
        </div>
      )}

      {/* Cards Grid/List */}
      {!isLoading && !error && filteredCards.length > 0 && (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 gap-4 pb-8'
              : 'space-y-4 pb-8'
          }
          style={{ marginTop: 0 }}
        >
          {filteredCards.map((card, index) => (
            <div
              key={card.userId}
              className={viewMode === 'grid' ? '' : 'flex justify-center'}
              style={{
                animation: `slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards`,
                animationDelay: `${index * 0.05}s`
              }}
            >
              {viewMode === 'grid' ? (
                <div className="w-full">
                  <FriendPokerCard card={card} onClick={() => handleCardClick(card)} isGrid={true} />
                </div>
              ) : (
                <div className="w-full max-w-xs">
                  <FriendPokerCard card={card} onClick={() => handleCardClick(card)} isGrid={false} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
