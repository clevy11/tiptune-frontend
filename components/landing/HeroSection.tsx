'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { GlowButton } from '@/components/GlowButton'
import { HeroWaveBottom } from '@/components/theme/HeroWaveBottom'
import { Sparkles } from 'lucide-react'

/** Replace with your Kigali nightlife images in public/images/landing/ */
const HERO_IMAGES = [
  { src: '/images/landing/hero-1.jpg', alt: 'Kigali nightlife — crowd and lights', position: 'top' },
  { src: '/images/landing/hero-2.jpg', alt: 'DJ setup and club lights', position: 'center' },
  { src: '/images/landing/hero-3.jpg', alt: 'Dance floor and atmosphere', position: 'bottom' },
]

export function HeroSection() {
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
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05] tracking-tight">
            <span className="text-white">Turn Moments</span>
            <br />
            <span className="text-gradient">Into Music</span>
          </h1>
          <p className="text-base sm:text-xl md:text-2xl font-medium text-[#E5E7EB] max-w-xl leading-relaxed">
            Create instant song request experiences. Generate a QR code, share it at your event, and let the music flow.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link href="/register">
              <GlowButton size="lg" glowColor="teal" className="min-h-[48px] text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto">
                Create Your QR
                <Sparkles className="ml-2 w-4 h-4 sm:w-5 sm:h-5 inline" />
              </GlowButton>
            </Link>
            <Link href="/events">
              <GlowButton size="lg" variant="outline" glowColor="teal" className="min-h-[48px] text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto">
                Browse Events
              </GlowButton>
            </Link>
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
    </section>
  )
}
