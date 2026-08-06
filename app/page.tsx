'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { GlowButton } from '@/components/GlowButton'
import { Mail, MessageCircle } from 'lucide-react'
import { HeroSection } from '@/components/landing/HeroSection'
import { NightlifeGallery } from '@/components/landing/NightlifeGallery'
import { FeatureHighlight } from '@/components/landing/FeatureHighlight'
import { InteractiveImageGrid } from '@/components/landing/InteractiveImageGrid'
import { DashboardPreview } from '@/components/landing/DashboardPreview'
import { LiveActivity } from '@/components/landing/LiveActivity'
import { Footer } from '@/components/landing/Footer'
import { SiteNav } from '@/components/landing/SiteNav'
import { SiteBackground } from '@/components/landing/SiteBackground'

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      <SiteBackground />
      <div className="relative z-10">
        {/* Navigation — mobile-first */}
        <SiteNav />

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
            For Every Event Type
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-base sm:text-lg text-[#D1D5DB] mb-8 sm:mb-10 max-w-2xl"
          >
            From intimate club nights and rooftop parties to corporate events and outdoor festivals.
          </motion.p>
          <InteractiveImageGrid />
        </section>

        {/* Teaser dashboard preview */}
        <DashboardPreview />

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
              Start Your Free Event in 2 Minutes
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#D1D5DB] mb-6 sm:mb-8 max-w-xl mx-auto">
              Create your event, share the unique link with your audience, and start taking requests instantly – <span className="text-[#00F5C3] font-semibold">completely free</span>.
            </p>
            <Link href="/register">
              <GlowButton size="lg" glowColor="teal" className="min-h-[48px] text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-6 focus-visible:ring-2 focus-visible:ring-[#00F5C3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]">
                Start Free Today
              </GlowButton>
            </Link>
          </div>
        </motion.section>

        {/* Live activity — social proof */}
        <div className="container mx-auto px-4 sm:px-6 pb-10 sm:pb-14">
          <LiveActivity />
        </div>

        {/* Contact / Get in Touch */}
        <section className="container mx-auto px-4 sm:px-6 pb-10 sm:pb-14">
          <div className="rounded-2xl p-6 sm:p-8 bg-[#0B0F14]/70 border border-white/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">Get in Touch</h3>
                <p className="text-sm sm:text-base text-[#D1D5DB] mt-1">
                  Questions about setup or interested in partnering? Reach out to our team.
                </p>
                <p className="text-xs text-[#00F5C3] mt-2">Average response time: under 2 hours</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/contact">
                  <GlowButton glowColor="teal" className="min-h-[48px] px-5 w-full sm:w-auto">
                    Contact Support
                  </GlowButton>
                </Link>
                <a
                  href="https://wa.me/250792548195"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 hover:border-[#00F5C3]/30 px-4 py-3 min-h-[48px] text-white transition-colors"
                  aria-label="Contact us on WhatsApp"
                >
                  <MessageCircle className="w-5 h-5 text-[#00F5C3]" aria-hidden />
                  WhatsApp
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
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}
