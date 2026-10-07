'use client'

import { motion } from 'framer-motion'
import { Play, ThumbsUp, Share2, Radio, Music, MapPin, Calendar, Sparkles } from 'lucide-react'

const REQUESTS = [
  { id: 1, song: 'Goosebumps', artist: 'Travis Scott', requester: 'Alex', votes: 24 },
  { id: 2, song: 'Calm Down', artist: 'Rema', requester: 'Grace', votes: 18 },
  { id: 3, song: 'Sofamba', artist: 'Meddy', requester: 'Jean', votes: 12 },
]

const ACTIVITY = [
  { id: 1, text: 'New request from Alex' },
  { id: 2, text: 'Track added to queue' },
  { id: 3, text: 'Tip received — RWF 2,000' },
]

export function DashboardPreview() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Your Event Dashboard
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 border border-green-500/40 px-3 py-1 text-xs font-medium text-green-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" aria-hidden />
              Live
            </span>
          </div>
          <p className="text-base sm:text-lg text-[#D1D5DB] max-w-2xl mx-auto">
            Your DJ booth in the cloud. Manage requests, read the room, and count the till — all while the music plays.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="rounded-2xl sm:rounded-3xl border border-white/10 bg-[#121826]/90 shadow-[0_0_40px_rgba(0,245,195,0.08)] overflow-hidden"
        >
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 px-5 sm:px-8 py-4 sm:py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F5C3]/30 to-purple-500/30 border border-white/10 flex items-center justify-center">
                <Music className="w-5 h-5 text-[#00F5C3]" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-white">Saturday Night Live</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" aria-hidden /> Sat, Aug 15
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" aria-hidden /> Kigali
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg border border-[#00F5C3]/40 bg-[#00F5C3]/10 px-3 py-2 text-sm font-medium text-[#00F5C3]">
                <Share2 className="w-4 h-4" aria-hidden />
                Share Link
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-green-500/20 border border-green-500/50 px-3 py-2 text-sm font-medium text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                Go Live
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3">
            {/* Request queue */}
            <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r border-white/10">
              <div className="flex items-center justify-between px-5 sm:px-8 pt-5 pb-3">
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Live Request Queue
                </p>
                <span className="text-xs text-[#00F5C3]">54 requests tonight</span>
              </div>
              <div className="px-5 sm:px-8 pb-5 sm:pb-6 space-y-3">
                {REQUESTS.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-[#00F5C3]/15 border border-[#00F5C3]/30 flex items-center justify-center">
                      <Play className="w-4 h-4 text-[#00F5C3] ml-0.5" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{r.song}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {r.artist} · requested by {r.requester}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-[#00F5C3]">
                      <ThumbsUp className="w-3.5 h-3.5" aria-hidden />
                      {r.votes}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Activity feed */}
            <div className="bg-white/[0.02]">
              <p className="px-5 sm:px-8 pt-5 pb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Activity Feed
              </p>
              <div className="px-5 sm:px-8 pb-5 sm:pb-6 space-y-3">
                {ACTIVITY.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="flex items-center gap-2 text-sm text-[#D1D5DB]"
                  >
                    <Sparkles className="w-4 h-4 text-[#00F5C3] shrink-0" aria-hidden />
                    {a.text}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
