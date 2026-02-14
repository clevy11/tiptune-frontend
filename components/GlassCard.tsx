'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: 'purple' | 'blue' | 'pink' | 'red' | 'green' | 'yellow' | 'none'
  /** Skip entrance animation for list/table containers to improve scroll performance */
  noEnterAnimation?: boolean
}

export function GlassCard({ children, className, hover = true, glow = 'purple', noEnterAnimation = false }: GlassCardProps) {
  const glowClass = glow !== 'none' ? `glow-${glow}` : ''
  const baseClass = cn('glass rounded-2xl p-6 shadow-2xl', glowClass, className)

  if (noEnterAnimation) {
    return (
      <div
        className={baseClass}
      >
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className={baseClass}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={hover ? {
        scale: 1.02,
        transition: { duration: 0.2 }
      } : {}}
    >
      {children}
    </motion.div>
  )
}
