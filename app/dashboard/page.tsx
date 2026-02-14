'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getDashboardPath } from '@/lib/roleGuard'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }

    const dashboardPath = getDashboardPath(user.role)
    router.push(dashboardPath)
  }, [router])

  return null
}
