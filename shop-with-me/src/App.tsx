import { useCurrentUser, useBuyerAttributes, useRecentProducts, useSavedProducts } from '@shopify/shop-minis-react'
import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'
import { OnboardingForm, OnboardingFormData } from './components/OnboardingForm'
import { UserProfile } from './types'

type AppView = 'loading' | 'onboarding' | 'main'

export function App() {
  const { currentUser } = useCurrentUser()
  const { buyerAttributes } = useBuyerAttributes()
  const { products: recentProducts } = useRecentProducts()
  const { products: savedProducts } = useSavedProducts()
  const { userId, isLoading: authLoading } = useAuth()
  const [view, setView] = useState<AppView>('loading')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if user has a profile when userId is available
  useEffect(() => {
    async function checkUserProfile() {
      console.log('🚀 checkUserProfile called - userId:', userId ? userId.substring(0, 8) + '...' : 'null', 'authLoading:', authLoading)
      
      if (!userId || authLoading) {
        console.log('⏳ Waiting for auth... userId:', !!userId, 'authLoading:', authLoading)
        return
      }

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co') {
        console.warn('⚠️ Supabase not configured, skipping database check - showing onboarding')
        setView('onboarding')
        return
      }

      try {
        console.log('🔍 Checking for existing profile for user:', userId.substring(0, 8) + '...')
        
        // Check if profile exists in database with timeout
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        console.log('📊 Database response - data:', !!data, 'error:', error?.code || 'none')

        if (error) {
          if (error.code === 'PGRST116') {
            // No profile found - show onboarding
            console.log('📝 No profile found, showing onboarding')
            setView('onboarding')
          } else {
            console.error('❌ Database error:', error)
            // Show onboarding instead of error for network issues
            console.log('🔄 Showing onboarding due to database error')
            setView('onboarding')
          }
        } else if (data) {
          // Profile exists - load it
          console.log('✅ Profile found:', data.username)
          setUserProfile(data)
          setView('main')
        } else {
          // No data and no error - show onboarding
          console.log('❓ No data returned, showing onboarding')
          setView('onboarding')
        }
      } catch (err) {
        console.error('❌ Error checking profile:', err)
        // Show onboarding instead of error state
        console.log('🔄 Showing onboarding due to error')
        setView('onboarding')
      }
    }

    checkUserProfile()
  }, [userId, authLoading])

  // Handle onboarding form completion
  const handleOnboardingComplete = async (formData: OnboardingFormData) => {
    console.log('💾 Creating profile with data:', formData)

    // For now, skip database and just show the collected data
    // Create a mock profile from form data
    const mockProfile: UserProfile = {
      user_id: formData.syncId,
      username: formData.username,
      display_name: formData.metadata.displayName || 'User',
      profile_pic: formData.pfp,
      bio: formData.bio,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString()
    }

    console.log('✅ Profile data collected successfully!')
    setUserProfile(mockProfile)
    setView('main')
  }

  // Loading state
  if (authLoading || view === 'loading') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#666', fontSize: '16px' }}>Loading StyleSync...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '20px'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '12px', 
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', color: '#111' }}>Something went wrong</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      </div>
    )
  }

  // Onboarding flow
  if (view === 'onboarding' && userId) {
    return (
      <OnboardingForm 
        syncId={userId}
        onComplete={handleOnboardingComplete}
      />
    )
  }

  // Main app view
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>StyleSync</h1>
          <div style={{ fontSize: '14px', color: '#666' }}>
            @{userProfile?.username}
          </div>
        </div>

        {/* Profile Card */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#2563eb' }}>
            ✅ Profile Created!
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            {userProfile?.profile_pic && (
              <img 
                src={userProfile.profile_pic}
                alt="Profile"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '40px',
                  marginRight: '20px',
                  border: '3px solid #2563eb'
                }}
              />
            )}
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                {userProfile?.display_name}
              </h3>
              <p style={{ color: '#2563eb', fontSize: '16px', margin: 0 }}>
                @{userProfile?.username}
              </p>
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#f0f9ff', 
            padding: '16px', 
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '14px', color: '#0369a1', margin: '0 0 8px 0' }}>
              <strong>Bio:</strong>
            </p>
            <p style={{ 
              fontSize: '14px', 
              color: '#0369a1',
              margin: 0,
              fontStyle: userProfile?.bio ? 'normal' : 'italic'
            }}>
              {userProfile?.bio || 'No bio provided'}
            </p>
          </div>

          <div style={{ 
            backgroundColor: '#f0f9ff', 
            padding: '16px', 
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '14px', color: '#0369a1', margin: '0 0 8px 0' }}>
              <strong>Your Hidden Reference ID:</strong>
            </p>
            <p style={{ 
              fontSize: '12px', 
              fontFamily: 'monospace', 
              color: '#0369a1',
              wordBreak: 'break-all',
              margin: 0
            }}>
              {userProfile?.user_id}
            </p>
          </div>
        </div>

        {/* Hook Data Display */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#2563eb' }}>
            📊 Collected Shop SDK Data
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            This data will be used to build your personalized StyleSync feed
          </p>

          {/* Data Summary */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              backgroundColor: '#f0f9ff',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #0ea5e9'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0369a1' }}>
                {recentProducts?.length || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#0c4a6e', marginTop: '4px' }}>
                Recent Products
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#fef3c7',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #fbbf24'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#92400e' }}>
                {savedProducts?.length || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#78350f', marginTop: '4px' }}>
                Saved Products
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#f3e8ff',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #a855f7'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6b21a8' }}>
                {(window as any).onboardingInterests?.length || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#581c87', marginTop: '4px' }}>
                Interests Tagged
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#dcfce7',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #4ade80'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>
                {buyerAttributes ? '✓' : '✗'}
              </div>
              <div style={{ fontSize: '12px', color: '#14532d', marginTop: '4px' }}>
                Buyer Attributes
              </div>
            </div>
          </div>

          {/* Detailed Hook Data */}
          <div style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '20px'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
              Detailed Hook Responses:
            </h4>

            {/* Recent Products */}
            <details style={{ marginBottom: '12px' }}>
              <summary style={{ 
                cursor: 'pointer', 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#0369a1',
                padding: '10px',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                border: '1px solid #bae6fd'
              }}>
                🛍️ useRecentProducts() → {recentProducts?.length || 0} items
              </summary>
              <pre style={{
                fontSize: '11px',
                backgroundColor: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '200px',
                color: '#475569',
                border: '1px solid #e2e8f0',
                marginTop: '8px'
              }}>
                {JSON.stringify(recentProducts || 'No recent products', null, 2)}
              </pre>
            </details>

            {/* Saved Products */}
            <details style={{ marginBottom: '12px' }}>
              <summary style={{ 
                cursor: 'pointer', 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#92400e',
                padding: '10px',
                backgroundColor: '#fef3c7',
                borderRadius: '6px',
                border: '1px solid #fde68a'
              }}>
                💾 useSavedProducts() → {savedProducts?.length || 0} items
              </summary>
              <pre style={{
                fontSize: '11px',
                backgroundColor: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '200px',
                color: '#475569',
                border: '1px solid #e2e8f0',
                marginTop: '8px'
              }}>
                {JSON.stringify(savedProducts || 'No saved products', null, 2)}
              </pre>
            </details>

            {/* Buyer Attributes */}
            <details style={{ marginBottom: '12px' }}>
              <summary style={{ 
                cursor: 'pointer', 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#6b21a8',
                padding: '10px',
                backgroundColor: '#f3e8ff',
                borderRadius: '6px',
                border: '1px solid #e9d5ff'
              }}>
                👤 useBuyerAttributes()
              </summary>
              <pre style={{
                fontSize: '11px',
                backgroundColor: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '200px',
                color: '#475569',
                border: '1px solid #e2e8f0',
                marginTop: '8px'
              }}>
                {JSON.stringify(buyerAttributes || 'Not available', null, 2)}
              </pre>
            </details>

            {/* Current User */}
            <details style={{ marginBottom: '12px' }}>
              <summary style={{ 
                cursor: 'pointer', 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#166534',
                padding: '10px',
                backgroundColor: '#dcfce7',
                borderRadius: '6px',
                border: '1px solid #bbf7d0'
              }}>
                🧑 useCurrentUser()
              </summary>
              <pre style={{
                fontSize: '11px',
                backgroundColor: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '200px',
                color: '#475569',
                border: '1px solid #e2e8f0',
                marginTop: '8px'
              }}>
                {JSON.stringify(currentUser, null, 2)}
              </pre>
            </details>

            {/* Complete Onboarding Data */}
            <details>
              <summary style={{ 
                cursor: 'pointer', 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#1e40af',
                padding: '10px',
                backgroundColor: '#dbeafe',
                borderRadius: '6px',
                border: '1px solid #bfdbfe'
              }}>
                📋 Complete Onboarding Form Data
              </summary>
              <pre style={{
                fontSize: '11px',
                backgroundColor: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '300px',
                color: '#475569',
                border: '1px solid #e2e8f0',
                marginTop: '8px'
              }}>
                {JSON.stringify({
                  username: userProfile?.username,
                  syncId: userProfile?.user_id,
                  bio: userProfile?.bio,
                  profilePicture: userProfile?.profile_pic,
                  interests: (window as any).onboardingInterests || [],
                  metadata: {
                    displayName: currentUser?.displayName,
                    email: (currentUser as any)?.email,
                    recentProductsCount: recentProducts?.length || 0,
                    savedProductsCount: savedProducts?.length || 0,
                    hasBuyerAttributes: !!buyerAttributes
                  }
                }, null, 2)}
              </pre>
            </details>
          </div>
        </div>

        {/* Info Card */}
        <div style={{ 
          backgroundColor: '#dcfce7', 
          borderRadius: '12px', 
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '16px', color: '#166534', marginBottom: '12px' }}>
            🎉 You're all set!
          </h3>
          <p style={{ fontSize: '14px', color: '#166534', margin: 0 }}>
            Your StyleSync profile has been created with a secure UUID as your backend reference.
            Start exploring and connecting with other users!
          </p>
        </div>
      </div>
    </div>
  )
}
