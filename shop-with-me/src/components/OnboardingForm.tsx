import { useState } from 'react'
import { useCurrentUser } from '@shopify/shop-minis-react'

interface OnboardingFormProps {
  onComplete?: (formData: OnboardingFormData) => Promise<void>
}

/**
 * Minimal data structure matching the users table
 * Only collects what we can't get from Shop SDK
 */
export interface OnboardingFormData {
  // User inputs
  username: string
  bio: string | null
  
  // From Shop SDK (useCurrentUser) - all optional since Shop SDK doesn't provide stable IDs
  display_name?: string | null
  pfp_url?: string | null
  
  // Auto-generated in DB
  // sync_id: UUID (generated on insert, our primary identifier)
  // created_at: TIMESTAMPTZ
  // updated_at: TIMESTAMPTZ
}

export function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const { currentUser } = useCurrentUser()

  // Form state - minimal!
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')

  // Extract data from Shop SDK (all optional now)
  const displayName = (currentUser as any)?.displayName || null
  const pfpUrl = (currentUser as any)?.avatarImage?.url || null

  // Validation
  const validateUsername = (value: string): string | null => {
    if (!value) return 'Username is required'
    if (value.length < 3) return 'Username must be at least 3 characters'
    if (value.length > 20) return 'Username must be less than 20 characters'
    if (!/^[a-z0-9_]+$/.test(value)) return 'Only lowercase letters, numbers, and underscores'
    return null
  }

  const validateBio = (value: string): string | null => {
    if (value.length > 150) return 'Bio must be less than 150 characters'
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

  const handleBioChange = (value: string) => {
    setBio(value)
    
    const error = validateBio(value)
    if (error) {
      setErrors({ ...errors, bio: error })
    } else {
      const { bio, ...rest } = errors
      setErrors(rest)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    const usernameError = validateUsername(username)
    const bioError = validateBio(bio)
    
    if (usernameError || bioError) {
      setErrors({
        ...(usernameError && { username: usernameError }),
        ...(bioError && { bio: bioError }),
      })
      return
    }

    // Prepare minimal form data - only what goes in users table
    const formData: OnboardingFormData = {
      username,
      bio: bio.trim() || null, // null if empty
      display_name: displayName,
      pfp_url: pfpUrl,
    }

    console.log('📋 Creating user profile:', formData)
    setDebugInfo('📤 Calling create-profile edge function...')
    
    setIsSubmitting(true)
    
    try {
      if (onComplete) {
        setDebugInfo('📤 Edge function call started...')
        await onComplete(formData)
        setDebugInfo('✅ Profile created successfully!')
      } else {
        // No callback provided - just log for testing
        console.log('✅ Profile data ready (no handler attached):', formData)
        setDebugInfo('✅ Profile data ready (no handler attached)')
      }
    } catch (err) {
      console.error('❌ Submission error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile. Please try again.'
      setDebugInfo(`❌ Error: ${errorMessage}`)
      setErrors({ form: errorMessage })
    } finally {
      setIsSubmitting(false)
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
        {/* DEBUG PANEL - Onboarding */}
        <div style={{ 
          backgroundColor: '#1e293b',
          color: '#e2e8f0',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontFamily: 'monospace',
          fontSize: '12px',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#fbbf24' }}>
            🔍 DEBUG: Onboarding Environment
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#60a5fa' }}>Shop SDK Data:</strong>
          </div>
          <div style={{ marginLeft: '12px', marginBottom: '4px' }}>
            currentUser: {currentUser ? '✅ Available' : '❌ null/undefined'}
          </div>
          <div style={{ marginLeft: '12px', marginBottom: '4px' }}>
            displayName: {displayName || '(empty)'}
          </div>
          <div style={{ marginLeft: '12px', marginBottom: '8px' }}>
            pfpUrl: {pfpUrl ? '✅ Available' : '❌ null/undefined'}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#60a5fa' }}>Form State:</strong>
          </div>
          <div style={{ marginLeft: '12px', marginBottom: '4px' }}>
            Username: "{username}" ({username.length} chars)
          </div>
          <div style={{ marginLeft: '12px', marginBottom: '4px' }}>
            Bio: "{bio}" ({bio.length} chars)
          </div>
          <div style={{ marginLeft: '12px', marginBottom: '4px' }}>
            Errors: {Object.keys(errors).length > 0 ? Object.keys(errors).join(', ') : 'None'}
          </div>
          <div style={{ marginLeft: '12px', marginBottom: '4px' }}>
            Submitting: {isSubmitting ? '⏳ Yes' : '✅ No'}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#60a5fa' }}>Validation:</strong>
          </div>
          <div style={{ marginLeft: '12px', marginBottom: '4px' }}>
            Username Valid: {username.length >= 3 && !errors.username ? '✅' : '❌'}
          </div>
          <div style={{ marginLeft: '12px', marginBottom: '4px' }}>
            Bio Valid: {!errors.bio ? '✅' : '❌'}
          </div>
          <div style={{ marginLeft: '12px', marginBottom: '4px' }}>
            Can Submit: {username.length >= 3 && !errors.username && !isSubmitting ? '✅' : '❌'}
          </div>

          {debugInfo && (
            <div style={{ marginTop: '8px', color: debugInfo.includes('❌') ? '#ef4444' : debugInfo.includes('✅') ? '#10b981' : '#60a5fa' }}>
              <strong>Edge Function:</strong> {debugInfo}
            </div>
          )}
        </div>

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
            {pfpUrl ? (
              <img 
                src={pfpUrl}
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
              {(currentUser as any)?.displayName || 'Your Profile'}
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
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              fontSize: '14px',
              color: '#1e293b'
            }}>
              Bio <span style={{ color: '#64748b', fontWeight: '400' }}>(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => handleBioChange(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              maxLength={150}
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
              {bio.length}/150 characters
            </p>
          </div>

          {/* Info box */}
          <div style={{ 
            backgroundColor: '#eff6ff', 
            border: '1px solid #93c5fd',
            padding: '16px', 
            borderRadius: '10px',
            marginBottom: '24px'
          }}>
            <p style={{ 
              fontSize: '13px', 
              color: '#1e3a8a',
              margin: 0
            }}>
              💡 <strong>Quick setup!</strong> You can build your profile as you explore and connect with friends.
            </p>
          </div>

          {/* Error Display */}
          {errors.form && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <p style={{ color: '#dc2626', fontSize: '14px', margin: 0 }}>
                ❌ {errors.form}
              </p>
            </div>
          )}

          {/* Test Edge Function Button */}
          <button
            type="button"
            onClick={async () => {
              setDebugInfo('🧪 Testing edge function connection...')
              try {
                const testData = {
                  username: 'testuser123',
                  bio: 'Test bio',
                  display_name: displayName,
                  pfp_url: pfpUrl
                }
                setDebugInfo('📤 Sending test request...')
                if (onComplete) {
                  await onComplete(testData)
                  setDebugInfo('✅ Test successful!')
                } else {
                  setDebugInfo('⚠️ No onComplete handler')
                }
              } catch (err) {
                setDebugInfo(`❌ Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
              }
            }}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '500',
              background: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            🧪 Test Edge Function Connection
          </button>

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




