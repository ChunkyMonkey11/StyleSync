import { useState } from 'react'
import { useCurrentUser, useBuyerAttributes, useRecentProducts, useSavedProducts } from '@shopify/shop-minis-react'

interface OnboardingFormProps {
  syncId: string // The UUID we generate
  onComplete?: (formData: OnboardingFormData) => Promise<void>
}

export interface OnboardingFormData {
  username: string
  syncId: string
  bio: string
  pfp: string
  interests: string[]
  metadata: {
    displayName?: string
    email?: string
    buyerAttributes?: any
    shopifyData?: any
    recentProducts?: any
    savedProducts?: any
  }
}

export function OnboardingForm({ syncId, onComplete }: OnboardingFormProps) {
  const { currentUser } = useCurrentUser()
  const { buyerAttributes } = useBuyerAttributes()
  const { products: recentProducts } = useRecentProducts()
  const { products: savedProducts } = useSavedProducts()

  // Form state
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [currentInterest, setCurrentInterest] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get profile picture from currentUser
  const profilePicture = (currentUser as any)?.avatarImage?.url || ''

  // Validation
  const validateUsername = (value: string): string | null => {
    if (value.length < 3) return 'Username must be at least 3 characters'
    if (value.length > 20) return 'Username must be less than 20 characters'
    if (!/^[a-z0-9_]+$/.test(value)) return 'Only lowercase letters, numbers, and underscores'
    return null
  }

  const handleUsernameChange = (value: string) => {
    const lowercase = value.toLowerCase()
    setUsername(lowercase)
    
    const error = validateUsername(lowercase)
    if (error) {
      setErrors({ ...errors, username: error })
    } else {
      const { username, ...rest } = errors
      setErrors(rest)
    }
  }

  // Interest bubble handling (LinkedIn-style)
  const handleInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addInterest()
    } else if (e.key === 'Backspace' && !currentInterest && interests.length > 0) {
      // Remove last interest if backspace on empty input
      setInterests(interests.slice(0, -1))
    }
  }

  const addInterest = () => {
    const trimmed = currentInterest.trim()
    if (trimmed && !interests.includes(trimmed) && interests.length < 10) {
      setInterests([...interests, trimmed])
      setCurrentInterest('')
    }
  }

  const removeInterest = (interestToRemove: string) => {
    setInterests(interests.filter(i => i !== interestToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate
    const usernameError = validateUsername(username)
    if (usernameError) {
      setErrors({ ...errors, username: usernameError })
      return
    }

    if (bio.length > 200) {
      setErrors({ ...errors, bio: 'Bio must be less than 200 characters' })
      return
    }

    // Prepare form data
    const formData: OnboardingFormData = {
      username,
      syncId,
      bio,
      pfp: profilePicture,
      interests,
      metadata: {
        displayName: currentUser?.displayName ?? undefined,
        email: (currentUser as any)?.email ?? undefined,
        buyerAttributes: buyerAttributes,
        shopifyData: currentUser,
        recentProducts: recentProducts,
        savedProducts: savedProducts
      }
    }

    console.log('📋 Onboarding Form Data:', formData)
    
    // Store interests globally for display
    ;(window as any).onboardingInterests = interests
    
    if (onComplete) {
      setIsSubmitting(true)
      try {
        await onComplete(formData)
      } catch (err) {
        console.error('❌ Submission error:', err)
        setErrors({ ...errors, submit: err instanceof Error ? err.message : 'Failed to complete setup' })
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Welcome to StyleSync! ✨
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px' }}>
            Let's set up your profile
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          {/* Profile Picture */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            {profilePicture ? (
              <img 
                src={profilePicture}
                alt="Profile"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  border: '4px solid #667eea',
                  margin: '0 auto'
                }}
              />
            ) : (
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontSize: '40px'
              }}>
                👤
              </div>
            )}
            <p style={{ 
              marginTop: '12px', 
              fontSize: '14px', 
              color: '#64748b' 
            }}>
              {currentUser?.displayName || 'Your Profile'}
            </p>
          </div>

          {/* SyncId Display */}
          <div style={{ 
            backgroundColor: '#f1f5f9', 
            padding: '12px', 
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
              <strong>Your SyncId:</strong>
            </p>
            <p style={{ 
              fontSize: '11px', 
              fontFamily: 'monospace', 
              color: '#475569',
              wordBreak: 'break-all'
            }}>
              {syncId}
            </p>
          </div>

          {/* Username Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              fontSize: '14px',
              color: '#1e293b'
            }}>
              Username <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ 
                position: 'absolute', 
                left: '14px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#64748b',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="username"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 32px',
                  fontSize: '16px',
                  border: `2px solid ${errors.username ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: '10px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = errors.username ? '#ef4444' : '#e2e8f0'}
              />
            </div>
            {errors.username && (
              <p style={{ marginTop: '6px', fontSize: '13px', color: '#ef4444' }}>
                ❌ {errors.username}
              </p>
            )}
            <p style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
              People will use this to find you
            </p>
          </div>

          {/* Bio Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              fontSize: '14px',
              color: '#1e293b'
            }}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '15px',
                border: `2px solid ${errors.bio ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '10px',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = errors.bio ? '#ef4444' : '#e2e8f0'}
            />
            {errors.bio && (
              <p style={{ marginTop: '6px', fontSize: '13px', color: '#ef4444' }}>
                ❌ {errors.bio}
              </p>
            )}
            <p style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
              {bio.length}/200 characters
            </p>
          </div>

          {/* Interests Input (LinkedIn-style bubbles) */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              fontSize: '14px',
              color: '#1e293b'
            }}>
              Interests
            </label>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
              Add interests that define your style (press Enter or comma to add)
            </p>
            
            {/* Interest bubbles display */}
            <div style={{
              minHeight: '60px',
              padding: '10px',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
              backgroundColor: '#fafafa'
            }}>
              {interests.map((interest, index) => (
                <span
                  key={index}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(interest)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.3)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      padding: 0
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
              
              {/* Input for adding new interests */}
              {interests.length < 10 && (
                <input
                  type="text"
                  value={currentInterest}
                  onChange={(e) => setCurrentInterest(e.target.value)}
                  onKeyDown={handleInterestKeyDown}
                  onBlur={addInterest}
                  placeholder={interests.length === 0 ? "Fashion, Tech, Sports..." : "Add more..."}
                  style={{
                    flex: '1',
                    minWidth: '150px',
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    padding: '6px',
                    backgroundColor: 'transparent'
                  }}
                />
              )}
            </div>
            <p style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
              {interests.length}/10 interests added
            </p>
          </div>

          {/* Shop SDK Data Preview */}
          <div style={{ 
            backgroundColor: '#fefce8', 
            border: '1px solid #fde047',
            padding: '16px', 
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <p style={{ 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#854d0e',
              marginBottom: '12px'
            }}>
              📊 We're collecting your shop data to personalize your feed:
            </p>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px',
              fontSize: '12px',
              color: '#a16207'
            }}>
              <li>Recent Products: {recentProducts?.length || 0} items</li>
              <li>Saved Products: {savedProducts?.length || 0} items</li>
              <li>Buyer Attributes: {buyerAttributes ? 'Available' : 'Not available'}</li>
              <li>Profile Data: {currentUser ? 'Available' : 'Loading...'}</li>
            </ul>
          </div>

          {/* Detailed Metadata Display (collapsible) */}
          <details style={{ marginBottom: '20px' }}>
            <summary style={{ 
              cursor: 'pointer', 
              fontSize: '13px', 
              color: '#64748b',
              marginBottom: '8px',
              fontWeight: '600'
            }}>
              🔍 View Detailed SDK Data (Advanced)
            </summary>
            
            <div style={{ marginTop: '12px' }}>
              {/* Recent Products */}
              {recentProducts && (
                <details style={{ marginBottom: '12px' }}>
                  <summary style={{ 
                    cursor: 'pointer', 
                    fontSize: '12px', 
                    color: '#4b5563',
                    padding: '8px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px'
                  }}>
                    Recent Products ({recentProducts.length})
                  </summary>
                  <pre style={{
                    fontSize: '11px',
                    backgroundColor: '#f1f5f9',
                    padding: '12px',
                    borderRadius: '8px',
                    overflow: 'auto',
                    maxHeight: '150px',
                    color: '#475569',
                    marginTop: '8px'
                  }}>
                    {JSON.stringify(recentProducts, null, 2)}
                  </pre>
                </details>
              )}

              {/* Saved Products */}
              {savedProducts && (
                <details style={{ marginBottom: '12px' }}>
                  <summary style={{ 
                    cursor: 'pointer', 
                    fontSize: '12px', 
                    color: '#4b5563',
                    padding: '8px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px'
                  }}>
                    Saved Products ({savedProducts.length})
                  </summary>
                  <pre style={{
                    fontSize: '11px',
                    backgroundColor: '#f1f5f9',
                    padding: '12px',
                    borderRadius: '8px',
                    overflow: 'auto',
                    maxHeight: '150px',
                    color: '#475569',
                    marginTop: '8px'
                  }}>
                    {JSON.stringify(savedProducts, null, 2)}
                  </pre>
                </details>
              )}

              {/* Buyer Attributes */}
              {buyerAttributes && (
                <details style={{ marginBottom: '12px' }}>
                  <summary style={{ 
                    cursor: 'pointer', 
                    fontSize: '12px', 
                    color: '#4b5563',
                    padding: '8px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px'
                  }}>
                    Buyer Attributes
                  </summary>
                  <pre style={{
                    fontSize: '11px',
                    backgroundColor: '#f1f5f9',
                    padding: '12px',
                    borderRadius: '8px',
                    overflow: 'auto',
                    maxHeight: '150px',
                    color: '#475569',
                    marginTop: '8px'
                  }}>
                    {JSON.stringify(buyerAttributes, null, 2)}
                  </pre>
                </details>
              )}

              {/* Current User */}
              {currentUser && (
                <details>
                  <summary style={{ 
                    cursor: 'pointer', 
                    fontSize: '12px', 
                    color: '#4b5563',
                    padding: '8px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px'
                  }}>
                    Current User Data
                  </summary>
                  <pre style={{
                    fontSize: '11px',
                    backgroundColor: '#f1f5f9',
                    padding: '12px',
                    borderRadius: '8px',
                    overflow: 'auto',
                    maxHeight: '150px',
                    color: '#475569',
                    marginTop: '8px'
                  }}>
                    {JSON.stringify(currentUser, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </details>

          {/* Error Display */}
          {errors.submit && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <p style={{ color: '#dc2626', fontSize: '14px', margin: 0 }}>
                ❌ {errors.submit}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!username || username.length < 3 || !!errors.username || isSubmitting}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
              background: (!username || username.length < 3 || !!errors.username || isSubmitting) 
                ? '#cbd5e1' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: (!username || username.length < 3 || !!errors.username || isSubmitting) 
                ? 'not-allowed' 
                : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
          >
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}></span>
                Creating Profile...
              </span>
            ) : (
              'Complete Setup ✨'
            )}
          </button>
          
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </form>
      </div>
    </div>
  )
}




