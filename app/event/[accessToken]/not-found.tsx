'use client'

import Link from 'next/link'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { GlassCard } from '@/components/GlassCard'
import { GlowButton } from '@/components/GlowButton'
import { Music } from 'lucide-react'

export default function EventNotFound() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      <AnimatedBackground />
      <div className="relative z-10 max-w-md w-full">
        <GlassCard glow="purple" className="p-8 text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-bold mb-4 text-gradient">Event Not Found</h2>
          <p className="text-gray-300 mb-6">
            The event you&apos;re looking for doesn&apos;t exist or has expired.
          </p>
          <Link href="/">
            <GlowButton glowColor="pink" className="w-full">
              Go Home
            </GlowButton>
          </Link>
        </GlassCard>
      </div>
    </div>
  )
}
