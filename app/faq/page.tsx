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
    a: 'No. Attendees can open the event link on their phone and request or vote on songs without creating an account.',
  },
  {
    q: 'How do I create an event as a DJ?',
    a: 'Sign up for free, then use the dashboard to create your event. TipTune generates a unique link and QR code you can share with your audience.',
  },
  {
    q: 'How much does TipTune cost?',
    a: 'TipTune is currently completely free for all users. We are in early access and want to make it easy for DJs and event organizers to try the platform. No credit card is required, and there are no hidden fees.',
  },
  {
    q: 'Can attendees tip the DJ through TipTune?',
    a: 'Yes. Depending on the event, attendees can tip via mobile money. Tips are tracked in the DJ dashboard and paid out through the configured payment method.',
  },
  {
    q: 'Can I set a fee for song requests?',
    a: 'DJs can enable a request fee on their event. The fee is collected during the request flow and visible in the dashboard.',
  },
  {
    q: 'What happens if an event link stops working?',
    a: 'Events can be closed by the organizer or expire after their end time. Contact the host for a new link, or reach out to our support team for help.',
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
