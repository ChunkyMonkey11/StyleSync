import { useState } from 'react'

interface UsernameSelectionProps {
  onSubmit: (username: string) => Promise<void>
  suggestedUsername?: string
}

export function UsernameSelection({ onSubmit, suggestedUsername }: UsernameSelectionProps) {
  const [username, setUsername] = useState(suggestedUsername || '')
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateUsername = (value: string): string | null => {
    if (value.length < 3) return 'Username must be at least 3 characters'
    if (value.length > 20) return 'Username must be less than 20 characters'
    if (!/^[a-z0-9_]+$/.test(value)) return 'Only lowercase letters, numbers, and underscores'
    return null
  }

  const handleUsernameChange = async (value: string) => {
    const lowercase = value.toLowerCase()
    setUsername(lowercase)
    setError(null)
    setIsAvailable(null)

    const validationError = validateUsername(lowercase)
    if (validationError) {
      setError(validationError)
      return
    }

    // Check availability
    setIsChecking(true)
    try {
      // TODO: Implement actual availability check via Supabase
      // For now, simulate a check
      await new Promise(resolve => setTimeout(resolve, 500))
      setIsAvailable(true)
    } catch (err) {
      setError('Failed to check availability')
    } finally {
      setIsChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateUsername(username)
    if (validationError) {
      setError(validationError)
      return
    }

    if (!isAvailable) {
      setError('Please choose an available username')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(username)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
          Welcome to StyleSync! 🎉
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px', fontSize: '16px' }}>
          Choose your unique username
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Your StyleSync @
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#666',
                fontSize: '16px'
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
                  padding: '12px 12px 12px 28px',
                  fontSize: '16px',
                  border: `2px solid ${error ? '#ef4444' : isAvailable ? '#10b981' : '#ddd'}`,
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                disabled={isSubmitting}
              />
            </div>

            {isChecking && (
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                Checking availability...
              </p>
            )}

            {error && (
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#ef4444' }}>
                ❌ {error}
              </p>
            )}

            {isAvailable && !error && (
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#10b981' }}>
                ✅ @{username} is available!
              </p>
            )}
          </div>

          <div style={{ 
            backgroundColor: '#e0f2fe', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '13px',
            color: '#0369a1'
          }}>
            <p style={{ margin: '0 0 8px 0' }}><strong>Username rules:</strong></p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>3-20 characters</li>
              <li>Lowercase letters, numbers, and underscores only</li>
              <li>Must be unique</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={!isAvailable || isSubmitting || isChecking || !!error}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: (!isAvailable || isSubmitting || isChecking || !!error) ? '#ccc' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (!isAvailable || isSubmitting || isChecking || !!error) ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? 'Creating your profile...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}


