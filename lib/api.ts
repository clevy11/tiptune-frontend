import axios from 'axios'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Event,
  EventRequest,
  SongRequest,
  SongRequestCreateRequest,
  PublicSongRequestCreateRequest,
  User,
  DjEvent,
  DjSongRequest,
  PublicEvent,
  AdminEvent,
  AdminRequest,
  TipInfoResponse,
  TipRecordResponse,
  TipSettingsRequest,
  TipSubmitRequest,
  DjRevenueSummaryResponse,
  RevenueByDjResponse,
  RevenueSeriesResponse,
  TopSongResponse,
  EmailBroadcastRequest,
  EmailBroadcastLog,
  ProfileLinkResponse,
  ProfileLinkRequest,
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

/** Decode JWT payload (no verification; used only to read exp). Returns null if invalid. */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(base64)
    const json = decodeURIComponent(
      raw.replace(/(.)/g, (ch) => '%' + ('00' + ch.charCodeAt(0).toString(16)).slice(-2))
    )
    return JSON.parse(json) as { exp?: number }
  } catch {
    return null
  }
}

/** True if the JWT is expired (exp in seconds since epoch). Uses 10s skew to avoid edge flicker. */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload || payload.exp == null) return true
  const nowSec = Math.floor(Date.now() / 1000)
  return payload.exp < nowSec - 10
}

function clearAuthAndRedirectToLogin(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

/** True if hostname looks like a local/dev IP (same-network mobile testing). */
function isLocalNetworkHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    const parts = hostname.split('.').map(Number)
    if (parts[0] === 192 && parts[1] === 168) return true
    if (parts[0] === 10) return true
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  }
  return false
}

/**
 * In production (e.g. Vercel) always use NEXT_PUBLIC_API_URL (HTTPS).
 * Only use same-host:8080 when on a local network IP (e.g. phone at http://192.168.1.x:3000).
 */
export function getEffectiveApiBaseUrl(): string {
  if (typeof window === 'undefined') return API_BASE_URL
  if (isLocalNetworkHostname(window.location.hostname)) {
    return `http://${window.location.hostname}:8080/api/v1`
  }
  return API_BASE_URL
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Use correct API host when in browser (e.g. mobile opening http://MAC_IP:3000)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    config.baseURL = getEffectiveApiBaseUrl()
  }
  return config
})

// Request interceptor: add auth token only if valid and not expired; otherwise clear and redirect
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        if (isTokenExpired(token)) {
          clearAuthAndRedirectToLogin()
          return Promise.reject(new Error('Token expired'))
        }
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on auth endpoints
    const isAuthEndpoint = error.config?.url?.includes('/auth/')
    
    if (error.response?.status === 401 && !isAuthEndpoint) {
      if (typeof window !== 'undefined') clearAuthAndRedirectToLogin()
    }
    
    // Extract error message from backend response
    if (error.response?.data) {
      const errorData = error.response.data
      if (errorData.message) {
        error.message = errorData.message
      } else if (typeof errorData === 'string') {
        error.message = errorData
      }
    }
    
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data)
    if (typeof window !== 'undefined' && response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data)
    if (typeof window !== 'undefined' && response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/reset-password', { token, newPassword })
    return response.data
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token')
    }
    return null
  },

  getCurrentUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token && isTokenExpired(token)) {
        clearAuthAndRedirectToLogin()
        return null
      }
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          return JSON.parse(userStr)
        } catch {
          return null
        }
      }
    }
    return null
  },
}

// DJ API
export const djApi = {
  getEvents: async (): Promise<DjEvent[]> => {
    const response = await api.get<DjEvent[]>('/dj/events')
    return response.data
  },

  getEvent: async (id: number): Promise<DjEvent> => {
    const response = await api.get<DjEvent>(`/dj/events/${id}`)
    return response.data
  },

  createEvent: async (data: EventRequest): Promise<DjEvent> => {
    const response = await api.post<DjEvent>('/dj/events', data)
    return response.data
  },

  updateEvent: async (id: number, data: EventRequest): Promise<DjEvent> => {
    const response = await api.put<DjEvent>(`/dj/events/${id}`, data)
    return response.data
  },

  deleteEvent: async (id: number): Promise<void> => {
    await api.delete(`/dj/events/${id}`)
  },

  endEvent: async (id: number): Promise<DjEvent> => {
    const response = await api.post<DjEvent>(`/dj/events/${id}/end`)
    return response.data
  },

  getRequests: async (): Promise<DjSongRequest[]> => {
    const response = await api.get<DjSongRequest[]>('/dj/requests')
    return response.data
  },

  getEventRequests: async (
    eventId: number,
    params?: { filter?: string; sort?: string }
  ): Promise<DjSongRequest[]> => {
    const searchParams = new URLSearchParams()
    if (params?.filter) searchParams.set('filter', params.filter)
    if (params?.sort) searchParams.set('sort', params.sort)
    const q = searchParams.toString()
    const url = q ? `/dj/events/${eventId}/requests?${q}` : `/dj/events/${eventId}/requests`
    const response = await api.get<DjSongRequest[]>(url)
    return response.data
  },

  getTipSettings: async (): Promise<TipInfoResponse> => {
    const response = await api.get<TipInfoResponse>('/dj/me/tip-settings')
    return response.data
  },

  updateTipSettings: async (data: TipSettingsRequest): Promise<TipInfoResponse> => {
    const response = await api.put<TipInfoResponse>('/dj/me/tip-settings', data)
    return response.data
  },

  getStandaloneTipRecords: async (): Promise<TipRecordResponse[]> => {
    const response = await api.get<TipRecordResponse[]>('/dj/me/tip-records')
    return response.data
  },

  getEventTipRecords: async (eventId: number): Promise<TipRecordResponse[]> => {
    const response = await api.get<TipRecordResponse[]>(`/dj/events/${eventId}/tip-records`)
    return response.data
  },

  getRevenueSummary: async (params?: { from?: string; to?: string }): Promise<DjRevenueSummaryResponse> => {
    const sp = new URLSearchParams()
    if (params?.from) sp.set('from', params.from)
    if (params?.to) sp.set('to', params.to)
    const q = sp.toString()
    const response = await api.get<DjRevenueSummaryResponse>(q ? `/dj/me/revenue-summary?${q}` : '/dj/me/revenue-summary')
    return response.data
  },

  getTopSongs: async (params?: { from?: string; to?: string; limit?: number }): Promise<TopSongResponse[]> => {
    const sp = new URLSearchParams()
    if (params?.from) sp.set('from', params.from)
    if (params?.to) sp.set('to', params.to)
    if (params?.limit != null) sp.set('limit', String(params.limit))
    const q = sp.toString()
    const response = await api.get<TopSongResponse[]>(q ? `/dj/me/top-songs?${q}` : '/dj/me/top-songs')
    return response.data
  },

  getMyProfile: async (): Promise<User> => {
    const response = await api.get<User>('/dj/me/profile')
    return response.data
  },

  updateMyProfile: async (data: { name: string }): Promise<User> => {
    const response = await api.put<User>('/dj/me/profile', data)
    return response.data
  },

  getProfileLinks: async (): Promise<ProfileLinkResponse[]> => {
    const response = await api.get<ProfileLinkResponse[]>('/dj/me/profile-links')
    return response.data
  },

  updateProfileLinks: async (links: ProfileLinkRequest[]): Promise<ProfileLinkResponse[]> => {
    const response = await api.put<ProfileLinkResponse[]>('/dj/me/profile-links', links)
    return response.data
  },

  getQRCodeImage: async (id: number, baseUrl: string = 'http://localhost:3000'): Promise<string> => {
    const response = await api.get(`/events/${id}/qr?baseUrl=${encodeURIComponent(baseUrl)}`, {
      responseType: 'blob',
    })
    return URL.createObjectURL(response.data)
  },
}

// User API
export const userApi = {
  getPublicEvents: async (): Promise<PublicEvent[]> => {
    const response = await api.get<PublicEvent[]>('/user/events')
    return response.data
  },

  getPublicEvent: async (accessToken: string): Promise<PublicEvent> => {
    const response = await api.get<PublicEvent>(`/user/events/${accessToken}`)
    return response.data
  },
}

// Event API (legacy - for backward compatibility)
export const eventApi = {
  getAllActive: async (): Promise<Event[]> => {
    const response = await api.get<Event[]>('/events/active')
    return response.data
  },

  getById: async (id: number): Promise<Event> => {
    const response = await api.get<Event>(`/events/${id}`)
    return response.data
  },

  getByAccessToken: async (accessToken: string): Promise<Event> => {
    const base = typeof window !== 'undefined' ? getEffectiveApiBaseUrl() : API_BASE_URL
    const eventBase = base.replace(/\/api\/v1\/?$/, '')
    const url = `${eventBase}/event/${accessToken}`
    try {
      const response = await axios.get<Event>(url)
      if (!response.data) {
        throw new Error('Event not found')
      }
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Event not found')
      }
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error(
          "The  event you are looking for is not available or  is no longer open. Please try again later or login to events to see events that are still open.."
        )
      }
      throw error
    }
  },

  create: async (data: EventRequest): Promise<Event> => {
    const response = await api.post<Event>('/events', data)
    return response.data
  },

  update: async (id: number, data: EventRequest): Promise<Event> => {
    const response = await api.put<Event>(`/events/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/events/${id}`)
  },

  getQRCode: (id: number, baseUrl: string = 'http://localhost:3000'): string => {
    return `${API_BASE_URL}/events/${id}/qr?baseUrl=${encodeURIComponent(baseUrl)}`
  },

  getQRCodeImage: async (id: number, baseUrl: string = 'http://localhost:3000'): Promise<string> => {
    const response = await api.get(`/events/${id}/qr?baseUrl=${encodeURIComponent(baseUrl)}`, {
      responseType: 'blob',
    })
    return URL.createObjectURL(response.data)
  },
}

// Song Request API
export const songRequestApi = {
  create: async (data: SongRequestCreateRequest): Promise<SongRequest> => {
    const response = await api.post<SongRequest>('/requests', data)
    return response.data
  },

  createPublic: async (data: PublicSongRequestCreateRequest): Promise<SongRequest> => {
    const response = await axios.post<SongRequest>(
      `${API_BASE_URL}/requests/public`,
      data
    )
    return response.data
  },

  getByEvent: async (eventId: number): Promise<SongRequest[]> => {
    const response = await api.get<SongRequest[]>(`/requests/event/${eventId}`)
    return response.data
  },

  getByAccessToken: async (accessToken: string): Promise<SongRequest[]> => {
    const response = await api.get<SongRequest[]>(
      `/requests/event/token/${accessToken}`
    )
    return response.data
  },

  updateStatus: async (
    id: number,
    status: string
  ): Promise<SongRequest> => {
    const response = await api.patch<SongRequest>(
      `/requests/${id}/status?status=${status}`
    )
    return response.data
  },

  getMyRequests: async (): Promise<SongRequest[]> => {
    const response = await api.get<SongRequest[]>('/requests/my')
    return response.data
  },
}

/** Public tip (no auth). */
export const publicTipApi = {
  getTipInfo: async (token: string): Promise<TipInfoResponse> => {
    const base =
      typeof window !== 'undefined' ? getEffectiveApiBaseUrl() : API_BASE_URL
    const response = await axios.get<TipInfoResponse>(
      `${base}/public/tip-info/${token}`
    )
    return response.data
  },

  /** Submit standalone tip when user clicks Pay (records revenue). */
  submitTip: async (data: TipSubmitRequest): Promise<void> => {
    const base =
      typeof window !== 'undefined' ? getEffectiveApiBaseUrl() : API_BASE_URL
    await axios.post(`${base}/public/tip`, data)
  },
}

// Admin API
export const adminApi = {
  // Users
  getUsers: async (page: number = 0, size: number = 20, role?: string): Promise<{ content: User[]; totalElements: number; totalPages: number; number: number }> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() })
    if (role) params.append('role', role)
    const response = await api.get<{ content: User[]; totalElements: number; totalPages: number; number: number }>(`/admin/users?${params}`)
    return response.data
  },

  getUser: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/admin/users/${id}`)
    return response.data
  },

  updateUser: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/admin/users/${id}`, data)
    return response.data
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}`)
  },

  // Events
  getEvents: async (page: number = 0, size: number = 20, status?: string, fromDate?: string, toDate?: string): Promise<{ content: AdminEvent[]; totalElements: number; totalPages: number; number: number }> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() })
    if (status) params.append('status', status)
    if (fromDate) params.append('fromDate', fromDate)
    if (toDate) params.append('toDate', toDate)
    const response = await api.get<{ content: AdminEvent[]; totalElements: number; totalPages: number; number: number }>(`/admin/events?${params}`)
    return response.data
  },

  getEvent: async (id: number): Promise<AdminEvent> => {
    const response = await api.get<AdminEvent>(`/admin/events/${id}`)
    return response.data
  },

  updateEvent: async (id: number, data: Partial<AdminEvent>): Promise<AdminEvent> => {
    const response = await api.put<AdminEvent>(`/admin/events/${id}`, data)
    return response.data
  },

  deleteEvent: async (id: number): Promise<void> => {
    await api.delete(`/admin/events/${id}`)
  },

  // Requests
  getRequests: async (page: number = 0, size: number = 20, status?: string, eventId?: number, djId?: number, fromDate?: string, toDate?: string): Promise<{ content: AdminRequest[]; totalElements: number; totalPages: number; number: number }> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() })
    if (status) params.append('status', status)
    if (eventId) params.append('eventId', eventId.toString())
    if (djId != null) params.append('djId', djId.toString())
    if (fromDate) params.append('fromDate', fromDate)
    if (toDate) params.append('toDate', toDate)
    const response = await api.get<{ content: AdminRequest[]; totalElements: number; totalPages: number; number: number }>(`/admin/requests?${params}`)
    return response.data
  },

  getRequest: async (id: number): Promise<AdminRequest> => {
    const response = await api.get<AdminRequest>(`/admin/requests/${id}`)
    return response.data
  },

  updateRequest: async (id: number, data: Partial<AdminRequest>): Promise<AdminRequest> => {
    const response = await api.put<AdminRequest>(`/admin/requests/${id}`, data)
    return response.data
  },

  deleteRequest: async (id: number): Promise<void> => {
    await api.delete(`/admin/requests/${id}`)
  },

  // Analytics
  getAnalytics: async (fromDate?: string, toDate?: string): Promise<any> => {
    const params = new URLSearchParams()
    if (fromDate) params.append('fromDate', fromDate)
    if (toDate) params.append('toDate', toDate)
    const response = await api.get(`/admin/analytics?${params}`)
    return response.data
  },

  getRevenueByDj: async (from?: string, to?: string): Promise<RevenueByDjResponse[]> => {
    const params = new URLSearchParams()
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    const response = await api.get<RevenueByDjResponse[]>(`/admin/analytics/revenue-by-dj?${params}`)
    return response.data
  },

  getRevenueSeries: async (params?: {
    djId?: number
    fromDate?: string
    toDate?: string
    day?: string
    interval?: 'day' | 'hour'
  }): Promise<RevenueSeriesResponse> => {
    const q = new URLSearchParams()
    if (params?.djId != null) q.append('djId', String(params.djId))
    if (params?.fromDate) q.append('fromDate', params.fromDate)
    if (params?.toDate) q.append('toDate', params.toDate)
    if (params?.day) q.append('day', params.day)
    if (params?.interval) q.append('interval', params.interval)
    const response = await api.get<RevenueSeriesResponse>(`/admin/analytics/revenue-series?${q}`)
    return response.data
  },

  getTopSongs: async (params?: {
    djId?: number
    fromDate?: string
    toDate?: string
    limit?: number
  }): Promise<TopSongResponse[]> => {
    const q = new URLSearchParams()
    if (params?.djId != null) q.append('djId', String(params.djId))
    if (params?.fromDate) q.append('fromDate', params.fromDate)
    if (params?.toDate) q.append('toDate', params.toDate)
    if (params?.limit != null) q.append('limit', String(params.limit))
    const response = await api.get<TopSongResponse[]>(`/admin/analytics/top-songs?${q}`)
    return response.data
  },

  // Email Broadcast
  sendEmailBroadcast: async (data: EmailBroadcastRequest): Promise<{ broadcastId: number; message: string; estimatedRecipients: number; status: string }> => {
    const response = await api.post(`/admin/broadcast/email`, data)
    return response.data
  },

  getBroadcastLogs: async (page: number = 0, size: number = 20): Promise<{ content: EmailBroadcastLog[]; totalElements: number; totalPages: number; number: number }> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() })
    const response = await api.get<{ content: EmailBroadcastLog[]; totalElements: number; totalPages: number; number: number }>(`/admin/broadcast/logs?${params}`)
    return response.data
  },

  getBroadcastLog: async (id: number): Promise<EmailBroadcastLog> => {
    const response = await api.get<EmailBroadcastLog>(`/admin/broadcast/${id}`)
    return response.data
  },
}

export default api
