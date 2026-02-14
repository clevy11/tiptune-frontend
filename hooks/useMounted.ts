'use client'

import { useState, useEffect } from 'react'

/**
 * Returns true only after the component has mounted on the client.
 * Use this to avoid hydration mismatches when rendering content that
 * depends on localStorage, window, or other client-only APIs.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}
