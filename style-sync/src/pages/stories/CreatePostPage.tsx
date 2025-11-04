import { useState } from 'react'
import { useCurrentUser, Button, Input, Card } from '@shopify/shop-minis-react'
import { useAuth } from '../../hooks/useAuth'

interface CreatePostPageProps {
  onBack: () => void
  onPostCreated: () => void
}

export function CreatePostPage({ onBack, onPostCreated }: CreatePostPageProps) {
  const { currentUser } = useCurrentUser()
  const { getValidToken } = useAuth()
  
  // Form state
  const [postType, setPostType] = useState<'style' | 'product'>('style')
  const [content, setContent] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [productTitle, setProductTitle] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productImage, setProductImage] = useState('')
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!content.trim()) {
      newErrors.content = 'Content is required'
    } else if (content.length > 2000) {
      newErrors.content = 'Content must be 2000 characters or less'
    }
    
    if (postType === 'product') {
      if (!productUrl.trim()) {
        newErrors.productUrl = 'Product URL is required for product posts'
      } else {
        try {
          new URL(productUrl)
        } catch {
          newErrors.productUrl = 'Please enter a valid URL'
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setErrors({})
    
    try {
      const token = await getValidToken()
      
      const postData = {
        post_type: postType,
        content: content.trim(),
        product_url: postType === 'product' ? productUrl.trim() : undefined,
        product_title: postType === 'product' ? productTitle.trim() : undefined,
        product_price: postType === 'product' ? productPrice.trim() : undefined,
        product_image: postType === 'product' ? productImage.trim() : undefined,
      }
      
      console.log('Creating post with data:', postData)
      
      const response = await fetch(
        'https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/create-post',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ postData })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create post')
      }

      const result = await response.json()
      console.log('Post created:', result.post)
      
      onPostCreated() // Navigate back to feed
      
    } catch (error) {
      console.error('Error creating post:', error)
      setErrors({ general: error instanceof Error ? error.message : 'Failed to create post. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button 
          onClick={onBack}
          className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Create Post</h1>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          {/* Post Type Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Post Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPostType('style')}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  postType === 'style'
                    ? 'bg-purple-500 text-white border-purple-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Style Update
              </button>
              <button
                type="button"
                onClick={() => setPostType('product')}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  postType === 'product'
                    ? 'bg-purple-500 text-white border-purple-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Product Share
              </button>
            </div>
          </div>
          
          {/* Content Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              What's on your mind? *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                postType === 'style' 
                  ? "Share your latest style update..." 
                  : "Tell us about this product..."
              }
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={4}
              maxLength={2000}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.content && (
                <p className="text-sm text-red-600">{errors.content}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {content.length}/2000
              </p>
            </div>
          </div>
          
          {/* Product-specific fields */}
          {postType === 'product' && (
            <>
              {/* Product URL */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Product URL *</label>
                <Input
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://example.com/product"
                  className="w-full"
                  type="url"
                />
                {errors.productUrl && (
                  <p className="text-sm text-red-600 mt-1">{errors.productUrl}</p>
                )}
              </div>
              
              {/* Product Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Product Title (optional)</label>
                <Input
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  placeholder="Amazing Product Name"
                  className="w-full"
                />
              </div>
              
              {/* Product Price */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Price (optional)</label>
                <Input
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="$99.99"
                  className="w-full"
                />
              </div>
              
              {/* Product Image URL */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Product Image URL (optional)</label>
                <Input
                  value={productImage}
                  onChange={(e) => setProductImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full"
                  type="url"
                />
              </div>
            </>
          )}
          
          {/* Error Display */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {errors.general}
            </div>
          )}
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Post...' : 'Create Post'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
