import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteLayout } from '@/components/landing/SiteLayout'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about hosting events and joining events with TipTune.',
  alternates: {
    canonical: '/faq',
  },
}

const FAQS = [
  {
    q: 'Do I need an account to request a song at an event?',
    a: 'No. Just like finding the door list, attendees scan the QR or open the link and they\'re on the floor — no sign-up, no friction. Requesting and voting are instant.',
  },
  {
    q: 'How do I create an event as a DJ?',
    a: 'Book the main floor in two minutes. Sign up for free, set your event name, date, and MoMo code, and TipTune generates your unique QR code instantly — ready to print or share.',
  },
  {
    q: 'How much does TipTune cost?',
    a: '100% free during early access. No credit card, no hidden fees. Just like a guest list, you walk in and start spinning. We\'ll always tell you before introducing any paid plans.',
  },
  {
    q: 'Can attendees tip the DJ through TipTune?',
    a: 'Yes — directly through mobile money. Tips roll in while you\'re reading the room, and they\'re tracked in your dashboard. Like counting the till at close, but live.',
  },
  {
    q: 'Can I set a fee for song requests?',
    a: 'Yes. DJs can enable a request fee on any event. The fee is collected during the request flow, visible in real-time on your dashboard, and configurable per event.',
  },
  {
    q: 'What happens if an event link stops working?',
    a: 'Events close when you close them — or after the end time. If the link\'s dead, ask the host for a fresh one, or reach out to our support team. Average response: under 2 hours.',
  },
]

export default function FaqPage() {
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Frequently Asked Questions</h1>
          <p className="text-sm sm:text-base text-[#D1D5DB] mb-10">
            Quick answers about hosting and joining events on TipTune.
          </p>

          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 open:border-[#00F5C3]/30 transition-colors"
              >
                <summary className="cursor-pointer list-none font-medium text-white flex items-center justify-between gap-4">
                  {faq.q}
                  <span className="shrink-0 text-[#00F5C3] transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-[#D1D5DB]">{faq.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link href="/contact" className="text-[#00F5C3] hover:text-white transition-colors">
              Still have questions? Contact support
            </Link>
            <span className="hidden sm:inline text-gray-600">|</span>
            <Link href="/" className="text-[#00F5C3] hover:text-white transition-colors">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
