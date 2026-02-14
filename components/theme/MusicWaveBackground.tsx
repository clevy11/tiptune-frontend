'use client'

/**
 * GPU-accelerated moving wave background. CSS only (transform + opacity).
 * Neon teal/purple glow, slow horizontal motion. For landing page only.
 */
export function MusicWaveBackground() {
  return (
    <div
      className="fixed inset-0 -z-20 overflow-hidden pointer-events-none"
      aria-hidden
    >
      {/* Base dark fill */}
      <div className="absolute inset-0 bg-[#0B0F14]" />
      {/* Layered gradient waves - translateX only for GPU */}
      <div className="absolute inset-0 music-wave-layer music-wave-1" />
      <div className="absolute inset-0 music-wave-layer music-wave-2" />
      <div className="absolute inset-0 music-wave-layer music-wave-3" />
    </div>
  )
}
