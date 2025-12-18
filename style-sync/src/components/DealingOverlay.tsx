import { useEffect, useState, useRef } from 'react'
import logoImage from '../logo.png'

interface DealingOverlayProps {
  onFinish: () => void
  deckButtonPosition?: { x: number; y: number }
}

export function DealingOverlay({ onFinish, deckButtonPosition }: DealingOverlayProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [animatedCards, setAnimatedCards] = useState<Array<{ 
    id: number
    startX: number
    startY: number
    endX: number
    endY: number
    startRotation: number
    endRotation: number
    startScale: number
    delay: number
    hasStarted: boolean
  }>>([])
  const overlayRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  // Detect mobile for performance optimization
  const isMobile = typeof window !== 'undefined' && (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768)

  useEffect(() => {
    // Skip animation if reduced motion is preferred
    if (prefersReducedMotion.current) {
      setTimeout(() => {
        onFinish()
      }, 100)
      return
    }

    // Start animation state immediately
    setIsAnimating(true)

    const width = window.innerWidth
    const height = window.innerHeight
    
    // Get deck button position - use provided position or calculate from button element
    let deckCenterX = width / 2
    let deckCenterY = height * 0.35 // Fallback position
    
    if (deckButtonPosition) {
      // Use provided position (center of the button)
      deckCenterX = deckButtonPosition.x
      deckCenterY = deckButtonPosition.y
    } else {
      // Fallback: try to find the deck button element
      const deckButton = document.querySelector('[aria-label="Open Feeds Deck"]') as HTMLElement
      if (deckButton) {
        const rect = deckButton.getBoundingClientRect()
        deckCenterX = rect.left + rect.width / 2
        deckCenterY = rect.top + rect.height / 2
      }
    }

    // Reduce card count on mobile for smoother animation
    const cardCount = isMobile ? 60 : 120
    const newAnimatedCards: Array<{ 
      id: number
      startX: number
      startY: number
      endX: number
      endY: number
      startRotation: number
      endRotation: number
      startScale: number
      delay: number
      hasStarted: boolean
    }> = []

    // Create a dense grid for complete coverage
    // Simpler grid on mobile for better performance
    const gridCols = isMobile ? 7 : 10
    const gridRows = isMobile ? 10 : 15
    const cardWidth = 160
    const cardHeight = 224
    const overlapFactor = isMobile ? 0.5 : 0.7 // Less overlap on mobile for simpler calculations

    for (let i = 0; i < cardCount; i++) {
      // Initial position (at deck center, accounting for card dimensions)
      // Offset by half card size so the card's center aligns with deck center
      const startX = deckCenterX - cardWidth / 2
      const startY = deckCenterY - cardHeight / 2
      
      let endX: number
      let endY: number
      
      // Mix different distribution patterns for full screen coverage
      if (i < cardCount * 0.5) {
        // Pattern 1: Dense grid-like distribution for even coverage
        const col = (i % gridCols)
        const row = Math.floor(i / gridCols)
        const cellWidth = width / gridCols
        const cellHeight = height / gridRows
        // Position cards in grid with overlap
        endX = col * cellWidth + cellWidth * 0.5 + (Math.random() - 0.5) * cellWidth * overlapFactor
        endY = row * cellHeight + cellHeight * 0.5 + (Math.random() - 0.5) * cellHeight * overlapFactor
      } else if (i < cardCount * 0.8) {
        // Pattern 2: Random scatter with edge coverage
        endX = Math.random() * (width + cardWidth) - cardWidth * 0.5
        endY = Math.random() * (height + cardHeight) - cardHeight * 0.5
      } else {
        // Pattern 3: Fill edges and corners more densely
        const edge = i % 4 // 0=top, 1=right, 2=bottom, 3=left
        if (edge === 0) {
          // Top edge
          endX = Math.random() * width
          endY = Math.random() * (cardHeight * 0.8)
        } else if (edge === 1) {
          // Right edge
          endX = width - Math.random() * (cardWidth * 0.8)
          endY = Math.random() * height
        } else if (edge === 2) {
          // Bottom edge
          endX = Math.random() * width
          endY = height - Math.random() * (cardHeight * 0.8)
        } else {
          // Left edge
          endX = Math.random() * (cardWidth * 0.8)
          endY = Math.random() * height
        }
      }
      
      // Allow cards to extend beyond screen edges for complete coverage
      // Offset end positions by half card size to match start position offset
      const clampedEndX = Math.max(-cardWidth * 0.3, Math.min(width + cardWidth * 0.3, endX)) - cardWidth / 2
      const clampedEndY = Math.max(-cardHeight * 0.3, Math.min(height + cardHeight * 0.3, endY)) - cardHeight / 2

      newAnimatedCards.push({
        id: i,
        startX,
        startY,
        endX: clampedEndX,
        endY: clampedEndY,
        startRotation: (Math.random() - 0.5) * 30, // Small initial rotation
        endRotation: isMobile ? (Math.random() - 0.5) * 180 : (Math.random() - 0.5) * 720, // Less rotation on mobile for performance
        startScale: 0.1, // Start very small
        delay: isMobile ? i * 12 : i * 8, // Slightly more delay on mobile for smoother animation
        hasStarted: false
      })
    }

    setAnimatedCards(newAnimatedCards)

    // Start animations immediately - use requestAnimationFrame to ensure DOM is ready
    // Double RAF on mobile for better performance
    if (isMobile) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimatedCards(prev => prev.map(card => ({ ...card, hasStarted: true })))
        })
      })
    } else {
      requestAnimationFrame(() => {
        setAnimatedCards(prev => prev.map(card => ({ ...card, hasStarted: true })))
      })
    }

    // Finish animation after all cards have flown, then navigate immediately
    const animationDuration = isMobile ? 1200 : 1000 // ms
    const maxDelay = isMobile ? (cardCount - 1) * 12 : (cardCount - 1) * 8
    
    // Navigate immediately when animation completes - no pause, no fade out delay
    setTimeout(() => {
      setIsFadingOut(true)
      setIsAnimating(false)
      // Navigate immediately - no delay
      onFinish()
    }, animationDuration + maxDelay)

  }, [onFinish, deckButtonPosition])

  // Render a simple white card with only the StyleSync logo
  const renderSimpleLogoCard = () => (
    <div className="relative" style={{
      width: '160px',
      height: '224px',
      transformStyle: 'preserve-3d',
    }}>
      {/* Main Card Container - White/Cream background */}
      <div
        className="absolute inset-0 bg-stone-50 rounded-2xl shadow-2xl"
        style={{
          border: '1px solid rgba(168, 85, 247, 0.25)',
          boxShadow: `
            0 20px 50px rgba(0, 0, 0, 0.2),
            0 8px 16px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.6)
          `,
          transform: 'translateZ(0px)',
        }}
      >
        {/* Inner Border */}
        <div
          className="absolute inset-3 rounded-lg pointer-events-none"
          style={{
            border: '1px solid rgba(0, 0, 0, 0.12)',
            transform: 'translateZ(1px)',
          }}
        />

        {/* Paper Grain Texture */}
        <div
          className="absolute inset-0 rounded-xl opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)
            `,
            transform: 'translateZ(1px)',
          }}
        />

        {/* StyleSync Logo - Centered */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: 'translateZ(2px)',
          }}
        >
          <img
            src={logoImage}
            alt="StyleSync"
            className="h-20 w-auto object-contain"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))',
            }}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 overflow-hidden pointer-events-none"
    >
      {/* Background layer to cover homepage during transition - matches app background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(120% 120% at 0% 0%,
              #9333ea 0%,
              #7c3aed 35%,
              transparent 70%
            ),
            linear-gradient(
              115deg,
              #7c3aed 0%,
              #6d28d9 25%,
              #5b21b6 60%,
              #4c1d95 100%
            )
          `,
          backgroundColor: '#1e1b4b',
          backgroundAttachment: 'fixed',
          opacity: 1, // Always stay opaque to block homepage
          zIndex: 1,
        }}
      />

      {/* Animated Deck Cards - Ripple/Shuffle Effect */}
      {animatedCards.map((animCard) => {
        // Use consistent duration (calculated above)
        const duration = isMobile ? 1200 : 1000
        const deltaX = animCard.endX - animCard.startX
        const deltaY = animCard.endY - animCard.startY

        return (
          <div
            key={animCard.id}
            className="absolute"
            style={{
              left: `${animCard.startX}px`,
              top: `${animCard.startY}px`,
              width: '160px',
              height: '224px',
              // Use translate3d for GPU acceleration on mobile
              transform: animCard.hasStarted
                ? `translate3d(${deltaX}px, ${deltaY}px, 0) rotate(${animCard.endRotation}deg) scale(1)`
                : `translate3d(0, 0, 0) rotate(${animCard.startRotation}deg) scale(${animCard.startScale})`,
              transition: animCard.hasStarted
                ? `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1) ${animCard.delay}ms, opacity 200ms ease-out ${animCard.delay}ms`
                : 'none',
              opacity: (isAnimating && animCard.hasStarted) && !isFadingOut ? 1 : isFadingOut ? 0 : 0,
              zIndex: 10 + animCard.id,
              pointerEvents: 'none',
              transformOrigin: 'center center',
              willChange: 'transform, opacity', // Performance optimization
              backfaceVisibility: 'hidden', // Prevent flickering on mobile
              WebkitBackfaceVisibility: 'hidden' // iOS specific
            }}
          >
            {renderSimpleLogoCard()}
          </div>
        )
      })}
    </div>
  )
}
