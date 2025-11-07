import { useState, useCallback, useEffect } from 'react'
import { useAuth } from './useAuth'

interface FeedProduct {
  id: string
  product_id: string
  product_title: string
  product_image: string | null
  product_url: string | null
  product_price: string
  product_currency: string
  created_at: string
}

interface FeedShop {
  id: string
  followed_shop_id: string
  followed_shop_name: string
  followed_shop_logo: string | null
  followed_shop_url: string
  created_at: string
}

interface UseFriendFeedReturn {
  products: FeedProduct[]
  followedShops: FeedShop[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  page: number
  fetchMore: () => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Hook to fetch a friend's product feed
 */
export function useFriendFeed(friendShopPublicId: string | null): UseFriendFeedReturn {
  const { getValidToken } = useAuth()
  const [products, setProducts] = useState<FeedProduct[]>([])
  const [followedShops, setFollowedShops] = useState<FeedShop[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)

  const fetchFeed = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!friendShopPublicId) {
      setError('No friend selected')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const token = await getValidToken()

      const response = await fetch(
        `https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/get-friend-feed?friend_shop_public_id=${encodeURIComponent(friendShopPublicId)}&page=${pageNum}&limit=20`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch feed: ${response.status}`)
      }

      const data = await response.json()

      if (append) {
        setProducts(prev => [...prev, ...(data.products || [])])
      } else {
        setProducts(data.products || [])
        setFollowedShops(data.followed_shops || [])
      }

      setHasMore(data.has_more || false)
      setPage(pageNum)

    } catch (err) {
      console.error('Error fetching friend feed:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch feed')
    } finally {
      setIsLoading(false)
    }
  }, [friendShopPublicId, getValidToken])

  const fetchMore = useCallback(async () => {
    if (!hasMore || isLoading) return
    await fetchFeed(page + 1, true)
  }, [hasMore, isLoading, page, fetchFeed])

  const refetch = useCallback(async () => {
    setPage(1)
    await fetchFeed(1, false)
  }, [fetchFeed])

  // Fetch initial data when friend changes
  useEffect(() => {
    if (friendShopPublicId) {
      setPage(1)
      fetchFeed(1, false)
    } else {
      setProducts([])
      setFollowedShops([])
    }
  }, [friendShopPublicId, fetchFeed])

  return {
    products,
    followedShops,
    isLoading,
    error,
    hasMore,
    page,
    fetchMore,
    refetch
  }
}

