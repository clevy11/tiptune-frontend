export enum Role {
  USER = 'USER',
  DJ = 'DJ',
  ARTIST = 'ARTIST',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum EventStatus {
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  PLAYED = 'PLAYED',
}

/** Payment type for tips: MoMo short code vs phone number (USSD format differs). */
export enum TipPaymentType {
  MOMO_CODE = 'MOMO_CODE',
  PHONE_NUMBER = 'PHONE_NUMBER',
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
  tipPaymentType?: TipPaymentType
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
  momoCode?: string
  tipPaymentType?: TipPaymentType
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
  /** MoMo code (4–10 digits) or phone number (9–15 digits). */
  momoCode: string
  tipPaymentType?: TipPaymentType
  startTime: string
  endTime: string
  status: EventStatus
}

export interface TipInfoResponse {
  djName: string
  paymentType: TipPaymentType
  paymentValue: string
  tipLinkToken: string | null
}

export interface TipSettingsRequest {
  tipPaymentType: TipPaymentType
  paymentValue: string
}

/** One standalone tip record (permanent QR, no event). */
export interface TipRecordResponse {
  id: number
  amount: number | string
  payerName?: string | null
  payerPhone?: string | null
  createdAt: string
  standalone: boolean
}

/** DJ revenue summary (all or filtered by date). */
export interface DjRevenueSummaryResponse {
  totalRevenue: number | string
  songRequestRevenue: number | string
  standaloneTipRevenue: number | string
  tipRecordCount: number
  dateFrom?: string | null
  dateTo?: string | null
  revenueByDay?: Array<{ date: string; revenue: number | string }>
  revenueByHour?: Array<{ hour: string; revenue: number | string }>
}

/** Admin: revenue per DJ row. */
export interface RevenueByDjResponse {
  userId: number
  userName: string
  userEmail: string
  totalRevenue: number | string
  songRequestRevenue: number | string
  standaloneTipRevenue: number | string
  tipRecordCount: number
}

/** Admin/DJ: revenue series for charts (hour/day). */
export interface RevenueSeriesResponse {
  djId?: number | null
  interval: 'day' | 'hour' | string
  dateFrom?: string | null
  dateTo?: string | null
  totalRevenue: number | string
  songRequestRevenue: number | string
  tipRecordRevenue: number | string
  totalRequests: number
  points: Array<{ bucket: string; revenue: number | string }>
}

/** Admin/DJ: top requested songs row. */
export interface TopSongResponse {
  title: string
  artist: string
  requestCount: number
}

/** Payload for submitting a standalone tip (tip-only flow). One of tipLinkToken or eventAccessToken required. */
export interface TipSubmitRequest {
  tipLinkToken?: string
  eventAccessToken?: string
  amount: number
  payerName?: string
  payerPhone?: string
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

// Email Broadcast types
export interface EmailBroadcastRequest {
  recipientType: 'ALL' | 'ROLE' | 'SELECTED'
  recipientRole?: string
  recipientIds?: number[]
  subject: string
  content: string
}

export interface EmailBroadcastLog {
  id: number
  adminId: number
  subject: string
  content: string
  recipientType: string
  recipientRole?: string
  recipientCount: number
  successCount: number
  failedCount: number
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
  createdAt: string
  completedAt?: string
}
