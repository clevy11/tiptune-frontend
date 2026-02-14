'use client'

/**
 * Modern futuristic hero visual: glowing core + equalizer-style bars.
 * CSS-only, GPU-friendly (transform + opacity). No 3D/Three.js.
 */
const BAR_COUNT = 20
const bars = Array.from({ length: BAR_COUNT }, (_, i) => i)

export function HeroVisual() {
  return (
    <div className="relative w-full max-w-md h-[380px] flex items-center justify-center mx-auto">
      {/* Outer rings - subtle breathe */}
      <div
        className="absolute w-64 h-64 rounded-full border border-[#00F5C3]/10 hero-visual-ring"
        aria-hidden
      />
      <div
        className="absolute w-80 h-80 rounded-full border border-[#7C3AED]/8 hero-visual-ring hero-visual-ring-2"
        aria-hidden
      />
      {/* Equalizer bars in a semicircle */}
      <div className="absolute inset-0 flex items-end justify-center gap-0.5 pb-24">
        {bars.map((i) => (
          <div
            key={i}
            className="flex flex-col items-center hero-bar-wrapper"
            style={{
              transform: `rotate(${(i - BAR_COUNT / 2) * 5}deg) translateY(${(i % 2) * 8}px)`,
            }}
          >
            <div
              className="w-2 rounded-full hero-equalizer-bar origin-bottom"
              style={{
                animationDelay: `${(i * 0.05) % 1.4}s`,
                height: 40 + (i % 5) * 12,
              }}
            />
          </div>
        ))}
      </div>
      {/* Glowing core */}
      <div
        className="absolute w-36 h-36 rounded-full opacity-90 hero-visual-core"
        aria-hidden
      />
      <div
        className="absolute w-28 h-28 rounded-full bg-[#0B0F14] border border-[#00F5C3]/20 hero-visual-inner"
        aria-hidden
      />
    </div>
  )
}
