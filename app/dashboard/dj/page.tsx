'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { djApi, songRequestApi, authApi } from '@/lib/api'
import { websocketService } from '@/lib/websocket'
import { DashboardBackground } from '@/components/theme/DashboardBackground'
import { GlassCard } from '@/components/GlassCard'
import { GlowButton } from '@/components/GlowButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Music, Plus, LogOut, Menu, CheckCircle2, XCircle, PlayCircle, BarChart3 } from 'lucide-react'
import type { DjEvent, DjSongRequest, EventRequest, Notification } from '@/lib/types'
import { EventStatus, RequestStatus, Role } from '@/lib/types'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { ToastNotification } from '@/components/notifications/ToastNotification'
import { useNotificationStore } from '@/store/notificationStore'
import { getCurrentUserId, getCurrentUser } from '@/lib/auth'
import { shouldRedirect, getDashboardPath } from '@/lib/roleGuard'
import { useMounted } from '@/hooks/useMounted'
import { getApiErrorMessage } from '@/lib/apiClient'
import { ErrorMessage, FieldErrorWrapper } from '@/components/ui/ErrorMessage'
import { MobileDrawer } from '@/components/ui/MobileDrawer'
import { QRDownload } from '@/components/export/QRDownload'
import { ReportExport } from '@/components/export/ReportExport'

export default function DjDashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const mounted = useMounted()
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [createEventError, setCreateEventError] = useState<string | null>(null)
  const [newEvent, setNewEvent] = useState<EventRequest>({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    status: EventStatus.ACTIVE,
  })

  // Only read from localStorage after mount to avoid hydration mismatch
  const currentUser = mounted ? getCurrentUser() : null
  const currentUserId = mounted ? getCurrentUserId() : null

  // Role guard
  useEffect(() => {
    if (!mounted) return
    const user = getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }

    const redirect = shouldRedirect(user.role, '/dashboard/dj')
    if (redirect) {
      router.push(redirect)
    }
  }, [mounted, router])

  const { data: events } = useQuery<DjEvent[]>({
    queryKey: ['dj-events'],
    queryFn: djApi.getEvents,
    enabled: !!currentUser && (currentUser.role === Role.DJ || currentUser.role === Role.ARTIST),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const { data: requests } = useQuery<DjSongRequest[]>({
    queryKey: ['dj-requests', selectedEventId],
    queryFn: () => djApi.getEventRequests(selectedEventId!),
    enabled: !!selectedEventId && !!currentUser,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    websocketService.connect()
    return () => {
      websocketService.disconnect()
    }
  }, [])

  const { addSongRequestNotification } = useNotificationStore()

  // Subscribe to DJ notifications
  useEffect(() => {
    if (!currentUserId) return

    const handleNotification = (notification: Notification) => {
      if (notification.songRequest) {
        addSongRequestNotification(notification.songRequest)
      } else {
        useNotificationStore.getState().addNotification(notification)
      }
    }

    const timeoutId = setTimeout(() => {
      websocketService.subscribeToDjNotifications(currentUserId, handleNotification)
    }, 500)

    return () => {
      clearTimeout(timeoutId)
      websocketService.unsubscribeFromDjNotifications(currentUserId, handleNotification)
    }
  }, [currentUserId, addSongRequestNotification])

  useEffect(() => {
    if (!selectedEventId) {
      setQrCodeUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl)
        }
        return null
      })
      return
    }

    let currentUrl: string | null = null

    const fetchQRCode = async () => {
      try {
        const url = await djApi.getQRCodeImage(
          selectedEventId!,
          typeof window !== 'undefined' ? window.location.origin : ''
        )
        currentUrl = url
        setQrCodeUrl(url)
      } catch (error) {
        console.error('Failed to fetch QR code:', error)
        setQrCodeUrl(null)
      }
    }

    fetchQRCode()

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [selectedEventId])

  const createEventMutation = useMutation({
    mutationFn: djApi.createEvent,
    onSuccess: () => {
      setCreateEventError(null)
      setShowCreateEvent(false)
      setNewEvent({
        name: '',
        description: '',
        startTime: '',
        endTime: '',
        status: EventStatus.ACTIVE,
      })
      queryClient.invalidateQueries({ queryKey: ['dj-events'] })
    },
    onError: (error: unknown) => {
      setCreateEventError(getApiErrorMessage(error))
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: RequestStatus }) =>
      songRequestApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dj-requests', selectedEventId] })
    },
  })

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    setCreateEventError(null)

    // Frontend validation: start time must be in the present or future (full datetime)
    const now = new Date()
    const start = newEvent.startTime ? new Date(newEvent.startTime) : null
    const end = newEvent.endTime ? new Date(newEvent.endTime) : null

    if (start && start.getTime() < now.getTime()) {
      setCreateEventError('Start time must be in the present or future')
      return
    }
    if (start && end && end.getTime() <= start.getTime()) {
      setCreateEventError('End time must be after start time')
      return
    }

    createEventMutation.mutate(newEvent)
  }

  const handleStatusUpdate = (id: number, status: RequestStatus) => {
    updateStatusMutation.mutate({ id, status })
  }

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

  if (!currentUser || (currentUser.role !== Role.DJ && currentUser.role !== Role.ARTIST)) {
    return null
  }

  const selectedEvent = events?.find((e) => e.id === selectedEventId)

  const djReportSummary = [
    { label: 'Total events', value: events?.length ?? 0 },
    { label: 'Total requests', value: requests?.length ?? 0 },
    { label: 'Pending', value: requests?.filter((r) => r.status === RequestStatus.PENDING).length ?? 0 },
    { label: 'Accepted', value: requests?.filter((r) => r.status === RequestStatus.ACCEPTED).length ?? 0 },
    { label: 'Played', value: requests?.filter((r) => r.status === RequestStatus.PLAYED).length ?? 0 },
  ]
  const djReportTables: { title: string; headers: string[]; rows: (string | number)[][] }[] = []
  if (events?.length) {
    djReportTables.push({
      title: 'My Events',
      headers: ['Name', 'Start', 'Status', 'Requests'],
      rows: events.map((e) => [
        e.name,
        new Date(e.startTime).toLocaleDateString(),
        e.status,
        e.requestCount,
      ]),
    })
  }
  if (requests?.length) {
    djReportTables.push({
      title: 'Song Requests',
      headers: ['Song', 'Artist', 'Requester', 'Status'],
      rows: requests.map((r) => [r.songTitle, r.songArtist ?? '', r.requesterName, r.status]),
    })
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <DashboardBackground />
      <ToastNotification />

      <MobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        ariaLabel="My events menu"
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="font-semibold text-white">My Events</h2>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <XCircle className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-4 space-y-2">
          {events?.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => {
                setSelectedEventId(event.id)
                setMobileMenuOpen(false)
              }}
              className={`w-full text-left rounded-lg p-4 transition-all min-h-[44px] touch-manipulation ${
                selectedEventId === event.id ? 'bg-purple-500/20 border border-purple-500/50' : 'bg-white/5 border border-white/10'
              }`}
            >
              <span className="font-medium text-white block">{event.name}</span>
              <span className="text-sm text-gray-400">{event.requestCount} requests</span>
            </button>
          ))}
          {events?.length === 0 && <p className="text-gray-400 text-center py-4">No events yet</p>}
        </div>
      </MobileDrawer>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header — mobile: hamburger + stacked; desktop: row */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-white/10 border border-white/20 touch-manipulation"
              aria-label="Open events menu"
            >
              <Menu className="w-6 h-6 text-purple-300" />
            </button>
            <div className="flex items-center gap-3">
              <Music className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" aria-hidden />
              <h1 className="text-xl sm:text-3xl font-bold text-gradient">DJ Control Panel</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <NotificationBell />
            <GlowButton
              onClick={() => {
                setCreateEventError(null)
                setShowCreateEvent(true)
              }}
              glowColor="pink"
              className="min-h-[44px] touch-manipulation"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </GlowButton>
            <ReportExport title="DJ Report" summary={djReportSummary} tables={djReportTables} />
            <Button variant="ghost" onClick={handleLogout} className="min-h-[44px] touch-manipulation">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </motion.div>

        {/* Create Event Modal */}
        <AnimatePresence>
          {showCreateEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreateEvent(false)}
            >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl"
            >
                <GlassCard
                  glow={createEventError ? 'red' : 'purple'}
                  className={`p-8 ${createEventError ? 'ring-2 ring-red-500/50' : ''}`}
                >
                  <h2 className="text-2xl font-bold mb-6 text-gradient">Create New Event</h2>
                  <form onSubmit={handleCreateEvent} className="space-y-4">
                    {createEventError && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl bg-red-500/10 border border-red-500/30 p-4"
                      >
                        <ErrorMessage message={createEventError} />
                      </motion.div>
                    )}
                    <Input
                      placeholder="Event Name *"
                      value={newEvent.name}
                      onChange={(e) => {
                        setNewEvent({ ...newEvent, name: e.target.value })
                        setCreateEventError(null)
                      }}
                      required
                    />
                    <Textarea
                      placeholder="Description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      rows={3}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FieldErrorWrapper
                        error={
                          createEventError &&
                          (createEventError.includes('Start time') || createEventError.includes('present or future'))
                            ? createEventError
                            : undefined
                        }
                        fieldId="startTime"
                      >
                        <Input
                          id="startTime"
                          type="datetime-local"
                          placeholder="Start Time *"
                          value={newEvent.startTime}
                          onChange={(e) => {
                            setNewEvent({ ...newEvent, startTime: e.target.value })
                            setCreateEventError(null)
                          }}
                          required
                        />
                      </FieldErrorWrapper>
                      <FieldErrorWrapper
                        error={
                          createEventError && createEventError.includes('End time')
                            ? createEventError
                            : undefined
                        }
                        fieldId="endTime"
                      >
                        <Input
                          id="endTime"
                          type="datetime-local"
                          placeholder="End Time *"
                          value={newEvent.endTime}
                          onChange={(e) => {
                            setNewEvent({ ...newEvent, endTime: e.target.value })
                            setCreateEventError(null)
                          }}
                          required
                        />
                      </FieldErrorWrapper>
                    </div>
                    <div className="flex gap-4">
                      <GlowButton
                        type="submit"
                        disabled={createEventMutation.isPending}
                        glowColor="pink"
                        className="flex-1"
                      >
                        {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
                      </GlowButton>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateEvent(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Events List — hidden on mobile (use drawer); visible lg */}
          <div className="hidden lg:block lg:col-span-1">
            <GlassCard glow="purple">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                My Events
              </h2>
              <div className="space-y-3">
                {events && events.length > 0 ? (
                  events.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedEventId(event.id)}
                      className={`
                        glass rounded-lg p-4 cursor-pointer transition-all
                        ${selectedEventId === event.id ? 'border-2 border-purple-500 glow-purple' : ''}
                      `}
                    >
                      <h3 className="font-semibold mb-1">{event.name}</h3>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>{event.requestCount} requests</span>
                        {event.pendingRequestCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                            {event.pendingRequestCount} pending
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">No events yet</p>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Event Details & Requests */}
          <div className="lg:col-span-2">
            {selectedEvent ? (
              <div className="space-y-6">
                <GlassCard glow="blue">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold mb-2">{selectedEvent.name}</h2>
                      {selectedEvent.description && (
                        <p className="text-gray-300 mb-2 text-sm sm:text-base">{selectedEvent.description}</p>
                      )}
                      <p className="text-xs sm:text-sm text-gray-400">
                        {new Date(selectedEvent.startTime).toLocaleString()} -{' '}
                        {new Date(selectedEvent.endTime).toLocaleString()}
                      </p>
                    </div>
                    {qrCodeUrl && (
                      <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCodeUrl} alt="Event QR Code" className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg bg-white" />
                        <QRDownload
                          qrDataUrl={qrCodeUrl}
                          filenameBase={`event-${selectedEvent.id}-qr`}
                          pdfTitle="Event QR Code"
                          pdfSubtitle={selectedEvent.name}
                        />
                      </div>
                    )}
                  </div>
                </GlassCard>

                {/* Event Analytics */}
                {requests && requests.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <GlassCard glow="yellow">
                      <div className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">{requests.filter(r => r.status === RequestStatus.PENDING).length}</div>
                        <div className="text-sm text-gray-400 mt-1">Pending</div>
                      </div>
                    </GlassCard>
                    <GlassCard glow="green">
                      <div className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">{requests.filter(r => r.status === RequestStatus.ACCEPTED).length}</div>
                        <div className="text-sm text-gray-400 mt-1">Accepted</div>
                      </div>
                    </GlassCard>
                    <GlassCard glow="red">
                      <div className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-400">{requests.filter(r => r.status === RequestStatus.DECLINED).length}</div>
                        <div className="text-sm text-gray-400 mt-1">Declined</div>
                      </div>
                    </GlassCard>
                    <GlassCard glow="blue">
                      <div className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">{requests.filter(r => r.status === RequestStatus.PLAYED).length}</div>
                        <div className="text-sm text-gray-400 mt-1">Played</div>
                      </div>
                    </GlassCard>
                  </div>
                )}

                <GlassCard glow="pink">
                  <h3 className="text-xl font-bold mb-4">Song Requests</h3>
                  <div className="space-y-3">
                    {requests && requests.length > 0 ? (
                      requests.map((request) => (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium">{request.songTitle}</p>
                              <p className="text-sm text-gray-400">{request.songArtist}</p>
                              {request.message && (
                                <p className="text-sm text-gray-500 mt-1">{request.message}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Requested by {request.requesterName}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                request.status === RequestStatus.ACCEPTED
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                  : request.status === RequestStatus.DECLINED
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                                  : request.status === RequestStatus.PLAYED
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                              }`}
                            >
                              {request.status}
                            </span>
                          </div>
                          {request.status === RequestStatus.PENDING && (
                            <div className="flex gap-2 mt-3">
                              <GlowButton
                                onClick={() => handleStatusUpdate(request.id, RequestStatus.ACCEPTED)}
                                glowColor="green"
                                size="sm"
                                variant="outline"
                                className="flex-1"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Accept
                              </GlowButton>
                              <GlowButton
                                onClick={() => handleStatusUpdate(request.id, RequestStatus.DECLINED)}
                                glowColor="red"
                                size="sm"
                                variant="outline"
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Decline
                              </GlowButton>
                            </div>
                          )}
                          {request.status === RequestStatus.ACCEPTED && (
                            <GlowButton
                              onClick={() => handleStatusUpdate(request.id, RequestStatus.PLAYED)}
                              glowColor="blue"
                              size="sm"
                              variant="outline"
                              className="w-full mt-3"
                            >
                              <PlayCircle className="w-4 h-4 mr-1" />
                              Mark as Played
                            </GlowButton>
                          )}
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-center py-8">No requests yet</p>
                    )}
                  </div>
                </GlassCard>
              </div>
            ) : (
              <GlassCard glow="purple" className="text-center py-12">
                <Music className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <p className="text-gray-400">Select an event to view details</p>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
