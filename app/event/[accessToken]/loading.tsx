'use client'

import { AnimatedBackground } from '@/components/AnimatedBackground'
import { Music } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <AnimatedBackground />
      <div className="relative z-10 text-center">
        <Music className="w-16 h-16 mx-auto mb-4 text-purple-400 animate-pulse" />
        <p className="text-xl text-gray-300">Loading event...</p>
      </div>
    </div>
  )
}
