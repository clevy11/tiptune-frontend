'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { GlowButton } from '@/components/GlowButton'
import { HeroWaveBottom } from '@/components/theme/HeroWaveBottom'
import { JoinEventModal } from '@/components/landing/JoinEventModal'
import { CalendarPlus, LogIn, Headphones } from 'lucide-react'

/** Replace with your Kigali nightlife images in public/images/landing/ */
const HERO_IMAGES = [
  { src: '/images/landing/hero-1.jpg', alt: 'Kigali dancefloor — the crowd responding to the beat', position: 'top' },
  { src: '/images/landing/hero-2.jpg', alt: 'Reading the room from the DJ booth', position: 'center' },
  { src: '/images/landing/hero-3.jpg', alt: 'The main floor — where the night belongs', position: 'bottom' },
]

export function HeroSection() {
  const [joinOpen, setJoinOpen] = useState(false)

  return (
    <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24 relative min-h-[70vh] sm:min-h-[85vh] flex flex-col justify-center">
      <HeroWaveBottom />
      <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center relative z-0">
        {/* Left — headline + message + CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="space-y-5 sm:space-y-8"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight">
            <span className="text-white">Real-Time Song</span>
            <br />
            <span className="text-gradient-hero">Requests for Live Events</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl font-medium text-[#E5E7EB] max-w-xl leading-relaxed">
            Book the main floor in two minutes. Generate a QR code, share it at your event, and let the crowd shape the set — the music flows from there.
          </p>
          <p className="inline-flex items-center gap-2 self-start rounded-full bg-white/5 border border-teal-400/30 px-4 py-2 text-sm sm:text-base font-medium">
            <Headphones className="w-4 h-4 text-teal-400" aria-hidden />
            <span className="text-white">Live at <span className="text-teal-400 font-semibold">12 Kigali venues</span> this month</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link href="/register">
              <GlowButton size="lg" glowColor="teal" className="min-h-[48px] text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto">
                Drop Your First Beat
                <CalendarPlus className="ml-2 w-4 h-4 sm:w-5 sm:h-5 inline" />
              </GlowButton>
            </Link>
            <GlowButton
              size="lg"
              variant="outline"
              glowColor="teal"
              onClick={() => setJoinOpen(true)}
              className="min-h-[48px] text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto"
            >
              Join an Event
              <LogIn className="ml-2 w-4 h-4 sm:w-5 sm:h-5 inline" />
            </GlowButton>
          </div>
        </motion.div>

        {/* Right — overlapping nightlife image grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="relative hidden lg:block h-[420px] lg:h-[480px]"
        >
          <div className="absolute inset-0 flex items-center justify-center gap-4">
            {HERO_IMAGES.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(0,245,195,0.08)] hover:shadow-[0_0_25px_rgba(0,245,195,0.15)] hover:border-[#00F5C3]/20 transition-all duration-300 hover:-translate-y-1"
                style={{
                  width: i === 1 ? 220 : 180,
                  alignSelf: i === 0 ? 'flex-start' : i === 1 ? 'center' : 'flex-end',
                  transform: `rotate(${i === 0 ? -4 : i === 1 ? 2 : 3}deg)`,
                }}
              >
                <div className="relative w-full aspect-[3/4] bg-[#121826]">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 1024px) 0, 220px"
                    className="object-cover"
                    loading="eager"
                    priority
                    onError={(e) => {
                      const t = e.target as HTMLImageElement
                      t.style.display = 'none'
                      t.parentElement?.querySelector<HTMLElement>('.img-fallback')?.classList.remove('hidden')
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14]/60 to-transparent pointer-events-none" />
                  <div className="img-fallback absolute inset-0 bg-[#121826] hidden" aria-hidden />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <JoinEventModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </section>
  )
}
