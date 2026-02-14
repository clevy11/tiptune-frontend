'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  /** Side from which drawer slides. Default: left */
  side?: 'left' | 'right'
  /** Accessible label for the drawer (e.g. "Main menu") */
  ariaLabel?: string
  /** Optional class for the panel */
  className?: string
}

/**
 * Mobile-first drawer: slides in from left or right.
 * Tap overlay to close. Prevents body scroll when open.
 */
export function MobileDrawer({
  open,
  onClose,
  children,
  side = 'left',
  ariaLabel = 'Menu',
  className = '',
}: MobileDrawerProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            role="presentation"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-label={ariaLabel}
            aria-modal="true"
            initial={{ x: side === 'left' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'left' ? '-100%' : '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className={`fixed top-0 bottom-0 z-50 w-[min(320px,85vw)] max-w-full bg-[#121826] border border-white/10 shadow-xl overflow-y-auto ${side === 'left' ? 'left-0' : 'right-0'} ${className}`}
          >
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
