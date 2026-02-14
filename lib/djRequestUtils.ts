import type { SongRequest, DjSongRequest } from './types'

/**
 * Map backend SongRequest (nested user/event/song) to flat DjSongRequest for dashboard list.
 * O(1) — used when injecting WebSocket payload into cache.
 */
export function songRequestToDj(sr: SongRequest): DjSongRequest {
  return {
    id: sr.id,
    songTitle: sr.song?.title ?? '',
    songArtist: sr.song?.artist ?? '',
    songAlbum: sr.song?.album,
    message: sr.message,
    status: sr.status,
    createdAt: sr.createdAt,
    requesterName: sr.user?.name ?? '',
    eventId: sr.event?.id ?? 0,
    eventName: sr.event?.name ?? '',
  }
}
