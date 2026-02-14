'use client'

/**
 * Dark overlay for landing. No video — subtle gradient only.
 * Kept for optional use; landing currently uses MusicWaveBackground + HeroWaveBottom.
 */
export function NightLifeBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#0B0F14]/30 via-[#0B0F14]/60 to-[#0B0F14]"
        style={{ mixBlendMode: 'normal' }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-1/3 nightlife-lights" />
    </div>
  )
}
