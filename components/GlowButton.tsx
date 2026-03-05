'use client'

import { motion } from 'framer-motion'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GlowButtonProps extends ButtonProps {
  glowColor?: 'purple' | 'blue' | 'pink' | 'green' | 'red' | 'teal'
  /** Disable scale animation; use CSS hover overlay only (for dashboards). */
  noMotion?: boolean
  magnetic?: boolean
}

export function GlowButton({ 
  children, 
  className, 
  glowColor = 'purple',
  noMotion = false,
  magnetic = true,
  ...props 
}: GlowButtonProps) {
  const glowClass = `glow-${glowColor}`
  
  if (noMotion) {
    return (
      <Button
        className={cn(glowClass, 'transition-all hover:brightness-110', className)}
        {...props}
      >
        {children}
      </Button>
    )
  }
  
  return (
    <motion.div
      whileHover={magnetic ? { scale: 1.05 } : {}}
      whileTap={magnetic ? { scale: 0.95 } : {}}
      className="inline-block"
    >
      <Button
        className={cn(glowClass, className)}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  )
}
