export enum Role {
  USER = 'USER',
  DJ = 'DJ',
  ARTIST = 'ARTIST',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum EventStatus {
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  PLAYED = 'PLAYED',
}

export interface User {
  id: number
  name: string
  email: string
  role: Role
}

export interface Event {
  id: number
  accessToken: string
  name: string
  description?: string
  startTime: string
  endTime: string
  status: EventStatus
  createdBy: User
  djMomoCode?: string
}

// DJ-specific types
export interface DjEvent {
  id: number
  accessToken: string
  name: string
  description?: string
  startTime: string
  endTime: string
  status: EventStatus
  requestCount: number
  pendingRequestCount: number
  totalTipRevenue?: number | string
}

export interface DjSongRequest {
  id: number
  songTitle: string
  songArtist: string
  songAlbum?: string
  message?: string
  tipAmount?: number | string
  payerName?: string
  payerPhone?: string
  status: RequestStatus
  createdAt: string
  requesterName: string
  eventId: number
  eventName: string
}

// Admin API response types (flat DTOs)
export interface AdminEvent {
  id: number
  accessToken: string
  name: string
  description?: string
  startTime: string
  endTime: string
  status: EventStatus
  creatorId: number
  creatorName: string
  creatorEmail: string
  requestCount: number
  totalTipRevenue?: number | string
}

export interface AdminRequest {
  id: number
  songTitle: string
  songArtist: string
  songAlbum?: string
  message?: string
  tipAmount?: number | string
  payerName?: string
  payerPhone?: string
  status: RequestStatus
  createdAt: string
  userId: number
  userName: string
  userEmail: string
  eventId: number
  eventName: string
  djId: number
  djName: string
}

// Public/User-specific types
export interface PublicEvent {
  accessToken: string
  name: string
  description?: string
  startTime: string
  endTime: string
  status: EventStatus
  djName: string
}

export interface Song {
  id: number
  title: string
  artist: string
  album?: string
}

export interface SongRequest {
  id: number
  user: User
  event: Event
  song: Song
  message?: string
  tipAmount?: number | string
  payerName?: string
  payerPhone?: string
  status: RequestStatus
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: Role
}

export interface EventRequest {
  name: string
  description?: string
  /** MoMo Payment Code: 4–10 digits for USSD *182*8*1*{code}*{amount}# */
  momoCode: string
  startTime: string
  endTime: string
  status: EventStatus
}

export interface SongRequestCreateRequest {
  eventId: number
  songTitle: string
  songArtist: string
  songAlbum?: string
  message?: string
}

export interface PublicSongRequestCreateRequest {
  accessToken: string
  songTitle: string
  songArtist: string
  songAlbum?: string
  message?: string
  wantToTip?: boolean
  tipAmount?: number
  payerName?: string
  payerPhone?: string
}

// Notification types
export interface Notification {
  id: number
  message: string
  isRead: boolean
  createdAt: string
  type?: 'song_request' | 'status_update' | 'system'
  songRequest?: SongRequest
}

// Music search types
export interface MusicSearchResult {
  trackId: number
  trackName: string
  artistName: string
  collectionName?: string
  artworkUrl100?: string
  artworkUrl60?: string
  previewUrl?: string
  releaseDate?: string
}

export interface MusicSearchResponse {
  results: MusicSearchResult[]
}
