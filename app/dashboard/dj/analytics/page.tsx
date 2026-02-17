'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BarChart3, DollarSign, FileDown, Maximize2, Music } from 'lucide-react'
import { DashboardBackground } from '@/components/theme/DashboardBackground'
import { GlassCard } from '@/components/GlassCard'
import { GlowButton } from '@/components/GlowButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { djApi } from '@/lib/api'
import type { DjRevenueSummaryResponse, TopSongResponse } from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'
import { shouldRedirect } from '@/lib/roleGuard'
import { useMounted } from '@/hooks/useMounted'
import { Role } from '@/lib/types'
import { FullScreenOverlay } from '@/components/ui/FullScreenOverlay'

export default function DjAnalyticsPage() {
  const router = useRouter()
  const mounted = useMounted()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [interval, setInterval] = useState<'day' | 'hour'>('day')
  const [fullScreen, setFullScreen] = useState<null | 'topSongs' | 'histogram'>(null)

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

  const { data: topSongs } = useQuery<TopSongResponse[]>({
    queryKey: ['dj-top-songs', from || null, to || null],
    queryFn: () => djApi.getTopSongs({ from: from || undefined, to: to || undefined, limit: 10 }),
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
    if (data.revenueByHour && data.revenueByHour.length > 0) {
      rows.push('')
      rows.push('Hour,Revenue (RWF)')
      data.revenueByHour.forEach((h) =>
        rows.push(`${h.hour},${Number(h.revenue).toLocaleString()}`)
      )
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `revenue-report${from && to ? `-${from}-${to}` : ''}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const chartPoints = (() => {
    if (!summary) return []
    if (interval === 'hour') {
      return (summary.revenueByHour || []).map((h) => ({
        label: h.hour,
        value: Number(h.revenue) || 0,
      }))
    }
    return (summary.revenueByDay || []).map((d) => ({
      label: d.date,
      value: Number(d.revenue) || 0,
    }))
  })()

  const maxValue = chartPoints.reduce((m, p) => Math.max(m, p.value), 0)
  const peak = chartPoints.reduce<{ label: string; value: number } | null>((best, p) => {
    if (!best || p.value > best.value) return { label: p.label, value: p.value }
    return best
  }, null)

  const TopSongsContent = () => (
    topSongs && topSongs.length > 0 ? (
      <div className="space-y-3">
        {(() => {
          const max = Math.max(...topSongs.map((s) => s.requestCount), 1)
          return topSongs.map((s, idx) => (
            <div key={`${s.title}-${s.artist}-${idx}`} className="space-y-1">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-gray-200 font-medium truncate">
                  {idx + 1}. {s.title} <span className="text-gray-500">— {s.artist}</span>
                </span>
                <span className="text-gray-400 flex-shrink-0">{s.requestCount}</span>
              </div>
              <div className="h-2 rounded bg-white/5 border border-white/10 overflow-hidden">
                <div className="h-full bg-pink-500/70" style={{ width: `${(s.requestCount / max) * 100}%` }} />
              </div>
            </div>
          ))
        })()}
      </div>
    ) : (
      <p className="text-gray-400">No requests in this period.</p>
    )
  )

  const HistogramContent = ({ large }: { large?: boolean }) => (
    <>
      {interval === 'hour' && (!from || !to) && (
        <p className="text-sm text-gray-400">
          Select a <span className="text-gray-200 font-medium">From</span> and <span className="text-gray-200 font-medium">To</span> date to see hourly performance.
        </p>
      )}
      {isFetching ? (
        <p className="text-gray-400">Loading chart…</p>
      ) : chartPoints.length === 0 ? (
        <p className="text-gray-400">No chart data for this period.</p>
      ) : (
        <div className="space-y-3">
          {peak && (
            <p className={`text-sm ${large ? 'sm:text-base' : ''} text-gray-300`}>
              Peak: <span className="text-green-400 font-semibold">{peak.value.toLocaleString()} RWF</span>{' '}
              <span className="text-gray-500">at</span> <span className="text-gray-200 font-medium">{peak.label}</span>
            </p>
          )}
          <div className="overflow-x-auto">
            <div
              className="flex items-end gap-2 py-2 pr-2"
              style={{
                minHeight: large ? 320 : 180,
                minWidth: Math.max(520, chartPoints.length * 18),
              }}
            >
              {chartPoints.map((p) => {
                const h = maxValue > 0
                  ? Math.max(6, Math.round((p.value / maxValue) * (large ? 280 : 160)))
                  : 6
                const isPeak = peak?.label === p.label && peak?.value === p.value
                return (
                  <div key={p.label} className="flex flex-col items-center gap-2">
                    <div
                      title={`${p.label}: ${p.value.toLocaleString()} RWF`}
                      className={`w-3 rounded-t-md transition-colors ${isPeak ? 'bg-green-500' : 'bg-purple-500/70'}`}
                      style={{ height: `${h}px` }}
                    />
                    <div className={`text-[10px] ${large ? 'sm:text-xs' : ''} text-gray-500 whitespace-nowrap rotate-[-45deg] origin-top-left`}>
                      {interval === 'hour' ? p.label.slice(11, 16) : p.label.slice(5)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Tip: switch to <span className="text-gray-300">By hour</span> to identify the best performing hour.
          </p>
        </div>
      )}
    </>
  )

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

          <GlassCard glow="pink">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <Music className="w-5 h-5 text-pink-400" />
                Top requested songs
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[44px] gap-2"
                onClick={() => setFullScreen('topSongs')}
              >
                <Maximize2 className="w-4 h-4" />
                Full screen
              </Button>
            </div>
            <TopSongsContent />
          </GlassCard>

          <GlassCard glow="purple">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Revenue histogram
              </h2>
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <div className="flex rounded-lg overflow-hidden border border-white/20 w-fit">
                  <button
                    type="button"
                    onClick={() => setInterval('day')}
                    className={`px-3 py-2 text-sm font-medium min-h-[44px] ${
                      interval === 'day' ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-gray-400'
                    }`}
                  >
                    By day
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterval('hour')}
                    className={`px-3 py-2 text-sm font-medium min-h-[44px] ${
                      interval === 'hour' ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-gray-400'
                    }`}
                  >
                    By hour
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] gap-2"
                  onClick={() => setFullScreen('histogram')}
                >
                  <Maximize2 className="w-4 h-4" />
                  Full screen
                </Button>
              </div>
            </div>
            <HistogramContent />
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

      <FullScreenOverlay
        open={fullScreen === 'topSongs'}
        title="Top requested songs"
        onClose={() => setFullScreen(null)}
      >
        <TopSongsContent />
      </FullScreenOverlay>

      <FullScreenOverlay
        open={fullScreen === 'histogram'}
        title="Revenue histogram"
        onClose={() => setFullScreen(null)}
        headerExtra={
          <div className="flex rounded-lg overflow-hidden border border-white/20 w-fit">
            <button
              type="button"
              onClick={() => setInterval('day')}
              className={`px-3 py-2 text-sm font-medium min-h-[44px] ${
                interval === 'day' ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-gray-300'
              }`}
            >
              By day
            </button>
            <button
              type="button"
              onClick={() => setInterval('hour')}
              className={`px-3 py-2 text-sm font-medium min-h-[44px] ${
                interval === 'hour' ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-gray-300'
              }`}
            >
              By hour
            </button>
          </div>
        }
      >
        <HistogramContent large />
      </FullScreenOverlay>
    </div>
  )
}
