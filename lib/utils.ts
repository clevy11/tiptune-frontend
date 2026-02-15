import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Rwanda timezone (GMT+2). Use for displaying all server-stored times. */
const RWANDA_TZ = 'Africa/Kigali'

/** Format date+time in Rwanda (GMT+2). Use for any hour displayed from the backend. */
export function formatInRwanda(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-GB', { timeZone: RWANDA_TZ, dateStyle: 'short', timeStyle: 'short' })
}

/** Format date only in Rwanda (GMT+2). */
export function formatDateInRwanda(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', { timeZone: RWANDA_TZ })
}

/** Format time only in Rwanda (GMT+2). */
export function formatTimeInRwanda(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-GB', { timeZone: RWANDA_TZ, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/** Sanitize event name for file names: spaces → hyphens, remove special chars. Result: {event-name}-qr-code */
export function sanitizeEventNameForFile(eventName: string): string {
  if (!eventName?.trim()) return 'event'
  return eventName
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'event'
}
