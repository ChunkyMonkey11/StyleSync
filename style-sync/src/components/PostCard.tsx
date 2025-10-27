import { useState } from 'react'
import { Card, Button, Image } from '@shopify/shop-minis-react'
import { useAuth } from '../hooks/useAuth'

interface FeedPost {
  id: string
  shop_public_id: string
  post_type: 'style' | 'product'
  content: string
  product_url?: string
  product_image?: string
  product_title?: string
  product_price?: string
  created_at: string
  updated_at: string
  user: {
    username: string
    display_name: string
    profile_pic: string
  }
  interaction_counts: {
    likes: number
    upvotes: number
    downvotes: number
    comments: number
  }
  user_interaction?: 'like' | 'upvote' | 'downvote'
}

interface PostCardProps {
  post: FeedPost
  onViewComments: (postId: string) => void
  onInteract: (postId: string, interactionType: 'like' | 'upvote' | 'downvote') => void
}

export function PostCard({ post, onViewComments, onInteract }: PostCardProps) {
  const [isInteracting, setIsInteracting] = useState(false)
  const { getValidToken } = useAuth()

  const handleInteract = async (interactionType: 'like' | 'upvote' | 'downvote') => {
    if (isInteracting) return
    
    try {
      setIsInteracting(true)
      const token = await getValidToken()
      
      const response = await fetch(
        'https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/post-interact',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            post_id: post.id,
            interaction_type: interactionType
          })
        }
      )

      if (response.ok) {
        onInteract(post.id, interactionType)
      } else {
        console.error('Failed to interact with post:', await response.text())
      }
    } catch (error) {
      console.error('Error interacting with post:', error)
    } finally {
      setIsInteracting(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  return (
    <Card className="p-4">
      {/* User Header */}
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center overflow-hidden">
          {post.user.profile_pic ? (
            <Image 
              src={post.user.profile_pic} 
              alt={post.user.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg">👤</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">@{post.user.username}</h3>
            <span className="text-gray-500 text-xs">•</span>
            <span className="text-gray-500 text-xs">{formatTimeAgo(post.created_at)}</span>
          </div>
          <p className="text-gray-600 text-xs">{post.user.display_name}</p>
        </div>
        {post.post_type === 'product' && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            Product
          </span>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-900 text-sm leading-relaxed">{post.content}</p>
      </div>

      {/* Product Preview (if product post) */}
      {post.post_type === 'product' && post.product_image && (
        <div className="mb-4">
          <div className="relative">
            <Image 
              src={post.product_image} 
              alt={post.product_title || 'Product'}
              className="w-full h-48 object-cover rounded-lg"
            />
            {post.product_price && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                {post.product_price}
              </div>
            )}
          </div>
          {post.product_title && (
            <p className="text-sm font-medium mt-2 text-gray-900">{post.product_title}</p>
          )}
        </div>
      )}

      {/* Interaction Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button
            onClick={() => handleInteract('like')}
            disabled={isInteracting}
            className={`flex items-center gap-1 text-sm transition-colors ${
              post.user_interaction === 'like'
                ? 'text-red-600'
                : 'text-gray-500 hover:text-red-600'
            }`}
          >
            <span className="text-lg">❤️</span>
            <span>{post.interaction_counts.likes}</span>
          </button>

          {/* Upvote Button */}
          <button
            onClick={() => handleInteract('upvote')}
            disabled={isInteracting}
            className={`flex items-center gap-1 text-sm transition-colors ${
              post.user_interaction === 'upvote'
                ? 'text-green-600'
                : 'text-gray-500 hover:text-green-600'
            }`}
          >
            <span className="text-lg">👍</span>
            <span>{post.interaction_counts.upvotes}</span>
          </button>

          {/* Downvote Button */}
          <button
            onClick={() => handleInteract('downvote')}
            disabled={isInteracting}
            className={`flex items-center gap-1 text-sm transition-colors ${
              post.user_interaction === 'downvote'
                ? 'text-red-600'
                : 'text-gray-500 hover:text-red-600'
            }`}
          >
            <span className="text-lg">👎</span>
            <span>{post.interaction_counts.downvotes}</span>
          </button>
        </div>

        {/* Comments Button */}
        <button
          onClick={() => onViewComments(post.id)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          <span className="text-lg">💬</span>
          <span>{post.interaction_counts.comments}</span>
        </button>
      </div>
    </Card>
  )
}
