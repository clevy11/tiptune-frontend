'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { GlowButton } from '@/components/GlowButton'
import { X, Ticket } from 'lucide-react'

interface JoinEventModalProps {
  open: boolean
  onClose: () => void
}

/** Extract the access token from either a raw code or a full event link. */
function extractToken(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (trimmed.includes('/')) {
    const segments = trimmed.split('/').filter(Boolean)
    return segments[segments.length - 1] ?? ''
  }
  return trimmed
}

export function JoinEventModal({ open, onClose }: JoinEventModalProps) {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleJoin = () => {
    const token = extractToken(value)
    if (!token) {
      setError('Please enter the event code or paste the link shared by your host.')
      return
    }
    setError(null)
    onClose()
    router.push(`/event/${token}`)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Join an event"
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F14] p-6 sm:p-8 shadow-[0_0_40px_rgba(0,245,195,0.1)]"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-lg p-2 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="w-5 h-5 text-[#00F5C3]" aria-hidden />
                <h2 className="text-xl sm:text-2xl font-bold text-white">Join an Event</h2>
              </div>
              <p className="text-sm text-[#D1D5DB]">
                Enter the event code or paste the link your host shared with you.
              </p>
            </div>

            <label className="block text-sm font-medium text-[#D1D5DB] mb-2" htmlFor="event-code">
              Event Code or Link
            </label>
            <input
              id="event-code"
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                if (error) setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoin()
              }}
              placeholder="e.g. abc123 or https://tiptune.space/event/..."
              autoFocus
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-[#00F5C3]/60 focus:ring-2 focus:ring-[#00F5C3]/20 transition-colors"
            />

            {error && (
              <p className="mt-2 text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <div className="mt-6">
              <GlowButton
                glowColor="teal"
                onClick={handleJoin}
                className="w-full min-h-[48px]"
              >
                Join Event
              </GlowButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
