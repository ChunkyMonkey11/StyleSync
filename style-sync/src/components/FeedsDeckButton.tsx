import { useEffect, useRef } from 'react'
import logoImage from '../logo.png'

interface FeedsDeckButtonProps {
  onOpen: () => void
  disabled?: boolean
}

export function FeedsDeckButton({ onOpen, disabled = false }: FeedsDeckButtonProps) {
  const deckRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Subtle idle animation - slow bob
  useEffect(() => {
    if (disabled) return

    const deck = deckRef.current
    if (!deck) return

    deck.style.animation = 'deckIdle 3s ease-in-out infinite'

    return () => {
      if (deck) {
        deck.style.animation = ''
      }
    }
  }, [disabled])


  // Mouse move parallax effect
  useEffect(() => {
    if (disabled) return

    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const deltaX = (e.clientX - centerX) / rect.width
      const deltaY = (e.clientY - centerY) / rect.height

      const rotateY = deltaX * 4
      const rotateX = -deltaY * 4

      if (deckRef.current) {
        deckRef.current.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateZ(0)`
      }
    }

    const handleMouseLeave = () => {
      if (deckRef.current) {
        deckRef.current.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0)'
      }
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [disabled])

  return (
    <>
      <div ref={containerRef} className="flex justify-center items-center mb-6 py-4">
        <button
          ref={deckRef}
          onClick={onOpen}
          disabled={disabled}
          className={`relative ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'} transition-transform duration-200 focus:outline-none`}
          style={{
            width: '160px',
            height: '224px',
            transformStyle: 'preserve-3d',
            perspective: '1000px'
          }}
          aria-label="Open Feeds Deck"
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Stacked Cards Effect - 2 cards behind (refined) */}
          {[2, 1].map((index) => {
            const offset = index * 4
            const rotation = index === 1 ? -1.2 : -2.5 // Slightly adjusted rotation

            return (
              <div
                key={index}
                className="absolute bg-stone-50 rounded-2xl"
                style={{
                  width: '160px',
                  height: '224px',
                  left: 0,
                  top: 0,
                  transform: `translate(${offset}px, ${offset}px) rotate(${rotation}deg)`,
                  transformStyle: 'preserve-3d',
                  zIndex: 3 - index,
                  opacity: 0.25 - (index * 0.08), // Reduced opacity
                  boxShadow: `0 ${6 + index * 1.5}px ${12 + index * 3}px rgba(0, 0, 0, ${0.08 - index * 0.02})`, // Softer shadows further back
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                }}
              />
            )
          })}

          {/* Main Card Container - Cream background (playing card feel) */}
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
            {/* Inner Border - Hairline (playing card frame) */}
            <div
              className="absolute inset-3 rounded-lg pointer-events-none"
              style={{
                border: '1px solid rgba(0, 0, 0, 0.12)', // Slightly more visible
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

            {/* ZONE 1: Top - Logo + FEEDS Brand */}
            <div
              className="absolute top-5 left-0 right-0"
              style={{
                transform: 'translateZ(2px)',
              }}
            >
              {/* StyleSync Logo - Top Center */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <img 
                  src={logoImage} 
                  alt="StyleSync" 
                  className="h-16 w-auto object-contain"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))',
                  }}
                />
              </div>

              {/* FEEDS - Display Font (more authoritative) */}
              <h2
                className="text-center text-2xl font-black mb-2"
                style={{
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  color: '#0a0a0a', // Near-black for more authority
                  letterSpacing: '0.08em', // Increased tracking-wide
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  lineHeight: '1.1',
                  fontWeight: 900, // Heavier weight
                }}
              >
                FEEDS
              </h2>

              {/* Subtitle - Directly below FEEDS (better contrast) */}
              <div
                className="text-center text-xs font-normal px-4"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
                  color: '#444', // Darker for better readability
                  letterSpacing: '0.02em',
                  lineHeight: '1.3', // Reduced line height
                }}
              >
                See what your friends are into
              </div>
            </div>

            {/* ZONE 3: Bottom - Action Label (more interactive) */}
            <div
              className="absolute bottom-6 left-0 right-0 text-center"
              style={{
                transform: 'translateZ(2px)',
              }}
            >
              <div
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
                  color: '#a855f7',
                  borderColor: 'rgba(168, 85, 247, 0.3)', // Thin pill outline
                  letterSpacing: '0.12em',
                  fontSize: '11px',
                  fontWeight: 600, // Increased weight
                }}
              >
                <span>OPEN DECK</span>
                <span style={{ fontSize: '10px', marginLeft: '2px' }}>→</span>
              </div>
            </div>

          </div>
        </button>
      </div>

      <style>{`
        @keyframes deckIdle {
          0%, 100% {
            transform: perspective(1000px) translateY(0px) rotateY(0deg) rotateX(0deg);
          }
          50% {
            transform: perspective(1000px) translateY(-3px) rotateY(0.5deg) rotateX(-0.5deg);
          }
        }


        @media (prefers-reduced-motion: reduce) {
          button {
            animation: none !important;
          }
          * {
            animation: none !important;
          }
        }

        button {
          will-change: transform;
          backface-visibility: hidden;
        }
      `}</style>
    </>
  )
}
