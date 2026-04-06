'use client'

import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { djApi, songRequestApi, authApi } from '@/lib/api'
import { websocketService } from '@/lib/websocket'
import type { EventRevenuePayload } from '@/lib/websocket'
import { DashboardBackground } from '@/components/theme/DashboardBackground'
import { GlassCard } from '@/components/GlassCard'
import { GlowButton } from '@/components/GlowButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { Music, Plus, LogOut, Menu, CheckCircle2, XCircle, PlayCircle, BarChart3, DollarSign, Filter, HelpCircle, ChevronDown, ChevronUp, Maximize2, Minimize2, Edit2, Trash2, StopCircle, QrCode, Download, FileDown, User } from 'lucide-react'
import type { DjEvent, DjSongRequest, EventRequest, Notification, TipInfoResponse, TipRecordResponse, TipSettingsRequest, DjRevenueSummaryResponse } from '@/lib/types'
import { EventStatus, RequestStatus, Role, TipPaymentType } from '@/lib/types'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { ToastNotification } from '@/components/notifications/ToastNotification'
import { useNotificationStore } from '@/store/notificationStore'
import { getCurrentUserId, getCurrentUser } from '@/lib/auth'
import { shouldRedirect, getDashboardPath } from '@/lib/roleGuard'
import { useMounted } from '@/hooks/useMounted'
import { getApiErrorMessage } from '@/lib/apiClient'
import { ErrorMessage, FieldErrorWrapper } from '@/components/ui/ErrorMessage'
import { MobileDrawer } from '@/components/ui/MobileDrawer'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { QRDownload } from '@/components/export/QRDownload'
import { sanitizeEventNameForFile, formatInRwanda } from '@/lib/utils'

// Memoized EventCard to prevent unnecessary re-renders
const EventCard = memo(({ 
  event, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  onEnd,
  isDeleting,
  isEnding
}: { 
  event: DjEvent
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onEnd: () => void
  isDeleting: boolean
  isEnding: boolean
}) => (
  <div
    className={`
      glass rounded-lg p-4 transition-colors hover:bg-white/5
      ${isSelected ? 'border-2 border-purple-500 glow-purple' : ''}
      ${event.status === EventStatus.ENDED ? 'opacity-75' : ''}
    `}
  >
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="flex-1">
        <h3 
          className="font-semibold cursor-pointer flex items-center gap-2"
          onClick={onSelect}
        >
          {event.name}
          {event.status === EventStatus.ENDED && (
            <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-xs font-normal">
              Ended
            </span>
          )}
        </h3>
      </div>
      <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        {event.status === EventStatus.ACTIVE && (
          <button
            type="button"
            onClick={onEnd}
            disabled={isEnding}
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-orange-400 transition-colors disabled:opacity-50"
            aria-label="End event"
          >
            <StopCircle className="w-4 h-4" />
          </button>
        )}
        {event.status === EventStatus.ACTIVE && (
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-purple-400 transition-colors"
            aria-label="Edit event"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
          aria-label="Delete event"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
    <div 
      className="flex items-center justify-between text-sm text-gray-400 cursor-pointer"
      onClick={onSelect}
    >
      <span>{event.requestCount} requests</span>
      {event.pendingRequestCount > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
          {event.pendingRequestCount} pending
        </span>
      )}
    </div>
  </div>
))
EventCard.displayName = 'EventCard'

// Memoized MobileEventItem to prevent unnecessary re-renders
const MobileEventItem = memo(({ 
  event, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  onEnd,
  isDeleting,
  isEnding,
  onCloseMenu
}: { 
  event: DjEvent
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onEnd: () => void
  isDeleting: boolean
  isEnding: boolean
  onCloseMenu: () => void
}) => (
  <div
    className={`w-full rounded-lg p-4 transition-all min-h-[44px] touch-manipulation ${
      isSelected ? 'bg-purple-500/20 border border-purple-500/50' : 'bg-white/5 border border-white/10'
    } ${event.status === EventStatus.ENDED ? 'opacity-75' : ''}`}
  >
    <div className="flex items-start justify-between gap-2 mb-2">
      <button
        type="button"
        onClick={() => {
          onSelect()
          onCloseMenu()
        }}
        className="flex-1 text-left"
      >
        <span className="font-medium text-white block flex items-center gap-2">
          {event.name}
          {event.status === EventStatus.ENDED && (
            <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-xs font-normal">
              Ended
            </span>
          )}
        </span>
        <span className="text-sm text-gray-400">{event.requestCount} requests</span>
      </button>
      <div className="flex gap-1 shrink-0">
        {event.status === EventStatus.ACTIVE && (
          <button
            type="button"
            onClick={() => {
              onEnd()
              onCloseMenu()
            }}
            disabled={isEnding}
            className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-orange-400 transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            aria-label="End event"
          >
            <StopCircle className="w-4 h-4" />
          </button>
        )}
        {event.status === EventStatus.ACTIVE && (
          <button
            type="button"
            onClick={() => {
              onEdit()
              onCloseMenu()
            }}
            className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-purple-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            aria-label="Edit event"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            onDelete()
            onCloseMenu()
          }}
          disabled={isDeleting}
          className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          aria-label="Delete event"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
))
MobileEventItem.displayName = 'MobileEventItem'

export default function DjDashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const mounted = useMounted()
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [createEventError, setCreateEventError] = useState<string | null>(null)
  const [requestFilter, setRequestFilter] = useState<string>('active')
  const [requestSort, setRequestSort] = useState<string>('tip_desc')
  const [requestTab, setRequestTab] = useState<'active' | 'played'>('active')
  const [fullScreenRequests, setFullScreenRequests] = useState(false)
  const [highlightRequestId, setHighlightRequestId] = useState<number | null>(null)
  const [requestsDisplayCount, setRequestsDisplayCount] = useState(25)
  const [tipSettingsForm, setTipSettingsForm] = useState<TipSettingsRequest>({
    tipPaymentType: TipPaymentType.MOMO_CODE,
    paymentValue: '',
  })
  const [showTipSettingsForm, setShowTipSettingsForm] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [mobileTipsOpen, setMobileTipsOpen] = useState(false)
  const [newEvent, setNewEvent] = useState<EventRequest>({
    name: '',
    description: '',
    momoCode: '',
    tipPaymentType: TipPaymentType.MOMO_CODE,
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

  const apiFilter = useMemo(
    () => requestTab === 'played' ? 'played' : (requestFilter === 'all' ? 'active' : requestFilter),
    [requestTab, requestFilter]
  )

  useEffect(() => {
    setRequestsDisplayCount(25)
  }, [selectedEventId, apiFilter, requestSort])

  const { data: requests } = useQuery<DjSongRequest[]>({
    queryKey: ['dj-requests', selectedEventId, apiFilter, requestSort],
    queryFn: () =>
      djApi.getEventRequests(selectedEventId!, {
        filter: apiFilter.toUpperCase(),
        sort: requestSort === 'tip_desc' ? undefined : requestSort.toUpperCase(),
      }),
    enabled: !!selectedEventId && !!currentUser,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const { data: tipSettings, refetch: refetchTipSettings } = useQuery<TipInfoResponse>({
    queryKey: ['dj-tip-settings'],
    queryFn: djApi.getTipSettings,
    enabled: !!currentUser && (currentUser.role === Role.DJ || currentUser.role === Role.ARTIST),
    staleTime: 2 * 60 * 1000,
  })

  const updateTipSettingsMutation = useMutation({
    mutationFn: (data: TipSettingsRequest) => djApi.updateTipSettings(data),
    onSuccess: () => {
      setShowTipSettingsForm(false)
      queryClient.invalidateQueries({ queryKey: ['dj-tip-settings'] })
      queryClient.invalidateQueries({ queryKey: ['dj-tip-records'] })
      refetchTipSettings()
    },
  })

  const { data: standaloneTips } = useQuery<TipRecordResponse[]>({
    queryKey: ['dj-tip-records'],
    queryFn: djApi.getStandaloneTipRecords,
    enabled: !!currentUser && (currentUser.role === Role.DJ || currentUser.role === Role.ARTIST),
    staleTime: 1 * 60 * 1000,
  })

  const [revenueDateFrom, setRevenueDateFrom] = useState('')
  const [revenueDateTo, setRevenueDateTo] = useState('')
  const { data: revenueSummary } = useQuery<DjRevenueSummaryResponse>({
    queryKey: ['dj-revenue-summary', revenueDateFrom || null, revenueDateTo || null],
    queryFn: () => djApi.getRevenueSummary(
      revenueDateFrom || revenueDateTo ? { from: revenueDateFrom || undefined, to: revenueDateTo || undefined } : undefined
    ),
    enabled: !!currentUser && (currentUser.role === Role.DJ || currentUser.role === Role.ARTIST),
    staleTime: 1 * 60 * 1000,
  })

  useEffect(() => {
    if (tipSettings) {
      setTipSettingsForm({
        tipPaymentType: tipSettings.paymentType ?? TipPaymentType.MOMO_CODE,
        paymentValue: tipSettings.paymentValue ?? '',
      })
    }
  }, [tipSettings])

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

      // If a tip arrives (e.g. permanent link tip), refresh revenue + tip list in real-time
      const msg = (notification as any)?.message ? String((notification as any).message).toLowerCase() : ''
      if (msg.includes('tip')) {
        queryClient.invalidateQueries({ queryKey: ['dj-revenue-summary'] })
        queryClient.invalidateQueries({ queryKey: ['dj-tip-records'] })
      }
    }

    const timeoutId = setTimeout(() => {
      websocketService.subscribeToDjNotifications(currentUserId, handleNotification)
    }, 500)

    return () => {
      clearTimeout(timeoutId)
      websocketService.unsubscribeFromDjNotifications(currentUserId, handleNotification)
    }
  }, [currentUserId, addSongRequestNotification, queryClient])

  useEffect(() => {
    if (!selectedEventId) return
    const handleRevenue = (_payload: EventRevenuePayload) => {
      queryClient.invalidateQueries({ queryKey: ['dj-events'] })
      queryClient.invalidateQueries({ queryKey: ['dj-requests', selectedEventId, apiFilter, requestSort] })
      // Event tips affect DJ totals too
      queryClient.invalidateQueries({ queryKey: ['dj-revenue-summary'] })
    }
    websocketService.subscribeToEventRevenue(selectedEventId, handleRevenue)
    return () => {
      websocketService.unsubscribeFromEventRevenue(selectedEventId, handleRevenue)
    }
  }, [selectedEventId, queryClient, apiFilter, requestSort])

  useEffect(() => {
    if (!selectedEventId) return
    let highlightTimeout: ReturnType<typeof setTimeout>
    const cb = (data: { id?: number }) => {
      queryClient.invalidateQueries({ queryKey: ['dj-events'] })
      queryClient.invalidateQueries({ queryKey: ['dj-requests', selectedEventId, apiFilter, requestSort] })
      if (data?.id != null) {
        setHighlightRequestId(data.id)
        clearTimeout(highlightTimeout)
        highlightTimeout = setTimeout(() => setHighlightRequestId(null), 4000)
      }
    }
    websocketService.subscribeToEventRequests(selectedEventId, cb)
    return () => {
      clearTimeout(highlightTimeout)
      websocketService.unsubscribeFromEventRequests(selectedEventId, cb)
    }
  }, [selectedEventId, queryClient, apiFilter, requestSort])

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
        momoCode: '',
        tipPaymentType: TipPaymentType.MOMO_CODE,
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
      queryClient.invalidateQueries({ queryKey: ['dj-events'] })
      queryClient.invalidateQueries({ queryKey: ['dj-requests', selectedEventId, apiFilter, requestSort] })
    },
  })

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EventRequest }) => djApi.updateEvent(id, data),
    onSuccess: () => {
      setEditingEventId(null)
      queryClient.invalidateQueries({ queryKey: ['dj-events'] })
      queryClient.invalidateQueries({ queryKey: ['dj-event', editingEventId] })
    },
    onError: (error: unknown) => {
      setCreateEventError(getApiErrorMessage(error))
    },
  })

  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => djApi.deleteEvent(id),
    onSuccess: () => {
      if (selectedEventId === editingEventId) {
        setSelectedEventId(null)
      }
      setEditingEventId(null)
      queryClient.invalidateQueries({ queryKey: ['dj-events'] })
    },
    onError: (error: unknown) => {
      setCreateEventError(getApiErrorMessage(error))
    },
  })

  const endEventMutation = useMutation({
    mutationFn: (id: number) => djApi.endEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dj-events'] })
      queryClient.invalidateQueries({ queryKey: ['dj-event', selectedEventId] })
    },
    onError: (error: unknown) => {
      setCreateEventError(getApiErrorMessage(error))
    },
  })

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    setCreateEventError(null)

    const code = newEvent.momoCode?.replace(/\D/g, '') ?? ''
    if (code.length < 4 || code.length > 10) {
      setCreateEventError('MoMo Payment Code must be 4–10 digits')
      return
    }

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

    createEventMutation.mutate({ ...newEvent, momoCode: code })
  }

  const handleStatusUpdate = useCallback((id: number, status: RequestStatus) => {
    updateStatusMutation.mutate({ id, status })
  }, [updateStatusMutation])

  const handleEditEvent = useCallback(async (event: DjEvent) => {
    setEditingEventId(event.id)
    try {
      // Fetch full event details to get momoCode
      const fullEvent = await djApi.getEvent(event.id)
      setNewEvent({
        name: fullEvent.name,
        description: fullEvent.description || '',
        momoCode: fullEvent.momoCode || '',
        tipPaymentType: fullEvent.tipPaymentType ?? TipPaymentType.MOMO_CODE,
        startTime: fullEvent.startTime ? new Date(fullEvent.startTime).toISOString().slice(0, 16) : '',
        endTime: fullEvent.endTime ? new Date(fullEvent.endTime).toISOString().slice(0, 16) : '',
        status: fullEvent.status,
      })
    } catch (error) {
      // Fallback to event data we have
      setNewEvent({
        name: event.name,
        description: event.description || '',
        momoCode: event.momoCode || '',
        tipPaymentType: event.tipPaymentType ?? TipPaymentType.MOMO_CODE,
        startTime: event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : '',
        endTime: event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : '',
        status: event.status,
      })
    }
  }, [])

  const handleUpdateEvent = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEventId) return
    setCreateEventError(null)

    const code = newEvent.momoCode?.replace(/\D/g, '') ?? ''
    if (code.length < 4 || code.length > 10) {
      setCreateEventError('MoMo Payment Code must be 4–10 digits')
      return
    }

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

    updateEventMutation.mutate({ id: editingEventId, data: { ...newEvent, momoCode: code } })
  }, [editingEventId, newEvent, updateEventMutation])

  const handleDeleteEvent = useCallback((id: number) => {
    if (confirm('Are you sure you want to delete this event? This will hide it from users, but the data will be preserved.')) {
      deleteEventMutation.mutate(id)
    }
  }, [deleteEventMutation])

  const handleEndEvent = useCallback((id: number) => {
    if (confirm('Are you sure you want to end this event? It will stop accepting new requests but remain visible on your dashboard.')) {
      endEventMutation.mutate(id)
    }
  }, [endEventMutation])

  const handleLogout = useCallback(() => {
    authApi.logout()
    router.push('/login')
  }, [router])

  // All hooks must be called before any early returns (Rules of Hooks)
  const selectedEvent = useMemo(
    () => events?.find((e) => e.id === selectedEventId),
    [events, selectedEventId]
  )

  const { totalTipRevenue, tippedCount, highestTip, lowestTip, avgTip } = useMemo(() => {
    const total = events?.reduce((sum, e) => sum + (Number(e.totalTipRevenue) || 0), 0) ?? 0
    const tipped = requests?.filter((r) => (Number(r.tipAmount) || 0) > 0) ?? []
    const count = tipped.length
    const highest = count ? Math.max(...tipped.map((r) => Number(r.tipAmount) || 0)) : 0
    const lowest = count ? Math.min(...tipped.map((r) => Number(r.tipAmount) || 0)) : 0
    const avg = count ? Math.round(tipped.reduce((s, r) => s + (Number(r.tipAmount) || 0), 0) / count) : 0
    return { totalTipRevenue: total, tippedCount: count, highestTip: highest, lowestTip: lowest, avgTip: avg }
  }, [events, requests])

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
            <MobileEventItem
              key={event.id}
              event={event}
              isSelected={selectedEventId === event.id}
              onSelect={() => setSelectedEventId(event.id)}
              onEdit={() => handleEditEvent(event)}
              onDelete={() => handleDeleteEvent(event.id)}
              onEnd={() => handleEndEvent(event.id)}
              isDeleting={deleteEventMutation.isPending}
              isEnding={endEventMutation.isPending}
              onCloseMenu={() => setMobileMenuOpen(false)}
            />
          ))}
          {events?.length === 0 && <p className="text-gray-400 text-center py-4">No events yet</p>}
        </div>
        {/* Permanent tip link — visible on mobile so QR is available */}
        <div className="p-4 border-t border-white/10">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-2">
            <QrCode className="w-4 h-4 text-green-400" />
            Permanent tip link
          </h3>
          {tipSettings?.tipLinkToken ? (
            <div className="space-y-2">
              <p className="font-mono text-xs text-green-300 break-all">
                {mounted && typeof window !== 'undefined' ? `${window.location.origin}/tip/${tipSettings.tipLinkToken}` : `/tip/${tipSettings.tipLinkToken}`}
              </p>
              {mounted && typeof window !== 'undefined' && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/tip/${tipSettings.tipLinkToken}`)}`}
                    alt="Tip QR"
                    className="rounded-lg border border-white/10 w-32 h-32 mx-auto block"
                    width={200}
                    height={200}
                  />
                  <Button
              type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={async () => {
                      const url = `${window.location.origin}/tip/${tipSettings.tipLinkToken}`
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(url)}`
                      try {
                        const res = await fetch(qrUrl)
                        const blob = await res.blob()
                        const a = document.createElement('a')
                        a.href = URL.createObjectURL(blob)
                        a.download = 'tiptune-tip-qr.png'
                        a.click()
                        URL.revokeObjectURL(a.href)
                      } catch {
                        window.open(qrUrl, '_blank')
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download QR
                  </Button>
                  {showTipSettingsForm ? (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <p className="text-xs text-gray-400">Update payment</p>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1 cursor-pointer text-sm">
                          <input type="radio" name="tipSettingsTypeMobile" checked={tipSettingsForm.tipPaymentType === TipPaymentType.MOMO_CODE}
                            onChange={() => setTipSettingsForm({ ...tipSettingsForm, tipPaymentType: TipPaymentType.MOMO_CODE, paymentValue: tipSettingsForm.paymentValue.slice(0, 10) })} className="rounded-full border-white/30" />
                          MoMo
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer text-sm">
                          <input type="radio" name="tipSettingsTypeMobile" checked={tipSettingsForm.tipPaymentType === TipPaymentType.PHONE_NUMBER}
                            onChange={() => setTipSettingsForm({ ...tipSettingsForm, tipPaymentType: TipPaymentType.PHONE_NUMBER })} className="rounded-full border-white/30" />
                          Phone
                        </label>
                      </div>
                      <Input placeholder={tipSettingsForm.tipPaymentType === TipPaymentType.MOMO_CODE ? 'MoMo code' : 'Phone'} value={tipSettingsForm.paymentValue}
                        onChange={(e) => setTipSettingsForm({ ...tipSettingsForm, paymentValue: e.target.value.replace(/\D/g, '').slice(0, tipSettingsForm.tipPaymentType === TipPaymentType.MOMO_CODE ? 10 : 15) })}
                        maxLength={tipSettingsForm.tipPaymentType === TipPaymentType.MOMO_CODE ? 10 : 15} className="w-full font-mono text-sm" />
                      <div className="flex gap-2">
                        <GlowButton noMotion type="button" glowColor="green" size="sm" className="flex-1" disabled={updateTipSettingsMutation.isPending || !tipSettingsForm.paymentValue.trim()}
                          onClick={() => updateTipSettingsMutation.mutate({ tipPaymentType: tipSettingsForm.tipPaymentType, paymentValue: tipSettingsForm.paymentValue.trim() })}>
                          {updateTipSettingsMutation.isPending ? 'Saving...' : 'Update'}
                        </GlowButton>
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowTipSettingsForm(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button type="button" variant="ghost" size="sm" className="w-full gap-2 text-gray-400" onClick={() => setShowTipSettingsForm(true)}>
                      <Edit2 className="w-4 h-4" />
                      Update payment details
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <p className="text-xs text-gray-400">Payment for tips</p>
              <div className="flex gap-2">
                <label className="flex items-center gap-1 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="tipSettingsTypeMobile"
                    checked={tipSettingsForm.tipPaymentType === TipPaymentType.MOMO_CODE}
                    onChange={() => setTipSettingsForm({ ...tipSettingsForm, tipPaymentType: TipPaymentType.MOMO_CODE, paymentValue: tipSettingsForm.paymentValue.slice(0, 10) })}
                    className="rounded-full border-white/30"
                  />
                  MoMo
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="tipSettingsTypeMobile"
                    checked={tipSettingsForm.tipPaymentType === TipPaymentType.PHONE_NUMBER}
                    onChange={() => setTipSettingsForm({ ...tipSettingsForm, tipPaymentType: TipPaymentType.PHONE_NUMBER })}
                    className="rounded-full border-white/30"
                  />
                  Phone
                </label>
              </div>
              <Input
                placeholder={tipSettingsForm.tipPaymentType === TipPaymentType.MOMO_CODE ? 'MoMo code' : 'Phone'}
                value={tipSettingsForm.paymentValue}
                onChange={(e) => {
                  const max = tipSettingsForm.tipPaymentType === TipPaymentType.MOMO_CODE ? 10 : 15
                  setTipSettingsForm({ ...tipSettingsForm, paymentValue: e.target.value.replace(/\D/g, '').slice(0, max) })
                }}
                maxLength={tipSettingsForm.tipPaymentType === TipPaymentType.MOMO_CODE ? 10 : 15}
                className="w-full font-mono text-sm"
              />
              <GlowButton noMotion
                type="button"
                glowColor="green"
                size="sm"
                className="w-full"
                disabled={updateTipSettingsMutation.isPending || !tipSettingsForm.paymentValue.trim()}
              onClick={() => {
                  updateTipSettingsMutation.mutate({
                    tipPaymentType: tipSettingsForm.tipPaymentType,
                    paymentValue: tipSettingsForm.paymentValue.trim(),
                  })
                }}
              >
                {updateTipSettingsMutation.isPending ? 'Saving...' : 'Save to get link'}
              </GlowButton>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-white/10">
          <Link
            href="/dashboard/dj/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-gray-200 hover:text-white transition-colors"
          >
            <User className="w-4 h-4 text-purple-400" />
            My profile & links
          </Link>
        </div>
      </MobileDrawer>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-[100vw] overflow-x-hidden">
        {/* Header — mobile: hamburger + stacked; desktop: row */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-white/10 border border-white/20 touch-manipulation"
              aria-label="Open events menu"
            >
              <Menu className="w-6 h-6 text-purple-300" />
            </button>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium pl-10 sm:pl-0">
                DJ Control Panel
              </p>
            <div className="flex items-center gap-3">
                <Music className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400 shrink-0" aria-hidden />
                {currentUser?.name ? (
                  <Link
                    href="/dashboard/dj/profile"
                    className="text-xl sm:text-3xl font-bold text-gradient hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded"
                    aria-label="Go to profile"
                  >
                    {currentUser.name}
                  </Link>
                ) : (
                  <span className="text-xl sm:text-3xl font-bold text-gradient">DJ Control Panel</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <NotificationBell />
            <Link
              href="/dashboard/dj/profile"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 px-3 py-2 text-sm font-medium text-gray-200 min-h-[44px] touch-manipulation transition-colors"
            >
              <User className="w-4 h-4 text-purple-400" />
              Profile
            </Link>
            <Link
              href="/dashboard/dj/analytics"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 px-3 py-2 text-sm font-medium text-gray-200 min-h-[44px] touch-manipulation transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Analytics
            </Link>
            <GlowButton noMotion
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
            <Button variant="ghost" onClick={handleLogout} className="min-h-[44px] touch-manipulation">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Create/Edit Event Modal */}
        {(showCreateEvent || editingEventId !== null) && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowCreateEvent(false)
                setEditingEventId(null)
                setCreateEventError(null)
              }}
            >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl"
            >
                <GlassCard
                  noEnterAnimation
                  glow={createEventError ? 'red' : 'purple'}
                  className={`p-8 ${createEventError ? 'ring-2 ring-red-500/50' : ''}`}
                >
                  <h2 className="text-2xl font-bold mb-6 text-gradient">
                    {editingEventId ? 'Edit Event' : 'Create New Event'}
                  </h2>
                  <form onSubmit={editingEventId ? handleUpdateEvent : handleCreateEvent} className="space-y-4">
                    {createEventError && (
                      <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
                        <ErrorMessage message={createEventError} />
                      </div>
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
                    <div>
                      <p className="block text-sm font-medium text-gray-300 mb-2">
                        Do you want to use Momo or Phone Number? *
                      </p>
                      <div className="flex gap-4 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="tipPaymentType"
                            checked={newEvent.tipPaymentType === TipPaymentType.MOMO_CODE}
                            onChange={() =>
                              setNewEvent({
                                ...newEvent,
                                tipPaymentType: TipPaymentType.MOMO_CODE,
                                momoCode: newEvent.momoCode.slice(0, 10),
                              })
                            }
                            className="rounded-full border-white/30 bg-white/5"
                          />
                          <span className="text-gray-300">MoMo</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="tipPaymentType"
                            checked={newEvent.tipPaymentType === TipPaymentType.PHONE_NUMBER}
                            onChange={() =>
                              setNewEvent({
                                ...newEvent,
                                tipPaymentType: TipPaymentType.PHONE_NUMBER,
                              })
                            }
                            className="rounded-full border-white/30 bg-white/5"
                          />
                          <span className="text-gray-300">Phone Number</span>
                        </label>
                      </div>
                      <label htmlFor="momoCode" className="block text-sm font-medium text-gray-300 mb-1">
                        {newEvent.tipPaymentType === TipPaymentType.MOMO_CODE
                          ? 'MoMo short code (4–10 digits) *'
                          : 'Phone number (9–15 digits) *'}
                      </label>
                      <Input
                        id="momoCode"
                        placeholder={
                          newEvent.tipPaymentType === TipPaymentType.MOMO_CODE
                            ? 'e.g. 2345'
                            : 'e.g. 0781234567'
                        }
                        value={newEvent.momoCode}
                        onChange={(e) => {
                          const max = newEvent.tipPaymentType === TipPaymentType.MOMO_CODE ? 10 : 15
                          const v = e.target.value.replace(/\D/g, '').slice(0, max)
                          setNewEvent({ ...newEvent, momoCode: v })
                          setCreateEventError(null)
                        }}
                        maxLength={newEvent.tipPaymentType === TipPaymentType.MOMO_CODE ? 10 : 15}
                        className="w-full font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {newEvent.tipPaymentType === TipPaymentType.MOMO_CODE ? (
                          <>USSD: *182*8*1*<span className="text-gray-400">{newEvent.momoCode || 'XXXX'}</span>*amount#</>
                        ) : (
                          <>USSD: *182*1*1*<span className="text-gray-400">{newEvent.momoCode || 'XXXXXXXXX'}</span>*amount#</>
                        )}
                      </p>
                    </div>
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
                        <DateTimePicker
                          id="startTime"
                          placeholder="Start date & time *"
                          value={newEvent.startTime}
                          onChange={(v) => {
                            setNewEvent({ ...newEvent, startTime: v })
                            setCreateEventError(null)
                          }}
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
                        <DateTimePicker
                          id="endTime"
                          placeholder="End date & time *"
                          value={newEvent.endTime}
                          onChange={(v) => {
                            setNewEvent({ ...newEvent, endTime: v })
                            setCreateEventError(null)
                          }}
                        />
                      </FieldErrorWrapper>
                    </div>
                    <div className="flex gap-4">
                      <GlowButton noMotion
                        type="submit"
                        disabled={editingEventId ? updateEventMutation.isPending : createEventMutation.isPending}
                        glowColor="pink"
                        className="flex-1"
                      >
                        {editingEventId 
                          ? (updateEventMutation.isPending ? 'Updating...' : 'Update Event')
                          : (createEventMutation.isPending ? 'Creating...' : 'Create Event')
                        }
                      </GlowButton>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCreateEvent(false)
                          setEditingEventId(null)
                          setCreateEventError(null)
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </GlassCard>
              </div>
            </div>
          )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Events List — hidden on mobile (use drawer); visible from tablet (md) */}
          <div className="hidden md:block md:col-span-1 min-w-0">
            <GlassCard noEnterAnimation glow="purple">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-400" />
                My Events
              </h2>
              <div className="space-y-3">
                {events && events.length > 0 ? (
                  events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isSelected={selectedEventId === event.id}
                      onSelect={() => setSelectedEventId(event.id)}
                      onEdit={() => handleEditEvent(event)}
                      onDelete={() => handleDeleteEvent(event.id)}
                      onEnd={() => handleEndEvent(event.id)}
                      isDeleting={deleteEventMutation.isPending}
                      isEnding={endEventMutation.isPending}
                    />
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">No events yet</p>
                )}
              </div>
            </GlassCard>

            {/* Permanent tip link */}
            <GlassCard noEnterAnimation glow="green" className="mt-4">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-green-400" />
                Permanent tip link
              </h2>
              {tipSettings?.tipLinkToken ? (
                <>
                  <p className="text-xs text-gray-400 mb-2">Share this link or QR for tips (no event needed).</p>
                  <p className="font-mono text-sm text-green-300 break-all mb-2">
                    {mounted && typeof window !== 'undefined' ? `${window.location.origin}/tip/${tipSettings.tipLinkToken}` : `/tip/${tipSettings.tipLinkToken}`}
                  </p>
                  {mounted && typeof window !== 'undefined' && (
                    <div className="flex flex-col items-center my-3 gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(`${window.location.origin}/tip/${tipSettings.tipLinkToken}`)}`}
                        alt="Tip QR code"
                        className="rounded-lg border border-white/10 w-40 h-40 sm:w-48 sm:h-48"
                        width={256}
                        height={256}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={async () => {
                          const url = `${window.location.origin}/tip/${tipSettings.tipLinkToken}`
                          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(url)}`
                          try {
                            const res = await fetch(qrUrl)
                            const blob = await res.blob()
                            const a = document.createElement('a')
                            a.href = URL.createObjectURL(blob)
                            a.download = 'tiptune-tip-qr.png'
                            a.click()
                            URL.revokeObjectURL(a.href)
                          } catch (e) {
                            window.open(qrUrl, '_blank')
                          }
                        }}
                      >
                        <Download className="w-4 h-4" />
                        Download QR
                      </Button>
                      {!showTipSettingsForm && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-gray-400"
                          onClick={() => setShowTipSettingsForm(true)}
                        >
                          <Edit2 className="w-4 h-4" />
                          Update payment details
                        </Button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-400 mb-3">Set payment details below and save to get your permanent tip link.</p>
              )}
              {(showTipSettingsForm || !tipSettings?.tipLinkToken) && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <p className="text-xs font-medium text-gray-300">Payment for tips</p>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="tipSettingsType"
                        checked={tipSettingsForm.tipPaymentType === TipPaymentType.MOMO_CODE}
                        onChange={() => setTipSettingsForm({ ...tipSettingsForm, tipPaymentType: TipPaymentType.MOMO_CODE, paymentValue: tipSettingsForm.paymentValue.slice(0, 10) })}
                        className="rounded-full border-white/30"
                      />
                      <span className="text-sm">MoMo</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="tipSettingsType"
                        checked={tipSettingsForm.tipPaymentType === TipPaymentType.PHONE_NUMBER}
                        onChange={() => setTipSettingsForm({ ...tipSettingsForm, tipPaymentType: TipPaymentType.PHONE_NUMBER })}
                        className="rounded-full border-white/30"
                      />
                      <span className="text-sm">Phone</span>
                    </label>
                  </div>
                  <Input
                    placeholder={tipSettingsForm.tipPaymentType === TipPaymentType.MOMO_CODE ? 'MoMo code (4-10 digits)' : 'Phone (9-15 digits)'}
                    value={tipSettingsForm.paymentValue}
                    onChange={(e) => {
                      const max = tipSettingsForm.tipPaymentType === TipPaymentType.MOMO_CODE ? 10 : 15
                      setTipSettingsForm({ ...tipSettingsForm, paymentValue: e.target.value.replace(/\D/g, '').slice(0, max) })
                    }}
                    maxLength={tipSettingsForm.tipPaymentType === TipPaymentType.MOMO_CODE ? 10 : 15}
                    className="w-full font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <GlowButton noMotion
                      type="button"
                      glowColor="green"
                      className="flex-1"
                      disabled={updateTipSettingsMutation.isPending || !tipSettingsForm.paymentValue.trim()}
                      onClick={() => updateTipSettingsMutation.mutate({
                        tipPaymentType: tipSettingsForm.tipPaymentType,
                        paymentValue: tipSettingsForm.paymentValue.trim(),
                      })}
                    >
                      {updateTipSettingsMutation.isPending ? 'Saving...' : tipSettings?.tipLinkToken ? 'Update' : 'Save'}
                    </GlowButton>
                    {tipSettings?.tipLinkToken && showTipSettingsForm && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowTipSettingsForm(false)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Total revenue & Tip records count */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <GlassCard noEnterAnimation glow="green" className="p-3">
                <p className="text-xs text-gray-400 mb-1">Total revenue</p>
                <p className="text-lg font-bold text-green-400">
                  {(revenueSummary ? Number(revenueSummary.totalRevenue) : 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">RWF</span>
                </p>
              </GlassCard>
              <GlassCard noEnterAnimation glow="green" className="p-3">
                <p className="text-xs text-gray-400 mb-1">Tip-only records</p>
                <p className="text-lg font-bold text-green-400">{revenueSummary?.tipRecordCount ?? standaloneTips?.length ?? 0}</p>
              </GlassCard>
            </div>

            {/* Tip-only tips (standalone, not from events) */}
            <GlassCard noEnterAnimation glow="green" className="mt-4">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Tip-only tips
              </h2>
              <p className="text-xs text-gray-400 mb-3">Tips from your permanent link (no song request).</p>
              {standaloneTips && standaloneTips.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {standaloneTips.map((t) => (
                    <div key={t.id} className="rounded-lg bg-white/5 border border-white/10 p-2 text-sm">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-medium text-green-300">{Number(t.amount).toLocaleString()} RWF</span>
                        <span className="text-xs text-gray-500">
                          {typeof t.createdAt === 'string' ? new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                      </div>
                      {(t.payerName || t.payerPhone) && (
                        <p className="text-xs text-gray-400 mt-1">
                          {[t.payerName, t.payerPhone].filter(Boolean).join(' · ')}
                        </p>
                        )}
                      </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4 text-sm">No tip-only tips yet</p>
              )}
            </GlassCard>
          </div>

          {/* Event Details & Requests */}
          <div className="md:col-span-2 min-w-0">
            {/* Mobile-only: compact revenue strip + collapsible Tip-only tips (hidden from tablet up when sidebar is visible) */}
            <div className="md:hidden mb-4">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <GlassCard noEnterAnimation glow="green" className="p-3">
                  <p className="text-xs text-gray-400">Revenue</p>
                  <p className="text-base font-bold text-green-400">
                    {(revenueSummary ? Number(revenueSummary.totalRevenue) : 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">RWF</span>
                  </p>
                </GlassCard>
                <GlassCard noEnterAnimation glow="green" className="p-3">
                  <p className="text-xs text-gray-400">Tip-only</p>
                  <p className="text-base font-bold text-green-400">{revenueSummary?.tipRecordCount ?? standaloneTips?.length ?? 0}</p>
                </GlassCard>
              </div>
              <GlassCard noEnterAnimation glow="green" className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMobileTipsOpen((o) => !o)}
                  className="w-full flex items-center justify-between gap-2 py-2 text-left hover:bg-white/5 rounded-lg min-h-[44px] touch-manipulation"
                  aria-expanded={mobileTipsOpen}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-200">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    Tip-only tips {standaloneTips && standaloneTips.length > 0 && (
                      <span className="text-green-400">({standaloneTips.length})</span>
                    )}
                  </span>
                  {mobileTipsOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {mobileTipsOpen && (
                  <div className="pt-2 border-t border-white/10 space-y-2 max-h-48 overflow-y-auto">
                    {standaloneTips && standaloneTips.length > 0 ? (
                      standaloneTips.slice(0, 10).map((t) => (
                        <div key={t.id} className="rounded-lg bg-white/5 border border-white/10 p-2 text-sm">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-medium text-green-300">{Number(t.amount).toLocaleString()} RWF</span>
                            <span className="text-xs text-gray-500">
                              {typeof t.createdAt === 'string' ? new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                            </span>
                          </div>
                          {(t.payerName || t.payerPhone) && (
                            <p className="text-xs text-gray-400 mt-1">{[t.payerName, t.payerPhone].filter(Boolean).join(' · ')}</p>
                          )}
                        </div>
                  ))
                ) : (
                      <p className="text-gray-400 text-center py-2 text-sm">No tip-only tips yet</p>
                    )}
                    {standaloneTips && standaloneTips.length > 10 && (
                      <p className="text-xs text-gray-500 text-center">+{standaloneTips.length - 10} more</p>
                )}
              </div>
                )}
            </GlassCard>
          </div>

            {selectedEvent ? (
              <div className="space-y-4">
                {/* 1. Event details & QR (back in place) */}
                <GlassCard noEnterAnimation glow="blue">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl sm:text-2xl font-bold">{selectedEvent.name}</h2>
                        {selectedEvent.status === EventStatus.ENDED && (
                          <span className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-sm">
                            Ended
                          </span>
                        )}
                        {selectedEvent.status === EventStatus.ACTIVE && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEndEvent(selectedEvent.id)}
                            disabled={endEventMutation.isPending}
                            className="text-orange-400 border-orange-400/30 hover:bg-orange-400/10"
                          >
                            <StopCircle className="w-4 h-4 mr-2" />
                            {endEventMutation.isPending ? 'Ending...' : 'End Event'}
                          </Button>
                        )}
                      </div>
                      {selectedEvent.description && (
                        <p className="text-gray-300 mb-2 text-sm sm:text-base">{selectedEvent.description}</p>
                      )}
                      <p className="text-xs sm:text-sm text-gray-400">
                        Starts: {formatInRwanda(selectedEvent.startTime)}
                      </p>
                    </div>
                    {qrCodeUrl && (
                      <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCodeUrl} alt="Event QR Code" className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg bg-white" />
                        <QRDownload
                          qrDataUrl={qrCodeUrl}
                          filenameBase={`${sanitizeEventNameForFile(selectedEvent.name)}-qr-code`}
                          pdfTitle="Event QR Code"
                          pdfSubtitle={selectedEvent.name}
                        />
                      </div>
                    )}
                  </div>
                </GlassCard>

                {/* 2. Song Requests — primary focus */}
                <GlassCard noEnterAnimation glow="pink" className={!fullScreenRequests ? 'sticky top-4 z-10' : ''}>
                  <div className="flex flex-col gap-4 mb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xl font-bold">Song Requests</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <GlowButton noMotion
                          type="button"
                          onClick={() => setFullScreenRequests(true)}
                          glowColor="purple"
                          size="sm"
                          variant="outline"
                          className="min-h-[44px] touch-manipulation"
                        >
                          <Maximize2 className="w-4 h-4 mr-1" />
                          Full screen
                        </GlowButton>
                        <span className="text-sm text-gray-400">View</span>
                        <div className="flex rounded-lg overflow-hidden border border-white/20">
                          <button
                            type="button"
                            onClick={() => { setRequestTab('active'); setRequestFilter('active') }}
                            className={`px-3 py-2 text-sm font-medium min-h-[44px] touch-manipulation ${requestTab === 'active' ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-gray-400'}`}
                          >
                            Active
                          </button>
                          <button
                            type="button"
                            onClick={() => setRequestTab('played')}
                            className={`px-3 py-2 text-sm font-medium min-h-[44px] touch-manipulation ${requestTab === 'played' ? 'bg-blue-500/30 text-blue-200' : 'bg-white/5 text-gray-400'}`}
                          >
                            Played
                          </button>
                      </div>
                      </div>
                      </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {requestTab === 'active' && (
                        <>
                          <span className="text-sm text-gray-400 flex items-center gap-1">
                            <Filter className="w-4 h-4" /> Filter
                          </span>
                          <select
                            value={requestFilter}
                            onChange={(e) => setRequestFilter(e.target.value)}
                            className="rounded-lg bg-white/10 border border-white/20 text-sm text-white py-1.5 px-2 min-h-[44px] touch-manipulation"
                            aria-label="Filter requests"
                          >
                            <option value="active">All active</option>
                            <option value="tipped">Tipped only</option>
                            <option value="no_tip">No tip</option>
                            <option value="pending">Pending</option>
                          </select>
                        </>
                      )}
                      <select
                        value={requestSort}
                        onChange={(e) => setRequestSort(e.target.value)}
                        className="rounded-lg bg-white/10 border border-white/20 text-sm text-white py-1.5 px-2 min-h-[44px] touch-manipulation"
                        aria-label="Sort requests"
                      >
                        <option value="tip_desc">Highest tip first</option>
                        <option value="recent">Most recent</option>
                        <option value="oldest">Oldest</option>
                      </select>
                      </div>
                  </div>
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                    {requests && requests.length > 0 ? (
                      (() => {
                        const displayed = requests.slice(0, requestsDisplayCount)
                        return (
                          <>
                            {displayed.map((request) => (
                              <div
                          key={request.id}
                                className={`glass rounded-lg p-4 transition-colors hover:bg-white/5 ${highlightRequestId === request.id ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-gray-900 shadow-lg shadow-green-500/20' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{request.songTitle}</p>
                                {(Number(request.tipAmount) || 0) > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/50">
                                    <DollarSign className="w-3 h-3" />
                                    {Number(request.tipAmount).toLocaleString()} RWF
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">{request.songArtist}</p>
                              {request.message && (
                                <p className="text-sm text-gray-500 mt-1">{request.message}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Requested by {request.requesterName}
                                {request.payerName && ` · ${request.payerName}`}
                                {request.payerPhone && ` · ${request.payerPhone}`}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {selectedEvent?.name && <span>{selectedEvent.name} · </span>}
                                {request.createdAt && formatInRwanda(request.createdAt)}
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
                              <GlowButton noMotion
                                onClick={() => handleStatusUpdate(request.id, RequestStatus.ACCEPTED)}
                                glowColor="green"
                                size="sm"
                                variant="outline"
                                className="flex-1"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Accept
                              </GlowButton>
                              <GlowButton noMotion
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
                            <GlowButton noMotion
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
                        </div>
                            ))}
                            {requests.length > requestsDisplayCount && (
                              <button
                                type="button"
                                onClick={() => setRequestsDisplayCount((c) => c + 25)}
                                className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium border border-white/10"
                              >
                                Show more ({requests.length - requestsDisplayCount} remaining)
                              </button>
                            )}
                          </>
                        )
                      })()
                    ) : (
                      <p className="text-gray-400 text-center py-8">No requests yet</p>
                    )}
                  </div>
                </GlassCard>

                {/* 3. Compact stats + one "More" collapsible (revenue & help) */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10 text-sm">
                  <span className="text-green-400 font-medium">
                    {typeof selectedEvent?.totalTipRevenue === 'number' || typeof selectedEvent?.totalTipRevenue === 'string'
                      ? `${Number(selectedEvent.totalTipRevenue).toLocaleString()} RWF`
                      : '0 RWF'}
                  </span>
                  {requests && requests.length > 0 && (
                    <>
                      <span className="text-gray-500">·</span>
                      <span className="text-yellow-400">{requests.filter(r => r.status === RequestStatus.PENDING).length} pending</span>
                      <span className="text-green-400">{requests.filter(r => r.status === RequestStatus.ACCEPTED).length} accepted</span>
                      <span className="text-blue-400">{requests.filter(r => r.status === RequestStatus.PLAYED).length} played</span>
                    </>
                  )}
                </div>

                {/* More: Revenue report + Help (single collapsible) */}
                <GlassCard glow="purple" className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setAnalyticsOpen((o) => !o)}
                    className="w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-white/5 rounded-lg transition-colors min-h-[44px] touch-manipulation"
                    aria-expanded={analyticsOpen}
                  >
                    <span className="flex items-center gap-2 font-medium text-gray-200">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      Revenue report & help
                    </span>
                    {analyticsOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>
                  {analyticsOpen && (
                    <div className="px-3 pb-4 pt-1 border-t border-white/10 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">From</label>
                          <Input type="date" value={revenueDateFrom} onChange={(e) => setRevenueDateFrom(e.target.value)} className="bg-white/5" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">To</label>
                          <Input type="date" value={revenueDateTo} onChange={(e) => setRevenueDateTo(e.target.value)} className="bg-white/5" />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setRevenueDateFrom(''); setRevenueDateTo('') }}>Clear</Button>
                        <GlowButton noMotion
                          size="sm"
                          glowColor="green"
                          onClick={async () => {
                            const from = revenueDateFrom || undefined
                            const to = revenueDateTo || undefined
                            const data = await djApi.getRevenueSummary(from || to ? { from, to } : undefined)
                            const rows: string[] = ['Total Revenue (RWF),Song Request Revenue (RWF),Standalone Tip Revenue (RWF),Tip-only Records']
                            rows.push(`${Number(data.totalRevenue).toLocaleString()},${Number(data.songRequestRevenue).toLocaleString()},${Number(data.standaloneTipRevenue).toLocaleString()},${data.tipRecordCount}`)
                            if (data.revenueByDay && data.revenueByDay.length > 0) {
                              rows.push('')
                              rows.push('Date,Revenue (RWF)')
                              data.revenueByDay.forEach((d) => rows.push(`${d.date},${Number(d.revenue).toLocaleString()}`))
                            }
                            const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' })
                            const a = document.createElement('a')
                            a.href = URL.createObjectURL(blob)
                            a.download = `revenue-report${from && to ? `-${from}-${to}` : ''}.csv`
                            a.click()
                            URL.revokeObjectURL(a.href)
                          }}
                        >
                          <FileDown className="w-4 h-4 mr-2" />
                          Download report
                        </GlowButton>
                      </div>
                      {revenueSummary && (
                        <p className="text-sm text-gray-300">
                          Total <span className="text-green-400 font-medium">{Number(revenueSummary.totalRevenue).toLocaleString()} RWF</span>
                          {' · '}Events: {Number(revenueSummary.songRequestRevenue).toLocaleString()} · Tip-only: {Number(revenueSummary.standaloneTipRevenue).toLocaleString()}
                        </p>
                      )}
                      <div className="pt-2 border-t border-white/10 text-sm text-gray-300 space-y-2">
                        <p className="font-medium text-gray-200">How it works</p>
                        <p>Tips are added to event revenue when someone pays via MoMo. Accept = keep tip; Decline = remove tip from revenue. Played requests stay in revenue.</p>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </div>
            ) : (
              <GlassCard glow="purple" className="text-center py-12">
                <Music className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <p className="text-gray-400 mb-2">Select an event to manage song requests</p>
                <p className="text-sm text-gray-500">Use the menu on the left (desktop) or tap the menu icon (mobile)</p>
              </GlassCard>
            )}
          </div>
        </div>

        {/* Full-screen request mode overlay */}
        {fullScreenRequests && selectedEvent && (
            <div className="fixed inset-0 z-[100] bg-gray-900/98 backdrop-blur flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-white">{selectedEvent.name} — Requests</span>
                  <span className="text-sm text-green-400">
                    {typeof selectedEvent?.totalTipRevenue === 'number' || typeof selectedEvent?.totalTipRevenue === 'string'
                      ? `${Number(selectedEvent.totalTipRevenue).toLocaleString()} RWF`
                      : '0 RWF'}
                  </span>
                </div>
                <GlowButton noMotion
                  type="button"
                  onClick={() => setFullScreenRequests(false)}
                  glowColor="red"
                  size="sm"
                  className="min-h-[44px]"
                >
                  <Minimize2 className="w-4 h-4 mr-2" />
                  Exit full screen
                </GlowButton>
              </div>
              <div className="flex flex-wrap items-center gap-2 p-4 border-b border-white/10 flex-shrink-0">
                <div className="flex rounded-lg overflow-hidden border border-white/20">
                  <button
                    type="button"
                    onClick={() => { setRequestTab('active'); setRequestFilter('active') }}
                    className={`px-3 py-2 text-sm font-medium min-h-[44px] ${requestTab === 'active' ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-gray-400'}`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestTab('played')}
                    className={`px-3 py-2 text-sm font-medium min-h-[44px] ${requestTab === 'played' ? 'bg-blue-500/30 text-blue-200' : 'bg-white/5 text-gray-400'}`}
                  >
                    Played
                  </button>
                </div>
                {requestTab === 'active' && (
                  <select
                    value={requestFilter}
                    onChange={(e) => setRequestFilter(e.target.value)}
                    className="rounded-lg bg-white/10 border border-white/20 text-sm text-white py-2 px-3 min-h-[44px]"
                  >
                    <option value="active">All active</option>
                    <option value="tipped">Tipped only</option>
                    <option value="no_tip">No tip</option>
                    <option value="pending">Pending</option>
                  </select>
                )}
                <select
                  value={requestSort}
                  onChange={(e) => setRequestSort(e.target.value)}
                  className="rounded-lg bg-white/10 border border-white/20 text-sm text-white py-2 px-3 min-h-[44px]"
                >
                  <option value="tip_desc">Highest tip first</option>
                  <option value="recent">Most recent</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {requests && requests.length > 0 ? (
                  <div className="space-y-3 max-w-2xl mx-auto">
                    {requests.slice(0, requestsDisplayCount).map((request) => (
                      <div
                        key={request.id}
                        className={`glass rounded-lg p-4 transition-colors hover:bg-white/5 ${highlightRequestId === request.id ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-gray-900' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{request.songTitle}</p>
                              {(Number(request.tipAmount) || 0) > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                                  {Number(request.tipAmount).toLocaleString()} RWF
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">{request.songArtist}</p>
                            {request.requesterName && (
                              <div className="flex items-center gap-1.5 mt-2 mb-1">
                                <User className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                <span className="text-sm font-medium text-purple-300">{request.requesterName}</span>
                              </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {request.payerPhone && `${request.payerPhone} · `}
                              {request.createdAt && formatInRwanda(request.createdAt)}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === RequestStatus.PENDING ? 'bg-yellow-500/20 text-yellow-400' :
                            request.status === RequestStatus.ACCEPTED ? 'bg-green-500/20 text-green-400' :
                            request.status === RequestStatus.DECLINED ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        {request.status === RequestStatus.PENDING && (
                          <div className="flex gap-2 mt-3">
                            <GlowButton noMotion onClick={() => handleStatusUpdate(request.id, RequestStatus.ACCEPTED)} glowColor="green" size="sm" variant="outline" className="flex-1">
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Accept
                            </GlowButton>
                            <GlowButton noMotion onClick={() => handleStatusUpdate(request.id, RequestStatus.DECLINED)} glowColor="red" size="sm" variant="outline" className="flex-1">
                              <XCircle className="w-4 h-4 mr-1" /> Decline
                            </GlowButton>
                          </div>
                        )}
                        {request.status === RequestStatus.ACCEPTED && (
                          <GlowButton noMotion onClick={() => handleStatusUpdate(request.id, RequestStatus.PLAYED)} glowColor="blue" size="sm" variant="outline" className="w-full mt-3">
                            <PlayCircle className="w-4 h-4 mr-1" /> Mark as Played
                          </GlowButton>
                        )}
                      </div>
                    ))}
                    {requests.length > requestsDisplayCount && (
                      <button
                        type="button"
                        onClick={() => setRequestsDisplayCount((c) => c + 25)}
                        className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm"
                      >
                        Show more ({requests.length - requestsDisplayCount} remaining)
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-12">No requests in this view</p>
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
