import logoImage from '../logo.png'

interface LogoHeaderProps {
  welcomeMessage?: string
}

/**
 * LogoHeader Component
 * 
 * Clean, minimal logo header - treated like a signature, not a badge.
 * Simple, confident, and tasteful.
 * 
 * Design Philosophy:
 * - No containers, no bubbles, no tricks
 * - Logo stands on its own with subtle dual-tone glow
 * - Purple hue on right, pink hue on left
 * - Bigger size for better presence
 * - Safe area padding for iOS notch
 * - Welcome message positioned directly below logo
 */
export function LogoHeader({ welcomeMessage }: LogoHeaderProps) {
  return (
    <div className="w-full flex flex-col items-center mb-8 pt-safe pb-4">
      {/* Logo with dual-tone glow - pink on left, purple on right */}
      <div className="relative mb-3">
        <img 
          src={logoImage} 
          alt="StyleSync" 
          className="h-44 w-auto object-contain logo-glow"
        />
      </div>

      {/* Welcome Message - positioned slightly below logo */}
      {welcomeMessage && (
        <p className="text-white text-lg font-medium tracking-tight">
          {welcomeMessage}
        </p>
      )}

      {/* Dual-tone glow effect - pink left, purple right */}
      <style>{`
        .logo-glow {
          /* Pink glow on the left side (negative x-offset) */
          filter: drop-shadow(-20px 0 35px rgba(236, 72, 153, 0.5)) 
                  /* Purple glow on the right side (positive x-offset) */
                  drop-shadow(20px 0 35px rgba(147, 51, 234, 0.5));
        }
        /* Safe area padding for iOS notch and status bar */
        .pt-safe {
          padding-top: max(env(safe-area-inset-top, 1rem), 1rem);
        }
      `}</style>
    </div>
  )
}
