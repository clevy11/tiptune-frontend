'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker } from 'react-day-picker'
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import 'react-day-picker/dist/style.css'

export interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
  min?: string
  max?: string
}

/** Value format: YYYY-MM-DDTHH:mm (datetime-local). */
function parseDateTime(s: string): { date: Date; time: string } | null {
  if (!s || s.length < 16) return null
  const [datePart, timePart] = s.split('T')
  if (!datePart || !timePart) return null
  const d = new Date(s + ':00')
  if (isNaN(d.getTime())) return null
  const time = timePart.slice(0, 5)
  return { date: d, time }
}

function toDateTimeString(date: Date, time: string): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const [hh = '00', mm = '00'] = time.split(':')
  return `${y}-${m}-${day}T${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Select date & time',
  className,
  id,
  disabled,
  min,
  max,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 320, openUp: false })
  const ref = useRef<HTMLDivElement>(null)
  const parsed = value ? parseDateTime(value) : null
  const selectedDate = parsed?.date
  const timeValue = parsed?.time || '12:00'
  const fromDate = min ? (() => { const p = parseDateTime(min); return p?.date; })() : undefined
  const toDate = max ? (() => { const p = parseDateTime(max); return p?.date; })() : undefined

  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const estimatedHeight = 420
      const spaceBelow = typeof window !== 'undefined' ? window.innerHeight - rect.bottom : 500
      const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight
      setPosition({
        top: openUp ? rect.top - estimatedHeight - 8 : rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 320),
        openUp,
      })
    }
  }, [open])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target)) return
      const portal = document.getElementById('datetime-picker-portal')
      if (portal?.contains(target)) return
      setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const displayDate = selectedDate ? toDateString(selectedDate) : ''
  const displayTime = timeValue
  const displayText = value ? `${displayDate} ${displayTime}` : ''

  const handleDateSelect = (day: Date | undefined) => {
    if (!day) return
    const base = toDateString(day)
    const next = `${base}T${timeValue}`
    onChange(next)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value
    if (!selectedDate) {
      const today = new Date()
      const y = today.getFullYear()
      const m = String(today.getMonth() + 1).padStart(2, '0')
      const d = String(today.getDate()).padStart(2, '0')
      onChange(`${y}-${m}-${d}T${t}`)
      return
    }
    onChange(toDateTimeString(selectedDate, t))
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-left',
          'backdrop-blur-sm transition-all duration-300 hover:border-purple-500/50 hover:bg-white/10',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        <Calendar className="h-4 w-4 text-purple-400 shrink-0" />
        <Clock className="h-4 w-4 text-purple-400/80 shrink-0" />
        <span className={value ? 'text-gray-200' : 'text-gray-500'}>{displayText || placeholder}</span>
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id="datetime-picker-portal"
            className="fixed z-[99999] flex flex-col flex-nowrap gap-3 rounded-xl border border-purple-500/30 bg-gray-900/95 p-4 shadow-2xl backdrop-blur-xl rdpm"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'fixed',
            }}
            role="dialog"
            aria-label="Date and time"
          >
            {/* Time at top */}
            <div className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <Clock className="h-4 w-4 text-purple-400 shrink-0" />
              <label htmlFor={id ? `${id}-time` : undefined} className="text-xs font-medium text-gray-400 shrink-0">Time</label>
              <input
                id={id ? `${id}-time` : undefined}
                type="time"
                value={timeValue}
                onChange={handleTimeChange}
                className={cn(
                  'flex h-9 flex-1 min-w-0 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-gray-200',
                  'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                )}
              />
            </div>
            {/* Calendar: shrink-0 so flex never clips the bottom rows */}
            <div className="shrink-0 datetime-calendar-wrap" style={{ minHeight: 320 }}>
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(day) => day && handleDateSelect(day)}
                disabled={[
                  ...(fromDate ? [{ before: fromDate }] : []),
                  ...(toDate ? [{ after: toDate }] : []),
                ].flat()}
                fromDate={fromDate}
                toDate={toDate}
                captionLayout="dropdown-buttons"
                classNames={{
                  root: '!m-0 !p-0',
                  months: '!block',
                  month: '!block',
                  caption: 'flex justify-between items-center text-gray-200',
                  caption_label: 'text-sm font-medium',
                  caption_dropdowns: 'flex gap-2',
                  dropdown: 'bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-gray-200 text-sm',
                  nav: 'flex gap-1',
                  nav_button: 'rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors',
                  head_cell: 'text-xs text-gray-500 w-9 py-1',
                  cell: 'w-9',
                  day: 'w-9 h-9 text-sm rounded-lg transition-colors hover:bg-purple-500/30 focus:outline-none focus:bg-purple-500/30',
                }}
                modifiersClassNames={{
                  selected: '!bg-purple-500 !text-white hover:!bg-purple-600',
                  today: 'font-semibold text-purple-300',
                  outside: 'text-gray-600 opacity-50',
                  disabled: 'opacity-40',
                  hidden: 'invisible',
                }}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
