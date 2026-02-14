'use client'

import { motion } from 'framer-motion'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GlowButtonProps extends ButtonProps {
  glowColor?: 'purple' | 'blue' | 'pink' | 'green' | 'red' | 'teal'
  magnetic?: boolean
}

export function GlowButton({ 
  children, 
  className, 
  glowColor = 'purple',
  magnetic = true,
  ...props 
}: GlowButtonProps) {
  const glowClass = `glow-${glowColor}`
  
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
