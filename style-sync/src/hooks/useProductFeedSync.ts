import { useState, useEffect, useRef } from 'react'
import { 
  useProductLists, 
  useSavedProducts, 
  useOrders, 
  useRecentProducts,
  useFollowedShops,
  useRecommendedProducts
} from '@shopify/shop-minis-react'
import { useAuth } from './useAuth'

const INITIAL_PAGE_SIZE = 20
const PAGINATION_PAGE_SIZE = 20
const MAX_PRODUCTS_PER_SOURCE = 100
const MAX_LISTS = 60
const MAX_ORDERS = 60
const MAX_RECENT_PRODUCTS = 100
const MAX_RECOMMENDED_PRODUCTS = 100
const MAX_FOLLOWED_SHOPS = 120

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

interface UseProductFeedSyncReturn {
  isSyncing: boolean
  error: string | null
}

/**
 * Hook to sync user's Shopify product data to the backend
 * Aggregates data from multiple Shopify hooks and auto-saves to sync-product-feed endpoint
 * Inspired by previous Collector approach with auto-save and mock data filtering
 */
export function useProductFeedSync(): UseProductFeedSyncReturn {
  const { getValidToken } = useAuth()
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  // Helper function to filter out mock/free products (inspired by old Collector)
  const isValidProduct = (product: any): boolean => {
    if (!product?.id) {
      console.log('🚫 Product missing ID:', product)
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
      console.log('🚫 Filtering out free/mock product:', product.title || product.id, 'Price:', price, 'Price object:', product.price)
      return false
    }
    
    console.log('✅ Valid product:', product.title || product.id, 'Price:', price)
    return true
  }

  // Auto-save when data is available (useEffect approach like old Collector)
  useEffect(() => {
    const syncFeed = async () => {
      // Prevent syncing too frequently (max once per 30 seconds)
      const now = Date.now()
      if (hasSyncedRef.current && (now - lastSyncTimeRef.current) < 30000) {
        console.log('⏸️ Skipping sync - too soon since last sync')
        return
      }

      const paginationStates = [
        { name: 'productLists', state: productListsPagination },
        { name: 'savedProducts', state: savedProductsPagination },
        { name: 'orders', state: ordersPagination },
        { name: 'recentProducts', state: recentProductsPagination },
        { name: 'recommendedProducts', state: recommendedProductsPagination },
        { name: 'followedShops', state: followedShopsPagination }
      ]

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

      // Wait a bit to ensure hooks have settled (hooks might return null initially)
      await new Promise(resolve => setTimeout(resolve, 1000))

      try {
        setIsSyncing(true)
        setError(null)

        // Debug: Log what we're getting from hooks
        console.log('🔍 Hook Data Debug:', {
          savedProducts: savedProducts?.length ?? 'null',
          productLists: productLists?.length ?? 'null',
          orders: orders?.length ?? 'null',
          recentProducts: recentProducts?.length ?? 'null',
          recommendedProducts: recommendedProducts?.length ?? 'null',
          followedShops: followedShops?.length ?? 'null',
          savedProductsType: Array.isArray(savedProducts) ? 'array' : savedProducts === null ? 'null' : typeof savedProducts,
          savedProductsSample: savedProducts?.[0],
          recentProductsSample: recentProducts?.[0],
          recommendedProductsSample: recommendedProducts?.[0]
        })

        // Aggregate products from all sources (no source tracking - just collect all products)
        const aggregatedProducts: Array<{
          product: any
          source?: string
          attributes?: any
        }> = []
        const seenProductIds = new Set<string>()
        let newUniqueProductsAdded = 0
        let savedValidCount = 0
        let listsValidCount = 0
        let ordersValidCount = 0
        let recentValidCount = 0
        let recommendedValidCount = 0

        // 1. Products from saved products (handle null case)
        if (savedProducts && Array.isArray(savedProducts) && savedProducts.length > 0) {
          console.log('📦 Processing saved products:', savedProducts.length)
          const validSaved = savedProducts.filter(isValidProduct)
          savedValidCount = validSaved.length
          console.log('✅ Valid saved products after filter:', validSaved.length)
          validSaved.forEach(product => {
            if (!seenProductIds.has(product.id)) {
              seenProductIds.add(product.id)
              aggregatedProducts.push({
                product,
                source: 'shopify',
                attributes: { origin: { hook: 'useSavedProducts' } }
              })
              newUniqueProductsAdded += 1
            }
          })
        } else {
          console.log('⚠️ No saved products or empty array')
        }

        // 2. Products from product lists (handle null case)
        if (productLists && Array.isArray(productLists) && productLists.length > 0) {
          console.log('📦 Processing product lists:', productLists.length)
          productLists.forEach(list => {
            if (list.products && list.products.length > 0) {
              console.log(`  📋 List "${list.name}":`, list.products.length, 'products')
              const validListProducts = list.products.filter(isValidProduct)
              listsValidCount += validListProducts.length
              console.log(`  ✅ Valid products in list:`, validListProducts.length)
              validListProducts.forEach(product => {
                if (!seenProductIds.has(product.id)) {
                  seenProductIds.add(product.id)
                  aggregatedProducts.push({
                    product,
                    source: 'shopify',
                    attributes: { origin: { hook: 'useProductLists', listName: list.name } }
                  })
                  newUniqueProductsAdded += 1
                }
              })
            }
          })
        } else {
          console.log('⚠️ No product lists or empty array')
        }

        // 3. Products from orders (handle null case)
        if (orders && Array.isArray(orders) && orders.length > 0) {
          console.log('📦 Processing orders:', orders.length)
          orders.forEach(order => {
            if (order.lineItems && order.lineItems.length > 0) {
              order.lineItems.forEach(item => {
                if (item.product && isValidProduct(item.product)) {
                  ordersValidCount += 1
                  const product = item.product
                  if (!seenProductIds.has(product.id)) {
                    seenProductIds.add(product.id)
                    aggregatedProducts.push({
                      product,
                      source: 'shopify',
                      attributes: { origin: { hook: 'useOrders', orderId: (order as any)?.id ?? null } }
                    })
                    newUniqueProductsAdded += 1
                  }
                }
              })
            }
          })
        } else {
          console.log('⚠️ No orders or empty array')
        }

        // 4. Recent products (handle null case)
        if (recentProducts && Array.isArray(recentProducts) && recentProducts.length > 0) {
          console.log('📦 Processing recent products:', recentProducts.length)
          const validRecent = recentProducts.filter(isValidProduct)
          recentValidCount = validRecent.length
          console.log('✅ Valid recent products after filter:', validRecent.length)
          validRecent.forEach(product => {
            if (!seenProductIds.has(product.id)) {
              seenProductIds.add(product.id)
              aggregatedProducts.push({
                product,
                source: 'shopify',
                attributes: { origin: { hook: 'useRecentProducts' } }
              })
              newUniqueProductsAdded += 1
            }
          })
        } else {
          console.log('⚠️ No recent products or empty array')
        }

        // 5. Recommended products (handle null case)
        if (recommendedProducts && Array.isArray(recommendedProducts) && recommendedProducts.length > 0) {
          console.log('📦 Processing recommended products:', recommendedProducts.length)
          const validRecommended = recommendedProducts.filter(isValidProduct)
          recommendedValidCount = validRecommended.length
          console.log('✅ Valid recommended products after filter:', validRecommended.length)
          validRecommended.forEach(product => {
            if (!seenProductIds.has(product.id)) {
              seenProductIds.add(product.id)
              aggregatedProducts.push({
                product,
                source: 'shopify',
                attributes: { origin: { hook: 'useRecommendedProducts' } }
              })
              newUniqueProductsAdded += 1
            }
          })
        } else {
          console.log('⚠️ No recommended products or empty array')
        }

        // Skip if no products to sync
        if (aggregatedProducts.length === 0) {
          console.log('⚠️ No valid products to sync')
          return
        }

        console.log('📊 Collected products:', {
          saved: savedValidCount,
          lists: listsValidCount,
          orders: ordersValidCount,
          recent: recentValidCount,
          recommended: recommendedValidCount,
          uniqueSynced: newUniqueProductsAdded,
          total: aggregatedProducts.length
        })

        // Get token for API call
        const token = await getValidToken()
        console.log('🔑 Got token for sync, length:', token.length)
        console.log('🔑 Token preview (first 50 chars):', token.substring(0, 50))
        console.log('🔑 Token has 3 parts (JWT format)?', token.split('.').length === 3)
        console.log('🔑 Token parts lengths:', token.split('.').map(p => p.length))
        console.log('🔑 Full token (for debugging):', token)

        // Send to backend
        console.log('📤 Sending sync request with:', {
          productsCount: aggregatedProducts.length,
          shopsCount: followedShops?.length || 0
        })

        const response = await fetch(
          'https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/sync-product-feed',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              products: aggregatedProducts,
              followedShops: followedShops || []
            })
          }
        )

        console.log('📥 Sync response status:', response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Sync failed, response:', errorText)
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText || `Failed to sync feed: ${response.status}` }
          }
          throw new Error(errorData.error || `Failed to sync feed: ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ Feed synced successfully:', result)
        
        // Mark as synced and update timestamp
        hasSyncedRef.current = true
        lastSyncTimeRef.current = Date.now()

      } catch (err) {
        console.error('❌ Error syncing product feed:', err)
        setError(err instanceof Error ? err.message : 'Failed to sync product feed')
      } finally {
        setIsSyncing(false)
      }
    }

    // Auto-save when data changes (but only if we have some data or confirmed no data)
    const hasAnyData = (savedProducts && Array.isArray(savedProducts) && savedProducts.length > 0) ||
                       (productLists && Array.isArray(productLists) && productLists.length > 0) ||
                       (orders && Array.isArray(orders) && orders.length > 0) ||
                       (recentProducts && Array.isArray(recentProducts) && recentProducts.length > 0) ||
                       (recommendedProducts && Array.isArray(recommendedProducts) && recommendedProducts.length > 0) ||
                       (followedShops && Array.isArray(followedShops) && followedShops.length > 0)
    
    // Only sync if we have data, or if hooks have finished loading and returned null (confirmed no data)
    const allHooksFinished =
      productListsPagination.isComplete &&
      savedProductsPagination.isComplete &&
      ordersPagination.isComplete &&
      recentProductsPagination.isComplete &&
      recommendedProductsPagination.isComplete &&
      followedShopsPagination.isComplete
    
    if (hasAnyData || (allHooksFinished && !hasSyncedRef.current)) {
      syncFeed()
    } else {
      console.log('⏸️ Skipping sync - no data and hooks still loading or already synced')
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
    getValidToken,
    productListsPagination.isComplete,
    productListsPagination.isPaginating,
    savedProductsPagination.isComplete,
    savedProductsPagination.isPaginating,
    ordersPagination.isComplete,
    ordersPagination.isPaginating,
    recentProductsPagination.isComplete,
    recentProductsPagination.isPaginating,
    recommendedProductsPagination.isComplete,
    recommendedProductsPagination.isPaginating,
    followedShopsPagination.isComplete,
    followedShopsPagination.isPaginating
  ])

  return {
    isSyncing,
    error
  }
}

