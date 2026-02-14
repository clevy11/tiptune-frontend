'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User as UserIcon, Pencil, X } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { GlassCard } from '@/components/GlassCard'
import { GlowButton } from '@/components/GlowButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/api'
import type { User } from '@/lib/types'
import { Role } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DashboardProfileProps {
  user: User
  onUserUpdate?: (user: User) => void
  /** Optional class for the card */
  className?: string
}

export function DashboardProfile({ user, onUserUpdate, className }: DashboardProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(user.name)

  const updateMutation = useMutation({
    mutationFn: async (name: string) => {
      if (user.role === Role.SUPER_ADMIN) {
        return adminApi.updateUser(user.id, { ...user, name })
      }
      return null
    },
    onSuccess: (updated) => {
      if (updated) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(updated))
        }
        onUserUpdate?.(updated)
      } else {
        const next = { ...user, name: editName }
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(next))
        }
        onUserUpdate?.(next)
      }
      setIsEditing(false)
    },
    onError: () => {
      const next = { ...user, name: editName }
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(next))
      }
      onUserUpdate?.(next)
      setIsEditing(false)
    },
  })

  const handleSave = () => {
    const trimmed = editName.trim()
    if (!trimmed) return
    if (trimmed === user.name) {
      setIsEditing(false)
      return
    }
    if (user.role === Role.SUPER_ADMIN) {
      updateMutation.mutate(trimmed)
    } else {
      const next = { ...user, name: trimmed }
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(next))
        onUserUpdate?.(next)
      }
      setIsEditing(false)
    }
  }

  const initial = user.name.charAt(0).toUpperCase() || '?'

  return (
    <GlassCard glow="purple" className={cn('p-4', className)}>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap items-center gap-2"
              >
                <p className="font-semibold text-white text-lg truncate">{user.name}</p>
                <button
                  type="button"
                  onClick={() => {
                    setEditName(user.name)
                    setIsEditing(true)
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-purple-300 transition-colors touch-manipulation"
                  aria-label="Edit profile"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your name"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') {
                      setEditName(user.name)
                      setIsEditing(false)
                    }
                  }}
                />
                <div className="flex gap-2">
                  <GlowButton
                    size="sm"
                    glowColor="teal"
                    onClick={handleSave}
                    disabled={updateMutation.isPending || !editName.trim()}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </GlowButton>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditName(user.name)
                      setIsEditing(false)
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="text-sm text-gray-400 truncate mt-0.5">{user.email}</p>
          <p className="text-xs text-gray-500 capitalize mt-0.5">{user.role.replace('_', ' ')}</p>
        </div>
      </div>
    </GlassCard>
  )
}
