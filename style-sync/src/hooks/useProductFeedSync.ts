import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  useProductLists, 
  useSavedProducts, 
  useOrders, 
  useRecentProducts,
  useFollowedShops,
  useRecommendedProducts
} from '@shopify/shop-minis-react'
import { apiRequestJson } from '../utils/apiClient'

const INITIAL_PAGE_SIZE = 20
const PAGINATION_PAGE_SIZE = 20
const MAX_PRODUCTS_PER_SOURCE = 300
const MAX_LISTS = 180
const MAX_ORDERS = 180
const MAX_RECENT_PRODUCTS = 300
const MAX_RECOMMENDED_PRODUCTS = 300
const MAX_FOLLOWED_SHOPS = 360

interface PageInfoLike {
  hasNextPage?: boolean
  endCursor?: string | null
}

type LoadMoreFn = ((variables?: { first?: number; after?: string | null }) => Promise<any>) | undefined

const getPageInfo = (result: any): PageInfoLike | undefined =>
  result?.pageInfo ??
  result?.page_info ??
  result?.pagination ??
  result?.paginationInfo ??
  result?.pageDetails

const getLoadMoreFn = (result: any): LoadMoreFn =>
  result?.loadMore ??
  result?.fetchMore ??
  result?.fetchNextPage ??
  result?.loadNext ??
  result?.next ??
  result?.nextPage

function useAutoPagination<T>({
  sourceName,
  items,
  loading,
  pageInfo,
  loadMore,
  maxItems,
  pageSize
}: {
  sourceName: string
  items: T[] | null | undefined
  loading: boolean
  pageInfo?: PageInfoLike
  loadMore?: LoadMoreFn
  maxItems: number
  pageSize: number
}) {
  const [isInFlight, setIsInFlight] = useState(false)
  const lastCursorRef = useRef<string | null>(null)

  useEffect(() => {
    if (loading || isInFlight) {
      return
    }

    if (typeof loadMore !== 'function') {
      return
    }

    const currentCount = Array.isArray(items) ? items.length : 0
    if (currentCount >= maxItems) {
      return
    }

    if (!pageInfo?.hasNextPage) {
      return
    }

    const cursor = pageInfo?.endCursor ?? null
    if (lastCursorRef.current === cursor) {
      return
    }

    let isMounted = true
    setIsInFlight(true)
    lastCursorRef.current = cursor

    loadMore({
      after: cursor ?? undefined,
      first: Math.min(pageSize, maxItems - currentCount)
    })
      .catch(error => {
        console.error(`Error auto-paginating ${sourceName}:`, error)
      })
      .finally(() => {
        if (isMounted) {
          setIsInFlight(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [
    items,
    loading,
    pageInfo?.hasNextPage,
    pageInfo?.endCursor,
    loadMore,
    maxItems,
    pageSize,
    sourceName,
    isInFlight
  ])

  const totalCount = Array.isArray(items) ? items.length : 0
  const fullyLoaded =
    totalCount >= maxItems ||
    !pageInfo?.hasNextPage ||
    typeof loadMore !== 'function'

  return {
    isLoading: loading,
    isPaginating: isInFlight,
    isComplete: fullyLoaded && !loading && !isInFlight
  }
}

// Helper function to filter out mock/free products (inspired by old Collector)
const isValidProduct = (product: any): boolean => {
  if (!product?.id) {
        return false
      }
      
      // Filter out products with $0.00 price (mock data)
      // Check multiple possible price locations
      const price = product.price?.amount || 
                    product.selectedVariant?.price?.amount || 
                    product.variants?.[0]?.price?.amount ||
                    '0.00'
      
      const priceNum = parseFloat(price)
      const isFree = price === '0.00' || price === '0' || isNaN(priceNum) || priceNum === 0
      
      if (isFree) {
        return false
      }
  return true
}

interface UseProductFeedSyncReturn {
  isSyncing: boolean
  error: string | null
  lastSyncTime: number | null
  syncCount: number
}

/**
 * Hook to sync user's Shopify product data to the backend
 * Aggregates data from multiple Shopify hooks and auto-saves to sync-product-feed endpoint
 * 
 * Features:
 * - Syncs once every time StyleSync app opens
 * - Continuously accumulates products through pagination
 * - Fetches and upserts products and shops to keep feed fresh
 * - Tracks last sync time and sync count for debugging
 */

export function useProductFeedSync(): UseProductFeedSyncReturn {
  // Note: getValidToken no longer needed - apiClient handles token automatically
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncCount, setSyncCount] = useState(0)
  const hasSyncedRef = useRef(false)
  const lastSyncTimeRef = useRef<number>(0)

  // Fetch data from all Shopify hooks (auto-paginated below)
  const productListsResult = useProductLists({ first: INITIAL_PAGE_SIZE })
  const { productLists, loading: listsLoading, error: listsError } = productListsResult
  const productListsPageInfo = getPageInfo(productListsResult)
  const loadMoreProductLists = getLoadMoreFn(productListsResult)

  const savedProductsResult = useSavedProducts({ first: INITIAL_PAGE_SIZE })
  const { products: savedProducts, loading: savedLoading, error: savedError } = savedProductsResult
  const savedProductsPageInfo = getPageInfo(savedProductsResult)
  const loadMoreSavedProducts = getLoadMoreFn(savedProductsResult)

  const ordersResult = useOrders({ first: INITIAL_PAGE_SIZE })
  const { orders, loading: ordersLoading, error: ordersError } = ordersResult
  const ordersPageInfo = getPageInfo(ordersResult)
  const loadMoreOrders = getLoadMoreFn(ordersResult)

  const recentProductsResult = useRecentProducts({ first: INITIAL_PAGE_SIZE })
  const { products: recentProducts, loading: recentLoading, error: recentError } = recentProductsResult
  const recentProductsPageInfo = getPageInfo(recentProductsResult)
  const loadMoreRecentProducts = getLoadMoreFn(recentProductsResult)

  const followedShopsResult = useFollowedShops({ first: INITIAL_PAGE_SIZE })
  const { shops: followedShops, loading: shopsLoading, error: shopsError } = followedShopsResult
  const followedShopsPageInfo = getPageInfo(followedShopsResult)
  const loadMoreFollowedShops = getLoadMoreFn(followedShopsResult)

  const recommendedProductsResult = useRecommendedProducts({ first: INITIAL_PAGE_SIZE })
  const { products: recommendedProducts, loading: recommendedLoading, error: recommendedError } = recommendedProductsResult
  const recommendedProductsPageInfo = getPageInfo(recommendedProductsResult)
  const loadMoreRecommendedProducts = getLoadMoreFn(recommendedProductsResult)

  const productListsPagination = useAutoPagination({
    sourceName: 'productLists',
    items: productLists,
    loading: listsLoading,
    pageInfo: productListsPageInfo,
    loadMore: loadMoreProductLists,
    maxItems: MAX_LISTS,
    pageSize: PAGINATION_PAGE_SIZE
  })

  const savedProductsPagination = useAutoPagination({
    sourceName: 'savedProducts',
    items: savedProducts,
    loading: savedLoading,
    pageInfo: savedProductsPageInfo,
    loadMore: loadMoreSavedProducts,
    maxItems: MAX_PRODUCTS_PER_SOURCE,
    pageSize: PAGINATION_PAGE_SIZE
  })

  const ordersPagination = useAutoPagination({
    sourceName: 'orders',
    items: orders,
    loading: ordersLoading,
    pageInfo: ordersPageInfo,
    loadMore: loadMoreOrders,
    maxItems: MAX_ORDERS,
    pageSize: PAGINATION_PAGE_SIZE
  })

  const recentProductsPagination = useAutoPagination({
    sourceName: 'recentProducts',
    items: recentProducts,
    loading: recentLoading,
    pageInfo: recentProductsPageInfo,
    loadMore: loadMoreRecentProducts,
    maxItems: MAX_RECENT_PRODUCTS,
    pageSize: PAGINATION_PAGE_SIZE
  })

  const recommendedProductsPagination = useAutoPagination({
    sourceName: 'recommendedProducts',
    items: recommendedProducts,
    loading: recommendedLoading,
    pageInfo: recommendedProductsPageInfo,
    loadMore: loadMoreRecommendedProducts,
    maxItems: MAX_RECOMMENDED_PRODUCTS,
    pageSize: PAGINATION_PAGE_SIZE
  })

  const followedShopsPagination = useAutoPagination({
    sourceName: 'followedShops',
    items: followedShops,
    loading: shopsLoading,
    pageInfo: followedShopsPageInfo,
    loadMore: loadMoreFollowedShops,
    maxItems: MAX_FOLLOWED_SHOPS,
    pageSize: PAGINATION_PAGE_SIZE
  })

  // Reset sync state on mount to allow syncing every time app opens
  useEffect(() => {
    // Reset sync state when hook mounts (happens every time StyleSync opens)
    // This ensures we sync fresh data every time the user opens the app
    lastSyncTimeRef.current = 0
    hasSyncedRef.current = false
    setSyncCount(0)
    console.log('🔄 Reset sync state - will sync on app open')
  }, [])

  // Sync function - fetches products and shops, then upserts to backend
  const performSync = useCallback(async () => {
      const paginationStates = [
        { name: 'productLists', state: productListsPagination },
        { name: 'savedProducts', state: savedProductsPagination },
        { name: 'orders', state: ordersPagination },
        { name: 'recentProducts', state: recentProductsPagination },
        { name: 'recommendedProducts', state: recommendedProductsPagination },
        { name: 'followedShops', state: followedShopsPagination }
      ]

    // Wait for full pagination to complete before syncing
      const isStillLoading = paginationStates.some(
        ({ state }) => state.isLoading || state.isPaginating
      )

      if (isStillLoading) {
        console.log('⏳ Still loading/paginating, waiting...')
        return
      }

      const allPaginationComplete = paginationStates.every(({ state }) => state.isComplete)
      if (!allPaginationComplete) {
        console.log('⏳ Waiting for pagination to complete...')
        return
      }

      // Check for hook errors (but don't block on recommendedProducts error if scope is missing)
      const criticalErrors = listsError || savedError || ordersError || recentError || shopsError
      if (criticalErrors) {
        console.error('Hook errors detected:', {
          listsError,
          savedError,
          ordersError,
          recentError,
          shopsError,
          recommendedError
        })
        // Only set error for critical failures, recommendedProducts is optional
        setError('Some data sources failed to load')
        return
      }

    // Wait a bit to ensure hooks have settled
      await new Promise(resolve => setTimeout(resolve, 1000))

      try {
        setIsSyncing(true)
        setError(null)


        // Aggregate products from all sources (no source tracking - just collect all products)
        const aggregatedProducts: Array<{
          product: any
          source?: string
          attributes?: any
        }> = []
        const seenProductIds = new Set<string>()

        // 1. Products from saved products (handle null case)
        if (savedProducts && Array.isArray(savedProducts) && savedProducts.length > 0) {
          const validSaved = savedProducts.filter(isValidProduct)
          validSaved.forEach(product => {
            if (!seenProductIds.has(product.id)) {
              seenProductIds.add(product.id)
              aggregatedProducts.push({
                product,
                source: 'shopify',
                attributes: { origin: { hook: 'useSavedProducts' } }
              })
            }
          })
        }

        // 2. Products from product lists (handle null case)
        if (productLists && Array.isArray(productLists) && productLists.length > 0) {
          productLists.forEach(list => {
            if (list.products && list.products.length > 0) {
              const validListProducts = list.products.filter(isValidProduct)
              validListProducts.forEach(product => {
                if (!seenProductIds.has(product.id)) {
                  seenProductIds.add(product.id)
                  aggregatedProducts.push({
                    product,
                    source: 'shopify',
                    attributes: { origin: { hook: 'useProductLists', listName: list.name } }
                  })
                }
              })
            }
          })
        }

        // 3. Products from orders (handle null case)
        if (orders && Array.isArray(orders) && orders.length > 0) {
          orders.forEach(order => {
            if (order.lineItems && order.lineItems.length > 0) {
              order.lineItems.forEach(item => {
                if (item.product && isValidProduct(item.product)) {
                  const product = item.product
                  if (!seenProductIds.has(product.id)) {
                    seenProductIds.add(product.id)
                    aggregatedProducts.push({
                      product,
                      source: 'shopify',
                      attributes: { origin: { hook: 'useOrders', orderId: (order as any)?.id ?? null } }
                    })
                  }
                }
              })
            }
          })
        }

        // 4. Recent products (handle null case)
        if (recentProducts && Array.isArray(recentProducts) && recentProducts.length > 0) {
          const validRecent = recentProducts.filter(isValidProduct)
          validRecent.forEach(product => {
            if (!seenProductIds.has(product.id)) {
              seenProductIds.add(product.id)
              aggregatedProducts.push({
                product,
                source: 'shopify',
                attributes: { origin: { hook: 'useRecentProducts' } }
              })
            }
          })
        }

        // 5. Recommended products (handle null case)
        if (recommendedProducts && Array.isArray(recommendedProducts) && recommendedProducts.length > 0) {
          const validRecommended = recommendedProducts.filter(isValidProduct)
          validRecommended.forEach(product => {
            if (!seenProductIds.has(product.id)) {
              seenProductIds.add(product.id)
              aggregatedProducts.push({
                product,
                source: 'shopify',
                attributes: { origin: { hook: 'useRecommendedProducts' } }
              })
            }
          })
      }

      // Continue to sync even if no products - we still want to sync shops
      // This ensures we always update the feed, even if only shops changed

        // Send to backend using API client
        await apiRequestJson('sync-product-feed', {
          method: 'POST',
          body: JSON.stringify({
            products: aggregatedProducts,
            followedShops: followedShops || []
          })
        })
      const syncTimestamp = Date.now()
      console.log(`✅ Feed synced successfully at ${new Date(syncTimestamp).toISOString()}: ${aggregatedProducts.length} products, ${followedShops?.length || 0} shops`)
        
      // Always mark as synced and update timestamp, even if no products
      // This ensures we track that a sync attempt was made
        hasSyncedRef.current = true
      lastSyncTimeRef.current = syncTimestamp
      setSyncCount(prev => prev + 1)

      } catch (err) {
        console.error('❌ Error syncing product feed:', err)
        setError(err instanceof Error ? err.message : 'Failed to sync product feed')
      } finally {
        setIsSyncing(false)
    }
  }, [
    productLists,
    savedProducts,
    orders,
    recentProducts,
    recommendedProducts,
    followedShops,
    listsLoading,
    savedLoading,
    ordersLoading,
    recentLoading,
    shopsLoading,
    recommendedLoading,
    listsError,
    savedError,
    ordersError,
    recentError,
    shopsError,
    recommendedError,
    productListsPagination.isComplete,
    productListsPagination.isPaginating,
    productListsPagination.isLoading,
    savedProductsPagination.isComplete,
    savedProductsPagination.isPaginating,
    savedProductsPagination.isLoading,
    ordersPagination.isComplete,
    ordersPagination.isPaginating,
    ordersPagination.isLoading,
    recentProductsPagination.isComplete,
    recentProductsPagination.isPaginating,
    recentProductsPagination.isLoading,
    recommendedProductsPagination.isComplete,
    recommendedProductsPagination.isPaginating,
    recommendedProductsPagination.isLoading,
    followedShopsPagination.isComplete,
    followedShopsPagination.isPaginating,
    followedShopsPagination.isLoading
  ])

  // Sync on app open: Always sync when hooks finish paginating
  // This ensures we sync every time StyleSync opens, even if no new products
  useEffect(() => {
    // Don't sync if already syncing or already synced in this session
    if (isSyncing || hasSyncedRef.current) {
      return
    }

    // Check if all hooks have finished paginating - this ensures we get all available data
    const allHooksFinished =
      productListsPagination.isComplete &&
      savedProductsPagination.isComplete &&
      ordersPagination.isComplete &&
      recentProductsPagination.isComplete &&
      recommendedProductsPagination.isComplete &&
      followedShopsPagination.isComplete
    
    // ALWAYS sync when all hooks have finished paginating - ensures sync every time StyleSync opens
    // This will sync products (if any) and shops (if any), keeping the feed fresh
    if (allHooksFinished) {
      console.log('🚀 Triggering sync on app open (all hooks finished paginating)...')
      performSync()
    }
  }, [
    productLists,
    savedProducts,
    orders,
    recentProducts,
    recommendedProducts,
    followedShops,
    isSyncing,
    performSync,
    productListsPagination.isComplete,
    savedProductsPagination.isComplete,
    ordersPagination.isComplete,
    recentProductsPagination.isComplete,
    recommendedProductsPagination.isComplete,
    followedShopsPagination.isComplete
  ])

  return {
    isSyncing,
    error,
    lastSyncTime: lastSyncTimeRef.current || null,
    syncCount
  }
}

