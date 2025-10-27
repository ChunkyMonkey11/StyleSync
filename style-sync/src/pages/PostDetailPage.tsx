import { useState, useEffect } from 'react'
import { useCurrentUser, Button, Input, Card, Image } from '@shopify/shop-minis-react'
import { useAuth } from '../hooks/useAuth'

interface Comment {
  id: string
  post_id: string
  shop_public_id: string
  parent_comment_id?: string
  content: string
  created_at: string
  updated_at: string
  user: {
    username: string
    display_name: string
    profile_pic: string
  }
  replies?: Comment[]
}

interface PostDetailPageProps {
  postId: string
  onBack: () => void
}

export function PostDetailPage({ postId, onBack }: PostDetailPageProps) {
  const { currentUser } = useCurrentUser()
  const { getValidToken } = useAuth()
  
  // State
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load post and comments
  useEffect(() => {
    loadPostAndComments()
  }, [postId])

  const loadPostAndComments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // For now, we'll show a placeholder since we don't have a get-post-detail endpoint
      // In a real implementation, you'd call an endpoint to get the specific post
      setPost({
        id: postId,
        content: "This is a placeholder post. In a real implementation, this would load the actual post data.",
        user: {
          username: "placeholder",
          display_name: "Placeholder User",
          profile_pic: ""
        },
        created_at: new Date().toISOString(),
        interaction_counts: {
          likes: 0,
          upvotes: 0,
          downvotes: 0,
          comments: 0
        }
      })
      
      // Placeholder comments
      setComments([
        {
          id: "1",
          post_id: postId,
          shop_public_id: "user1",
          content: "This is a placeholder comment. In a real implementation, this would load actual comments.",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            username: "commenter1",
            display_name: "Commenter One",
            profile_pic: ""
          }
        }
      ])
      
    } catch (error) {
      console.error('Error loading post:', error)
      setError(error instanceof Error ? error.message : 'Failed to load post')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.trim() || isSubmittingComment) return
    
    try {
      setIsSubmittingComment(true)
      
      // For now, just add to local state
      // In a real implementation, you'd call a create-comment endpoint
      const comment: Comment = {
        id: Date.now().toString(),
        post_id: postId,
        shop_public_id: "current_user",
        content: newComment.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          username: currentUser?.username || "you",
          display_name: currentUser?.displayName || "You",
          profile_pic: currentUser?.avatarImage?.url || ""
        }
      }
      
      setComments(prev => [comment, ...prev])
      setNewComment('')
      
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmittingComment(false)
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

  if (isLoading) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <button 
            onClick={onBack}
            className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Post Details</h1>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <button 
            onClick={onBack}
            className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Post Details</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700 mb-3">{error}</p>
          <button 
            onClick={loadPostAndComments}
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
      <div className="flex items-center mb-6">
        <button 
          onClick={onBack}
          className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Post Details</h1>
      </div>

      {/* Post */}
      {post && (
        <Card className="p-4 mb-6">
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
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <p className="text-gray-900 text-sm leading-relaxed">{post.content}</p>
          </div>

          {/* Interaction Stats */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-100 text-sm text-gray-500">
            <span>{post.interaction_counts.likes} likes</span>
            <span>{post.interaction_counts.upvotes} upvotes</span>
            <span>{post.interaction_counts.downvotes} downvotes</span>
            <span>{comments.length} comments</span>
          </div>
        </Card>
      )}

      {/* Comments Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Comments ({comments.length})</h2>
        
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {comment.user.profile_pic ? (
                      <Image 
                        src={comment.user.profile_pic} 
                        alt={comment.user.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">👤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">@{comment.user.username}</h4>
                      <span className="text-gray-500 text-xs">•</span>
                      <span className="text-gray-500 text-xs">{formatTimeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-gray-900 text-sm leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Comment Form */}
      <Card className="p-4">
        <form onSubmit={handleSubmitComment}>
          <div className="flex gap-3">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1"
              maxLength={500}
            />
            <Button 
              type="submit"
              disabled={!newComment.trim() || isSubmittingComment}
              className="px-4"
            >
              {isSubmittingComment ? '...' : 'Post'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
