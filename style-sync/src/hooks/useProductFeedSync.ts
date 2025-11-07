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

  // Fetch data from all Shopify hooks (reduced first to 20 to avoid "too high" errors)
  const { productLists, loading: listsLoading, error: listsError } = useProductLists({ first: 20 })
  const { products: savedProducts, loading: savedLoading, error: savedError } = useSavedProducts({ first: 20 })
  const { orders, loading: ordersLoading, error: ordersError } = useOrders({ first: 20 })
  const { products: recentProducts, loading: recentLoading, error: recentError } = useRecentProducts({ first: 20 })
  const { shops: followedShops, loading: shopsLoading, error: shopsError } = useFollowedShops({ first: 20 })
  const { products: recommendedProducts, loading: recommendedLoading, error: recommendedError } = useRecommendedProducts({ first: 20 })

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

      // Check if any hooks are still loading
      if (listsLoading || savedLoading || ordersLoading || recentLoading || shopsLoading || recommendedLoading) {
        console.log('⏳ Still loading, waiting...')
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
        }> = []

        // 1. Products from saved products (handle null case)
        if (savedProducts && Array.isArray(savedProducts) && savedProducts.length > 0) {
          console.log('📦 Processing saved products:', savedProducts.length)
          const validSaved = savedProducts.filter(isValidProduct)
          console.log('✅ Valid saved products after filter:', validSaved.length)
          validSaved.forEach(product => {
            aggregatedProducts.push({
              product
            })
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
              console.log(`  ✅ Valid products in list:`, validListProducts.length)
              validListProducts.forEach(product => {
                aggregatedProducts.push({
                  product
                })
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
                  aggregatedProducts.push({
                    product: item.product
                  })
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
          console.log('✅ Valid recent products after filter:', validRecent.length)
          validRecent.forEach(product => {
            aggregatedProducts.push({
              product
            })
          })
        } else {
          console.log('⚠️ No recent products or empty array')
        }

        // 5. Recommended products (handle null case)
        if (recommendedProducts && Array.isArray(recommendedProducts) && recommendedProducts.length > 0) {
          console.log('📦 Processing recommended products:', recommendedProducts.length)
          const validRecommended = recommendedProducts.filter(isValidProduct)
          console.log('✅ Valid recommended products after filter:', validRecommended.length)
          validRecommended.forEach(product => {
            aggregatedProducts.push({
              product
            })
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
          saved: savedProducts?.filter(isValidProduct).length || 0,
          lists: productLists?.reduce((sum, list) => sum + (list.products?.filter(isValidProduct).length || 0), 0) || 0,
          orders: orders?.reduce((sum, order) => sum + (order.lineItems?.filter(item => item.product && isValidProduct(item.product)).length || 0), 0) || 0,
          recent: recentProducts?.filter(isValidProduct).length || 0,
          recommended: recommendedProducts?.filter(isValidProduct).length || 0,
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
    const allHooksFinished = !listsLoading && !savedLoading && !ordersLoading && !recentLoading && !shopsLoading && !recommendedLoading
    
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
    getValidToken
  ])

  return {
    isSyncing,
    error
  }
}

