'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { GlassCard } from '@/components/GlassCard'
import { Input } from '@/components/ui/input'
import { Banknote, Home, Smartphone, User, ExternalLink, Globe, Link2 } from 'lucide-react'
import { SiInstagram, SiMixcloud } from 'react-icons/si'
import { publicTipApi } from '@/lib/api'
import type { TipInfoResponse, ProfileLinkResponse } from '@/lib/types'
import { TipPaymentType, ProfileLinkType } from '@/lib/types'

function toTelUrl(ussd: string): string {
  return `tel:${ussd.replace(/#/g, '%23')}`
}

async function submitAndOpenTel(
  submit: () => Promise<void>,
  telUrl: string,
  setThankYou: (v: boolean) => void
) {
  setThankYou(true)
  window.location.href = telUrl
  try {
    await submit()
  } catch (e) {
    console.error('Failed to record tip:', e)
  }
}

export default function PermanentTipPage() {
  const params = useParams()
  const token = params.token as string
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({ tipAmount: '', payerName: '', payerPhone: '' })
  const [tipError, setTipError] = useState<string | null>(null)
  const [thankYou, setThankYou] = useState(false)

  useEffect(() => setMounted(true), [])

  const { data: tipInfo, isLoading, isError, error } = useQuery<TipInfoResponse>({
    queryKey: ['tip-info', token],
    queryFn: () => publicTipApi.getTipInfo(token),
    retry: 1,
    enabled: !!token && mounted,
  })

  const paymentValue = tipInfo?.paymentValue ?? ''
  const paymentType = tipInfo?.paymentType ?? TipPaymentType.MOMO_CODE
  const ussdPrefix = paymentType === TipPaymentType.MOMO_CODE ? '*182*8*1*' : '*182*1*1*'

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="relative z-10 text-center">
          <Banknote className="w-16 h-16 mx-auto mb-4 text-green-400 animate-pulse" />
          <p className="text-xl text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 text-center"
        >
          <Banknote className="w-16 h-16 mx-auto mb-4 text-green-400 animate-pulse" />
          <p className="text-xl text-gray-300">Loading...</p>
        </motion.div>
      </div>
    )
  }

  if (isError || !tipInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 max-w-md w-full"
        >
          <GlassCard glow="red" className="p-8 text-center">
            <Banknote className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold mb-4 text-red-400">Link not found</h2>
            <p className="text-gray-300 mb-6">
              {error instanceof Error ? error.message : 'This tip link is invalid or has expired.'}
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 px-4"
            >
              <Home className="w-4 h-4" />
              Go Home
            </a>
          </GlassCard>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <AnimatedBackground />
      <div className="relative z-10 container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto space-y-6"
        >
          <GlassCard glow="green" className="text-center">
            <Banknote className="w-14 h-14 text-green-400 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-1">Tip {tipInfo.djName}</h1>
            <p className="text-gray-400 text-sm">Send a tip via MoMo</p>
          </GlassCard>

          {tipInfo.profileLinks && tipInfo.profileLinks.length > 0 && (
            <GlassCard glow="purple" className="text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <User className="w-5 h-5 text-purple-400" aria-hidden />
                  <span>{tipInfo.djName}</span>
                </div>
                <p className="text-xs text-gray-500 font-medium">Their socials</p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                  {tipInfo.profileLinks.map((link: ProfileLinkResponse) => {
                    const label =
                      link.linkType === ProfileLinkType.CUSTOM && link.label
                        ? link.label
                        : link.linkType.charAt(0) + link.linkType.slice(1).toLowerCase()
                    const Icon =
                      link.linkType === ProfileLinkType.INSTAGRAM
                        ? SiInstagram
                        : link.linkType === ProfileLinkType.MIXCLOUD
                        ? SiMixcloud
                        : link.linkType === ProfileLinkType.WEBSITE
                        ? Globe
                        : Link2
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-purple-500/30 border border-white/20 hover:border-purple-500/50 px-4 py-2.5 text-sm font-medium text-gray-200 hover:text-white transition-colors"
                      >
                        <Icon className="w-4 h-4 shrink-0 text-purple-400" aria-hidden />
                        <span>{label}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-70 shrink-0" aria-hidden />
                      </a>
                    )
                  })}
                </div>
              </div>
            </GlassCard>
          )}

          <GlassCard glow="green">
            {paymentValue && (
              <div className="rounded-lg bg-white/10 border border-green-500/30 p-4 mb-4">
                <p className="text-sm font-medium text-gray-300 mb-1">Payment</p>
                <p className="font-mono text-lg text-green-300 break-all tracking-wide">
                  {ussdPrefix}{paymentValue}*{'{amount}'}#
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Dial this on your phone and replace {'{amount}'} with your tip in RWF.
                </p>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Your name (optional)</label>
                <Input
                  placeholder="Payer name"
                  value={formData.payerName}
                  onChange={(e) => setFormData({ ...formData, payerName: e.target.value })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Phone (optional)</label>
                <Input
                  type="tel"
                  placeholder="Phone number"
                  value={formData.payerPhone}
                  onChange={(e) => setFormData({ ...formData, payerPhone: e.target.value })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Tip amount (RWF) *</label>
                <Input
                  type="number"
                  min={1}
                  max={500000}
                  placeholder="e.g. 5000"
                  value={formData.tipAmount}
                  onChange={(e) => {
                    setFormData({ ...formData, tipAmount: e.target.value })
                    setTipError(null)
                  }}
                  className="w-full"
                />
              </div>
              {paymentValue && formData.tipAmount && (() => {
                const raw = Number(formData.tipAmount)
                const safeAmount = Number.isFinite(raw) ? Math.max(1, Math.min(500000, Math.floor(raw))) : 0
                const ussd = `${ussdPrefix}${paymentValue}*${safeAmount}#`
                const telUrl = toTelUrl(ussd)
                const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                return (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
                    {thankYou ? (
                      <p className="text-center py-4 text-green-300 font-medium">
                        Thank you! Opening MoMo…
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-gray-400 mb-2">Then pay with MoMo (tip will be recorded)</p>
                        <button
                          type="button"
                          onClick={() => submitAndOpenTel(
                            () => publicTipApi.submitTip({
                              tipLinkToken: token,
                              amount: safeAmount,
                              payerName: formData.payerName?.trim() || undefined,
                              payerPhone: formData.payerPhone?.trim() || undefined,
                            }),
                            telUrl,
                            setThankYou
                          )}
                          className="inline-flex items-center gap-2 w-full justify-center rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium py-3 px-4 transition-colors min-h-[44px] touch-manipulation"
                        >
                          <Smartphone className="w-5 h-5" />
                          Pay with MoMo — {safeAmount.toLocaleString()} RWF
                        </button>
                      </>
                    )}
                    {!isMobile && (
                      <p className="text-xs text-gray-500 mt-2">
                        On desktop: dial <span className="font-mono text-gray-400">{ussd}</span> on your phone.
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>
            {tipError && <p className="text-sm text-red-400 mt-2" role="alert">{tipError}</p>}
          </GlassCard>

          <p className="text-center">
            <a href="/" className="text-sm text-gray-400 hover:text-gray-300 inline-flex items-center gap-1">
              <Home className="w-4 h-4" />
              Back to home
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
