'use client'

import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import 'react-day-picker/dist/style.css'

export interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
  min?: string
  max?: string
}

/** Format YYYY-MM-DD for value. */
function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDate(s: string): Date | undefined {
  if (!s || s.length < 10) return undefined
  const d = new Date(s + 'T12:00:00')
  return isNaN(d.getTime()) ? undefined : d
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className,
  id,
  disabled,
  min,
  max,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = value ? parseDate(value) : undefined
  const fromDate = min ? parseDate(min) : undefined
  const toDate = max ? parseDate(max) : undefined

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

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
        <span className={value ? 'text-gray-200' : 'text-gray-500'}>{value || placeholder}</span>
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-[9999] mt-2 rounded-xl border border-purple-500/30 bg-gray-900/95 p-3 shadow-2xl backdrop-blur-xl rdpm"
          role="dialog"
          aria-label="Calendar"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(day) => {
              if (day) {
                onChange(toDateString(day))
                setOpen(false)
              }
            }}
            disabled={[
              ...(fromDate ? [{ before: fromDate }] : []),
              ...(toDate ? [{ after: toDate }] : []),
            ].flat()}
            fromDate={fromDate}
            toDate={toDate}
            captionLayout="dropdown-buttons"
            classNames={{
              root: '!m-0 p-0',
              months: 'flex flex-col',
              month: 'space-y-3',
              caption: 'flex justify-between items-center text-gray-200',
              caption_label: 'text-sm font-medium',
              caption_dropdowns: 'flex gap-2',
              dropdown: 'bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-gray-200 text-sm',
              nav: 'flex gap-1',
              nav_button: 'rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors',
              head_cell: 'text-xs text-gray-500 w-9 py-1',
              cell: 'w-9',
              day: 'w-9 h-9 text-sm rounded-lg transition-colors hover:bg-purple-500/30 focus:outline-none focus:bg-purple-500/30',
              row: 'flex w-full mt-1',
              tbody: 'flex flex-col gap-0.5',
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
      )}
    </div>
  )
}
