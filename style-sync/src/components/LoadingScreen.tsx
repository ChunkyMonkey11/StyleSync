/**
 * LoadingScreen Component
 * 
 * Clean, smooth loading screen with animated logo:
 * - Soft white background with purple hue
 * - Logo animation: quick spin → stop → zoom forward → fade out
 * - Smooth transitions to app
 */

import logoImage from '../logo.png'

interface LoadingScreenProps {
  error?: string | null
  onRetry?: () => void
}

export function LoadingScreen({ error, onRetry }: LoadingScreenProps) {
  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-4 z-50 bg-[#faf8ff]">
        <div className="text-center space-y-4">
          <p className="text-lg text-purple-900">{error}</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-[#faf8ff]">
      <div className="logo-container">
        <img
          src={logoImage}
          alt="StyleSync"
          className="loading-logo"
        />
      </div>
      
      <style>{`
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .loading-logo {
          width: 150px;
          height: 150px;
          animation: logoSequence 2.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          will-change: transform, opacity;
        }
        
        @keyframes logoSequence {
          /* Phase 1: Fade in and quick spin (0-0.8s) */
          0% {
            transform: rotate(0deg) scale(0.8);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          25% {
            transform: rotate(360deg) scale(1);
            opacity: 1;
          }
          
          /* Phase 2: Stop and hold (0.8-1.4s) */
          28% {
            transform: rotate(360deg) scale(1);
          }
          50% {
            transform: rotate(360deg) scale(1);
          }
          
          /* Phase 3: Zoom forward - coming at you effect (1.4-2.4s) */
          54% {
            transform: rotate(360deg) scale(1) translateY(0);
          }
          85% {
            transform: rotate(360deg) scale(2.8) translateY(-20px);
            opacity: 1;
          }
          
          /* Phase 4: Fade out and continue forward (2.4-2.8s) */
          90% {
            transform: rotate(360deg) scale(3.2) translateY(-30px);
            opacity: 0.3;
          }
          100% {
            transform: rotate(360deg) scale(4) translateY(-40px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
