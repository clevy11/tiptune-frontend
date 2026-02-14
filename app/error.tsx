'use client'

import { useEffect } from 'react'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { GlassCard } from '@/components/GlassCard'
import { GlowButton } from '@/components/GlowButton'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      <AnimatedBackground />
      <div className="relative z-10 max-w-md w-full">
        <GlassCard glow="red" className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-4 text-red-400">Something went wrong!</h2>
          <p className="text-gray-300 mb-6">
            {error.message || 'An unexpected error occurred'}
          </p>
          <div className="flex gap-4 justify-center">
            <GlowButton onClick={reset} glowColor="blue">
              Try again
            </GlowButton>
            <GlowButton
              onClick={() => window.location.href = '/'}
              variant="outline"
              glowColor="purple"
            >
              Go home
            </GlowButton>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
