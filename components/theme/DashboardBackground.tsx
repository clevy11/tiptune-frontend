'use client'

/**
 * Matrix-style background for dashboards (same look as login form panel).
 * Grid + dark base + subtle purple/cyan glows. No animation.
 */
export function DashboardBackground() {
  return (
    <div className="fixed inset-0 -z-10 dashboard-matrix-bg" aria-hidden>
      {/* Radial glow bottom-right (like login form panel) */}
      <div
        className="absolute -bottom-24 -right-24 h-[420px] w-[420px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(123,47,247,0.08) 0%, transparent 70%)',
        }}
        aria-hidden
      />
      {/* Left edge glow */}
      <div
        className="absolute left-0 top-0 bottom-0 w-px pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(34,211,238,0.15), rgba(168,85,247,0.15), transparent)',
        }}
        aria-hidden
      />
    </div>
  )
}
