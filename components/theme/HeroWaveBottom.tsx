'use client'

/**
 * Multiple overlapping waves that transcend and pass through each other.
 * Pure SVG + CSS. GPU: transform + opacity only. Each wave has its own speed/direction.
 */
const WAVE_WIDTH = 600
const HEIGHT = 100

function buildWavePath(
  fromX: number,
  toX: number,
  phase: number,
  amplitude: number,
  period: number
): string {
  const points: string[] = []
  for (let x = fromX; x <= toX; x += 5) {
    const y = HEIGHT / 2 + amplitude * Math.sin((x / period) * Math.PI * 2 + phase)
    points.push(`${x},${y}`)
  }
  return `M ${points.join(' L ')}`
}

const WAVES = [
  { phase: 0, amplitude: 12, period: 240, speed: 22, reverse: false, opacity: 0.22, top: '10%' },
  { phase: 1.2, amplitude: 10, period: 200, speed: 28, reverse: true, opacity: 0.18, top: '25%' },
  { phase: 0.4, amplitude: 14, period: 280, speed: 18, reverse: false, opacity: 0.15, top: '45%' },
  { phase: 2.1, amplitude: 9, period: 180, speed: 25, reverse: true, opacity: 0.2, top: '60%' },
  { phase: 0.8, amplitude: 11, period: 220, speed: 20, reverse: false, opacity: 0.17, top: '75%' },
  { phase: 1.6, amplitude: 13, period: 260, speed: 24, reverse: true, opacity: 0.19, top: '88%' },
]

export function HeroWaveBottom() {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none select-none"
      aria-hidden
    >
      {WAVES.map((w, i) => {
        const path1 = buildWavePath(0, WAVE_WIDTH, w.phase, w.amplitude, w.period)
        const path2 = buildWavePath(WAVE_WIDTH, WAVE_WIDTH * 2, w.phase, w.amplitude, w.period)
        const path2Rest = path2.split(' ').slice(2).join(' ')
        const pathD = `${path1} ${path2Rest}`
        const viewBoxWidth = WAVE_WIDTH * 2
        const animName = `hero-wave-translate-${w.reverse ? 'rev' : 'fwd'}`
        const duration = w.speed

        return (
          <div
            key={i}
            className="absolute left-0 right-0 h-full hero-wave-layer"
            style={{
              top: w.top,
              animation: `${animName} ${duration}s linear infinite`,
              opacity: w.opacity,
            }}
          >
            <div className="hero-wave-track h-full w-full">
              <svg
                className="hero-wave-svg w-full h-full"
                viewBox={`0 0 ${viewBoxWidth} ${HEIGHT}`}
                preserveAspectRatio="none"
                width="200%"
                height="100%"
              >
                <defs>
                  <linearGradient id={`hero-wave-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00F5C3" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                  <filter id={`hero-wave-glow-${i}`} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d={pathD}
                  fill="none"
                  stroke={`url(#hero-wave-grad-${i})`}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#hero-wave-glow-${i})`}
                />
              </svg>
            </div>
          </div>
        )
      })}
    </div>
  )
}
