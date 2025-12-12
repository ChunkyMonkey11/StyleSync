import { useState } from 'react'
import { CardSuit, SUIT_ICONS, SUIT_COLORS } from '../types/card'

interface SuitCardProps {
  suit: CardSuit
  isCurrent?: boolean
}

const SUIT_DESCRIPTIONS: Record<CardSuit, {
  name: string
  archetype: string
  vibe: string
  personality: string
  commonTags: string[]
}> = {
  spades: {
    name: 'Edge',
    archetype: 'Streetwear / Bold / Culture-forward',
    vibe: 'Confident, experimental, plugged into trends early',
    personality: "I'm tapped into what's next.",
    commonTags: ['Streetwear', 'Sneakers', 'Techwear', 'Drops', 'Minimal black fits']
  },
  hearts: {
    name: 'Everyday',
    archetype: 'Casual / Lifestyle / Comfortable',
    vibe: 'Approachable, effortless, real-life wearable',
    personality: "I know what works for me.",
    commonTags: ['Casual', 'Athleisure', 'Essentials', 'Comfort']
  },
  diamonds: {
    name: 'Premium',
    archetype: 'Luxury / Elevated / Polished',
    vibe: 'Intentional, refined, quality-first',
    personality: 'Details matter.',
    commonTags: ['Luxury', 'Formal', 'Designer', 'Statement accessories']
  },
  clubs: {
    name: 'Archive',
    archetype: 'Vintage / Thrift / Curated',
    vibe: 'Thoughtful, nostalgic, individualistic',
    personality: 'Style has history.',
    commonTags: ['Vintage', 'Thrift', 'Archive fashion', 'Sustainable']
  }
}

export function SuitCard({ suit, isCurrent }: SuitCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const suitConfig = SUIT_COLORS[suit]
  const suitIcon = SUIT_ICONS[suit]
  const description = SUIT_DESCRIPTIONS[suit]

  return (
    <div className="perspective-1000 w-full">
      <div
        className={`relative w-full aspect-[4/5] transition-transform duration-700 transform-style-preserve-3d cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsFlipped(!isFlipped)
          }
        }}
        aria-label={`Flip ${description.name} suit card`}
      >
        {/* Front Side */}
        <div
          className={`absolute inset-0 w-full h-full rounded-lg border-2 ${suitConfig.border} bg-gradient-to-br ${suitConfig.gradient} shadow-xl backface-hidden p-4 flex flex-col items-center justify-center text-white`}
        >
          <div className="text-4xl mb-2">{suitIcon}</div>
          <div className="font-bold text-lg mb-1">{description.name}</div>
          {isCurrent && (
            <span className="inline-block px-2 py-0.5 bg-white/20 text-white text-xs rounded mt-1">
              Your Suit
            </span>
          )}
        </div>

        {/* Back Side */}
        <div
          className={`absolute inset-0 w-full h-full rounded-lg border-2 ${suitConfig.border} bg-gradient-to-br ${suitConfig.gradient} shadow-xl backface-hidden rotate-y-180 p-3 flex flex-col text-white overflow-y-auto`}
        >
          <div className="text-center mb-2 flex-shrink-0">
            <div className="text-xl mb-0.5">{suitIcon}</div>
            <div className="font-bold text-sm mb-0.5">{description.name}</div>
            <div className="text-[10px] opacity-75">Tap to flip back</div>
          </div>

          <div className="flex-1 space-y-2 text-[11px] min-h-0">
            <div>
              <div className="font-semibold opacity-90 mb-0.5 text-xs">Archetype</div>
              <div className="opacity-80 leading-tight">{description.archetype}</div>
            </div>

            <div>
              <div className="font-semibold opacity-90 mb-0.5 text-xs">Vibe</div>
              <div className="opacity-80 leading-tight">{description.vibe}</div>
            </div>

            <div>
              <div className="font-semibold opacity-90 mb-0.5 text-xs">Personality</div>
              <div className="opacity-80 italic leading-tight">"{description.personality}"</div>
            </div>

            <div>
              <div className="font-semibold opacity-90 mb-1 text-xs">Common Tags</div>
              <div className="flex flex-wrap gap-1">
                {description.commonTags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-1.5 py-0.5 bg-white/20 text-white text-[10px] rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  )
}

