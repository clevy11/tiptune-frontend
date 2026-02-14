'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { userApi, authApi, songRequestApi } from '@/lib/api'
import { DashboardBackground } from '@/components/theme/DashboardBackground'
import { GlassCard } from '@/components/GlassCard'
import { GlowButton } from '@/components/GlowButton'
import { Button } from '@/components/ui/button'
import { DashboardProfile } from '@/components/dashboard/DashboardProfile'
import { Music, LogOut, Calendar, User as UserIcon, Sparkles, ListMusic } from 'lucide-react'
import type { PublicEvent, SongRequest, User } from '@/lib/types'
import { RequestStatus } from '@/lib/types'
import { Role } from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'
import { shouldRedirect } from '@/lib/roleGuard'
import { useMounted } from '@/hooks/useMounted'

export default function UserDashboardPage() {
  const router = useRouter()
  const mounted = useMounted()
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const currentUser = mounted ? (profileUser ?? getCurrentUser()) : null

  useEffect(() => {
    if (mounted) setProfileUser(getCurrentUser())
  }, [mounted])

  // Role guard
  useEffect(() => {
    if (!mounted) return
    const user = getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }

    const redirect = shouldRedirect(user.role, '/dashboard/user')
    if (redirect) {
      router.push(redirect)
    }
  }, [mounted, router])

  const { data: events, isLoading } = useQuery<PublicEvent[]>({
    queryKey: ['public-events'],
    queryFn: userApi.getPublicEvents,
    enabled: !!currentUser && currentUser.role === Role.USER,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const { data: myRequests } = useQuery<SongRequest[]>({
    queryKey: ['my-requests'],
    queryFn: songRequestApi.getMyRequests,
    enabled: !!currentUser && currentUser.role === Role.USER,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const handleLogout = () => {
    authApi.logout()
    router.push('/login')
  }

  // Consistent placeholder until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="relative z-10 text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-purple-400 animate-pulse" />
          <p className="text-xl text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser || currentUser.role !== Role.USER) {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <DashboardBackground />
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Profile + Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-8 h-8 text-pink-400" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gradient">Nightlife Events</h1>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="self-start sm:self-center">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
          {currentUser && (
            <DashboardProfile user={currentUser} onUserUpdate={setProfileUser} className="mb-0" />
          )}
        </motion.div>

        {/* My Requests Section */}
        {myRequests && myRequests.length > 0 && (
          <GlassCard glow="purple" className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gradient">
              <ListMusic className="w-6 h-6" />
              My Requests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-lg p-4 border border-white/10"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-200">{request.song?.title || 'Unknown'}</p>
                      <p className="text-sm text-gray-400">{request.song?.artist || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 mt-1">{request.event?.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      request.status === RequestStatus.PENDING ? 'bg-yellow-500/20 text-yellow-300' :
                      request.status === RequestStatus.ACCEPTED ? 'bg-green-500/20 text-green-300' :
                      request.status === RequestStatus.DECLINED ? 'bg-red-500/20 text-red-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Events Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Music className="w-12 h-12 text-purple-400" />
            </motion.div>
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <motion.div
                key={event.accessToken}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                style={{ perspective: '1000px' }}
              >
                <GlassCard glow="pink" className="h-full flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        <Music className="w-12 h-12 text-pink-400 mb-2" />
                      </motion.div>
                      <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                        LIVE
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-2 text-gradient">{event.name}</h2>
                    
                    {event.description && (
                      <p className="text-gray-300 mb-4 line-clamp-2">{event.description}</p>
                    )}
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <UserIcon className="w-4 h-4" />
                        <span className="font-medium text-purple-400">{event.djName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(event.startTime).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.startTime).toLocaleTimeString()} -{' '}
                        {new Date(event.endTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <Link href={`/event/${event.accessToken}`}>
                    <GlowButton
                      glowColor="pink"
                      className="w-full text-lg py-6"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Request a Song
                    </GlowButton>
                  </Link>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <GlassCard glow="purple" className="text-center py-20">
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="mb-4"
            >
              <Music className="w-20 h-20 mx-auto text-purple-400" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">No Events Available</h2>
            <p className="text-gray-400">
              Check back later for exciting nightlife events!
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  )
}
