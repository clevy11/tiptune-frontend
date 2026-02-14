'use client'

import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorMessageProps {
  message: string
  className?: string
  /** Optional field name for accessibility */
  fieldId?: string
}

export function ErrorMessage({ message, className, fieldId }: ErrorMessageProps) {
  if (!message) return null

  return (
    <motion.p
      id={fieldId ? `${fieldId}-error` : undefined}
      role="alert"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-center gap-2 text-sm text-red-400 mt-1.5',
        'rounded-lg px-3 py-2 bg-red-500/10 border border-red-500/30',
        className
      )}
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </motion.p>
  )
}

interface FieldErrorWrapperProps {
  error?: string
  children: React.ReactNode
  fieldId?: string
  /** When true, adds red glow border to the field container */
  showErrorStyle?: boolean
}

export function FieldErrorWrapper({
  error,
  children,
  fieldId,
  showErrorStyle = true,
}: FieldErrorWrapperProps) {
  return (
    <div className="space-y-0">
      <motion.div
        animate={error && showErrorStyle ? { x: [0, -4, 4, -2, 2, 0] } : {}}
        transition={{ duration: 0.4 }}
        className={cn(
          error && showErrorStyle && 'rounded-lg ring-2 ring-red-500/50 bg-red-500/5'
        )}
      >
        {children}
      </motion.div>
      {error && <ErrorMessage message={error} fieldId={fieldId} />}
    </div>
  )
}
