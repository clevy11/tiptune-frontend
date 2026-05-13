'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const SLIDES = [
  {
    id: 0,
    bg: "linear-gradient(180deg, rgba(5,8,20,0.25) 0%, rgba(50,10,80,0.50) 40%, rgba(5,8,20,0.85) 100%), url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1400&q=80')",
  },
  {
    id: 1,
    bg: "linear-gradient(180deg, rgba(5,8,20,0.30) 0%, rgba(30,10,60,0.50) 40%, rgba(5,8,20,0.85) 100%), url('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1400&q=80')",
  },
  {
    id: 2,
   bg: "linear-gradient(180deg, rgba(5,8,20,0.20) 0%, rgba(10,30,50,0.50) 40%, rgba(5,8,20,0.85) 100%), url('https://images.unsplash.com/photo-1766553928642-cbfe1935de9c?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=1400&q=80')",
  },
] as const

export function AuthSplitLayout({
  right,
}: {
  right: React.ReactNode
}) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length)
    }, 5000)
    return () => window.clearInterval(id)
  }, [])

  const slideDots = useMemo(
    () =>
      SLIDES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => setActive(s.id)}
          aria-label={`Go to slide ${s.id + 1}`}
          className={[
            'w-[3px] rounded-sm transition-all',
            active === s.id ? 'h-8 bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]' : 'h-5 bg-white/20 hover:bg-white/35',
          ].join(' ')}
        />
      )),
    [active]
  )

  return (
    <div className="min-h-screen lg:h-screen w-full overflow-y-auto lg:overflow-hidden bg-[#07090f]">
      <div className="flex min-h-screen lg:h-screen w-full lg:flex-row">
        {/* Left: slideshow + copy */}
        <div className="hidden lg:flex relative flex-1 lg:h-full overflow-hidden">
          {/* Slides */}
          <div className="absolute inset-0">
            {SLIDES.map((s) => (
              <div
                key={s.id}
                className={[
                  'absolute inset-0 bg-cover bg-center transition-opacity [transition-duration:1800ms] ease-out',
                  active === s.id ? 'opacity-100' : 'opacity-0',
                ].join(' ')}
                style={{ backgroundImage: s.bg }}
              />
            ))}
          </div>

          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-100"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(155,89,247,0.12) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              maskImage:
                'linear-gradient(to right, transparent, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.3) 70%, transparent)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.3) 70%, transparent)',
            }}
          />

          {/* Grain */}
          <div className="absolute inset-0 auth-grain opacity-50" />

          {/* Top fade + right vignette */}
          <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#07090f]" />

          {/* Scan line */}
          <div className="absolute left-0 right-0 h-px auth-scan" />

          {/* Content */}
          <div className="relative z-10 flex w-full flex-col justify-between">
            {/* Logo */}
            <div className="px-6 sm:px-10 pt-8 sm:pt-10">
              <Link href="/" className="inline-flex items-center gap-3">
                <Image
                  src="/images/landing/logo.png"
                  alt="TipTune"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-xl shadow-[0_0_20px_rgba(123,47,247,0.5)]"
                  priority
                />
                <div className="text-white font-bold tracking-[0.22em] uppercase text-lg sm:text-xl">
                  TipTune
                </div>
              </Link>
            </div>

            {/* Bottom copy */}
            <div className="px-6 sm:px-10 pb-8 sm:pb-11">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 border border-cyan-300/20 px-3 py-1.5 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.9)] auth-blink" />
                <span className="text-[10px] tracking-[0.25em] uppercase text-cyan-300 font-medium">
                  Kigali, Rwanda
                </span>
              </div>

              <h2 className="font-bold leading-[1.05] tracking-wide text-white text-3xl sm:text-4xl lg:text-5xl font-[Rajdhani,system-ui] drop-shadow-[0_2px_30px_rgba(0,0,0,0.8)]">
                Turn Moments
                <br />
                Into{' '}
                <span className="bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(34,211,238,0.25)]">
                  Music
                </span>
              </h2>

              <p className="mt-3 max-w-[26rem] text-sm leading-6 text-white/45">
                Rwanda&apos;s premier song request &amp; tipping platform. Connect with DJs and artists at the hottest
                spots in the city.
              </p>

              <div className="mt-6 flex flex-wrap gap-7">
                <div className="flex flex-col leading-tight">
                  <span className="text-xl font-bold text-white/90 font-[Rajdhani,system-ui]">500+</span>
                  <span className="text-[10px] tracking-[0.22em] uppercase text-white/30">Artists</span>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xl font-bold text-white/90 font-[Rajdhani,system-ui]">80+</span>
                  <span className="text-[10px] tracking-[0.22em] uppercase text-white/30">Venues</span>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xl font-bold text-white/90 font-[Rajdhani,system-ui]">10K+</span>
                  <span className="text-[10px] tracking-[0.22em] uppercase text-white/30">Requests</span>
                </div>
              </div>
            </div>
          </div>

          {/* Slide dots */}
          <div className="hidden lg:flex absolute bottom-11 right-8 z-10 flex-col gap-2">
            {slideDots}
          </div>
        </div>

        {/* Right: form */}
        <div className="relative w-full lg:flex-1 bg-[#080c16] lg:border-l border-purple-500/15 overflow-hidden">
          <div className="absolute inset-0 auth-right-grid" aria-hidden />
          <div className="absolute -bottom-24 -right-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(123,47,247,0.08)_0%,transparent_70%)] pointer-events-none" />
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-300/40 via-purple-400/40 to-transparent" />

          <div className="relative z-10 flex min-h-screen lg:min-h-full flex-col justify-center px-6 sm:px-10 py-10 lg:py-14">
            {right}

            <div className="mt-10 lg:mt-0 lg:absolute lg:bottom-6 left-0 right-0 flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] auth-blink" />
              <span className="text-[10px] tracking-[0.25em] uppercase text-emerald-400/50">
                Secured · 256-bit encrypted
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

