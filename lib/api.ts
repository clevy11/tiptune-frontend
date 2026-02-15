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
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
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
    try {
      const response = await axios.get<Event>(
        `${API_BASE_URL.replace('/api/v1', '')}/event/${accessToken}`
      )
      if (!response.data) {
        throw new Error('Event not found')
      }
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Event not found')
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
  getRequests: async (page: number = 0, size: number = 20, status?: string, eventId?: number, fromDate?: string, toDate?: string): Promise<{ content: AdminRequest[]; totalElements: number; totalPages: number; number: number }> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() })
    if (status) params.append('status', status)
    if (eventId) params.append('eventId', eventId.toString())
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
}

export default api
