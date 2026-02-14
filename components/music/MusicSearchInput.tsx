'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Music, Loader2, X } from 'lucide-react'
import { musicApi } from '@/lib/musicApi'
import { MusicResultItem } from './MusicResultItem'
import type { MusicSearchResult } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface MusicSearchInputProps {
  onSelect: (result: MusicSearchResult) => void
  selectedResult?: MusicSearchResult | null
  className?: string
  placeholder?: string
}

const DEBOUNCE_DELAY = 300
const MIN_QUERY_LENGTH = 2

export function MusicSearchInput({
  onSelect,
  selectedResult,
  className,
  placeholder = 'Search for a song...',
}: MusicSearchInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MusicSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (searchQuery.length < MIN_QUERY_LENGTH) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    try {
      const searchResults = await musicApi.searchMusic(searchQuery, 15)
      setResults(searchResults)
      setIsOpen(searchResults.length > 0)
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Failed to search. Please try again.')
        console.error('Search error:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, DEBOUNCE_DELAY)

    return () => {
      clearTimeout(timer)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [query, performSearch])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (result: MusicSearchResult) => {
    onSelect(result)
    setQuery(`${result.trackName} - ${result.artistName}`)
    setIsOpen(false)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={cn('relative overflow-visible', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          className="pl-10 pr-10 w-full"
        />
        {query && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400" />
          </motion.button>
        )}
      </div>

      {/* Dropdown Results — high z-index, full width, scrollable; visible on mobile */}
      <AnimatePresence>
        {isOpen && (isLoading || results.length > 0 || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 w-full min-w-0 glass rounded-xl shadow-2xl border border-purple-500/30 glow-purple z-[100] max-h-[300px] overflow-y-auto overflow-x-hidden"
          >
            {isLoading ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-8 h-8 text-purple-400" />
                </motion.div>
                <p className="text-sm text-gray-400 mt-4">Searching...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <Music className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-sm text-gray-400">No results found</p>
                <p className="text-xs text-gray-500 mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div className="p-2">
                {results.map((result, index) => (
                  <MusicResultItem
                    key={result.trackId}
                    result={result}
                    onSelect={handleSelect}
                    isSelected={selectedResult?.trackId === result.trackId}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
