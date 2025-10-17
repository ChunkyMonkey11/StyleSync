import { useState } from 'react'
import { useCurrentUser } from '@shopify/shop-minis-react'
import { FriendsPage } from './FriendsPage'

export function MainApp() {
    const { currentUser } = useCurrentUser()
    const [currentView, setCurrentView] = useState<'main' | 'friends'>('main')

    if (currentView === 'friends') {
        return <FriendsPage onBack={() => setCurrentView('main')} />
    }

    return (
        <div className="p-4 max-w-md mx-auto">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">StyleSync Feed</h1>
                <p className="text-gray-600">Welcome back, {currentUser?.displayName || 'User'}!</p>
            </div>

            <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h2 className="font-semibold mb-2">Your Style Profile</h2>
                    <p className="text-sm text-gray-600">Profile created successfully!</p>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h2 className="font-semibold mb-2">Recent Posts</h2>
                    <p className="text-sm text-gray-600">No posts yet. Start sharing your style!</p>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h2 className="font-semibold mb-2">Style Preferences</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Casual</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Streetwear</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h2 className="font-semibold mb-2">Friends</h2>
                    <p className="text-sm text-gray-600 mb-3">Connect with friends to see their style!</p>
                    <button 
                        onClick={() => setCurrentView('friends')}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Manage Friends
                    </button>
                </div>
            </div>
        </div>
    )
}
