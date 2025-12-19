import { useState, useRef, useEffect } from 'react'
import { FriendCard } from '../../types/card'
import { useFriendFeed } from '../../hooks/useFriendFeed'
import { PokerCardPreview } from '../../components/PokerCardPreview'

interface FriendFeedPageProps {
  friendCard: FriendCard
  onBack: () => void
}

interface FriendProfileData {
  bio: string
  interests: string[]
}

export function FriendFeedPage({ friendCard, onBack }: FriendFeedPageProps) {
  // Use the userId (which is actually shop_public_id from backend) for the feed
  const { products, followedShops, isLoading, error, hasMore, fetchMore } = useFriendFeed(friendCard.userId)
  const [friendProfile, setFriendProfile] = useState<FriendProfileData | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Use bio and interests from friendCard prop
  useEffect(() => {
    setFriendProfile({
      bio: friendCard.bio || '',
      interests: friendCard.interests || []
    })
  }, [friendCard.bio, friendCard.interests])

  // Infinite scroll setup
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoading) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchMore()
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      if (observerRef.current && loadMoreRef.current) {
        observerRef.current.unobserve(loadMoreRef.current)
      }
    }
  }, [hasMore, isLoading, fetchMore])

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

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
            @{friendCard.username}
          </h1>
        </div>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      <div className="space-y-6 pb-8">
        {/* Friend's Poker Card - Smaller at top */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[200px]">
            <PokerCardPreview
              username={friendCard.username}
              displayName={friendCard.displayName || friendCard.username}
              avatarUrl={friendCard.avatarUrl || null}
              bio={friendProfile?.bio || ''}
              rank={friendCard.rank}
              suit={friendCard.suit}
              stats={{
                friends_count: friendCard.stats?.friendsCount || 0,
                interests: friendProfile?.interests || []
              }}
            />
          </div>
        </div>

        {/* Followed Shops */}
        {followedShops.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
              Shops They Follow
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {followedShops.map((shop) => (
                <a
                  key={shop.id}
                  href={shop.followed_shop_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-colors"
                >
                  {shop.followed_shop_logo && (
                    <div className="w-full aspect-square mb-3 bg-white/5 rounded-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={shop.followed_shop_logo}
                        alt={shop.followed_shop_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h3 className="text-white font-semibold text-sm line-clamp-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {shop.followed_shop_name}
                  </h3>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && products.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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
        {error && products.length === 0 && (
          <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-xl p-4 text-center">
            <p className="text-red-100 mb-3">{error}</p>
          </div>
        )}

        {/* Products Feed - Grid format */}
        {products.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
              Products
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <a
                  key={product.id}
                  href={product.product_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden hover:bg-white/15 transition-colors block"
                >
                  {product.product_image && (
                    <div className="aspect-square w-full bg-white/5">
                      <img
                        src={product.product_image}
                        alt={product.product_title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {product.product_title}
                    </h3>
                    {product.product_price && (
                      <p className="text-white/80 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {product.product_currency} {product.product_price}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && products.length === 0 && !error && (
          <div className="text-center py-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)] p-8">
            <div className="text-5xl mb-4">🛍️</div>
            <p className="text-lg font-semibold text-white mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
              No products yet
            </p>
            <p className="text-sm text-white/70" style={{ fontFamily: "'Inter', sans-serif" }}>
              {friendCard.username} hasn't shared any products yet.
            </p>
          </div>
        )}

        {/* Load More Trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
            {isLoading && (
              <div className="text-white/50 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                Loading more...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

