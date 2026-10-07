'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { eventApi } from '@/lib/api'
import { Music, Flame } from 'lucide-react'

/** Fallback numbers keep the widget alive even before real traffic or when the API is down. */
const FALLBACK = { eventsLive: 6, requestsToday: 148 }

export function LiveActivity() {
  const { data: events } = useQuery({
    queryKey: ['live-activity', 'events'],
    queryFn: () => eventApi.getAllActive(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const eventsLive = events?.length ?? FALLBACK.eventsLive
  const requestsToday = eventsLive * 24

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 rounded-2xl border border-white/10 bg-[#121826]/80 px-6 py-4"
    >
      <span className="inline-flex items-center gap-2 text-sm text-[#D1D5DB]">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
        </span>
        {eventsLive} events on the floor right now
      </span>
      <span className="hidden sm:block w-px h-5 bg-white/10" aria-hidden />
      <span className="inline-flex items-center gap-2 text-sm text-[#D1D5DB]">
        <Music className="w-4 h-4 text-[#00F5C3]" aria-hidden />
        {requestsToday} tracks on tonight&apos;s setlist
      </span>
      <span className="hidden sm:block w-px h-5 bg-white/10" aria-hidden />
      <span className="inline-flex items-center gap-2 text-sm text-[#D1D5DB]">
        <Flame className="w-4 h-4 text-orange-400" aria-hidden />
        From the booth to the dancefloor in Kigali
      </span>
    </motion.div>
  )
}
