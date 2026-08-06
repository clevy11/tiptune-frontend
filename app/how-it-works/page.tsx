import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarPlus, Share2, Radio, QrCode, ThumbsUp, Music } from 'lucide-react'
import { SiteLayout } from '@/components/landing/SiteLayout'

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Learn how to host an event or join one with TipTune in minutes.',
  alternates: {
    canonical: '/how-it-works',
  },
}

const DJ_STEPS = [
  {
    icon: CalendarPlus,
    title: 'Create your event',
    text: 'Sign up free, then set your event name, date, and location. TipTune generates a unique link and QR code instantly.',
  },
  {
    icon: Share2,
    title: 'Share the link',
    text: 'Post it on social media, show the QR code on a screen, or print it at the door. Attendees open it on their phones.',
  },
  {
    icon: Radio,
    title: 'Manage requests live',
    text: 'Watch requests pour into your live dashboard. Play the hits, reply to messages, and track tips in real time.',
  },
]

const ATTENDEE_STEPS = [
  {
    icon: QrCode,
    title: 'Open the event',
    text: 'Scan the QR code at the venue or enter the event code on the landing page.',
  },
  {
    icon: ThumbsUp,
    title: 'Request & vote',
    text: 'Search for a song, add a message, and send it to the queue. Upvote the tracks you want to hear next.',
  },
  {
    icon: Music,
    title: 'Feel the vibe',
    text: 'The DJ sees every request instantly and plays the tracks the crowd is asking for.',
  },
]

export default function HowItWorksPage() {
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 text-center">How It Works</h1>
          <p className="text-sm sm:text-base text-[#D1D5DB] mb-10 text-center">
            TipTune is live in three simple steps — whether you&apos;re hosting the event or attending it.
          </p>

          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6 text-center">For DJs &amp; Artist & Organizers</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {DJ_STEPS.map(({ icon: Icon, title, text }, i) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-[#00F5C3]/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00F5C3]/15 text-[#00F5C3] text-sm font-bold">
                      {i + 1}
                    </span>
                    <Icon className="h-5 w-5 text-[#00F5C3]" aria-hidden />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{title}</h3>
                  <p className="text-xs leading-5 text-[#D1D5DB]">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6 text-center">For Attendees</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {ATTENDEE_STEPS.map(({ icon: Icon, title, text }, i) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-[#00F5C3]/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00F5C3]/15 text-[#00F5C3] text-sm font-bold">
                      {i + 1}
                    </span>
                    <Icon className="h-5 w-5 text-[#00F5C3]" aria-hidden />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{title}</h3>
                  <p className="text-xs leading-5 text-[#D1D5DB]">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="text-[#00F5C3] hover:text-white transition-colors">
              Start your event →
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
