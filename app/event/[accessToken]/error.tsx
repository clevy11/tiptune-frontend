'use client'

import { useEffect } from 'react'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { GlassCard } from '@/components/GlassCard'
import { GlowButton } from '@/components/GlowButton'
import { AlertCircle } from 'lucide-react'

export default function EventError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Event page error:', error)
  }, [error])

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      <AnimatedBackground />
      <div className="relative z-10 max-w-md w-full">
        <GlassCard glow="red" className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-4 text-red-400">Error Loading Event</h2>
          <p className="text-gray-300 mb-6">
            {error.message || 'Failed to load event. Please try again.'}
          </p>
          <div className="flex gap-4">
            <GlowButton onClick={reset} glowColor="blue" className="flex-1">
              Try again
            </GlowButton>
            <GlowButton
              onClick={() => window.location.href = '/'}
              variant="outline"
              glowColor="purple"
              className="flex-1"
            >
              Go home
            </GlowButton>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
