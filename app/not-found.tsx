'use client'

import Link from 'next/link'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { GlassCard } from '@/components/GlassCard'
import { GlowButton } from '@/components/GlowButton'
import { Music, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      <AnimatedBackground />
      <div className="relative z-10 max-w-md w-full">
        <GlassCard glow="purple" className="p-8 text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h2 className="text-4xl font-bold mb-4 text-gradient">404</h2>
          <p className="text-gray-300 mb-6 text-lg">
            Page not found
          </p>
          <p className="text-gray-400 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link href="/">
            <GlowButton glowColor="pink" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </GlowButton>
          </Link>
        </GlassCard>
      </div>
    </div>
  )
}
