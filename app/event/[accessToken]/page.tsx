'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { eventApi, songRequestApi, publicTipApi } from '@/lib/api'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { GlassCard } from '@/components/GlassCard'
import { GlowButton } from '@/components/GlowButton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Music, Send, CheckCircle2, Sparkles, Clock, Home, Banknote, Smartphone, User, ExternalLink, Globe, Link2, Headphones, Heart, Radio } from 'lucide-react'
import { SiInstagram, SiMixcloud } from 'react-icons/si'
import type { Event, PublicSongRequestCreateRequest, MusicSearchResult, ProfileLinkResponse } from '@/lib/types'
import { EventStatus, TipPaymentType, ProfileLinkType } from '@/lib/types'
import { MusicSearchInput } from '@/components/music/MusicSearchInput'
import { formatInRwanda } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/apiClient'

type EventActionMode = 'choose' | 'tip_only' | 'request_song' | 'confirmation'
type ConfirmationType = 'song_request' | 'tip_only' | null

function toTelUrl(ussd: string): string {
  return `tel:${ussd.replace(/#/g, '%23')}`
}

async function submitTipAndOpenTel(
  submit: () => Promise<void>,
  telUrl: string,
  setThankYou: (v: boolean) => void,
  onError?: (message: string) => void,
  blockRedirectOnError: boolean = false,
  setConfirmationType?: (type: ConfirmationType) => void,
  setActionMode?: (mode: EventActionMode) => void
) {
  setThankYou(true)
  window.location.href = telUrl
  try {
    await submit()
    // Show confirmation screen only on success
    if (setConfirmationType) setConfirmationType('tip_only')
    if (setActionMode) setActionMode('confirmation')
  } catch (e) {
    const msg = getApiErrorMessage(e)
    console.error('Failed to record tip:', e)
    onError?.(msg)
    setThankYou(false)
    // Don't show confirmation or trigger payment on error
    if (blockRedirectOnError) return
  }
}

export default function PublicEventPage() {
  const params = useParams()
  const accessToken = params.accessToken as string
  const queryClient = useQueryClient()
  const [actionMode, setActionMode] = useState<EventActionMode>('choose')
  const [formData, setFormData] = useState({
    songTitle: '',
    songArtist: '',
    songAlbum: '',
    message: '',
    wantToTip: false as boolean,
    tipAmount: '' as string,
    payerName: '',
    payerPhone: '',
  })
  const [selectedSong, setSelectedSong] = useState<MusicSearchResult | null>(null)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [tipError, setTipError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [thankYou, setThankYou] = useState(false)
  const [isTriggeringPayment, setIsTriggeringPayment] = useState(false)
  const [confirmationType, setConfirmationType] = useState<ConfirmationType>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: event, isLoading, isError, error } = useQuery<Event>({
    queryKey: ['event', accessToken],
    queryFn: async () => {
      try {
        return await eventApi.getByAccessToken(accessToken)
      } catch (err) {
        console.error('Failed to fetch event:', err)
        throw err
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const createMutation = useMutation({
    mutationFn: (data: PublicSongRequestCreateRequest) =>
      songRequestApi.createPublic(data),
    onSuccess: (_, variables) => {
      setSuccess(true)
      setConfirmationType('song_request')
      setActionMode('confirmation')
      setFormData({
        songTitle: '',
        songArtist: '',
        songAlbum: '',
        message: '',
        wantToTip: false,
        tipAmount: '',
        payerName: '',
        payerPhone: '',
      })
      setSelectedSong(null)
      setTipError(null)
      setActionError(null)
      
      // If user wanted to tip and payment info is available, trigger payment dial
      if (variables.wantToTip && variables.tipAmount && paymentValue) {
        setIsTriggeringPayment(true)
        const safeAmount = Math.max(1, Math.min(500000, Math.floor(variables.tipAmount)))
        const ussd = `${ussdPrefix}${paymentValue}*${safeAmount}#`
        window.location.href = toTelUrl(ussd)
      }
    },
    onError: (error: any) => {
      console.error('Failed to submit request:', error)
      const msg = getApiErrorMessage(error)
      const lower = msg.toLowerCase()
      if (lower.includes('not active') || lower.includes('ended') || lower.includes('deleted')) {
        // Prefer a user-friendly message based on current event status (if available)
        if (event?.status === EventStatus.ENDED) setActionError('This event has ended.')
        else if (event?.status === EventStatus.DEACTIVATED) setActionError('This event has been deleted.')
        else setActionError('This event is no longer active.')
      } else {
        setActionError(msg)
      }
    },
  })

  const handleSongSelect = (result: MusicSearchResult) => {
    setSelectedSong(result)
    setFormData({
      ...formData,
      songTitle: result.trackName,
      songArtist: result.artistName,
      songAlbum: result.collectionName || '',
    })
  }

  const paymentValue = event?.djMomoCode ?? ''
  const tipPaymentType = event?.tipPaymentType ?? TipPaymentType.MOMO_CODE
  const ussdPrefix = tipPaymentType === TipPaymentType.MOMO_CODE ? '*182*8*1*' : '*182*1*1*'
  const isEventEnded = event?.status === EventStatus.ENDED
  const isEventDeleted = event?.status === EventStatus.DEACTIVATED
  const isEventBlocked = Boolean(isEventEnded || isEventDeleted)
  const eventBlockedMessage = isEventEnded ? 'This event has ended.' : isEventDeleted ? 'This event has been deleted.' : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTipError(null)
    setActionError(null)
    if (!event || !accessToken) {
      console.error('Cannot submit: event or accessToken is missing')
      return
    }
    if (isEventBlocked) {
      setActionError(eventBlockedMessage || 'This event is no longer active.')
      return
    }
    const wantToTip = formData.wantToTip
    let tipAmount: number | undefined
    if (wantToTip) {
      const parsed = Number(formData.tipAmount)
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 500_000) {
        setTipError('Tip amount must be between 1 and 500,000 RWF')
        return
      }
      tipAmount = parsed
    }
    createMutation.mutate({
      accessToken: event.accessToken as string,
      songTitle: formData.songTitle,
      songArtist: formData.songArtist,
      songAlbum: formData.songAlbum || undefined,
      message: formData.message || undefined,
      wantToTip: wantToTip || undefined,
      tipAmount,
      payerName: formData.payerName?.trim() || undefined,
      payerPhone: formData.payerPhone?.trim() || undefined,
    })
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="relative z-10 text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-purple-400 animate-pulse" />
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
          <Music className="w-16 h-16 mx-auto mb-4 text-purple-400 animate-pulse" />
          <p className="text-xl text-gray-300">Loading event...</p>
        </motion.div>
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 max-w-md w-full"
        >
          <GlassCard glow="red" className="p-8 text-center">
            <Music className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold mb-4 text-red-400">Event Not Found</h2>
            <p className="text-gray-300 mb-6">
              {error instanceof Error 
                ? error.message 
                : 'The event you&apos;re looking for doesn&apos;t exist or has expired.'}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              This event is no longer open or does not exist.
            </p>
            <GlowButton
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/'
                }
              }}
              glowColor="purple"
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </GlowButton>
          </GlassCard>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-6 sm:px-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl space-y-5 sm:space-y-8"
        >
          {/* Event Header */}
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(20,24,33,0.92),rgba(66,25,88,0.72)_52%,rgba(10,14,22,0.95))] p-5 text-center shadow-2xl sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-300/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-cyan-400/10 to-transparent" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-pink-300/30 bg-white/10 shadow-lg shadow-pink-500/20"
            >
              <Headphones className="h-9 w-9 text-pink-200" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mx-auto mb-3 max-w-2xl text-3xl font-black leading-tight text-white sm:text-5xl"
            >
              {event.name}
            </motion.h1>
            {event.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mx-auto mb-4 max-w-xl text-sm leading-relaxed text-gray-200 sm:text-lg"
              >
                {event.description}
              </motion.p>
            )}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mx-auto inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-2 text-xs text-gray-300 sm:text-sm"
            >
              <Clock className="h-4 w-4 shrink-0 text-cyan-300" />
              <span className="truncate">
                {formatInRwanda(event.startTime)} -{' '}
                {formatInRwanda(event.endTime)}
              </span>
            </motion.div>
          </section>

          {/* DJ info & socials */}
          {event.createdBy && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center shadow-xl shadow-black/20"
            >
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">Live with</p>
                <p className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
                  <User className="h-5 w-5 shrink-0 text-pink-300 sm:h-6 sm:w-6" aria-hidden />
                  {event.createdBy.name}
                </p>
              </div>
              {event.createdBy.profileLinks && event.createdBy.profileLinks.length > 0 && (
                <div className="mt-3 flex w-full flex-col items-center gap-2">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {event.createdBy.profileLinks.map((link: ProfileLinkResponse) => {
                      const label = link.linkType === ProfileLinkType.CUSTOM && link.label ? link.label : link.linkType.charAt(0) + link.linkType.slice(1).toLowerCase()
                      const Icon =
                        link.linkType === ProfileLinkType.INSTAGRAM ? SiInstagram
                        : link.linkType === ProfileLinkType.MIXCLOUD ? SiMixcloud
                        : link.linkType === ProfileLinkType.WEBSITE ? Globe
                        : Link2
                      return (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:border-pink-400/50 hover:bg-pink-500/20 hover:text-white"
                        >
                          <Icon className="h-4 w-4 shrink-0 text-pink-300" aria-hidden />
                          <span>{label}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Event availability banner */}
          {isEventBlocked && (
            <GlassCard glow="red" className="border border-red-500/30 bg-red-500/5">
              <p className="text-red-200 font-medium">
                {eventBlockedMessage}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                You can’t request songs or send tips for this event.
              </p>
            </GlassCard>
          )}

          {/* Choice: Tip only vs Request a song */}
          {actionMode === 'choose' && (
            <GlassCard glow="pink" className="p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-pink-300">Send your energy to the booth</p>
                  <h2 className="mt-1 text-2xl font-black text-white">What are we playing next?</h2>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <GlowButton
                    type="button"
                    onClick={() => setActionMode('request_song')}
                    glowColor="pink"
                    className="min-h-[140px] w-full flex-col items-center gap-3 rounded-2xl py-7 text-base"
                    disabled={isEventBlocked}
                  >
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 shadow-inner">
                      <Radio className="h-8 w-8" />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-lg font-bold">Request a song</span>
                      <span className="text-xs font-normal text-white/70">Search, send, and let the DJ review it</span>
                    </div>
                  </GlowButton>
                  <GlowButton
                    type="button"
                    onClick={() => setActionMode('tip_only')}
                    glowColor="green"
                    className="min-h-[140px] w-full flex-col items-center gap-3 rounded-2xl border border-green-300/40 bg-green-600/90 py-7 text-base text-white shadow-lg shadow-green-500/25 hover:bg-green-500"
                    disabled={isEventBlocked}
                  >
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 shadow-inner">
                      <Heart className="h-8 w-8" />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-lg font-bold">Tip the DJ</span>
                      <span className="text-xs font-normal text-white/75">Support the set without requesting</span>
                    </div>
                  </GlowButton>
                </div>
              </motion.div>
            </GlassCard>
          )}

          {/* Tip only form (no song request) */}
          {actionMode === 'tip_only' && !confirmationType && event && (
            <GlassCard glow="green" className="p-4 sm:p-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-2xl font-bold">
                    <Banknote className="w-6 h-6 text-green-400" />
                    Tip the DJ
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setActionMode('choose')
                      setConfirmationType(null)
                      setSuccess(false)
                      setIsTriggeringPayment(false)
                      setThankYou(false)
                    }}
                    className="min-h-[44px] shrink-0 rounded-lg px-2 text-sm text-gray-400 underline hover:text-gray-300"
                  >
                    Back
                  </button>
                </div>
                {actionError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 mb-3">
                    <p className="text-sm text-red-200">{actionError}</p>
                  </div>
                )}
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
                              disabled={isEventBlocked}
                              onClick={() => submitTipAndOpenTel(
                                () => publicTipApi.submitTip({
                                  eventAccessToken: accessToken,
                                  amount: safeAmount,
                                  payerName: formData.payerName?.trim() || undefined,
                                  payerPhone: formData.payerPhone?.trim() || undefined,
                                }),
                                telUrl,
                                setThankYou,
                                (msg) => {
                                  const lower = msg.toLowerCase()
                                  if (lower.includes('not active') || lower.includes('ended') || lower.includes('deleted')) {
                                    setActionError(eventBlockedMessage || 'This event is no longer active.')
                                  } else {
                                    setActionError(msg)
                                  }
                                },
                                true,
                                setConfirmationType,
                                setActionMode
                              )}
                              className="inline-flex items-center gap-2 w-full justify-center rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium py-3 px-4 transition-colors min-h-[44px] touch-manipulation disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <Smartphone className="w-5 h-5" />
                              Pay with MoMo — {safeAmount.toLocaleString()} RWF
                            </button>
                          </>
                        )}
                      </div>
                    )
                  })()}
                </div>
                {tipError && <p className="text-sm text-red-400 mt-2" role="alert">{tipError}</p>}
              </motion.div>
            </GlassCard>
          )}

          {/* Confirmation Screen */}
          {actionMode === 'confirmation' && (
            <GlassCard glow={confirmationType === 'song_request' ? 'pink' : 'green'} className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="py-8 px-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="inline-block mb-6"
                >
                  <CheckCircle2 className={`w-20 h-20 mx-auto ${confirmationType === 'song_request' ? 'text-pink-400' : 'text-green-400'}`} />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold mb-3 text-gradient"
                >
                  {confirmationType === 'song_request' 
                    ? 'Thank you for your request!'
                    : 'Thank you for your tip!'}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-300 text-lg mb-6"
                >
                  {confirmationType === 'song_request'
                    ? 'Your song request has been submitted successfully. The DJ will review it soon!'
                    : 'Your tip has been recorded. Thank you for supporting the DJ!'}
                </motion.p>
                {isTriggeringPayment && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-lg bg-green-500/10 border border-green-500/30 p-4 mb-4"
                  >
                    <p className="text-sm text-green-300 font-medium">
                      Opening payment dial...
                    </p>
                  </motion.div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-3 justify-center mt-6"
                >
                  <GlowButton
                    type="button"
                    onClick={() => {
                      setActionMode('choose')
                      setConfirmationType(null)
                      setSuccess(false)
                      setIsTriggeringPayment(false)
                      setThankYou(false)
                    }}
                    glowColor={confirmationType === 'song_request' ? 'pink' : 'green'}
                    variant="outline"
                  >
                    Make Another Request
                  </GlowButton>
                  <GlowButton
                    type="button"
                    onClick={() => {
                      setActionMode('choose')
                      setConfirmationType(null)
                      setSuccess(false)
                      setIsTriggeringPayment(false)
                      setThankYou(false)
                    }}
                    glowColor="purple"
                  >
                    View Event
                  </GlowButton>
                </motion.div>
              </motion.div>
            </GlassCard>
          )}

          {/* Request Form (song request + optional tip) */}
          {actionMode === 'request_song' && !confirmationType && (
          <GlassCard glow="pink" className="p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-pink-300">Queue drop</p>
                    <h2 className="mt-1 flex items-center gap-2 text-2xl font-black text-white">
                      <Sparkles className="h-6 w-6 text-pink-300" />
                      Request a Song
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActionMode('choose')
                      setConfirmationType(null)
                      setIsTriggeringPayment(false)
                      setSuccess(false)
                      setThankYou(false)
                    }}
                    className="min-h-[44px] shrink-0 rounded-lg px-2 text-sm text-gray-400 underline hover:text-gray-300"
                  >
                    Back
                  </button>
                </div>
                {actionError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 mb-3">
                    <p className="text-sm text-red-200">{actionError}</p>
                  </div>
                )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="rounded-xl border border-pink-300/20 bg-pink-500/10 p-3"
                >
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                    <Music className="h-4 w-4 text-pink-300" />
                    Search for a Song *
                  </label>
                  <MusicSearchInput
                    onSelect={handleSongSelect}
                    selectedResult={selectedSong}
                    placeholder="Type song name or artist..."
                  />
                    <p className="mt-2 text-xs text-gray-400">
                      If you don&apos;t find your song in search, fill in the title and artist manually below.
                    </p>
                </motion.div>
                
                {/* Manual input fields (shown when song is selected or for manual entry) */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.75 }}
                  className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Song Title</label>
                    <Input
                      placeholder="Song Title *"
                      value={formData.songTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, songTitle: e.target.value })
                      }
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Artist Name</label>
                    <Input
                      placeholder="Artist Name *"
                      value={formData.songArtist}
                      onChange={(e) =>
                        setFormData({ ...formData, songArtist: e.target.value })
                      }
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Album (optional)</label>
                    <Input
                      placeholder="Album"
                      value={formData.songAlbum}
                      onChange={(e) =>
                        setFormData({ ...formData, songAlbum: e.target.value })
                      }
                      className="w-full"
                    />
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                >
                  <Textarea
                    placeholder="Message (optional)"
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full"
                  />
                </motion.div>

                  {/* Optional tip */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.05 }}
                  className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <p className="block text-sm font-semibold text-white">
                      Add a tip?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={`flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${formData.wantToTip ? 'border-green-400/50 bg-green-500/15 text-green-100' : 'border-white/10 bg-white/5 text-gray-300'}`}>
                        <input
                          type="radio"
                          name="wantToTip"
                          checked={formData.wantToTip === true}
                          onChange={() => setFormData({ ...formData, wantToTip: true })}
                          className="sr-only"
                        />
                        <Banknote className="h-4 w-4" />
                        <span>Yes</span>
                      </label>
                      <label className={`flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${!formData.wantToTip ? 'border-pink-400/50 bg-pink-500/15 text-pink-100' : 'border-white/10 bg-white/5 text-gray-300'}`}>
                        <input
                          type="radio"
                          name="wantToTip"
                          checked={formData.wantToTip === false}
                          onChange={() => setFormData({ ...formData, wantToTip: false, tipAmount: '', payerName: '', payerPhone: '' })}
                          className="sr-only"
                        />
                        <Music className="h-4 w-4" />
                        <span>Request only</span>
                      </label>
                    </div>
                    {formData.wantToTip && (
                      <div className="space-y-3 rounded-xl border border-green-400/20 bg-green-500/10 p-3">
                        {paymentValue && (
                          <div className="rounded-lg bg-white/10 border border-pink-500/30 p-4">
                            <p className="text-sm font-medium text-gray-300 mb-1">Payment</p>
                            <p className="font-mono text-lg text-pink-300 break-all tracking-wide">
                              {ussdPrefix}{paymentValue}*{'{amount}'}#
                            </p>
                            <p className="text-xs text-gray-500 mt-2">Dial this on your phone and replace {'{amount}'} with your tip in RWF.</p>
                          </div>
                        )}
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
                        {/* Payment info display (payment will be triggered automatically after submission) */}
                        {paymentValue && formData.tipAmount && (() => {
                          const raw = Number(formData.tipAmount)
                          const safeAmount = Number.isFinite(raw) ? Math.max(1, Math.min(500000, Math.floor(raw))) : 0
                          const ussd = `${ussdPrefix}${paymentValue}*${safeAmount}#`
                          const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                          return (
                            <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
                              <p className="text-xs text-gray-400 mb-2">
                                Payment will be triggered automatically after submitting your request
                              </p>
                              <div className="text-sm text-green-300 font-medium mb-1">
                                Amount: {safeAmount.toLocaleString()} RWF
                              </div>
                              {!isMobile && (
                                <p className="text-xs text-gray-500 mt-2">
                                  On desktop: dial <span className="font-mono text-gray-400">{ussd}</span> on your phone when prompted.
                                </p>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </motion.div>
                  {tipError && <p className="text-sm text-red-400 mt-2" role="alert">{tipError}</p>}

                  <GlowButton
                    type="submit"
                    glowColor="pink"
                    className="w-full min-h-[52px] rounded-xl"
                    disabled={createMutation.isPending || isEventBlocked}
                  >
                    {createMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        {formData.wantToTip && formData.tipAmount ? 'Submitting & Preparing Payment...' : 'Submitting...'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        {formData.wantToTip && formData.tipAmount ? 'Submit & Pay' : 'Submit Request'}
                      </span>
                    )}
                  </GlowButton>
              </form>
              </motion.div>
            </GlassCard>
          )}
        </motion.div>
      </div>
    </div>
  )
}
