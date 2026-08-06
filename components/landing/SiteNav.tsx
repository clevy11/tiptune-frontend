'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { GlowButton } from '@/components/GlowButton'
import { Menu, X, ChevronRight } from 'lucide-react'

const NAV_LINKS = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
]

export function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="container relative mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center">
      {/* Left — logo + badges */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 sm:gap-3"
      >
        <Link href="/" className="group flex items-center gap-2">
          <div className="relative">
            <Image
              src="/images/landing/logo.png"
              alt="TipTune"
              width={32}
              height={32}
              className="h-8 w-8 rounded-xl shadow-[0_0_16px_rgba(123,47,247,0.5)] transition-transform duration-300 group-hover:scale-110"
              priority
            />
            <div
              className="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-br from-[#00F5C3]/40 to-purple-500/40 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden
            />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-gradient">TipTune</span>
        </Link>

        
      </motion.div>

      {/* Center — desktop links */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="hidden md:flex items-center gap-7"
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group relative text-sm font-medium text-[#D1D5DB] transition-colors duration-300 hover:text-white"
          >
            {link.label}
            <span
              className="absolute -bottom-1 left-0 h-0.5 w-0 rounded-full bg-gradient-to-r from-[#00F5C3] to-purple-400 transition-all duration-300 group-hover:w-full"
              aria-hidden
            />
          </Link>
        ))}
      </motion.div>

      {/* Right — CTAs */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 sm:gap-3"
      >
        <div className="hidden sm:block">
          <Link href="/login">
            <GlowButton variant="ghost" glowColor="teal" className="min-h-[44px] px-3 sm:px-4 text-sm sm:text-base">
              Sign In
            </GlowButton>
          </Link>
        </div>
        <div className="hidden sm:block">
          <Link href="/register">
            <GlowButton glowColor="teal" className="min-h-[44px] px-3 sm:px-4 text-sm sm:text-base">
              Get Started
            </GlowButton>
          </Link>
        </div>
        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2.5 text-white hover:bg-white/10 transition-colors"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </motion.div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden absolute inset-x-0 top-full mt-2 z-50 rounded-2xl border border-white/10 bg-[#0B0F14]/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2">
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-base text-[#D1D5DB] hover:bg-white/5 hover:text-white transition-colors"
                  >
                    {link.label}
                    <ChevronRight className="w-4 h-4 text-[#00F5C3]" aria-hidden />
                  </Link>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <GlowButton variant="ghost" glowColor="teal" className="w-full min-h-[44px]">
                    Sign In
                  </GlowButton>
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <GlowButton glowColor="teal" className="w-full min-h-[44px]">
                    Get Started
                  </GlowButton>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
