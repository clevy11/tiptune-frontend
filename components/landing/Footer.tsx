'use client'

import Link from 'next/link'
import Image from 'next/image'
import { SiInstagram, SiTiktok, SiX } from 'react-icons/si'
import { Mail, MessageCircle, ExternalLink } from 'lucide-react'

const PRODUCT_LINKS = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Browse Events', href: '/events' },
]

const COMPANY_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Contact Us', href: '/contact' },
]

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/', icon: SiInstagram },
  { label: 'TikTok', href: 'https://www.tiktok.com/', icon: SiTiktok },
  { label: 'X', href: 'https://x.com/', icon: SiX },
]

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#0B0F14]/80">
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/images/landing/logo.png"
                alt="TipTune"
                width={32}
                height={32}
                className="h-8 w-8 rounded-xl shadow-[0_0_16px_rgba(123,47,247,0.5)]"
              />
              <span className="text-xl font-bold text-gradient">TipTune</span>
            </Link>
            <p className="text-sm text-[#D1D5DB] leading-relaxed">
              Real-time song requests for live events. The simplest way for DJs and Artists to manage crowd requests and for attendees to vote on the next track.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-green-500/15 border border-green-500/40 px-3 py-1 text-xs font-medium text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                Service is Live
              </span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Product</h3>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[#D1D5DB] hover:text-[#00F5C3] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Company</h3>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[#D1D5DB] hover:text-[#00F5C3] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Legal &amp; Support</h3>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[#D1D5DB] hover:text-[#00F5C3] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 text-sm text-[#D1D5DB]">
              <a href="mailto:titunerw@gmail.com" className="flex items-center gap-2 hover:text-[#00F5C3] transition-colors">
                <Mail className="w-4 h-4 text-[#00F5C3]" aria-hidden />
                titunerw@gmail.com
              </a>
              <a href="https://wa.me/250792548195" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#00F5C3] transition-colors">
                <MessageCircle className="w-4 h-4 text-[#00F5C3]" aria-hidden />
                WhatsApp: 0792548195
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} TipTune. All rights reserved.
            <span className="mx-2 text-gray-600">|</span>
            <span className="font-medium text-[#00F5C3]">100% Free</span> – No credit card required.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-xs text-gray-400">
              <ExternalLink className="w-3.5 h-3.5" aria-hidden />
              Built for DJs and Artists in Kigali &amp; beyond
            </span>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="rounded-lg p-2 text-gray-400 hover:text-[#00F5C3] hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
