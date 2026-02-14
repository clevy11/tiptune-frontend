import type { MusicSearchResult, MusicSearchResponse } from './types'

const ITUNES_API_BASE = 'https://itunes.apple.com/search'

interface SearchParams {
  term: string
  limit?: number
  media?: string
}

export const musicApi = {
  /**
   * Search for music using iTunes API
   */
  async searchMusic(query: string, limit: number = 20): Promise<MusicSearchResult[]> {
    if (!query.trim()) {
      return []
    }

    try {
      const params = new URLSearchParams({
        term: query.trim(),
        media: 'music',
        limit: limit.toString(),
        entity: 'song',
      })

      const response = await fetch(`${ITUNES_API_BASE}?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status}`)
      }

      const data: MusicSearchResponse = await response.json()
      
      // Filter out results without trackName or artistName
      return data.results.filter(
        (result) => result.trackName && result.artistName
      )
    } catch (error) {
      console.error('Music search error:', error)
      return []
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
