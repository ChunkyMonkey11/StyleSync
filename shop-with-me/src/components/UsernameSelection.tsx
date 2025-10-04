import { useState, useCallback, useEffect } from 'react'
import { Button, Input, Card, CardContent, Touchable } from '@shopify/shop-minis-react'
import { Check, X, User, AlertCircle } from 'lucide-react'

interface UsernameSelectionProps {
  onUsernameSelected: (username: string) => void
  onCancel: () => void
  isDarkMode: boolean
  checkAvailability: (username: string) => Promise<boolean>
  generateFallback: () => string
}

export function UsernameSelection({ 
  onUsernameSelected, 
  onCancel,
  isDarkMode,
  checkAvailability,
  generateFallback
}: UsernameSelectionProps) {
  const [username, setUsername] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Generate initial username suggestion
  useEffect(() => {
    const suggested = generateFallback()
    setUsername(suggested)
    setSuggestions([suggested])
  }, [generateFallback])

  // Check username availability with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (username && validateUsername(username)) {
        await checkAvailabilityWrapper(username)
      } else {
        setIsAvailable(null)
        setError(null)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [username])

  const validateUsername = (username: string): boolean => {
    if (!username || typeof username !== 'string') return false
    if (username.length < 3 || username.length > 30) return false
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return false
    return true
  }

  const checkAvailabilityWrapper = async (usernameToCheck: string) => {
    setIsChecking(true)
    setError(null)
    
    try {
      const available = await checkAvailability(usernameToCheck)
      setIsAvailable(available)
      
      if (!available) {
        setError('Username is already taken')
        generateSuggestions(usernameToCheck)
      }
    } catch (err) {
      console.error('Error checking username:', err)
      setError('Failed to check username availability')
      setIsAvailable(null)
    } finally {
      setIsChecking(false)
    }
  }

  const generateSuggestions = (baseUsername: string) => {
    const timestamp = Date.now().toString().slice(-4)
    const randomSuffix = Math.random().toString(36).substring(2, 6)
    
    setSuggestions([
      `${baseUsername}_${timestamp}`,
      `${baseUsername}_${randomSuffix}`,
      `${baseUsername}_${Math.floor(Math.random() * 1000)}`,
    ])
  }

  const handleSubmit = async () => {
    if (!username || !isAvailable) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      await onUsernameSelected(username)
    } catch (err) {
      console.error('Error setting username:', err)
      setError('Failed to set username. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setUsername(suggestion)
    setError(null)
  }

  const getStatusIcon = () => {
    if (isChecking) {
      return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    }
    
    if (isAvailable === true) {
      return <Check className="w-5 h-5 text-green-500" />
    }
    
    if (isAvailable === false) {
      return <X className="w-5 h-5 text-red-500" />
    }
    
    return <User className="w-5 h-5 text-gray-400" />
  }

  const getStatusText = () => {
    if (isChecking) return 'Checking availability...'
    if (isAvailable === true) return 'Username is available!'
    if (isAvailable === false) return 'Username is taken'
    if (username.length < 3) return 'Username must be at least 3 characters'
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return 'Only letters, numbers, _ and - allowed'
    return 'Choose your username'
  }

  const getStatusColor = () => {
    if (isAvailable === true) return 'text-green-600'
    if (isAvailable === false) return 'text-red-600'
    if (error) return 'text-red-600'
    return 'text-gray-600'
  }

  const canSubmit = username && 
    validateUsername(username) && 
    isAvailable === true && 
    !isSubmitting

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Choose Your Username
            </h2>
            <p className="text-gray-600">
              Pick a unique username that others can use to find and mention you
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="pr-10"
                  disabled={isSubmitting}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {getStatusIcon()}
                </div>
              </div>
              
              <div className={`mt-2 text-sm ${getStatusColor()}`}>
                {getStatusText()}
              </div>
              
              {error && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {error}
                </div>
              )}
            </div>

            {/* Username suggestions */}
            {suggestions.length > 0 && isAvailable === false && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggestions
                </label>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <Touchable
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="block w-full"
                    >
                      <div className="p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                        <span className="text-sm font-mono text-blue-600">
                          @{suggestion}
                        </span>
                      </div>
                    </Touchable>
                  ))}
                </div>
              </div>
            )}

            {/* Username rules */}
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Username Rules
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• 3-30 characters long</li>
                <li>• Letters, numbers, underscore (_), and dash (-) only</li>
                <li>• Must be unique</li>
                <li>• Cannot be changed later</li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1"
              >
                {isSubmitting ? 'Setting Username...' : 'Continue'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}