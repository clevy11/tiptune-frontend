'use client'

import { motion } from 'framer-motion'
import { Music, Play } from 'lucide-react'
import type { MusicSearchResult } from '@/lib/types'
import { musicApi } from '@/lib/musicApi'
import { cn } from '@/lib/utils'
// Using regular img for external iTunes URLs

interface MusicResultItemProps {
  result: MusicSearchResult
  onSelect: (result: MusicSearchResult) => void
  isSelected?: boolean
}

export function MusicResultItem({ result, onSelect, isSelected }: MusicResultItemProps) {
  const artworkUrl = musicApi.getArtworkUrl(result.artworkUrl100, 100)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    onSelect(result)
  }

  return (
    <motion.div
      role="button"
      tabIndex={0}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onMouseDown={handleMouseDown}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(result) } }}
      className={cn(
        'glass rounded-lg p-3 cursor-pointer transition-all duration-300',
        'hover:bg-white/10 hover:glow-purple',
        isSelected && 'bg-purple-500/20 border border-purple-500/50 glow-purple'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Album Art */}
        <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
          {artworkUrl && artworkUrl !== '/placeholder-album.png' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artworkUrl}
              alt={`${result.trackName} cover`}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
          )}
          {result.previewUrl && (
            <motion.div
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              whileHover={{ opacity: 1 }}
            >
              <Play className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {result.trackName}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {result.artistName}
          </p>
          {result.collectionName && (
            <p className="text-xs text-gray-500 truncate">
              {result.collectionName}
            </p>
          )}
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center glow-purple"
          >
            <div className="w-2 h-2 bg-white rounded-full" />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
