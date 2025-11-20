  import { useState, useEffect, useMemo } from 'react'
import { useProductSearch } from '@shopify/shop-minis-react'
import { useAuth } from './useAuth'

interface UserProfile {
  shop_public_id: string
  username: string
  display_name: string
  profile_pic?: string
  bio?: string
  interests?: string[]
  style_preferences?: string[]
  gender?: 'MALE' | 'FEMALE' | 'NEUTRAL'
}

interface ProductActivity {
  id: string
  product_id: string
  product_title: string
  product_image?: string
  product_url?: string
  product_price: string
  product_currency: string
  created_at: string
}

interface SearchIntent {
  name: string
  query: string
  filters?: any // Using any for now to avoid type conflicts - will refine later
  sortBy?: string
  priority: number
}

const toIntRating = (value: number): number => {
  if (Number.isNaN(value)) {
    return 0
  }
  return Math.max(0, Math.min(5, Math.round(value)))
}

interface UsePersonalizedSearchReturn {
  products: any[] | null
  isLoading: boolean
  error: string | null
  currentIntent: SearchIntent | null
  refresh: () => void
}

/**
 * Hook that generates personalized product searches based on user profile and activity
 */
export function usePersonalizedSearch(): UsePersonalizedSearchReturn {
  const { getValidToken } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [productActivity, setProductActivity] = useState<ProductActivity[]>([])
  const [currentIntentIndex, setCurrentIntentIndex] = useState(0)
  const [isProfileLoading, setIsProfileLoading] = useState(true)

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getValidToken()
        const response = await fetch(
          'https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/check-profile',
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.hasProfile) {
            setUserProfile(data.profile)
          }
        }
      } catch (error) {
        console.error('Error fetching profile for personalization:', error)
      } finally {
        setIsProfileLoading(false)
      }
    }

    fetchProfile()
  }, [getValidToken])

  // Fetch recent product activity for signal extraction
  useEffect(() => {
    if (!userProfile?.shop_public_id) {
      return
    }

    const fetchActivity = async () => {
      try {
        const token = await getValidToken()
        // Prefer dedicated self-feed endpoint with fallback
        let response = await fetch(
          `https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/get-user-feed?page=1&limit=50`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (!response.ok) {
          response = await fetch(
            `https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/get-friend-feed?friend_shop_public_id=${encodeURIComponent(
              userProfile.shop_public_id
            )}&page=1&limit=50`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
        }

        if (response.ok) {
          const data = await response.json()
          setProductActivity(data.products || [])
        }
      } catch (error) {
        console.error('Error fetching activity for personalization:', error)
      }
    }

    fetchActivity()
  }, [userProfile?.shop_public_id, getValidToken])

  // Generate search intents based on user signals
  const searchIntents = useMemo((): SearchIntent[] => {
    if (!userProfile) {
      return []
    }

    const intents: SearchIntent[] = []

    // Extract signals from profile
    const { interests = [], style_preferences = [] } = userProfile

    // Extract signals from product activity
    const prices = productActivity.map(p => parseFloat(p.product_price) || 0).filter(p => p > 0)
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 50
    const minPrice = Math.max(0, avgPrice - 75)
    const maxPrice = avgPrice + 100

    // Analyze product titles for brand and category patterns
    const brands: { [key: string]: number } = {}
    const categories: { [key: string]: number } = {}

    productActivity.forEach(product => {
      const title = product.product_title.toLowerCase()

      // Extract potential brands (common brand names)
      const brandPatterns = ['nike', 'adidas', 'zara', 'hm', 'uniqlo', 'levi', 'gap', 'supreme', 'stussy', 'bape']
      brandPatterns.forEach(brand => {
        if (title.includes(brand)) {
          brands[brand] = (brands[brand] || 0) + 1
        }
      })

      // Extract categories
      const categoryPatterns = [
        { pattern: /\b(shoe|boot|sneaker|heel)\b/, category: 'footwear' },
        { pattern: /\b(shirt|t-shirt|top|blouse)\b/, category: 'tops' },
        { pattern: /\b(pant|jean|trouser|legging)\b/, category: 'bottoms' },
        { pattern: /\b(jacket|coat|hoodie|sweater)\b/, category: 'outerwear' },
        { pattern: /\b(bag|backpack|purse)\b/, category: 'accessories' },
        { pattern: /\b(hat|cap|beanie)\b/, category: 'headwear' }
      ]

      categoryPatterns.forEach(({ pattern, category }) => {
        if (pattern.test(title)) {
          categories[category] = (categories[category] || 0) + 1
        }
      })
    })

    const topBrands = Object.entries(brands)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([brand]) => brand)

    const topCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([category]) => category)

    // Style-based intents with price tiers
    style_preferences.forEach(style => {
      const styleLower = style.toLowerCase()

      if (styleLower === 'casual') {
        intents.push({
          name: 'casual_essentials',
          query: 'casual basics',
          filters: {
            price: { min: minPrice, max: Math.min(maxPrice, 150) },
            available: true,
            minimumRating: toIntRating(3.8)
          },
          priority: 1
        })

        // Add brand-specific casual if we have brand data
        if (topBrands.length > 0) {
          intents.push({
            name: `casual_${topBrands[0]}`,
            query: `${topBrands[0]} casual`,
            filters: {
              price: { min: minPrice, max: Math.min(maxPrice, 200) },
              available: true
            },
            priority: 1
          })
        }
      }

      else if (styleLower === 'formal') {
        intents.push({
          name: 'formal_office',
          query: 'formal office wear',
          filters: {
            price: { min: 100, max: Math.max(maxPrice, 300) },
            available: true,
            minimumRating: toIntRating(4.2)
          },
          priority: 1
        })

        intents.push({
          name: 'business_casual',
          query: 'business casual',
          filters: {
            price: { min: 75, max: Math.max(maxPrice, 250) },
            available: true
          },
          priority: 1
        })
      }

      else if (styleLower === 'streetwear') {
        intents.push({
          name: 'streetwear_trends',
          query: 'streetwear trends',
          filters: {
            price: { min: minPrice, max: Math.min(maxPrice, 250) },
            available: true
          },
          priority: 1
        })

        // Streetwear often pairs with specific brands
        if (topBrands.some(b => ['supreme', 'stussy', 'bape', 'nike', 'adidas'].includes(b))) {
          intents.push({
            name: 'premium_streetwear',
            query: 'premium streetwear',
            filters: {
              price: { min: 100, max: Math.max(maxPrice, 400) },
              minimumRating: toIntRating(4.0)
            },
            priority: 1
          })
        }
      }

      else if (styleLower === 'minimalist') {
        intents.push({
          name: 'minimalist_basics',
          query: 'minimalist basics',
          filters: {
            price: { min: minPrice, max: Math.min(maxPrice, 200) },
            available: true,
            minimumRating: toIntRating(4.0)
          },
          priority: 1
        })
      }

      else if (styleLower === 'vintage') {
        intents.push({
          name: 'vintage_finds',
          query: 'vintage clothing',
          filters: {
            price: { min: minPrice, max: Math.min(maxPrice, 150) },
            available: true
          },
          priority: 2
        })
      }

      else if (styleLower === 'athletic') {
        intents.push({
          name: 'athletic_wear',
          query: 'athletic apparel',
          filters: {
            price: { min: minPrice, max: Math.min(maxPrice, 200) },
            available: true
          },
          priority: 1
        })

        // Athletic often pairs with Nike/Adidas
        if (topBrands.some(b => ['nike', 'adidas', 'under armour'].includes(b))) {
          intents.push({
            name: 'performance_athletic',
            query: 'performance athletic wear',
            filters: {
              price: { min: 75, max: Math.max(maxPrice, 300) }
            },
            priority: 1
          })
        }
      }
    })

    // Interest-based intents
    interests.forEach(interest => {
      const interestLower = interest.toLowerCase()

      if (interestLower.includes('luxury')) {
        intents.push({
          name: 'luxury_pieces',
          query: 'luxury fashion',
          filters: {
            price: { min: 200, max: 1000 },
            minimumRating: toIntRating(4.5)
          },
          priority: 1
        })
      }

      else if (interestLower.includes('sustainable')) {
        intents.push({
          name: 'sustainable_fashion',
          query: 'sustainable clothing',
          filters: {
            price: { min: minPrice, max: Math.max(maxPrice, 300) },
            available: true
          },
          priority: 2
        })
      }

      else if (interestLower.includes('accessories')) {
        intents.push({
          name: 'fashion_accessories',
          query: 'fashion accessories',
          filters: {
            price: { min: 20, max: Math.min(maxPrice, 300) },
            available: true
          },
          priority: 2
        })

        // Jewelry specific
        if (interestLower.includes('jewelry')) {
          intents.push({
            name: 'fine_jewelry',
            query: 'fine jewelry',
            filters: {
              price: { min: 50, max: Math.max(maxPrice, 500) },
              minimumRating: toIntRating(4.2)
            },
            priority: 2
          })
        }
      }

      else if (interestLower.includes('shoes') || interestLower.includes('footwear')) {
        intents.push({
          name: 'designer_shoes',
          query: 'designer shoes',
          filters: {
            price: { min: 100, max: Math.max(maxPrice, 400) },
            minimumRating: toIntRating(4.0)
          },
          priority: 1
        })
      }
    })

    // Category-based intents from activity analysis
    topCategories.forEach(category => {
      intents.push({
        name: `${category}_recommendations`,
        query: `${category} fashion`,
        filters: {
          price: { min: minPrice, max: maxPrice },
          available: true,
          minimumRating: toIntRating(3.5)
        },
        priority: 2
      })
    })

    // Brand continuation intents
    topBrands.forEach(brand => {
      intents.push({
        name: `${brand}_new_arrivals`,
        query: `${brand} new arrivals`,
        filters: {
          available: true,
          minimumRating: toIntRating(3.8)
        },
        priority: 2
      })
    })

    // Trend-based intents
    if (productActivity.length > 5) {
      intents.push({
        name: 'trending_now',
        query: 'trending fashion',
        filters: {
          available: true,
          minimumRating: toIntRating(4.0)
        },
        priority: 3
      })
    }

    // Fallback general intent if no specific preferences
    if (intents.length === 0) {
      intents.push({
        name: 'general_trends',
        query: 'popular fashion',
        filters: {
          available: true,
          minimumRating: toIntRating(3.5)
        },
        priority: 3
      })
    }

    // Deduplicate intents by name and sort by priority (lower = higher priority)
    const uniqueIntents = intents.filter((intent, index, self) =>
      index === self.findIndex(i => i.name === intent.name)
    )

    return uniqueIntents.sort((a, b) => a.priority - b.priority).slice(0, 8) // Limit to 8 intents
  }, [userProfile, productActivity])

  // Get current intent
  const currentIntent = searchIntents[currentIntentIndex] || null

  // Execute search for current intent
  const searchParams = currentIntent ? (() => {
    const filters = currentIntent.filters ? { ...currentIntent.filters } : {}
    const g = userProfile?.gender
    if (g && (g === 'MALE' || g === 'FEMALE' || g === 'NEUTRAL')) {
      (filters as any).gender = g
    }
    return {
      query: currentIntent.query,
      first: 20,
      filters
    }
  })() : null

  const { products, loading: searchLoading, error: searchError, refetch } = useProductSearch(
    searchParams || { query: '', skip: true }
  )

  // Persist personalized results to backend feed
  useEffect(() => {
    const persistPersonalized = async () => {
      if (!currentIntent || !products || products.length === 0) return
      try {
        const token = await getValidToken()
        // Normalize Shopify ProductSearch items into sync payload
        const normalized = products.map((p: any) => ({
          product: {
            id: p.id,
            title: p.title,
            featuredImage: p.featuredImage ? { url: p.featuredImage.url } : null,
            price: {
              amount: p.priceRange?.min?.amount ?? p.price?.amount ?? '0.00',
              currencyCode: p.priceRange?.min?.currencyCode ?? p.price?.currencyCode ?? 'USD'
            },
            shop: {
              id: p.vendor || 'shop',
              name: p.vendor || 'Shop'
            },
            selectedVariant: p.selectedVariant
          },
          source: 'personalized',
          intent_name: currentIntent.name,
          attributes: {
            source_meta: {
              intent: currentIntent.name,
              query: currentIntent.query
            }
          }
        }))

        await fetch(
          'https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/sync-product-feed',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              products: normalized,
              followedShops: []
            })
          }
        )
      } catch (e) {
        console.error('Failed to persist personalized results:', e)
      }
    }
    persistPersonalized()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, currentIntent?.name])

  // Rotate through intents periodically (every 5 minutes)
  useEffect(() => {
    if (searchIntents.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIntentIndex(prev =>
        (prev + 1) % searchIntents.length
      )
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [searchIntents.length])

  const refresh = () => {
    refetch()
    // Optionally rotate to next intent
    if (searchIntents.length > 1) {
      setCurrentIntentIndex(prev =>
        (prev + 1) % searchIntents.length
      )
    }
  }

  return {
    products: searchParams ? products : null,
    isLoading: isProfileLoading || searchLoading,
    error: searchError?.message || null,
    currentIntent,
    refresh
  }
}
