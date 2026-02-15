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

const DEBOUNCE_DELAY = 400
const MIN_QUERY_LENGTH = 3
const DEFAULT_DROPDOWN_MAX_HEIGHT = 320

/** Get safe max height for dropdown above keyboard (visual viewport). */
function getDropdownMaxHeight(): number {
  if (typeof window === 'undefined') return DEFAULT_DROPDOWN_MAX_HEIGHT
  const vv = window.visualViewport
  if (!vv) return DEFAULT_DROPDOWN_MAX_HEIGHT
  const available = vv.height - 120
  return Math.max(200, Math.min(DEFAULT_DROPDOWN_MAX_HEIGHT, available))
}

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
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState(DEFAULT_DROPDOWN_MAX_HEIGHT)
  const abortControllerRef = useRef<AbortController | null>(null)
  const expectedQueryRef = useRef<string>('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const updateDropdownMaxHeight = useCallback(() => {
    setDropdownMaxHeight(getDropdownMaxHeight())
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    vv.addEventListener('resize', updateDropdownMaxHeight)
    vv.addEventListener('scroll', updateDropdownMaxHeight)
    return () => {
      vv.removeEventListener('resize', updateDropdownMaxHeight)
      vv.removeEventListener('scroll', updateDropdownMaxHeight)
    }
  }, [updateDropdownMaxHeight])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const trimmed = searchQuery.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([])
      setIsLoading(false)
      setIsOpen(false)
      setError(null)
      return
    }

    expectedQueryRef.current = trimmed
    setIsLoading(true)
    setError(null)
    setIsOpen(true)
    updateDropdownMaxHeight()

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const searchResults = await musicApi.searchMusic(trimmed, 15, controller.signal)
      if (controller.signal.aborted) return
      if (expectedQueryRef.current !== trimmed) return
      setResults(searchResults)
      setIsOpen(true)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      if (err instanceof Error && err.message === 'RATE_LIMIT') {
        setError('Too many searches. Please wait a moment and try again.')
        console.warn('iTunes search rate limited')
        return
      }
      setError('Search failed. Please check your connection and try again.')
      console.error('Search error:', err)
    } finally {
      if (!controller.signal.aborted && expectedQueryRef.current === trimmed) {
        setIsLoading(false)
      }
    }
  }, [updateDropdownMaxHeight])

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

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown, true)
    return () => document.removeEventListener('mousedown', handleMouseDown, true)
  }, [])

  const handleSelect = useCallback((result: MusicSearchResult) => {
    onSelect(result)
    setQuery(`${result.trackName} - ${result.artistName}`)
    setIsOpen(false)
  }, [onSelect])

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleInputFocus = () => {
    if (results.length > 0 || query.length >= MIN_QUERY_LENGTH) {
      setIsOpen(true)
      updateDropdownMaxHeight()
    }
  }

  const showDropdown = isOpen && (isLoading || results.length > 0 || error)

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value.length >= MIN_QUERY_LENGTH) setIsOpen(true)
          }}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="pl-10 pr-10 w-full text-base min-[16px]"
          style={{ fontSize: '16px' }}
          autoComplete="off"
        />
        {query && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors text-base"
            style={{ fontSize: '16px' }}
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400" />
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-[9999] rounded-xl shadow-2xl border border-purple-500/30 bg-gray-900/95 backdrop-blur-xl overflow-hidden"
            style={{ maxHeight: dropdownMaxHeight }}
          >
            <div className="overflow-y-auto p-2" style={{ maxHeight: dropdownMaxHeight - 8 }}>
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
                <div className="p-6 flex flex-col items-center justify-center text-center">
                  <Music className="w-12 h-12 text-gray-600 mb-3" />
                  <p className="text-sm text-gray-400">No results found</p>
                  <p className="text-xs text-gray-500 mt-1">Try a different search term</p>
                  <p className="text-xs text-purple-300/90 mt-3 px-2">
                    Can&apos;t find your song? Fill in the title and artist manually below.
                  </p>
                </div>
              ) : (
                results.map((result) => (
                  <MusicResultItem
                    key={result.trackId}
                    result={result}
                    onSelect={handleSelect}
                    isSelected={selectedResult?.trackId === result.trackId}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
