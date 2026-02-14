'use client'

/**
 * Lightweight background for login/register/events (not landing). CSS-only.
 * Dark music-tech theme: teal/purple orbs, no heavy motion.
 */
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#0B0F14]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F14] via-[#121826] to-[#0B0F14]" />
      <div
        className="absolute top-20 left-20 w-72 h-72 rounded-full mix-blend-screen filter blur-[100px] opacity-[0.12] bg-orb bg-orb-1"
        style={{ backgroundColor: '#00F5C3' }}
        aria-hidden
      />
      <div
        className="absolute top-40 right-20 w-96 h-96 rounded-full mix-blend-screen filter blur-[100px] opacity-[0.1] bg-orb bg-orb-2"
        style={{ backgroundColor: '#7C3AED' }}
        aria-hidden
      />
    </div>
  )
}
