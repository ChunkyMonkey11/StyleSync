import { useState, useEffect } from 'react'
import { Image, Button, useCurrentUser, ProductCard, useShopNavigation } from '@shopify/shop-minis-react'
import { useFriendRequests } from '../../hooks/useFriendRequests'
import { useFriendFeed } from '../../hooks/useFriendFeed'
import { useProductFeedSync } from '../../hooks/useProductFeedSync'
import { useAuth } from '../../hooks/useAuth'

interface UserProfile {
  shop_public_id: string
  username: string
  display_name: string
  profile_pic: string | null
}

interface FeedPageProps {
  onBack: () => void
}

// Product type for ProductCard (from Shopify Shop Minis)
// Note: Using a simplified version that matches what ProductCard expects
interface Product {
  id: string
  title: string
  price: {
    amount: string
    currencyCode: string
  }
  featuredImage?: {
    url: string
    altText: string
    sensitive: boolean
  } | null
  shop: {
    id: string
    name: string
  }
  defaultVariantId: string
  isFavorited: boolean
  reviewAnalytics: {
    averageRating?: number | null
    reviewCount?: number | null
  }
}

export function FeedPage({ onBack }: FeedPageProps) {
  const { currentUser } = useCurrentUser()
  const { getValidToken } = useAuth()
  const { navigateToShop } = useShopNavigation()
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null)
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null)
  const { friends, isLoading: friendsLoading, refreshData } = useFriendRequests()
  const { 
    products, 
    followedShops, 
    isLoading: feedLoading, 
    error: feedError,
    hasMore,
    fetchMore
  } = useFriendFeed(selectedFriendId)
  const { isSyncing, error: syncError } = useProductFeedSync()

  // Fetch current user's profile to get shop_public_id
  const fetchMyProfile = async () => {
    try {
      const token = await getValidToken()
      const response = await fetch(
        'https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/check-profile',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const result = await response.json()
        if (result.hasProfile && result.profile) {
          setMyProfile({
            shop_public_id: result.profile.shop_public_id,
            username: result.profile.username,
            display_name: result.profile.display_name,
            profile_pic: result.profile.profile_pic
          })
        }
      }
    } catch (error) {
      console.error('Error fetching my profile:', error)
    }
  }

  // Load friends and user profile on mount
  useEffect(() => {
    refreshData()
    fetchMyProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshData])

  // Note: Feed sync now happens automatically via useProductFeedSync useEffect

  /**
   * Transform FeedProduct from database to Product format for ProductCard
   */
  const transformFeedProductToProduct = (feedProduct: any, shopInfo?: { id: string; name: string }): Product => {
    // Extract shop info from followedShops if available, or use defaults
    const shop = shopInfo || {
      id: feedProduct.product_id, // Fallback to product_id if no shop info
      name: 'Shop'
    }

    // Create featuredImage from product_image
    const featuredImage = feedProduct.product_image
      ? {
          url: feedProduct.product_image,
          altText: feedProduct.product_title || 'Product image',
          sensitive: false
        }
      : null

    return {
      id: feedProduct.product_id,
      title: feedProduct.product_title,
      price: {
        amount: feedProduct.product_price || '0.00',
        currencyCode: feedProduct.product_currency || 'USD'
      },
      featuredImage,
      shop,
      defaultVariantId: feedProduct.product_id, // Use product_id as variant ID
      isFavorited: false, // Can be enhanced later to check saved products
      reviewAnalytics: {
        // Can be enhanced later if we store review data
        averageRating: null,
        reviewCount: null
      }
    }
  }

  /**
   * Handle favorite toggle for ProductCard
   * Note: ProductCard only passes isFavorited boolean, not productId
   */
  const handleFavoriteToggled = (isFavorited: boolean) => {
    console.log('Favorite toggled:', isFavorited)
    // TODO: Sync favorite state to backend if needed
    // For now, this is UI-only as ProductCard handles the visual state
    // Note: We'd need to track which product was favorited separately if needed
  }

  /**
   * Handle shop card click - navigate to shop in Shop app
   */
  const handleShopClick = (shopId: string) => {
    if (shopId) {
      navigateToShop({ shopId })
    }
  }

  const handleFriendClick = (friendShopPublicId: string) => {
    setSelectedFriendId(friendShopPublicId)
  }

  const handleMyFeedClick = () => {
    if (myProfile) {
      setSelectedFriendId(myProfile.shop_public_id)
    }
  }

  const handleBackToFriends = () => {
    setSelectedFriendId(null)
  }

  // If a friend (or self) is selected, show their feed
  if (selectedFriendId) {
    // Determine whose feed we're viewing
    const isMyFeed = myProfile && selectedFriendId === myProfile.shop_public_id
    const selectedFriend = friends.find(f => f.shop_public_id === selectedFriendId)
    const displayName = isMyFeed 
      ? myProfile.username 
      : selectedFriend 
        ? selectedFriend.friend_profile.username 
        : 'User'
    
    return (
      <div className="min-h-screen ">
        <div className="p-4 max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6 pt-2">
            <button 
              onClick={handleBackToFriends}
              className="mr-3 px-4 py-2.5 rounded-2xl backdrop-blur-xl bg-white/20 border border-white/30 shadow-lg hover:bg-white/30 active:scale-95 transition-all duration-200 text-white font-medium"
              style={{
                boxShadow: '0 8px 32px 0 rgba(255, 255, 255, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
              }}
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-white">@{displayName}</h1>
          </div>

        {/* Error Display */}
        {feedError && (
          <div className="mb-4 p-3 bg-red-500/20 backdrop-blur-sm border border-red-300/30 rounded-lg text-red-100 text-sm">
            {feedError}
          </div>
        )}

        {/* Loading State */}
        {feedLoading && products.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 shadow-lg animate-pulse">
                <div className="h-48 bg-white/20 rounded mb-2"></div>
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-3 bg-white/20 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Followed Shops Section */}
        {followedShops.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-white">Shops Followed</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {followedShops.map(shop => (
                <button
                  key={shop.id}
                  onClick={() => handleShopClick(shop.followed_shop_id)}
                  className="flex-shrink-0 backdrop-blur-xl bg-white/20 border border-white/30 shadow-lg p-3 rounded-xl min-w-[120px] hover:bg-white/30 active:scale-95 transition-all duration-200 cursor-pointer"
                  style={{
                    boxShadow: '0 8px 32px 0 rgba(255, 255, 255, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {shop.followed_shop_logo ? (
                    <Image 
                      src={shop.followed_shop_logo} 
                      alt={shop.followed_shop_name}
                      className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full mx-auto mb-2 bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                      <span className="text-white/80 text-xs">Shop</span>
                    </div>
                  )}
                  <p className="text-xs text-center font-medium truncate text-white">{shop.followed_shop_name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid - Scrollable */}
        {products.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-4">
              {products.map(product => {
                // Find shop info for this product if available
                // For now, we'll use a default shop since we don't have shop info per product
                const shopInfo = followedShops.length > 0 
                  ? { id: followedShops[0].followed_shop_id, name: followedShops[0].followed_shop_name }
                  : undefined
                
                const productData = transformFeedProductToProduct(product, shopInfo)
                
                return (
                  <div key={product.id} className="w-full">
                    <ProductCard
                      product={productData as any}
                      onFavoriteToggled={handleFavoriteToggled}
                      variant="compact"
                    />
                    {/* Origin badge */}
                    <div className="mt-1">
                      <span className="text-[10px] text-white/60">
                        {(product.attributes as any)?.origin?.hook
                          ? String((product.attributes as any).origin.hook).replace(/^use/, '')
                          : 'Shopify'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-6">
                <Button 
                  onClick={fetchMore}
                  disabled={feedLoading}
                  className="w-full"
                >
                  {feedLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        ) : !feedLoading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold mb-2 text-white">No products yet</h2>
            <p className="text-white/80">This friend hasn't synced their feed yet.</p>
          </div>
        )}
        </div>
      </div>
    )
  }

  // Default view: Friends list
  return (
    <div className="p-4 max-w-md mx-auto">
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
        
        .feed-card {
          animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
        
        .feed-card:nth-child(1) { animation-delay: 0.05s; }
        .feed-card:nth-child(2) { animation-delay: 0.1s; }
        .feed-card:nth-child(3) { animation-delay: 0.15s; }
        .feed-card:nth-child(4) { animation-delay: 0.2s; }
        .feed-card:nth-child(5) { animation-delay: 0.25s; }
        .feed-card:nth-child(6) { animation-delay: 0.3s; }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-6">
        <div className="flex items-center">
          <button 
            onClick={onBack}
            className="mr-4 px-5 py-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg hover:bg-white/20 active:scale-95 transition-all duration-200 text-white font-medium"
            style={{
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Feeds</h1>
        </div>
        {syncError && (
          <span className="text-xs text-red-200 bg-red-500/20 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-red-500/30 font-medium">Sync failed</span>
        )}
      </div>

      {/* Sync Status */}
      {isSyncing && (
        <div className="mb-4 p-4 backdrop-blur-xl bg-blue-500/20 border border-blue-400/30 rounded-2xl text-blue-100 text-sm shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="font-medium">Syncing your feed...</span>
          </div>
        </div>
      )}

      {/* Friends List */}
      {friendsLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-lg p-5 animate-pulse">
              <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-3"></div>
              <div className="h-4 bg-white/20 rounded mb-2 w-20 mx-auto"></div>
              <div className="h-3 bg-white/20 rounded w-16 mx-auto"></div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {/* My Feed Card - Always show at top */}
          {myProfile && (
            <div className="mb-6">
              <p className="text-lg font-bold text-white mb-4 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Your Feed</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleMyFeedClick}
                  className="feed-card flex flex-col items-center p-5 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 ease-out"
                  style={{
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {myProfile.profile_pic ? (
                    <div className="w-20 h-20 rounded-full overflow-hidden shadow-xl mb-3">
                      <Image 
                        src={myProfile.profile_pic} 
                        alt={myProfile.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : currentUser?.avatarImage?.url ? (
                    <div className="w-20 h-20 rounded-full overflow-hidden shadow-xl mb-3">
                      <Image 
                        src={currentUser.avatarImage.url} 
                        alt={myProfile.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center shadow-xl mb-3">
                      <span className="text-white text-2xl font-bold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                        {myProfile.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <p className="text-base font-semibold text-white tracking-tight text-center truncate w-full" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>@{myProfile.username}</p>
                  <p className="text-sm font-normal text-white/70 text-center truncate w-full mt-0.5" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>{myProfile.display_name}</p>
                </button>
              </div>
            </div>
          )}

          {/* Friends Section */}
          {friends.length > 0 ? (
            <>
              <p className="text-lg font-bold text-white mb-4 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Friends</p>
              <div className="grid grid-cols-2 gap-4">
                {friends.map((friend, index) => (
                  <button
                    key={friend.id}
                    onClick={() => handleFriendClick(friend.shop_public_id)}
                    className={`feed-card flex flex-col items-center p-5 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 ease-out`}
                    style={{
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
                      animationDelay: `${0.2 + index * 0.05}s`
                    }}
                  >
                    {friend.friend_profile.profile_pic ? (
                      <div className="w-20 h-20 rounded-full overflow-hidden shadow-xl mb-3">
                        <Image 
                          src={friend.friend_profile.profile_pic} 
                          alt={friend.friend_profile.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center shadow-xl mb-3">
                        <span className="text-white text-2xl font-bold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                          {friend.friend_profile.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <p className="text-base font-semibold text-white tracking-tight text-center truncate w-full" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>@{friend.friend_profile.username}</p>
                    <p className="text-sm font-normal text-white/70 text-center truncate w-full mt-0.5" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>{friend.friend_profile.display_name}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-lg p-8">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-lg font-semibold text-white mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>No friends yet</p>
              <p className="text-sm text-white/70" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Add friends to see their style feeds!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
