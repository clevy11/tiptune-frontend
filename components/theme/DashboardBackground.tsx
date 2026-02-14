'use client'

/**
 * Static dark gradient for dashboards. No continuous animation.
 * Performance-first: single layer, no motion.
 */
export function DashboardBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 bg-dashboard"
      aria-hidden
    />
  )
}
