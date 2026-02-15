import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
