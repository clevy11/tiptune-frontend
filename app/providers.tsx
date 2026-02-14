'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 min — reduce refetches
            gcTime: 10 * 60 * 1000,  // 10 min (formerly cacheTime)
            refetchOnWindowFocus: false,
            retry: (failureCount, error: unknown) => {
              const status = error && typeof error === 'object' && 'response' in error
                ? (error as { response?: { status?: number } }).response?.status
                : undefined
              if (status != null && status >= 400 && status < 500) return false
              return failureCount < 2
            },
          },
          mutations: {},
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
