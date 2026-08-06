import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { SiteLayout } from '@/components/landing/SiteLayout'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'TipTune is completely free in early access — no credit card required.',
  alternates: {
    canonical: '/pricing',
  },
}

const INCLUDED = [
  'Unlimited events',
  'Live request queue',
  'Attendee voting',
  'Tips & payments dashboard',
  'Analytics & reports',
  'Priority support',
]

export default function PricingPage() {
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Simple, Transparent, and Free</h1>
          <p className="text-sm sm:text-base text-[#D1D5DB] mb-8">
            Everything is currently free while we&apos;re in early access.
          </p>

          <div className="rounded-2xl sm:rounded-3xl border border-[#00F5C3]/25 bg-[#121826]/70 p-8 sm:p-10 text-center shadow-[0_0_40px_rgba(0,245,195,0.1)]">
            <Sparkles className="mx-auto h-8 w-8 text-[#00F5C3] mb-3" aria-hidden />
            <p className="text-4xl sm:text-5xl font-bold text-white mb-3">100% Free</p>
            <p className="text-[#D1D5DB] max-w-md mx-auto mb-6">
              No hidden fees. No credit card required. Just create your event and start taking requests.
            </p>

            <ul className="mx-auto mb-8 grid max-w-md gap-2 text-left text-sm">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00F5C3]" aria-hidden />
                  <span className="text-[#D1D5DB]">{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="inline-block rounded-xl bg-[#00F5C3] px-8 py-3 text-sm font-semibold text-black hover:bg-[#00F5C3]/90 transition-colors shadow-[0_0_24px_rgba(0,245,195,0.3)]"
            >
              Start Your Free Event
            </Link>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            TipTune is in early access. We&apos;ll always tell you before introducing any paid plans, and the features you use today stay free for existing users.
          </p>

          <div className="mt-6">
            <Link href="/" className="text-[#00F5C3] hover:text-white transition-colors">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
