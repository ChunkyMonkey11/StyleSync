import { useState, useEffect, useCallback } from 'react'
import { useCurrentUser, List, Button } from '@shopify/shop-minis-react'
import { PostCard } from '../components/PostCard'
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

interface FeedPageProps {
  onBack: () => void
  onCreatePost: () => void
  onViewPost: (postId: string) => void
}

export function FeedPage({ onBack, onCreatePost, onViewPost }: FeedPageProps) {
  const { currentUser } = useCurrentUser()
  const { getValidToken } = useAuth()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const loadPosts = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true)
        setOffset(0)
        setPosts([])
      } else {
        setIsLoadingMore(true)
      }
      
      setError(null)
      
      const token = await getValidToken()
      const currentOffset = reset ? 0 : offset
      
      const response = await fetch(
        `https://fhyisvyhahqxryanjnby.supabase.co/functions/v1/get-feed?limit=10&offset=${currentOffset}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch feed: ${response.status}`)
      }

      const result = await response.json()
      
      if (reset) {
        setPosts(result.posts || [])
      } else {
        setPosts(prev => [...prev, ...(result.posts || [])])
      }
      
      setHasMore(result.has_more)
      setOffset(currentOffset + (result.posts?.length || 0))
      
    } catch (error) {
      console.error('Error loading posts:', error)
      setError(error instanceof Error ? error.message : 'Failed to load posts')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [getValidToken, offset])

  // Load posts on mount
  useEffect(() => {
    loadPosts(true)
  }, [])

  const handleInteract = (postId: string, interactionType: 'like' | 'upvote' | 'downvote') => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const currentInteraction = post.user_interaction
        const counts = { ...post.interaction_counts }
        
        // Remove previous interaction count
        if (currentInteraction) {
          counts[currentInteraction] = Math.max(0, counts[currentInteraction] - 1)
        }
        
        // Add new interaction count
        if (currentInteraction !== interactionType) {
          counts[interactionType] = counts[interactionType] + 1
        }
        
        return {
          ...post,
          user_interaction: currentInteraction === interactionType ? undefined : interactionType,
          interaction_counts: counts
        }
      }
      return post
    }))
  }

  const handleRefresh = () => {
    loadPosts(true)
  }

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadPosts(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Style Feed</h1>
          <button 
            onClick={onCreatePost}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✏️
          </button>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-lg border shadow-sm animate-pulse">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Style Feed</h1>
          <button 
            onClick={onCreatePost}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✏️
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700 mb-3">{error}</p>
          <button 
            onClick={handleRefresh}
            className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Style Feed</h1>
        <button 
          onClick={onCreatePost}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ✏️
        </button>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
          <p className="text-gray-600 mb-6">Be the first to share your style!</p>
          <Button onClick={onCreatePost} className="w-full">
            Create First Post
          </Button>
        </div>
      ) : (
        <List>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onViewComments={(postId) => onViewPost(postId)}
              onInteract={handleInteract}
            />
          ))}
        </List>
      )}

      {/* Load More Button */}
      {hasMore && posts.length > 0 && (
        <div className="mt-6 text-center">
          <Button 
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="w-full"
          >
            {isLoadingMore ? 'Loading...' : 'Load More Posts'}
          </Button>
        </div>
      )}

      {/* Floating Action Button for Create Post */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={onCreatePost}
          className="w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors flex items-center justify-center text-2xl"
        >
          ✏️
        </button>
      </div>
    </div>
  )
}
