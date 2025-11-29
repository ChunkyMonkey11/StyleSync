import { useState } from 'react'
import { Button, ProductCard, useRecommendedProducts } from '@shopify/shop-minis-react'

interface PersonalizedRecommendationsProps {
  onProductClick?: (productId: string) => void
}

export function PersonalizedRecommendations({ onProductClick }: PersonalizedRecommendationsProps) {
  const { products, loading, error, refetch } = useRecommendedProducts({ first: 20 })
  const [showAll, setShowAll] = useState(false)

  const displayProducts = showAll ? products : products?.slice(0, 4)

  const handleProductClick = (productId: string) => {
    // Call the original onProductClick callback
    onProductClick?.(productId)
  }

  if (loading && !products) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Recommended for You</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20 animate-pulse">
              <div className="aspect-square bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/20 rounded mb-1"></div>
              <div className="h-3 bg-white/20 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Recommended for You</h2>
        <div className="bg-red-500/20 backdrop-blur-sm border border-red-300/30 rounded-lg p-4 text-center">
          <p className="text-red-100 text-sm">Unable to load recommendations</p>
          <Button onClick={() => refetch?.()} className="mt-2" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Recommended for You</h2>
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center">
          <p className="text-white/70 text-sm">No recommendations available at the moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white">Recommended for You</h2>
        <Button
          onClick={() => refetch?.()}
          variant="secondary"
          size="sm"
          className="text-xs"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {displayProducts?.map((product) => (
          <div
            key={product.id}
            className="cursor-pointer"
            onClick={() => handleProductClick(product.id)}
          >
            <ProductCard
              product={product}
              variant="compact"
            />
          </div>
        ))}
      </div>

      {products && products.length > 4 && (
        <div className="text-center mt-4">
          <Button
            onClick={() => setShowAll(!showAll)}
            variant="secondary"
            size="sm"
          >
            {showAll ? 'Show Less' : `Show All (${products.length})`}
          </Button>
        </div>
      )}
    </div>
  )
}
