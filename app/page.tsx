'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { GlowButton } from '@/components/GlowButton'
import { Music } from 'lucide-react'
import { HeroSection } from '@/components/landing/HeroSection'
import { NightlifeGallery } from '@/components/landing/NightlifeGallery'
import { FeatureHighlight } from '@/components/landing/FeatureHighlight'
import { InteractiveImageGrid } from '@/components/landing/InteractiveImageGrid'

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      {/* Full-page background: hero-3 image */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/landing/seyaa.jpg')" }}
        aria-hidden
      />
      {/* Dark overlay so text stays readable — semi-transparent so the picture shows through */}
      <div className="fixed inset-0 -z-10 bg-black/90" aria-hidden />
      <div className="relative z-10">
        {/* Navigation — mobile-first */}
        <nav className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <Music className="w-7 h-7 sm:w-8 sm:h-8 text-[#00F5C3]" aria-hidden />
            <span className="text-xl sm:text-2xl font-bold text-gradient">TipTune</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex gap-2 sm:gap-4"
          >
            <Link href="/login">
              <GlowButton variant="ghost" glowColor="teal" className="min-h-[44px] px-3 sm:px-4 text-sm sm:text-base">
                Sign In
              </GlowButton>
            </Link>
            <Link href="/register">
              <GlowButton glowColor="teal" className="min-h-[44px] px-3 sm:px-4 text-sm sm:text-base">
                Get Started
              </GlowButton>
            </Link>
          </motion.div>
        </nav>

        <HeroSection />

        {/* Feature highlights (below hero content, same section flow) */}
        <section className="container mx-auto px-4 sm:px-6">
          <FeatureHighlight />
        </section>

        {/* Nightlife gallery — full-width Kigali imagery */}
        <NightlifeGallery />

        {/* Interactive image grid */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          >
            The vibe
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-base sm:text-lg text-[#D1D5DB] mb-8 sm:mb-10 max-w-2xl"
          >
            Premium experiences, from club nights to outdoor events.
          </motion.p>
          <InteractiveImageGrid />
        </section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-4 sm:px-6 py-12 sm:py-20"
        >
          <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-14 text-center bg-[#121826]/80 border border-white/10 shadow-[0_0_30px_rgba(0,245,195,0.08)] hover:shadow-[0_0_25px_rgba(0,245,195,0.12)] hover:border-[#00F5C3]/20 transition-all duration-300">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 text-gradient">
              Ready to Amplify Your Events?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#D1D5DB] mb-6 sm:mb-8 max-w-xl mx-auto">
              Join DJs and artists creating unforgettable music experiences.
            </p>
            <Link href="/register">
              <GlowButton size="lg" glowColor="teal" className="min-h-[48px] text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-6 focus-visible:ring-2 focus-visible:ring-[#00F5C3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]">
                Start Free Today
              </GlowButton>
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
