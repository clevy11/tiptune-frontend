'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BarChart3, DollarSign, FileDown } from 'lucide-react'
import { DashboardBackground } from '@/components/theme/DashboardBackground'
import { GlassCard } from '@/components/GlassCard'
import { GlowButton } from '@/components/GlowButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { djApi } from '@/lib/api'
import type { DjRevenueSummaryResponse } from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'
import { shouldRedirect } from '@/lib/roleGuard'
import { useMounted } from '@/hooks/useMounted'
import { Role } from '@/lib/types'

export default function DjAnalyticsPage() {
  const router = useRouter()
  const mounted = useMounted()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const currentUser = mounted ? getCurrentUser() : null

  useEffect(() => {
    if (!mounted) return
    const user = getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }
    const redirect = shouldRedirect(user.role, '/dashboard/dj/analytics')
    if (redirect) router.push(redirect)
  }, [mounted, router])

  const { data: summary, isFetching } = useQuery<DjRevenueSummaryResponse>({
    queryKey: ['dj-revenue-summary', from || null, to || null],
    queryFn: () =>
      djApi.getRevenueSummary(
        from || to ? { from: from || undefined, to: to || undefined } : undefined
      ),
    enabled: !!currentUser && (currentUser.role === Role.DJ || currentUser.role === Role.ARTIST),
    staleTime: 60 * 1000,
  })

  const handleDownload = async () => {
    const data = await djApi.getRevenueSummary(
      from || to ? { from: from || undefined, to: to || undefined } : undefined
    )
    const rows: string[] = [
      'Total Revenue (RWF),Song Request Revenue (RWF),Standalone Tip Revenue (RWF),Tip-only Records',
    ]
    rows.push(
      `${Number(data.totalRevenue).toLocaleString()},${Number(data.songRequestRevenue).toLocaleString()},${Number(data.standaloneTipRevenue).toLocaleString()},${data.tipRecordCount}`
    )
    if (data.revenueByDay && data.revenueByDay.length > 0) {
      rows.push('')
      rows.push('Date,Revenue (RWF)')
      data.revenueByDay.forEach((d) =>
        rows.push(`${d.date},${Number(d.revenue).toLocaleString()}`)
      )
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `revenue-report${from && to ? `-${from}-${to}` : ''}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="relative z-10 text-center text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!currentUser || (currentUser.role !== Role.DJ && currentUser.role !== Role.ARTIST)) {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <DashboardBackground />
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/dj"
              className="p-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Back to DJ dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-purple-300" />
            </Link>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-purple-400" aria-hidden />
              <h1 className="text-xl sm:text-2xl font-bold text-white">Revenue analytics</h1>
            </div>
          </div>
        </div>

        <div className="max-w-2xl space-y-6">
          <GlassCard glow="purple">
            <h2 className="text-lg font-semibold text-gray-200 mb-4">Filter by date</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">From date</label>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="bg-white/5"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">To date</label>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="bg-white/5"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => { setFrom(''); setTo('') }}>
                Clear dates
              </Button>
              <GlowButton size="sm" glowColor="green" onClick={handleDownload}>
                <FileDown className="w-4 h-4 mr-2" />
                Download report
              </GlowButton>
            </div>
          </GlassCard>

          <GlassCard glow="green">
            <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Summary
            </h2>
            {isFetching ? (
              <p className="text-gray-400">Loading...</p>
            ) : summary ? (
              <div className="space-y-2 text-sm">
                <p>
                  Total: <span className="text-green-400 font-semibold">{Number(summary.totalRevenue).toLocaleString()} RWF</span>
                </p>
                <p className="text-gray-400">
                  From events: {Number(summary.songRequestRevenue).toLocaleString()} RWF
                </p>
                <p className="text-gray-400">
                  From tip-only link: {Number(summary.standaloneTipRevenue).toLocaleString()} RWF
                </p>
                <p className="text-gray-400">Tip-only records: {summary.tipRecordCount}</p>
                {summary.revenueByDay && summary.revenueByDay.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-white/10">
                    <p className="text-gray-400 mb-2">Revenue by day:</p>
                    <ul className="space-y-1 max-h-48 overflow-y-auto">
                      {summary.revenueByDay.map((d) => (
                        <li key={d.date} className="flex justify-between text-gray-300">
                          <span>{d.date}</span>
                          <span className="text-green-400 font-medium">{Number(d.revenue).toLocaleString()} RWF</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400">No data for this period.</p>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
