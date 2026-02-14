'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { eventApi } from '@/lib/api'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { GlassCard } from '@/components/GlassCard'
import { GlowButton } from '@/components/GlowButton'
import { Music } from 'lucide-react'
import type { Event } from '@/lib/types'

export default function EventsPage() {
  const { data: events, isLoading, isError, error } = useQuery<Event[]>({
    queryKey: ['events', 'active'],
    queryFn: async () => {
      try {
        return await eventApi.getAllActive()
      } catch (err) {
        console.error('Failed to fetch events:', err)
        throw err
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackground />
        <div className="relative z-10 text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-purple-400 animate-pulse" />
          <p className="text-xl text-gray-300">Loading events...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackground />
        <div className="relative z-10 max-w-md w-full">
          <GlassCard glow="red" className="p-8 text-center">
            <Music className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold mb-4 text-red-400">Error Loading Events</h2>
            <p className="text-gray-300 mb-6">
              {error instanceof Error ? error.message : 'Failed to load events'}
            </p>
            <GlowButton
              onClick={() => window.location.reload()}
              glowColor="blue"
              className="w-full"
            >
              Try Again
            </GlowButton>
          </GlassCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
        >
          <div className="flex items-center gap-3">
            <Music className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" aria-hidden />
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Active Events</h1>
          </div>
          <Link href="/dashboard">
            <GlowButton glowColor="pink" className="min-h-[44px] touch-manipulation w-full sm:w-auto">
              My Dashboard
            </GlowButton>
          </Link>
        </motion.div>

        {!events || events.length === 0 ? (
          <GlassCard glow="blue" className="text-center py-12">
            <Music className="w-16 h-16 mx-auto mb-4 text-gray-600" aria-hidden />
            <p className="text-gray-400 text-base sm:text-lg">No active events at the moment.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/events/${event.id}`}>
                  <GlassCard glow="purple" className="h-full">
                    <h2 className="text-xl font-bold mb-2 text-gradient">
                      {event.name}
                    </h2>
                    {event.description && (
                      <p className="text-gray-300 mb-4 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="text-sm text-gray-400">
                      <p>
                        {new Date(event.startTime).toLocaleString()} -{' '}
                        {new Date(event.endTime).toLocaleString()}
                      </p>
                      <p className="mt-1">By: {event.createdBy.name}</p>
                    </div>
                    <div className="mt-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/50">
                        {event.status}
                      </span>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
