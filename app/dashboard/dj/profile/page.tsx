'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Pencil, X } from 'lucide-react'
import { DashboardBackground } from '@/components/theme/DashboardBackground'
import { GlassCard } from '@/components/GlassCard'
import { GlowButton } from '@/components/GlowButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { djApi } from '@/lib/api'
import { DjProfileLinksEditor } from '@/components/dashboard/DjProfileLinksEditor'
import { getCurrentUser } from '@/lib/auth'
import { shouldRedirect } from '@/lib/roleGuard'
import { useMounted } from '@/hooks/useMounted'
import { Role } from '@/lib/types'
import type { User } from '@/lib/types'

export default function DjProfilePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const mounted = useMounted()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')

  const currentUser = mounted ? getCurrentUser() : null

  useEffect(() => {
    if (!mounted) return
    const user = getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }
    const redirect = shouldRedirect(user.role, '/dashboard/dj/profile')
    if (redirect) router.push(redirect)
  }, [mounted, router])

  const { data: profile, isLoading } = useQuery<User>({
    queryKey: ['dj-my-profile'],
    queryFn: () => djApi.getMyProfile(),
    enabled: !!currentUser && (currentUser.role === Role.DJ || currentUser.role === Role.ARTIST),
  })

  useEffect(() => {
    if (profile?.name != null) setEditName(profile.name)
  }, [profile?.name])

  const updateProfileMutation = useMutation({
    mutationFn: (name: string) => djApi.updateMyProfile({ name }),
    onSuccess: (updated) => {
      if (typeof window !== 'undefined' && updated) {
        localStorage.setItem('user', JSON.stringify(updated))
      }
      queryClient.setQueryData(['dj-my-profile'], updated)
      setIsEditingName(false)
    },
  })

  const handleSaveName = () => {
    const trimmed = editName?.trim()
    if (!trimmed || trimmed === profile?.name) {
      setIsEditingName(false)
      return
    }
    updateProfileMutation.mutate(trimmed)
  }

  if (!mounted || !currentUser) return null

  return (
    <div className="min-h-screen relative">
      <DashboardBackground />
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/dj"
              className="p-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 text-gray-200 transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient">My Profile</h1>
          </div>

          {isLoading ? (
            <GlassCard glow="purple" className="p-8 text-center">
              <p className="text-gray-400">Loading profile...</p>
            </GlassCard>
          ) : (
            <>
              {/* Name card */}
              <GlassCard glow="purple" className="p-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-purple-400" />
                  Display name
                </h2>
                <p className="text-sm text-gray-400 mb-3">
                  This name is shown on your event page when people request songs or tip you.
                </p>
                {!isEditingName ? (
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-medium text-white flex-1">{profile?.name ?? '—'}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setEditName(profile?.name ?? '')
                        setIsEditingName(true)
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your name"
                      className="flex-1 bg-white/10 border-white/20 text-white"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName()
                        if (e.key === 'Escape') {
                          setEditName(profile?.name ?? '')
                          setIsEditingName(false)
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <GlowButton
                        size="sm"
                        glowColor="teal"
                        onClick={handleSaveName}
                        disabled={updateProfileMutation.isPending || !editName?.trim()}
                      >
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                      </GlowButton>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditName(profile?.name ?? '')
                          setIsEditingName(false)
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </GlassCard>

              {/* Profile links */}
              <DjProfileLinksEditor />
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
