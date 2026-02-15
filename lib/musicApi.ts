import type { MusicSearchResult, MusicSearchResponse } from './types'
import api from './api'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes (client-side cache in addition to backend cache)

interface CacheEntry {
  results: MusicSearchResult[]
  timestamp: number
}

const searchCache = new Map<string, CacheEntry>()

function cacheKey(q: string): string {
  return q.trim().toLowerCase()
}

function getCached(key: string): MusicSearchResult[] | null {
  const entry = searchCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    searchCache.delete(key)
    return null
  }
  return entry.results
}

/** Backend proxy path only – never call iTunes directly. */
const MUSIC_SEARCH_PATH = '/music/search'

export const musicApi = {
  /**
   * Search for music via backend proxy only: GET /api/v1/music/search?q=...
   * Uses the same axios instance as the rest of the app (same base URL).
   * Pass signal to cancel in-flight requests. Rethrows AbortError so callers do not update state.
   */
  async searchMusic(query: string, limit: number = 15, signal?: AbortSignal): Promise<MusicSearchResult[]> {
    const trimmed = query.trim()
    if (!trimmed) return []

    const key = cacheKey(trimmed)
    const cached = getCached(key)
    if (cached !== null) return cached

    try {
      const { data } = await api.get<MusicSearchResponse>(MUSIC_SEARCH_PATH, {
        params: { q: trimmed },
        signal,
      })
      const results = (data.results || []).filter(
        (result) => result.trackName && result.artistName
      )
      searchCache.set(key, { results, timestamp: Date.now() })
      return results
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') throw error
      const axErr = error as { response?: { status?: number }; message?: string }
      if (axErr.response?.status === 429) {
        console.warn('Music search rate limited (429)')
        throw new Error('RATE_LIMIT')
      }
      if (axErr.response?.status === 400) return []
      console.error('Music search error:', error)
      throw error
    }
  },

  /**
   * Get higher quality artwork URL
   */
  getArtworkUrl(artworkUrl100?: string, size: 100 | 200 | 300 = 200): string {
    if (!artworkUrl100) {
      return '/placeholder-album.png' // Fallback image
    }
    // Replace size in URL
    return artworkUrl100.replace('100x100', `${size}x${size}`)
  },
}
