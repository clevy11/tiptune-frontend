'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FullScreenOverlay({
  open,
  title,
  onClose,
  headerExtra,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  headerExtra?: React.ReactNode
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 flex flex-col">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-gray-900/60">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">{title}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {headerExtra}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="min-h-[44px] gap-2"
                  aria-label="Close full screen"
                >
                  <X className="w-4 h-4" />
                  Close
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="max-w-[1200px] mx-auto w-full p-4 sm:p-6">
                <motion.div
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-6"
                >
                  {children}
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

