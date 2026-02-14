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
  AlertCircle
} from 'lucide-react'
import type { User, AdminEvent, AdminRequest } from '@/lib/types'
import { Role, EventStatus, RequestStatus } from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'
import { shouldRedirect } from '@/lib/roleGuard'
import { useMounted } from '@/hooks/useMounted'
import { getApiErrorMessage } from '@/lib/apiClient'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { ReportExport } from '@/components/export/ReportExport'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'

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
  topDjs: Array<{ userId: number; userName: string; userEmail: string; requestCount: number }>
  requestVolume: Array<{ date: string; count: number }>
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const mounted = useMounted()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'events' | 'requests'>('overview')
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [userRoleFilter, setUserRoleFilter] = useState<string>('')
  const [eventStatusFilter, setEventStatusFilter] = useState<string>('')
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  
  // Pagination
  const [userPage, setUserPage] = useState(0)
  const [eventPage, setEventPage] = useState(0)
  const [requestPage, setRequestPage] = useState(0)
  const pageSize = 10

  const currentUser = mounted ? getCurrentUser() : null

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

  // Analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics', dateFrom, dateTo],
    queryFn: () => adminApi.getAnalytics(dateFrom || undefined, dateTo || undefined),
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

  // Requests
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['admin-requests', requestPage, requestStatusFilter, dateFrom, dateTo],
    queryFn: () => adminApi.getRequests(requestPage, pageSize, requestStatusFilter || undefined, undefined, dateFrom || undefined, dateTo || undefined),
    enabled: !!currentUser && currentUser.role === Role.SUPER_ADMIN && activeTab === 'requests',
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const handleLogout = () => {
    authApi.logout()
    router.push('/login')
  }

  const adminReportSummary = [
    { label: 'Total users', value: analytics?.usersPerRole ? Object.values(analytics.usersPerRole).reduce((a, b) => a + b, 0) : 0 },
    { label: 'Total events', value: analytics?.totalEvents ?? 0 },
    { label: 'Active events', value: analytics?.activeEvents ?? 0 },
    { label: 'Total requests', value: analytics?.totalRequests ?? 0 },
    { label: 'Pending', value: analytics?.pendingRequests ?? 0 },
    { label: 'Accepted', value: analytics?.acceptedRequests ?? 0 },
    { label: 'Played', value: analytics?.playedRequests ?? 0 },
  ]
  const adminReportTables: { title: string; headers: string[]; rows: (string | number)[][] }[] = []
  if (usersData?.content?.length) {
    adminReportTables.push({
      title: 'Users',
      headers: ['ID', 'Name', 'Email', 'Role'],
      rows: usersData.content.map((u) => [u.id, u.name, u.email, u.role]),
    })
  }
  if (eventsData?.content?.length) {
    adminReportTables.push({
      title: 'Events',
      headers: ['ID', 'Name', 'Creator', 'Start', 'Status'],
      rows: eventsData.content.map((e) => [
        e.id,
        e.name,
        e.creatorName ?? '',
        new Date(e.startTime).toLocaleDateString(),
        e.status,
      ]),
    })
  }
  if (requestsData?.content?.length) {
    adminReportTables.push({
      title: 'Requests',
      headers: ['ID', 'Song', 'Requester', 'Event', 'Status'],
      rows: requestsData.content.map((r) => [
        r.id,
        `${r.songTitle ?? ''} - ${r.songArtist ?? ''}`,
        r.userName ?? '',
        r.eventName ?? '',
        r.status,
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
          {(['overview', 'users', 'events', 'requests'] as const).map((tab) => (
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
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Top DJs */}
            {analytics?.topDjs && analytics.topDjs.length > 0 && (
              <GlassCard glow="blue">
                <h3 className="text-xl font-bold mb-4 text-gradient">Top DJs by Requests</h3>
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
                      { key: 'start', header: 'Start', render: (e) => new Date(e.startTime).toLocaleDateString() },
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gradient">Requests</h2>
                <div className="flex gap-2">
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
      </div>
    </div>
  )
}
