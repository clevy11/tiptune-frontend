'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
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

const DEBOUNCE_DELAY = 350
const MIN_QUERY_LENGTH = 2
const DROPDOWN_MAX_HEIGHT = 320
const DROPDOWN_Z_INDEX = 9999

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
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isChoosingRef = useRef(false)

  const updateDropdownPosition = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setDropdownRect({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    })
  }, [])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (searchQuery.length < MIN_QUERY_LENGTH) {
      setResults([])
      setIsLoading(false)
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setIsOpen(true)
    updateDropdownPosition()

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const searchResults = await musicApi.searchMusic(searchQuery, 15, controller.signal)
      if (controller.signal.aborted) return
      setResults(searchResults)
      setIsOpen(true)
      updateDropdownPosition()
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Failed to search. Please try again.')
        console.error('Search error:', err)
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [updateDropdownPosition])

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
    if (!isOpen) return
    updateDropdownPosition()
    const onScrollOrResize = () => updateDropdownPosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [isOpen, updateDropdownPosition, results.length, isLoading])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (isChoosingRef.current) return
      const target = event.target as Node
      if (containerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown, { capture: true })
    return () => document.removeEventListener('pointerdown', handlePointerDown, { capture: true })
  }, [])

  const handleSelect = (result: MusicSearchResult) => {
    isChoosingRef.current = true
    onSelect(result)
    setQuery(`${result.trackName} - ${result.artistName}`)
    setIsOpen(false)
    setTimeout(() => { isChoosingRef.current = false }, 0)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleInputFocus = () => {
    if (results.length > 0 || query.length >= MIN_QUERY_LENGTH) {
      setIsOpen(true)
      updateDropdownPosition()
    }
  }

  const showDropdown = isOpen && (isLoading || results.length > 0 || error)

  const dropdownContent = showDropdown && dropdownRect && (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="fixed rounded-xl shadow-2xl border border-purple-500/30 bg-gray-900/95 backdrop-blur-xl z-[9999] overflow-hidden"
      style={{
        top: dropdownRect.top,
        left: dropdownRect.left,
        width: dropdownRect.width,
        maxHeight: DROPDOWN_MAX_HEIGHT,
      }}
    >
      <div className="overflow-y-auto p-2" style={{ maxHeight: DROPDOWN_MAX_HEIGHT - 8 }}>
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
            <p className="text-xs text-gray-500 mt-1">Try a different search term</p>
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
  )

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
          className="pl-10 pr-10 w-full"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400" />
          </motion.button>
        )}
      </div>
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>{dropdownContent}</AnimatePresence>,
          document.body
        )}
    </div>
  )
}
