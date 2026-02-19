'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { adminApi, authApi } from '@/lib/api'
import { DashboardBackground } from '@/components/theme/DashboardBackground'
import { GlassCard } from '@/components/GlassCard'
import { GlowButton } from '@/components/GlowButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Calendar, 
  Music, 
  BarChart3, 
  TrendingUp, 
  LogOut, 
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  Check,
  AlertCircle,
  DollarSign,
  Maximize2,
  Mail,
  Send
} from 'lucide-react'
import type { User, AdminEvent, AdminRequest, RevenueByDjResponse, RevenueSeriesResponse, TopSongResponse, EmailBroadcastLog } from '@/lib/types'
import { Role, EventStatus, RequestStatus } from '@/lib/types'
import { DashboardProfile } from '@/components/dashboard/DashboardProfile'
import { getCurrentUser } from '@/lib/auth'
import { shouldRedirect } from '@/lib/roleGuard'
import { useMounted } from '@/hooks/useMounted'
import { getApiErrorMessage } from '@/lib/apiClient'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { ReportExport } from '@/components/export/ReportExport'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { DatePicker } from '@/components/ui/DatePicker'
import { formatInRwanda, formatDateInRwanda } from '@/lib/utils'
import { FullScreenOverlay } from '@/components/ui/FullScreenOverlay'

interface AnalyticsData {
  usersPerRole: Record<string, number>
  totalEvents: number
  activeEvents: number
  endedEvents: number
  totalRequests: number
  pendingRequests: number
  acceptedRequests: number
  declinedRequests: number
  playedRequests: number
  totalTipRevenue?: number
  topDjs: Array<{ userId: number; userName: string; userEmail: string; requestCount: number }>
  topDjsByTipRevenue?: Array<{ userId: number; userName: string; userEmail: string; totalTipRevenue: number }>
  requestVolume: Array<{ date: string; count: number }>
  eventRevenueRanking?: Array<{ eventId: number; eventName: string; djId: number; djName: string; totalTipRevenue: number; tippedRequestCount: number }>
  revenueByDay?: Array<{ date: string; revenue: number }>
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const mounted = useMounted()
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'events' | 'requests' | 'revenue' | 'broadcast'>('overview')
  const [revenueFrom, setRevenueFrom] = useState('')
  const [revenueTo, setRevenueTo] = useState('')
  const [revenueDjId, setRevenueDjId] = useState<string>('') // "" = all DJs
  // Broadcast state
  const [broadcastRecipientType, setBroadcastRecipientType] = useState<'ALL' | 'ROLE' | 'SELECTED'>('ALL')
  const [broadcastRecipientRole, setBroadcastRecipientRole] = useState<string>('')
  const [broadcastRecipientIds, setBroadcastRecipientIds] = useState<number[]>([])
  const [broadcastSubject, setBroadcastSubject] = useState('')
  const [broadcastContent, setBroadcastContent] = useState('')
  const [broadcastLogsPage, setBroadcastLogsPage] = useState(0)

  const [revenueInterval, setRevenueInterval] = useState<'day' | 'hour'>('day')
  const [revenueDay, setRevenueDay] = useState<string>('') // YYYY-MM-DD; forces hourly view
  const [error, setError] = useState<string | null>(null)
  const [fullScreen, setFullScreen] = useState<null | string>(null)
  
  // Filters
  const [userRoleFilter, setUserRoleFilter] = useState<string>('')
  const [eventStatusFilter, setEventStatusFilter] = useState<string>('')
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('')
  const [requestDateFrom, setRequestDateFrom] = useState<string>('')
  const [requestDateTo, setRequestDateTo] = useState<string>('')
  const [requestDjId, setRequestDjId] = useState<string>('') // "" = all DJs
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [analyticsRange, setAnalyticsRange] = useState<'7' | '30' | '90' | 'custom'>('30')
  
  // Pagination
  const [userPage, setUserPage] = useState(0)
  const [eventPage, setEventPage] = useState(0)
  const [requestPage, setRequestPage] = useState(0)
  const pageSize = 10

  const currentUser = mounted ? (profileUser ?? getCurrentUser()) : null

  useEffect(() => {
    if (mounted) setProfileUser(getCurrentUser())
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    const user = getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }
    const redirect = shouldRedirect(user.role, '/dashboard/admin')
    if (redirect) {
      router.push(redirect)
    }
  }, [mounted, router])

  const analyticsDateRange = (() => {
    const to = new Date()
    const toStr = to.toISOString().slice(0, 10)
    if (analyticsRange === 'custom') return { from: dateFrom || undefined, to: dateTo || undefined }
    const days = analyticsRange === '7' ? 7 : analyticsRange === '90' ? 90 : 30
    const from = new Date(to)
    from.setDate(from.getDate() - days)
    return { from: from.toISOString().slice(0, 10), to: toStr }
  })()

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics', analyticsDateRange.from, analyticsDateRange.to],
    queryFn: () => adminApi.getAnalytics(analyticsDateRange.from, analyticsDateRange.to),
    enabled: !!currentUser && currentUser.role === Role.SUPER_ADMIN,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', userPage, userRoleFilter],
    queryFn: () => adminApi.getUsers(userPage, pageSize, userRoleFilter || undefined),
    enabled: !!currentUser && currentUser.role === Role.SUPER_ADMIN && activeTab === 'users',
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Events
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-events', eventPage, eventStatusFilter, dateFrom, dateTo],
    queryFn: () => adminApi.getEvents(eventPage, pageSize, eventStatusFilter || undefined, dateFrom || undefined, dateTo || undefined),
    enabled: !!currentUser && currentUser.role === Role.SUPER_ADMIN && activeTab === 'events',
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // DJ list for Requests tab filter (DJ + ARTIST roles)
  const { data: djsForRequests } = useQuery({
    queryKey: ['admin-users-djs'],
    queryFn: async () => {
      const [djRes, artistRes] = await Promise.all([
        adminApi.getUsers(0, 100, 'DJ'),
        adminApi.getUsers(0, 100, 'ARTIST'),
      ])
      const byId = new Map<number, User>()
      djRes.content.forEach((u) => byId.set(u.id, u))
      artistRes.content.forEach((u) => byId.set(u.id, u))
      return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
    },
    enabled: !!currentUser && currentUser.role === Role.SUPER_ADMIN && activeTab === 'requests',
    staleTime: 5 * 60 * 1000,
  })

  // Requests
  const requestDjIdNum = requestDjId ? Number(requestDjId) : undefined
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['admin-requests', requestPage, requestStatusFilter, requestDjIdNum, requestDateFrom, requestDateTo],
    queryFn: () => adminApi.getRequests(requestPage, pageSize, requestStatusFilter || undefined, undefined, requestDjIdNum, requestDateFrom || undefined, requestDateTo || undefined),
    enabled: !!currentUser && currentUser.role === Role.SUPER_ADMIN && activeTab === 'requests',
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Revenue by DJ (filterable by date)
  const { data: revenueByDj, isLoading: revenueByDjLoading } = useQuery<RevenueByDjResponse[]>({
    queryKey: ['admin-revenue-by-dj', revenueFrom, revenueTo],
    queryFn: () => adminApi.getRevenueByDj(revenueFrom || undefined, revenueTo || undefined),
    enabled: !!currentUser && currentUser.role === Role.SUPER_ADMIN && activeTab === 'revenue',
    staleTime: 1 * 60 * 1000,
  })

  const revenueDjIdNum = revenueDjId ? Number(revenueDjId) : undefined
  const effectiveInterval: 'day' | 'hour' = revenueDay ? 'hour' : revenueInterval

  const { data: revenueSeries, isFetching: revenueSeriesLoading } = useQuery<RevenueSeriesResponse>({
    queryKey: ['admin-revenue-series', revenueDjIdNum || null, revenueFrom || null, revenueTo || null, revenueDay || null, effectiveInterval],
    queryFn: () => adminApi.getRevenueSeries({
      djId: revenueDjIdNum,
      fromDate: revenueFrom || undefined,
      toDate: revenueTo || undefined,
      day: revenueDay || undefined,
      interval: effectiveInterval,
    }),
    enabled: !!currentUser && currentUser.role === Role.SUPER_ADMIN && activeTab === 'revenue',
    staleTime: 60 * 1000,
  })

  const { data: topSongs, isFetching: topSongsLoading } = useQuery<TopSongResponse[]>({
    queryKey: ['admin-top-songs', revenueDjIdNum || null, revenueFrom || null, revenueTo || null],
    queryFn: () => adminApi.getTopSongs({
      djId: revenueDjIdNum,
      fromDate: revenueFrom || undefined,
      toDate: revenueTo || undefined,
      limit: 10,
    }),
    enabled: !!currentUser && currentUser.role === Role.SUPER_ADMIN && activeTab === 'revenue',
    staleTime: 60 * 1000,
  })

  // Broadcast mutations and queries
  const sendBroadcastMutation = useMutation({
    mutationFn: adminApi.sendEmailBroadcast,
    onSuccess: () => {
      setBroadcastSubject('')
      setBroadcastContent('')
      setBroadcastRecipientType('ALL')
      setBroadcastRecipientRole('')
      setBroadcastRecipientIds([])
      queryClient.invalidateQueries({ queryKey: ['admin-broadcast-logs'] })
    },
  })

  const { data: broadcastLogsData, isLoading: logsLoading } = useQuery({
    queryKey: ['admin-broadcast-logs', broadcastLogsPage],
    queryFn: () => adminApi.getBroadcastLogs(broadcastLogsPage, 20),
    enabled: !!currentUser && currentUser.role === Role.SUPER_ADMIN && activeTab === 'broadcast',
  })

  // Fetch DJs and Artists for recipient selection
  const { data: djsData } = useQuery({
    queryKey: ['admin-users-djs'],
    queryFn: () => adminApi.getUsers(0, 1000, 'DJ'),
    enabled: !!currentUser && currentUser.role === Role.SUPER_ADMIN && activeTab === 'broadcast' && broadcastRecipientType === 'SELECTED',
  })

  const { data: artistsData } = useQuery({
    queryKey: ['admin-users-artists'],
    queryFn: () => adminApi.getUsers(0, 1000, 'ARTIST'),
    enabled: !!currentUser && currentUser.role === Role.SUPER_ADMIN && activeTab === 'broadcast' && broadcastRecipientType === 'SELECTED',
  })

  // Combine DJs and Artists for selection
  const availableUsers = [
    ...(djsData?.content || []),
    ...(artistsData?.content || []),
  ]

  const OverviewTopDjsContent = () => (
    <div className="space-y-3">
      {analytics?.topDjs?.map((dj, idx) => (
        <div key={dj.userId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {idx + 1}
            </div>
            <div>
              <div className="font-semibold text-gray-200">{dj.userName}</div>
              <div className="text-sm text-gray-400">{dj.userEmail}</div>
            </div>
          </div>
          <div className="text-purple-300 font-bold">{dj.requestCount} requests</div>
        </div>
      ))}
    </div>
  )

  const OverviewTopRevenueDjsContent = () => (
    <div className="space-y-3">
      {analytics?.topDjsByTipRevenue?.map((dj, idx) => (
        <div key={dj.userId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold">
              {idx + 1}
            </div>
            <div>
              <div className="font-semibold text-gray-200">{dj.userName}</div>
              <div className="text-sm text-gray-400">{dj.userEmail}</div>
            </div>
          </div>
          <div className="text-green-300 font-bold">{Number(dj.totalTipRevenue || 0).toLocaleString()} RWF</div>
        </div>
      ))}
    </div>
  )

  const OverviewEventRankingContent = ({ large }: { large?: boolean }) => (
    <div className="overflow-x-auto">
      <table className={`w-full ${large ? 'text-base' : 'text-sm'}`}>
        <thead>
          <tr className="text-left text-gray-400 border-b border-white/10">
            <th className="py-2 pr-4">#</th>
            <th className="py-2 pr-4">Event</th>
            <th className="py-2 pr-4">DJ</th>
            <th className="py-2 pr-4 text-right">Revenue (RWF)</th>
            <th className="py-2 text-right">Tipped requests</th>
          </tr>
        </thead>
        <tbody>
          {analytics?.eventRevenueRanking?.map((ev, idx) => (
            <tr key={ev.eventId} className="border-b border-white/5">
              <td className="py-2 pr-4 text-gray-400">{idx + 1}</td>
              <td className="py-2 pr-4 font-medium text-gray-200">{ev.eventName}</td>
              <td className="py-2 pr-4 text-gray-300">{ev.djName}</td>
              <td className="py-2 pr-4 text-right text-green-400 font-medium">{Number(ev.totalTipRevenue || 0).toLocaleString()}</td>
              <td className="py-2 text-right text-gray-400">{ev.tippedRequestCount ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const OverviewRevenueOverTimeContent = ({ large }: { large?: boolean }) => (
    <div className="flex items-end gap-1" style={{ height: large ? 320 : 160 }}>
      {analytics?.revenueByDay?.map((d) => {
        const max = Math.max(...analytics.revenueByDay!.map((x) => Number(x.revenue || 0)), 1)
        const h = (Number(d.revenue) / max) * 100
        return (
          <div
            key={d.date}
            className="flex-1 min-w-0 flex flex-col items-center gap-1"
            title={`${d.date}: ${Number(d.revenue).toLocaleString()} RWF`}
          >
            <div
              className="w-full bg-green-500/50 rounded-t min-h-[4px] transition-all"
              style={{ height: `${Math.max(h, 2)}%` }}
            />
            <span className={`text-xs ${large ? 'sm:text-sm' : ''} text-gray-500 truncate w-full text-center`}>
              {d.date.slice(5)}
            </span>
          </div>
        )
      })}
    </div>
  )

  const RevenueHistogramContent = ({ large }: { large?: boolean }) => {
    const points = revenueSeries?.points ?? []
    const max = Math.max(...points.map((p) => Number(p.revenue) || 0), 1)
    if (revenueSeriesLoading) return <div className="text-gray-400 py-10 text-center">Loading chart…</div>
    if (!points.length) return <div className="text-gray-400 py-10 text-center">No chart data</div>
    return (
      <div className="overflow-x-auto">
        <div className="flex items-end gap-2 py-2 pr-2" style={{ minHeight: large ? 360 : 180, minWidth: Math.max(640, points.length * 18) }}>
          {points.map((p) => {
            const v = Number(p.revenue) || 0
            const h = Math.max(6, Math.round((v / max) * (large ? 320 : 160)))
            return (
              <div key={p.bucket} className="flex flex-col items-center gap-2">
                <div
                  title={`${p.bucket}: ${v.toLocaleString()} RWF`}
                  className="w-3 rounded-t-md bg-purple-500/70"
                  style={{ height: `${h}px` }}
                />
                <div className={`text-[10px] ${large ? 'sm:text-xs' : ''} text-gray-500 whitespace-nowrap rotate-[-45deg] origin-top-left`}>
                  {effectiveInterval === 'hour' ? p.bucket.slice(11, 16) : p.bucket.slice(5)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const RevenueTopSongsContent = () => (
    topSongs && topSongs.length > 0 ? (
      <div className="space-y-3">
        {(() => {
          const max = Math.max(...topSongs.map((s) => s.requestCount), 1)
          return topSongs.map((s, idx) => (
            <div key={`${s.title}-${s.artist}-${idx}`} className="space-y-1">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-gray-200 font-medium truncate">
                  {idx + 1}. {s.title} <span className="text-gray-500">— {s.artist}</span>
                </span>
                <span className="text-gray-400 flex-shrink-0">{s.requestCount}</span>
              </div>
              <div className="h-2 rounded bg-white/5 border border-white/10 overflow-hidden">
                <div className="h-full bg-pink-500/70" style={{ width: `${(s.requestCount / max) * 100}%` }} />
              </div>
            </div>
          ))
        })()}
      </div>
    ) : (
      <div className="text-gray-400 py-6 text-center">No requests</div>
    )
  )

  const RevenueBreakdownContent = ({ large }: { large?: boolean }) => (
    revenueByDjLoading ? (
      <div className="text-center py-10 text-gray-400">Loading…</div>
    ) : revenueByDj && revenueByDj.length > 0 ? (
      <div className="overflow-x-auto">
        <table className={`w-full text-left ${large ? 'text-base' : 'text-sm'}`}>
          <thead>
            <tr className="border-b border-white/20 text-gray-400">
              <th className="py-3 px-2">DJ Name</th>
              <th className="py-3 px-2">Email</th>
              <th className="py-3 px-2 text-right">Total (RWF)</th>
              <th className="py-3 px-2 text-right">From events</th>
              <th className="py-3 px-2 text-right">Tip records</th>
            </tr>
          </thead>
          <tbody>
            {revenueByDj.map((d) => (
              <tr key={d.userId} className="border-b border-white/10 hover:bg-white/5">
                <td className="py-3 px-2 font-medium text-white">{d.userName}</td>
                <td className="py-3 px-2 text-gray-300">{d.userEmail}</td>
                <td className="py-3 px-2 text-right text-green-400 font-medium">{Number(d.totalRevenue).toLocaleString()}</td>
                <td className="py-3 px-2 text-right text-gray-300">{Number(d.songRequestRevenue).toLocaleString()}</td>
                <td className="py-3 px-2 text-right text-gray-300">{Number(d.standaloneTipRevenue).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-center py-10 text-gray-400">No revenue data</div>
    )
  )

  const handleLogout = () => {
    authApi.logout()
    router.push('/login')
  }

  const adminReportSummary = [
    { label: 'Total revenue (RWF)', value: analytics?.totalTipRevenue != null ? Number(analytics.totalTipRevenue).toLocaleString() : '0' },
    { label: 'Total requests', value: analytics?.totalRequests ?? 0 },
    { label: 'Total played', value: analytics?.playedRequests ?? 0 },
    { label: 'Total declined', value: analytics?.declinedRequests ?? 0 },
    { label: 'Total users', value: analytics?.usersPerRole ? Object.values(analytics.usersPerRole).reduce((a, b) => a + b, 0) : 0 },
    { label: 'Total events', value: analytics?.totalEvents ?? 0 },
    { label: 'Active events', value: analytics?.activeEvents ?? 0 },
    { label: 'Pending requests', value: analytics?.pendingRequests ?? 0 },
    { label: 'Accepted requests', value: analytics?.acceptedRequests ?? 0 },
  ]
  const adminReportTables: { title: string; headers: string[]; rows: (string | number)[][] }[] = []
  if (analytics?.topDjsByTipRevenue?.length) {
    adminReportTables.push({
      title: 'Revenue per DJ',
      headers: ['DJ Name', 'Email', 'Total revenue (RWF)'],
      rows: analytics.topDjsByTipRevenue.map((d) => [
        d.userName,
        d.userEmail,
        Number(d.totalTipRevenue || 0).toLocaleString(),
      ]),
    })
  }
  if (analytics?.eventRevenueRanking?.length) {
    adminReportTables.push({
      title: 'Event ranking by revenue',
      headers: ['Event', 'DJ', 'Revenue (RWF)', 'Tipped requests'],
      rows: analytics.eventRevenueRanking.map((e) => [
        e.eventName,
        e.djName,
        Number(e.totalTipRevenue || 0).toLocaleString(),
        e.tippedRequestCount ?? 0,
      ]),
    })
  }
  if (usersData?.content?.length) {
    adminReportTables.push({
      title: 'Users',
      headers: ['ID', 'Name', 'Email', 'Role'],
      rows: usersData.content.map((u) => [u.id, u.name, u.email, u.role]),
    })
  }
  if (eventsData?.content?.length) {
    adminReportTables.push({
      title: 'Events (with revenue)',
      headers: ['ID', 'Name', 'Creator', 'Start', 'Status', 'Tip revenue (RWF)'],
      rows: eventsData.content.map((e) => [
        e.id,
        e.name,
        e.creatorName ?? '',
        formatDateInRwanda(e.startTime),
        e.status,
        e.totalTipRevenue != null ? Number(e.totalTipRevenue).toLocaleString() : '0',
      ]),
    })
  }
  if (requestsData?.content?.length) {
    adminReportTables.push({
      title: 'Requests (detailed)',
      headers: ['ID', 'Song', 'User', 'Phone', 'Tip (RWF)', 'Status', 'Created', 'Event'],
      rows: requestsData.content.map((r) => [
        r.id,
        `${r.songTitle ?? ''} - ${r.songArtist ?? ''}`,
        r.userName ?? '',
        r.payerPhone ?? '',
        r.tipAmount != null ? Number(r.tipAmount).toLocaleString() : '0',
        r.status,
        r.createdAt ? formatInRwanda(r.createdAt) : '',
        r.eventName ?? '',
      ]),
    })
  }

  if (!mounted || !currentUser || currentUser.role !== Role.SUPER_ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="relative z-10 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-purple-400 animate-pulse" />
          <p className="text-xl text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <DashboardBackground />
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header — responsive */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gradient mb-1 sm:mb-2">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-400">Manage users, events, and requests</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ReportExport title="Admin Report" summary={adminReportSummary} tables={adminReportTables} />
            <GlowButton onClick={handleLogout} glowColor="red" className="min-h-[44px] touch-manipulation">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </GlowButton>
          </div>
        </motion.div>

        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <DashboardProfile user={currentUser} onUserUpdate={setProfileUser} />
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <ErrorMessage message={error} />
          </motion.div>
        )}

        {/* Tabs — wrap on mobile, touch-friendly */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['overview', 'users', 'events', 'requests', 'revenue', 'broadcast'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab)
                setError(null)
              }}
              className={`min-h-[44px] px-4 sm:px-6 py-2 rounded-lg font-medium transition-all touch-manipulation ${
                activeTab === tab
                  ? 'bg-purple-500/20 text-purple-300 glow-purple border border-purple-500/50'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-400">Analytics period:</span>
              {(['7', '30', '90'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setAnalyticsRange(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${analyticsRange === d ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  {d === '7' ? 'Last 7 days' : d === '30' ? 'Last 30 days' : 'Last 90 days'}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAnalyticsRange('custom')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${analyticsRange === 'custom' ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                Custom
              </button>
              {analyticsRange === 'custom' && (
                <span className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                  <DatePicker
                    value={dateFrom}
                    onChange={setDateFrom}
                    placeholder="From"
                    className="w-40"
                  />
                  <span>to</span>
                  <DatePicker
                    value={dateTo}
                    onChange={setDateTo}
                    placeholder="To"
                    className="w-40"
                  />
                </span>
              )}
            </div>
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <GlassCard glow="purple">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-8 h-8 text-purple-400" />
                    <span className="text-2xl font-bold text-purple-300">
                      {analytics?.usersPerRole ? Object.values(analytics.usersPerRole).reduce((a, b) => a + b, 0) : 0}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Total Users</p>
                </div>
              </GlassCard>

              <GlassCard glow="blue">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="w-8 h-8 text-blue-400" />
                    <span className="text-2xl font-bold text-blue-300">
                      {analytics?.totalEvents || 0}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Total Events</p>
                </div>
              </GlassCard>

              <GlassCard glow="pink">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Music className="w-8 h-8 text-pink-400" />
                    <span className="text-2xl font-bold text-pink-300">
                      {analytics?.totalRequests || 0}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Total Requests</p>
                </div>
              </GlassCard>

              <GlassCard glow="green">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="w-8 h-8 text-green-400" />
                    <span className="text-xl font-bold text-green-300">
                      {analytics?.totalTipRevenue != null
                        ? Number(analytics.totalTipRevenue).toLocaleString()
                        : '0'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Platform tip revenue (RWF)</p>
                </div>
              </GlassCard>

              <GlassCard glow="green">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <BarChart3 className="w-8 h-8 text-green-400" />
                    <span className="text-2xl font-bold text-green-300">
                      {analytics?.topDjs?.length || 0}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Active DJs</p>
                </div>
              </GlassCard>
            </div>

            {/* Users per Role */}
            <GlassCard glow="purple">
              <h3 className="text-xl font-bold mb-4 text-gradient">Users by Role</h3>
              <div className="space-y-3">
                {analytics?.usersPerRole && Object.entries(analytics.usersPerRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-gray-300">{role}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / (Object.values(analytics.usersPerRole).reduce((a, b) => a + b, 0) || 1)) * 100}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        />
                      </div>
                      <span className="text-purple-300 font-semibold w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Request Stats */}
            <GlassCard glow="pink">
              <h3 className="text-xl font-bold mb-4 text-gradient">Request Status Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                  <div className="text-2xl font-bold text-yellow-400">{analytics?.pendingRequests || 0}</div>
                  <div className="text-sm text-gray-400">Pending</div>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                  <div className="text-2xl font-bold text-green-400">{analytics?.acceptedRequests || 0}</div>
                  <div className="text-sm text-gray-400">Accepted</div>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                  <div className="text-2xl font-bold text-red-400">{analytics?.declinedRequests || 0}</div>
                  <div className="text-sm text-gray-400">Declined</div>
                </div>
                <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-400">{analytics?.playedRequests || 0}</div>
                  <div className="text-sm text-gray-400">Played</div>
                </div>
              </div>
            </GlassCard>

            {/* Top DJs by Requests */}
            {analytics?.topDjs && analytics.topDjs.length > 0 && (
              <GlassCard glow="blue">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-xl font-bold text-gradient">Top DJs by Requests</h3>
                  <Button variant="outline" size="sm" className="min-h-[44px] gap-2" onClick={() => setFullScreen('ov_top_djs')}>
                    <Maximize2 className="w-4 h-4" />
                    Full screen
                  </Button>
                </div>
                <div className="space-y-3">
                  {analytics.topDjs.map((dj, idx) => (
                    <div key={dj.userId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-200">{dj.userName}</div>
                          <div className="text-sm text-gray-400">{dj.userEmail}</div>
                        </div>
                      </div>
                      <div className="text-purple-300 font-bold">{dj.requestCount} requests</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Top DJs by Tip Revenue */}
            {analytics?.topDjsByTipRevenue && analytics.topDjsByTipRevenue.length > 0 && (
              <GlassCard glow="green">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-xl font-bold text-gradient">Revenue per DJ (Top Earning DJs)</h3>
                  <Button variant="outline" size="sm" className="min-h-[44px] gap-2" onClick={() => setFullScreen('ov_top_revenue_djs')}>
                    <Maximize2 className="w-4 h-4" />
                    Full screen
                  </Button>
                </div>
                <div className="space-y-3">
                  {analytics.topDjsByTipRevenue.map((dj, idx) => (
                    <div key={dj.userId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-200">{dj.userName}</div>
                          <div className="text-sm text-gray-400">{dj.userEmail}</div>
                        </div>
                      </div>
                      <div className="text-green-300 font-bold">
                        {Number(dj.totalTipRevenue || 0).toLocaleString()} RWF
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Event revenue ranking (highest tipping events) */}
            {analytics?.eventRevenueRanking && analytics.eventRevenueRanking.length > 0 && (
              <GlassCard glow="blue">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-xl font-bold text-gradient">Event Performance Ranking (by Tip Revenue)</h3>
                  <Button variant="outline" size="sm" className="min-h-[44px] gap-2" onClick={() => setFullScreen('ov_event_ranking')}>
                    <Maximize2 className="w-4 h-4" />
                    Full screen
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-white/10">
                        <th className="py-2 pr-4">#</th>
                        <th className="py-2 pr-4">Event</th>
                        <th className="py-2 pr-4">DJ</th>
                        <th className="py-2 pr-4 text-right">Revenue (RWF)</th>
                        <th className="py-2 text-right">Tipped requests</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.eventRevenueRanking.map((ev, idx) => (
                        <tr key={ev.eventId} className="border-b border-white/5">
                          <td className="py-2 pr-4 text-gray-400">{idx + 1}</td>
                          <td className="py-2 pr-4 font-medium text-gray-200">{ev.eventName}</td>
                          <td className="py-2 pr-4 text-gray-300">{ev.djName}</td>
                          <td className="py-2 pr-4 text-right text-green-400 font-medium">{Number(ev.totalTipRevenue || 0).toLocaleString()}</td>
                          <td className="py-2 text-right text-gray-400">{ev.tippedRequestCount ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}

            {/* Revenue over time (simple chart) */}
            {analytics?.revenueByDay && analytics.revenueByDay.length > 0 && (
              <GlassCard glow="green">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-xl font-bold text-gradient">Tip Revenue Over Time</h3>
                  <Button variant="outline" size="sm" className="min-h-[44px] gap-2" onClick={() => setFullScreen('ov_revenue_over_time')}>
                    <Maximize2 className="w-4 h-4" />
                    Full screen
                  </Button>
                </div>
                <div className="flex items-end gap-1 h-40">
                  {analytics.revenueByDay.map((d) => {
                    const max = Math.max(...analytics.revenueByDay!.map((x) => Number(x.revenue || 0)), 1)
                    const h = (Number(d.revenue) / max) * 100
                    return (
                      <div
                        key={d.date}
                        className="flex-1 min-w-0 flex flex-col items-center gap-1"
                        title={`${d.date}: ${Number(d.revenue).toLocaleString()} RWF`}
                      >
                        <div
                          className="w-full bg-green-500/50 rounded-t min-h-[4px] transition-all"
                          style={{ height: `${Math.max(h, 2)}%` }}
                        />
                        <span className="text-xs text-gray-500 truncate w-full text-center">{d.date.slice(5)}</span>
                      </div>
                    )
                  })}
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <GlassCard glow="purple" noEnterAnimation>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gradient">Users</h2>
                <div className="flex gap-2">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value)
                      setUserPage(0)
                    }}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-300"
                  >
                    <option value="">All Roles</option>
                    {Object.values(Role).map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              {usersLoading ? (
                <div className="text-center py-12 text-gray-400">Loading...</div>
              ) : (
                <>
                  <ResponsiveTable<User>
                    caption="Users list"
                    columns={[
                      { key: 'id', header: 'ID', render: (u) => u.id },
                      { key: 'name', header: 'Name', render: (u) => u.name },
                      { key: 'email', header: 'Email', render: (u) => u.email },
                      {
                        key: 'role',
                        header: 'Role',
                        render: (u) => (
                          <span className={`px-2 py-1 rounded text-xs ${
                            u.role === Role.SUPER_ADMIN ? 'bg-red-500/20 text-red-300' :
                            u.role === Role.DJ || u.role === Role.ARTIST ? 'bg-purple-500/20 text-purple-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {u.role}
                          </span>
                        ),
                      },
                    ]}
                    data={usersData?.content ?? []}
                    keyExtractor={(u) => u.id}
                  />
                  {usersData && usersData.content.length > 0 && usersData.totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        onClick={() => setUserPage(p => Math.max(0, p - 1))}
                        disabled={userPage === 0}
                        variant="outline"
                      >
                        Previous
                      </Button>
                      <span className="text-gray-400">
                        Page {userPage + 1} of {usersData.totalPages}
                      </span>
                      <Button
                        onClick={() => setUserPage(p => Math.min(usersData.totalPages - 1, p + 1))}
                        disabled={userPage >= usersData.totalPages - 1}
                        variant="outline"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </GlassCard>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <GlassCard glow="blue" noEnterAnimation>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gradient">Events</h2>
                <div className="flex gap-2">
                  <select
                    value={eventStatusFilter}
                    onChange={(e) => {
                      setEventStatusFilter(e.target.value)
                      setEventPage(0)
                    }}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-300"
                  >
                    <option value="">All Status</option>
                    {Object.values(EventStatus).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              {eventsLoading ? (
                <div className="text-center py-12 text-gray-400">Loading...</div>
              ) : (
                <>
                  <ResponsiveTable<AdminEvent>
                    caption="Events list"
                    columns={[
                      { key: 'id', header: 'ID', render: (e) => e.id },
                      { key: 'name', header: 'Name', render: (e) => e.name },
                      { key: 'creator', header: 'Creator', render: (e) => e.creatorName ?? 'N/A' },
                      { key: 'start', header: 'Start', render: (e) => formatDateInRwanda(e.startTime) },
                      {
                        key: 'status',
                        header: 'Status',
                        render: (e) => (
                          <span className={`px-2 py-1 rounded text-xs ${
                            e.status === EventStatus.ACTIVE ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {e.status}
                          </span>
                        ),
                      },
                    ]}
                    data={eventsData?.content ?? []}
                    keyExtractor={(e) => e.id}
                  />
                  {eventsData && eventsData.content.length > 0 && eventsData.totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        onClick={() => setEventPage(p => Math.max(0, p - 1))}
                        disabled={eventPage === 0}
                        variant="outline"
                      >
                        Previous
                      </Button>
                      <span className="text-gray-400">
                        Page {eventPage + 1} of {eventsData.totalPages}
                      </span>
                      <Button
                        onClick={() => setEventPage(p => Math.min(eventsData.totalPages - 1, p + 1))}
                        disabled={eventPage >= eventsData.totalPages - 1}
                        variant="outline"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </GlassCard>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <GlassCard glow="pink" noEnterAnimation>
            <div className="p-6">
              <div className="flex flex-col gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gradient">Requests</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-gray-400">Filters:</span>
                  <select
                    value={requestDjId}
                    onChange={(e) => {
                      setRequestDjId(e.target.value)
                      setRequestPage(0)
                    }}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-300 min-w-[160px]"
                    title="Filter by DJ"
                  >
                    <option value="">All DJs</option>
                    {djsForRequests?.map((dj) => (
                      <option key={dj.id} value={dj.id}>{dj.name}</option>
                    ))}
                  </select>
                  <DatePicker
                    value={requestDateFrom}
                    onChange={(v) => {
                      setRequestDateFrom(v)
                      setRequestPage(0)
                    }}
                    placeholder="From date"
                    className="w-40"
                  />
                  <span className="text-gray-500">to</span>
                  <DatePicker
                    value={requestDateTo}
                    onChange={(v) => {
                      setRequestDateTo(v)
                      setRequestPage(0)
                    }}
                    placeholder="To date"
                    className="w-40"
                  />
                  <select
                    value={requestStatusFilter}
                    onChange={(e) => {
                      setRequestStatusFilter(e.target.value)
                      setRequestPage(0)
                    }}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-300"
                  >
                    <option value="">All Status</option>
                    {Object.values(RequestStatus).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRequestDjId('')
                      setRequestDateFrom('')
                      setRequestDateTo('')
                      setRequestStatusFilter('')
                      setRequestPage(0)
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              </div>

              {requestsLoading ? (
                <div className="text-center py-12 text-gray-400">Loading...</div>
              ) : (
                <>
                  <ResponsiveTable<AdminRequest>
                    caption="Requests list"
                    columns={[
                      { key: 'id', header: 'ID', render: (r) => r.id },
                      { key: 'song', header: 'Song', render: (r) => `${r.songTitle ?? 'N/A'} - ${r.songArtist ?? 'N/A'}` },
                      { key: 'requester', header: 'Requester', render: (r) => r.userName ?? 'N/A' },
                      { key: 'event', header: 'Event', render: (r) => r.eventName ?? 'N/A' },
                      {
                        key: 'status',
                        header: 'Status',
                        render: (r) => (
                          <span className={`px-2 py-1 rounded text-xs ${
                            r.status === RequestStatus.PENDING ? 'bg-yellow-500/20 text-yellow-300' :
                            r.status === RequestStatus.ACCEPTED ? 'bg-green-500/20 text-green-300' :
                            r.status === RequestStatus.DECLINED ? 'bg-red-500/20 text-red-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {r.status}
                          </span>
                        ),
                      },
                    ]}
                    data={requestsData?.content ?? []}
                    keyExtractor={(r) => r.id}
                  />
                  {requestsData && requestsData.content.length > 0 && requestsData.totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        onClick={() => setRequestPage(p => Math.max(0, p - 1))}
                        disabled={requestPage === 0}
                        variant="outline"
                      >
                        Previous
                      </Button>
                      <span className="text-gray-400">
                        Page {requestPage + 1} of {requestsData.totalPages}
                      </span>
                      <Button
                        onClick={() => setRequestPage(p => Math.min(requestsData.totalPages - 1, p + 1))}
                        disabled={requestPage >= requestsData.totalPages - 1}
                        variant="outline"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </GlassCard>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <GlassCard glow="green" noEnterAnimation>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gradient">Tip revenue analytics</h2>
                    <p className="text-sm text-gray-400">Trends, peak hours, DJ breakdown, and top requested songs.</p>
      </div>
                  <GlowButton
                    size="sm"
                    glowColor="green"
                    onClick={() => {
                      if (!revenueByDj?.length) return
                      const headers = 'DJ Name,Email,Total Revenue (RWF),Song Request Revenue (RWF),Standalone Tip Revenue (RWF),Tip-only Records'
                      const rows = revenueByDj.map((d) => [
                        `"${(d.userName ?? '').replace(/"/g, '""')}"`,
                        `"${(d.userEmail ?? '').replace(/"/g, '""')}"`,
                        Number(d.totalRevenue).toLocaleString(),
                        Number(d.songRequestRevenue).toLocaleString(),
                        Number(d.standaloneTipRevenue).toLocaleString(),
                        d.tipRecordCount,
                      ].join(','))
                      const csv = [headers, ...rows].join('\n')
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
                      const a = document.createElement('a')
                      a.href = URL.createObjectURL(blob)
                      a.download = `revenue-by-dj${revenueFrom || revenueTo ? `-${revenueFrom || ''}-${revenueTo || ''}` : ''}.csv`
                      a.click()
                      URL.revokeObjectURL(a.href)
                    }}
                    disabled={!revenueByDj?.length}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Export revenue by DJ
                  </GlowButton>
    </div>

                {/* Filters */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-6">
                  <div className="lg:col-span-4">
                    <label className="block text-xs text-gray-400 mb-1">DJ</label>
                    <select
                      value={revenueDjId}
                      onChange={(e) => setRevenueDjId(e.target.value)}
                      className="w-full rounded-lg bg-white/10 border border-white/20 text-sm text-white py-2 px-3 min-h-[44px]"
                      aria-label="Filter by DJ"
                    >
                      <option value="">All DJs</option>
                      {revenueByDj?.map((d) => (
                        <option key={d.userId} value={String(d.userId)}>{d.userName} ({d.userEmail})</option>
                      ))}
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">From</label>
                    <Input type="date" value={revenueFrom} onChange={(e) => setRevenueFrom(e.target.value)} className="bg-white/10" />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">To</label>
                    <Input type="date" value={revenueTo} onChange={(e) => setRevenueTo(e.target.value)} className="bg-white/10" />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Specific day (hourly)</label>
                    <Input type="date" value={revenueDay} onChange={(e) => setRevenueDay(e.target.value)} className="bg-white/10" />
                  </div>
                  <div className="lg:col-span-2 flex items-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setRevenueFrom(''); setRevenueTo(''); setRevenueDay(''); setRevenueInterval('day'); setRevenueDjId('') }}
                      className="w-full"
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="lg:col-span-12 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-400">Interval</span>
                    <div className="flex rounded-lg overflow-hidden border border-white/20">
                      <button
                        type="button"
                        onClick={() => setRevenueInterval('day')}
                        disabled={!!revenueDay}
                        className={`px-3 py-2 text-sm font-medium min-h-[44px] ${(!revenueDay && revenueInterval === 'day') ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-gray-400'} disabled:opacity-60`}
                      >
                        By day
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevenueInterval('hour')}
                        className={`px-3 py-2 text-sm font-medium min-h-[44px] ${(revenueDay || revenueInterval === 'hour') ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-gray-400'}`}
                      >
                        By hour
                      </button>
                    </div>
                    {revenueDay && <span className="text-xs text-gray-500">Specific day forces hourly view</span>}
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-xs text-gray-400">Total revenue</div>
                    <div className="text-2xl font-bold text-green-400">
                      {revenueSeries ? Number(revenueSeries.totalRevenue).toLocaleString() : '0'} <span className="text-sm text-gray-500 font-medium">RWF</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-xs text-gray-400">Total requests</div>
                    <div className="text-2xl font-bold text-purple-200">
                      {revenueSeries ? Number(revenueSeries.totalRequests).toLocaleString() : '0'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-xs text-gray-400">Peak {effectiveInterval === 'hour' ? 'hour' : 'day'}</div>
                    {(() => {
                      const pts = revenueSeries?.points ?? []
                      const peak = pts.reduce<{ bucket: string; revenue: number } | null>((best, p) => {
                        const v = Number(p.revenue) || 0
                        if (!best || v > best.revenue) return { bucket: p.bucket, revenue: v }
                        return best
                      }, null)
                      return peak ? (
                        <>
                          <div className="text-lg font-bold text-yellow-300">{peak.revenue.toLocaleString()} RWF</div>
                          <div className="text-xs text-gray-500 truncate">{peak.bucket}</div>
                        </>
                      ) : (
                        <div className="text-gray-400">—</div>
                      )
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
                  {/* Revenue histogram */}
                  <div className="lg:col-span-8 rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-400" />
                        <h3 className="font-semibold text-gray-200">Revenue histogram</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{revenueSeries?.dateFrom} → {revenueSeries?.dateTo}</span>
                        <Button variant="outline" size="sm" className="min-h-[44px] gap-2" onClick={() => setFullScreen('rev_histogram')}>
                          <Maximize2 className="w-4 h-4" />
                          Full screen
                        </Button>
                      </div>
                    </div>
                    {revenueSeriesLoading ? (
                      <div className="text-gray-400 py-10 text-center">Loading chart…</div>
                    ) : (revenueSeries?.points?.length ? (
                      (() => {
                        const points = revenueSeries.points
                        const max = Math.max(...points.map((p) => Number(p.revenue) || 0), 1)
                        return (
                          <div className="overflow-x-auto">
                            <div className="flex items-end gap-2 min-h-[180px] py-2 pr-2" style={{ minWidth: Math.max(640, points.length * 18) }}>
                              {points.map((p) => {
                                const v = Number(p.revenue) || 0
                                const h = Math.max(6, Math.round((v / max) * 160))
                                return (
                                  <div key={p.bucket} className="flex flex-col items-center gap-2">
                                    <div
                                      title={`${p.bucket}: ${v.toLocaleString()} RWF`}
                                      className="w-3 rounded-t-md bg-purple-500/70"
                                      style={{ height: `${h}px` }}
                                    />
                                    <div className="text-[10px] text-gray-500 whitespace-nowrap rotate-[-45deg] origin-top-left">
                                      {effectiveInterval === 'hour' ? p.bucket.slice(11, 16) : p.bucket.slice(5)}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })()
                    ) : (
                      <div className="text-gray-400 py-10 text-center">No chart data</div>
                    ))}
                  </div>

                  {/* Top songs */}
                  <div className="lg:col-span-4 rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Music className="w-5 h-5 text-pink-400" />
                        <h3 className="font-semibold text-gray-200">Top requested songs</h3>
                      </div>
                      <Button variant="outline" size="sm" className="min-h-[44px] gap-2" onClick={() => setFullScreen('rev_top_songs')}>
                        <Maximize2 className="w-4 h-4" />
                        Full screen
                      </Button>
                    </div>
                    {topSongsLoading ? (
                      <div className="text-gray-400 py-10 text-center">Loading…</div>
                    ) : topSongs && topSongs.length > 0 ? (
                      <div className="space-y-3">
                        {(() => {
                          const max = Math.max(...topSongs.map((s) => s.requestCount), 1)
                          return topSongs.map((s, idx) => (
                            <div key={`${s.title}-${s.artist}-${idx}`} className="space-y-1">
                              <div className="flex justify-between gap-3 text-sm">
                                <span className="text-gray-200 font-medium truncate">
                                  {idx + 1}. {s.title} <span className="text-gray-500">— {s.artist}</span>
                                </span>
                                <span className="text-gray-400 flex-shrink-0">{s.requestCount}</span>
                              </div>
                              <div className="h-2 rounded bg-white/5 border border-white/10 overflow-hidden">
                                <div className="h-full bg-pink-500/70" style={{ width: `${(s.requestCount / max) * 100}%` }} />
                              </div>
                            </div>
                          ))
                        })()}
                      </div>
                    ) : (
                      <div className="text-gray-400 py-10 text-center">No requests</div>
                    )}
                  </div>
                </div>

                {/* Breakdown per DJ */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-gray-200">Revenue breakdown per DJ</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Table reflects the date range above</span>
                      <Button variant="outline" size="sm" className="min-h-[44px] gap-2" onClick={() => setFullScreen('rev_breakdown')}>
                        <Maximize2 className="w-4 h-4" />
                        Full screen
                      </Button>
                    </div>
                  </div>
                  {revenueByDjLoading ? (
                    <div className="text-center py-10 text-gray-400">Loading…</div>
                  ) : revenueByDj && revenueByDj.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-white/20 text-gray-400">
                            <th className="py-3 px-2">DJ Name</th>
                            <th className="py-3 px-2">Email</th>
                            <th className="py-3 px-2 text-right">Total (RWF)</th>
                            <th className="py-3 px-2 text-right">From events</th>
                            <th className="py-3 px-2 text-right">Tip records</th>
                          </tr>
                        </thead>
                        <tbody>
                          {revenueByDj.map((d) => (
                            <tr key={d.userId} className="border-b border-white/10 hover:bg-white/5">
                              <td className="py-3 px-2 font-medium text-white">{d.userName}</td>
                              <td className="py-3 px-2 text-gray-300">{d.userEmail}</td>
                              <td className="py-3 px-2 text-right text-green-400 font-medium">{Number(d.totalRevenue).toLocaleString()}</td>
                              <td className="py-3 px-2 text-right text-gray-300">{Number(d.songRequestRevenue).toLocaleString()}</td>
                              <td className="py-3 px-2 text-right text-gray-300">{Number(d.standaloneTipRevenue).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400">No revenue data</div>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>

      {/* Full-screen analytics overlay (reuses already-fetched data; no refetch on toggle) */}
      <FullScreenOverlay
        open={fullScreen === 'ov_top_djs'}
        title="Top DJs by Requests"
        onClose={() => setFullScreen(null)}
        headerExtra={
          <span className="text-xs text-gray-400">
            Period: {analyticsDateRange.from} → {analyticsDateRange.to}
          </span>
        }
      >
        <OverviewTopDjsContent />
      </FullScreenOverlay>

      <FullScreenOverlay
        open={fullScreen === 'ov_top_revenue_djs'}
        title="Revenue per DJ (Top Earning DJs)"
        onClose={() => setFullScreen(null)}
        headerExtra={
          <span className="text-xs text-gray-400">
            Period: {analyticsDateRange.from} → {analyticsDateRange.to}
          </span>
        }
      >
        <OverviewTopRevenueDjsContent />
      </FullScreenOverlay>

      <FullScreenOverlay
        open={fullScreen === 'ov_event_ranking'}
        title="Event Performance Ranking (by Tip Revenue)"
        onClose={() => setFullScreen(null)}
        headerExtra={
          <span className="text-xs text-gray-400">
            Period: {analyticsDateRange.from} → {analyticsDateRange.to}
          </span>
        }
      >
        <OverviewEventRankingContent large />
      </FullScreenOverlay>

      <FullScreenOverlay
        open={fullScreen === 'ov_revenue_over_time'}
        title="Tip Revenue Over Time"
        onClose={() => setFullScreen(null)}
        headerExtra={
          <span className="text-xs text-gray-400">
            Period: {analyticsDateRange.from} → {analyticsDateRange.to}
          </span>
        }
      >
        <OverviewRevenueOverTimeContent large />
      </FullScreenOverlay>

      <FullScreenOverlay
        open={fullScreen === 'rev_histogram'}
        title="Revenue histogram"
        onClose={() => setFullScreen(null)}
        headerExtra={
          <span className="text-xs text-gray-400">
            Interval: {effectiveInterval} · {revenueSeries?.dateFrom} → {revenueSeries?.dateTo}
          </span>
        }
      >
        <RevenueHistogramContent large />
      </FullScreenOverlay>

      <FullScreenOverlay
        open={fullScreen === 'rev_top_songs'}
        title="Top requested songs"
        onClose={() => setFullScreen(null)}
        headerExtra={
          <span className="text-xs text-gray-400">
            {revenueSeries?.dateFrom} → {revenueSeries?.dateTo}
          </span>
        }
      >
        <RevenueTopSongsContent />
      </FullScreenOverlay>

      <FullScreenOverlay
        open={fullScreen === 'rev_breakdown'}
        title="Revenue breakdown per DJ"
        onClose={() => setFullScreen(null)}
        headerExtra={
          <span className="text-xs text-gray-400">
            {revenueFrom || '…'} → {revenueTo || '…'}
          </span>
        }
      >
        <RevenueBreakdownContent large />
      </FullScreenOverlay>

      {/* Broadcast Tab */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6">
          {/* Send Broadcast Form */}
          <GlassCard glow="purple" noEnterAnimation>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gradient mb-2">Send Email Broadcast</h2>
              <p className="text-sm text-gray-400 mb-6">Send emails to selected users or all users</p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!broadcastSubject.trim() || !broadcastContent.trim()) {
                    setError('Subject and content are required')
                    return
                  }
                  sendBroadcastMutation.mutate({
                    recipientType: broadcastRecipientType,
                    recipientRole: broadcastRecipientType === 'ROLE' ? broadcastRecipientRole : undefined,
                    recipientIds: broadcastRecipientType === 'SELECTED' ? broadcastRecipientIds : undefined,
                    subject: broadcastSubject.trim(),
                    content: broadcastContent.trim(),
                  })
                }}
                className="space-y-4"
              >
                    {/* Recipient Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Recipients</label>
                      <select
                        value={broadcastRecipientType}
                        onChange={(e) => {
                          const newType = e.target.value as 'ALL' | 'ROLE' | 'SELECTED'
                          setBroadcastRecipientType(newType)
                          setBroadcastRecipientRole('')
                          setBroadcastRecipientIds([]) // Clear selected IDs when switching types
                        }}
                        className="w-full rounded-lg bg-white/10 border border-white/20 text-sm text-white py-2 px-3 min-h-[44px]"
                      >
                        <option value="ALL">All Users</option>
                        <option value="ROLE">By Role</option>
                        <option value="SELECTED">Selected Users</option>
                      </select>
                    </div>

                    {/* Role Selector */}
                    {broadcastRecipientType === 'ROLE' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                        <select
                          value={broadcastRecipientRole}
                          onChange={(e) => setBroadcastRecipientRole(e.target.value)}
                          className="w-full rounded-lg bg-white/10 border border-white/20 text-sm text-white py-2 px-3 min-h-[44px]"
                          required
                        >
                          <option value="">Select role...</option>
                          <option value="USER">User</option>
                          <option value="DJ">DJ</option>
                          <option value="ARTIST">Artist</option>
                          <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                      </div>
                    )}

                    {/* Selected Users - Multi-select dropdown */}
                    {broadcastRecipientType === 'SELECTED' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Select DJs & Artists
                        </label>
                        <select
                          multiple
                          value={broadcastRecipientIds.map(String)}
                          onChange={(e) => {
                            const selectedIds = Array.from(e.target.selectedOptions, (option) => parseInt(option.value))
                            setBroadcastRecipientIds(selectedIds)
                          }}
                          className="w-full rounded-lg bg-white/10 border border-white/20 text-sm text-white py-2 px-3 min-h-[120px]"
                          required={broadcastRecipientType === 'SELECTED'}
                        >
                          {availableUsers.length === 0 ? (
                            <option disabled>Loading users...</option>
                          ) : (
                            <>
                              {djsData?.content && djsData.content.length > 0 && (
                                <optgroup label="DJs">
                                  {djsData.content.map((user) => (
                                    <option key={user.id} value={user.id}>
                                      {user.name} ({user.email}) - DJ
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              {artistsData?.content && artistsData.content.length > 0 && (
                                <optgroup label="Artists">
                                  {artistsData.content.map((user) => (
                                    <option key={user.id} value={user.id}>
                                      {user.name} ({user.email}) - Artist
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              {availableUsers.length === 0 && (
                                <option disabled>No DJs or Artists found</option>
                              )}
                            </>
                          )}
                        </select>
                        {broadcastRecipientIds.length > 0 && (
                          <p className="text-xs text-gray-400 mt-2">
                            {broadcastRecipientIds.length} user{broadcastRecipientIds.length !== 1 ? 's' : ''} selected
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Hold Ctrl (Cmd on Mac) to select multiple users
                        </p>
                      </div>
                    )}

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                      <Input
                        type="text"
                        placeholder="Email subject"
                        value={broadcastSubject}
                        onChange={(e) => setBroadcastSubject(e.target.value)}
                        maxLength={500}
                        required
                        className="w-full"
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Content (HTML supported)</label>
                      <textarea
                        value={broadcastContent}
                        onChange={(e) => setBroadcastContent(e.target.value)}
                        placeholder="Email content..."
                        rows={10}
                        maxLength={50000}
                        required
                        className="w-full rounded-lg bg-white/10 border border-white/20 text-sm text-white py-2 px-3 resize-y"
                      />
                    </div>

                    {/* Submit */}
                    <GlowButton
                      type="submit"
                      glowColor="purple"
                      className="w-full"
                      disabled={sendBroadcastMutation.isPending}
                    >
                      {sendBroadcastMutation.isPending ? (
                        'Sending...'
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Broadcast
                        </>
                      )}
                    </GlowButton>
              </form>
            </div>
          </GlassCard>

          {/* Broadcast Logs */}
          <GlassCard glow="blue" noEnterAnimation>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gradient mb-2">Broadcast History</h2>
                  <p className="text-sm text-gray-400 mb-6">View past email broadcasts</p>

                  {logsLoading ? (
                    <div className="text-center py-8 text-gray-400">Loading...</div>
                  ) : broadcastLogsData?.content?.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No broadcast logs yet</div>
                  ) : (
                    <div className="space-y-4">
                      {broadcastLogsData?.content?.map((log: EmailBroadcastLog) => (
                        <div
                          key={log.id}
                          className="p-4 rounded-lg bg-white/5 border border-white/10"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                            <div>
                              <h3 className="font-semibold text-white">{log.subject}</h3>
                              <p className="text-xs text-gray-400 mt-1">
                                {log.recipientType === 'ALL' && 'All Users'}
                                {log.recipientType === 'ROLE' && `Role: ${log.recipientRole}`}
                                {log.recipientType === 'SELECTED' && 'Selected Users'}
                                {' • '}
                                {log.recipientCount} recipients
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  log.status === 'COMPLETED'
                                    ? 'bg-green-500/20 text-green-400'
                                    : log.status === 'FAILED'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}
                              >
                                {log.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs text-gray-400 mt-2">
                            <span>Success: {log.successCount}</span>
                            <span>Failed: {log.failedCount}</span>
                            <span>{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}

                      {/* Pagination */}
                      {broadcastLogsData && broadcastLogsData.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                          <button
                            type="button"
                            onClick={() => setBroadcastLogsPage((p) => Math.max(0, p - 1))}
                            disabled={broadcastLogsPage === 0}
                            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                          >
                            Previous
                          </button>
                          <span className="text-sm text-gray-400">
                            Page {broadcastLogsPage + 1} of {broadcastLogsData.totalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setBroadcastLogsPage((p) => p + 1)}
                            disabled={broadcastLogsPage >= broadcastLogsData.totalPages - 1}
                            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>
        </div>
      )}
    </div>
  )
}
