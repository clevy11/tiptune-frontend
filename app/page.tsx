'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { GlowButton } from '@/components/GlowButton'
import { Mail, MessageCircle, Music } from 'lucide-react'
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
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/landing/logo.png"
                alt="TipTune"
                width={32}
                height={32}
                className="h-8 w-8 rounded-xl shadow-[0_0_16px_rgba(123,47,247,0.5)]"
                priority
              />
              <span className="text-xl sm:text-2xl font-bold text-gradient">TipTune</span>
            </Link>
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

        {/* Contact / Footer */}
        <section className="container mx-auto px-4 sm:px-6 pb-10 sm:pb-14">
          <div className="rounded-2xl p-6 sm:p-8 bg-[#0B0F14]/70 border border-white/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">Need help?</h3>
                <p className="text-sm sm:text-base text-[#D1D5DB] mt-1">
                  Contact us anytime — fast support and trusted communication.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://wa.me/250792548195"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 hover:border-[#00F5C3]/30 px-4 py-3 min-h-[48px] text-white transition-colors"
                  aria-label="Contact us on WhatsApp"
                >
                  <MessageCircle className="w-5 h-5 text-[#00F5C3]" aria-hidden />
                  WhatsApp: 0792548195
                </a>
                <a
                  href="mailto:titunerw@gmail.com"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 hover:border-[#00F5C3]/30 px-4 py-3 min-h-[48px] text-white transition-colors"
                  aria-label="Email us"
                >
                  <Mail className="w-5 h-5 text-[#00F5C3]" aria-hidden />
                  Email
                </a>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-gray-400">
              <span>© {new Date().getFullYear()} TipTune</span>
              <div className="flex items-center gap-3">
                <Link href="/privacy" className="hover:text-cyan-300 transition-colors">
                  Privacy
                </Link>
                <span className="text-gray-600">|</span>
                <Link href="/terms" className="hover:text-cyan-300 transition-colors">
                  Terms
                </Link>
                <span className="text-gray-600">|</span>
                <Link href="/contact" className="hover:text-cyan-300 transition-colors">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
