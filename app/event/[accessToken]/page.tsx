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
import { Music, Send, CheckCircle2, Sparkles, Clock, Home, DollarSign, Smartphone } from 'lucide-react'
import type { Event, PublicSongRequestCreateRequest, MusicSearchResult } from '@/lib/types'
import { EventStatus, TipPaymentType } from '@/lib/types'
import { MusicSearchInput } from '@/components/music/MusicSearchInput'
import { formatInRwanda } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/apiClient'

type EventActionMode = 'choose' | 'tip_only' | 'request_song'

async function submitTipAndOpenTel(
  submit: () => Promise<void>,
  telUrl: string,
  setThankYou: (v: boolean) => void,
  onError?: (message: string) => void,
  blockRedirectOnError: boolean = false
) {
  setThankYou(true)
  try {
    await submit()
  } catch (e) {
    const msg = getApiErrorMessage(e)
    console.error('Failed to record tip:', e)
    onError?.(msg)
    setThankYou(false)
    if (blockRedirectOnError) return
  }
  setTimeout(() => {
    window.location.href = telUrl
  }, 1200)
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

  const { data: requests } = useQuery({
    queryKey: ['requests', accessToken],
    queryFn: async () => {
      try {
        return await songRequestApi.getByAccessToken(accessToken)
      } catch (err) {
        console.error('Failed to fetch requests:', err)
        return []
      }
    },
    enabled: !!event && !isError,
  })

  const createMutation = useMutation({
    mutationFn: (data: PublicSongRequestCreateRequest) =>
      songRequestApi.createPublic(data),
    onSuccess: () => {
      setSuccess(true)
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
      queryClient.invalidateQueries({ queryKey: ['requests', accessToken] })
      setTimeout(() => setSuccess(false), 3000)
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
      
      <div className="relative z-10 container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          {/* Event Header */}
          <GlassCard glow="purple" className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-block mb-4"
            >
              <Music className="w-16 h-16 text-purple-400 mx-auto" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl lg:text-5xl font-bold mb-4 text-gradient"
            >
              {event.name}
            </motion.h1>
            {event.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-300 text-lg mb-4"
              >
                {event.description}
              </motion.p>
            )}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 text-sm text-gray-400"
            >
              <Clock className="w-4 h-4" />
              <span>
                {formatInRwanda(event.startTime)} -{' '}
                {formatInRwanda(event.endTime)}
              </span>
            </motion.div>
          </GlassCard>

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
            <GlassCard glow="pink">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-bold text-center mb-4">What would you like to do?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GlowButton
                    type="button"
                    onClick={() => setActionMode('tip_only')}
                    glowColor="green"
                    className="w-full py-6 flex flex-col items-center gap-2"
                    disabled={isEventBlocked}
                  >
                    <DollarSign className="w-8 h-8" />
                    <span>Tip only</span>
                  </GlowButton>
                  <GlowButton
                    type="button"
                    onClick={() => setActionMode('request_song')}
                    glowColor="pink"
                    className="w-full py-6 flex flex-col items-center gap-2"
                    disabled={isEventBlocked}
                  >
                    <Music className="w-8 h-8" />
                    <span>Request a song</span>
                  </GlowButton>
                </div>
              </motion.div>
            </GlassCard>
          )}

          {/* Tip only form (no song request) */}
          {actionMode === 'tip_only' && event && (
            <GlassCard glow="green">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-green-400" />
                    Tip the DJ
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActionMode('choose')}
                    className="text-sm text-gray-400 hover:text-gray-300 underline"
                  >
                    Back to choices
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
                    const telUrl = `tel:${ussd}`
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
                                true
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
                </div>
                {tipError && <p className="text-sm text-red-400 mt-2" role="alert">{tipError}</p>}
              </motion.div>
            </GlassCard>
          )}

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-strong rounded-xl p-6 glow-green border border-green-500/50"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  <p className="text-green-400 font-semibold">
                    Song request submitted successfully!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Request Form (song request + optional tip) */}
          {actionMode === 'request_song' && (
            <GlassCard glow="pink">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-pink-400" />
                    Request a Song
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActionMode('choose')}
                    className="text-sm text-gray-400 hover:text-gray-300 underline"
                  >
                    Back to choices
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
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Search for a Song *
                    </label>
                    <MusicSearchInput
                      onSelect={handleSongSelect}
                      selectedResult={selectedSong}
                      placeholder="Type song name or artist..."
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      If you don&apos;t find your song in search, fill in the title and artist manually below.
                    </p>
                  </motion.div>
                  
                  {/* Manual input fields (shown when song is selected or for manual entry) */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.75 }}
                    className="space-y-3 pt-2 border-t border-white/10"
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
                    className="space-y-3 pt-2 border-t border-white/10"
                  >
                    <p className="block text-sm font-medium text-gray-300 mb-2">
                      Would you like to tip the DJ?
                    </p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="wantToTip"
                          checked={formData.wantToTip === true}
                          onChange={() => setFormData({ ...formData, wantToTip: true })}
                          className="rounded-full border-white/30 bg-white/5"
                        />
                        <span className="text-gray-300">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="wantToTip"
                          checked={formData.wantToTip === false}
                          onChange={() => setFormData({ ...formData, wantToTip: false, tipAmount: '', payerName: '', payerPhone: '' })}
                          className="rounded-full border-white/30 bg-white/5"
                        />
                        <span className="text-gray-300">No</span>
                      </label>
                    </div>
                    {formData.wantToTip && (
                      <div className="space-y-3 pl-2 border-l-2 border-pink-500/50">
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
                        {/* Pay with MoMo: tel link; amount sanitized 1–500000 */}
                        {paymentValue && formData.tipAmount && (() => {
                          const raw = Number(formData.tipAmount)
                          const safeAmount = Number.isFinite(raw) ? Math.max(1, Math.min(500000, Math.floor(raw))) : 0
                          const ussd = `${ussdPrefix}${paymentValue}*${safeAmount}#`
                          const telUrl = `tel:${ussd}`
                          const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                          return (
                            <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
                              <p className="text-xs text-gray-400 mb-2">Then pay with MoMo</p>
                              <a
                                href={telUrl}
                                className="inline-flex items-center gap-2 w-full justify-center rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium py-3 px-4 transition-colors min-h-[44px] touch-manipulation"
                              >
                                <Smartphone className="w-5 h-5" />
                                Pay with MoMo — {safeAmount.toLocaleString()} RWF
                              </a>
                              {!isMobile && (
                                <p className="text-xs text-gray-500 mt-2">
                                  On desktop: dial <span className="font-mono text-gray-400">{ussd}</span> on your phone.
                                </p>
                              )}
                            </div>
                          )
                        })()}
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
                      </div>
                    )}
                  </motion.div>
                  {tipError && <p className="text-sm text-red-400 mt-2" role="alert">{tipError}</p>}

                  <GlowButton type="submit" glowColor="pink" className="w-full min-h-[48px]">
                    Submit request
                  </GlowButton>
                </form>
              </motion.div>
            </GlassCard>
          )}

          {/* Recent Requests */}
          {actionMode === 'request_song' && requests && requests.length > 0 && (
            <GlassCard glow="blue">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Recent Requests
                </h2>
                <div className="space-y-3">
                  <AnimatePresence>
                    {requests.slice(0, 10).map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.3 + index * 0.1 }}
                        className="glass rounded-lg p-4"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">
                              {request.song.title} - {request.song.artist}
                              {(Number(request.tipAmount) || 0) > 0 && (
                                <span className="ml-2 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                                  <DollarSign className="w-3 h-3" />
                                  {Number(request.tipAmount).toLocaleString()} RWF
                                </span>
                              )}
                            </p>
                            {request.message && (
                              <p className="text-sm text-gray-400 mt-1">{request.message}</p>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                              request.status === 'ACCEPTED'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                : request.status === 'DECLINED'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                                : request.status === 'PLAYED'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                            }`}
                          >
                            {request.status}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            </GlassCard>
          )}
        </motion.div>
      </div>
    </div>
  )
}
