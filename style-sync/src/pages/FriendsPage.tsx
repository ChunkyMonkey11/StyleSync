import { useState } from 'react'

interface FriendsPageProps {
    onBack: () => void
}

export function FriendsPage({ onBack }: FriendsPageProps) {
    const [activeTab, setActiveTab] = useState<'send' | 'received'>('send')
    const [friendUsername, setFriendUsername] = useState('')
    const [sentRequests, setSentRequests] = useState<string[]>([])
    const [receivedRequests, setReceivedRequests] = useState<string[]>([])

    const handleSendRequest = () => {
        if (friendUsername.trim()) {
            setSentRequests(prev => [...prev, friendUsername.trim()])
            setFriendUsername('')
            alert(`Friend request sent to @${friendUsername}!`)
        }
    }

    const handleAcceptRequest = (username: string) => {
        setReceivedRequests(prev => prev.filter(u => u !== username))
        alert(`You are now friends with @${username}!`)
    }

    const handleRejectRequest = (username: string) => {
        setReceivedRequests(prev => prev.filter(u => u !== username))
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
                <h1 className="text-2xl font-bold">Friends</h1>
            </div>

            {/* Tabs */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                <button
                    onClick={() => setActiveTab('send')}
                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                        activeTab === 'send' 
                            ? 'bg-white text-purple-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                    Send Request
                </button>
                <button
                    onClick={() => setActiveTab('received')}
                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                        activeTab === 'received' 
                            ? 'bg-white text-purple-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                    Received ({receivedRequests.length})
                </button>
            </div>

            {/* Send Request Tab */}
            {activeTab === 'send' && (
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <h2 className="font-semibold mb-3">Send Friend Request</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={friendUsername}
                                    onChange={(e) => setFriendUsername(e.target.value)}
                                    placeholder="Enter username (e.g., johndoe)"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={handleSendRequest}
                                disabled={!friendUsername.trim()}
                                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                Send Friend Request
                            </button>
                        </div>
                    </div>

                    {/* Sent Requests */}
                    {sentRequests.length > 0 && (
                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                            <h3 className="font-semibold mb-3">Sent Requests</h3>
                            <div className="space-y-2">
                                {sentRequests.map((username, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-700">@{username}</span>
                                        <span className="text-sm text-gray-500">Pending</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Received Requests Tab */}
            {activeTab === 'received' && (
                <div className="space-y-4">
                    {receivedRequests.length === 0 ? (
                        <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
                            <p className="text-gray-600">No friend requests yet</p>
                        </div>
                    ) : (
                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                            <h3 className="font-semibold mb-3">Friend Requests</h3>
                            <div className="space-y-3">
                                {receivedRequests.map((username, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <span className="font-medium">@{username}</span>
                                            <p className="text-sm text-gray-500">wants to be friends</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAcceptRequest(username)}
                                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleRejectRequest(username)}
                                                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

