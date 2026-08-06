import type { Metadata } from 'next'
import Link from 'next/link'
import { Music, Users, Heart } from 'lucide-react'
import { SiteLayout } from '@/components/landing/SiteLayout'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn how TipTune powers live events with real-time song requests.',
  alternates: {
    canonical: '/about',
  },
}

const VALUES = [
  {
    icon: Music,
    title: 'Built for the Crowd',
    text: 'Every feature starts with the listener — faster requests, fair queues, and music the room actually wants.',
  },
  {
    icon: Users,
    title: 'Built for DJs',
    text: 'We give performers simple tools to read the room, manage demand, and get paid for their craft.',
  },
  {
    icon: Heart,
    title: 'Built for Communities',
    text: 'From Kigali to the world, we help local scenes connect audiences with the artists behind the decks.',
  },
]

export default function AboutPage() {
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">About TipTune</h1>
          <p className="text-sm text-[#D1D5DB] mb-8">Real-time song requests for live events.</p>

          <section className="mb-8 space-y-4 text-sm sm:text-base leading-7 text-[#D1D5DB]">
            <p>
              TipTune started with a simple observation: in a packed venue, the DJ can hear every
              song request except the ones the crowd actually wants. We built a platform that closes
              that gap — letting attendees request and vote on tracks from their phones while giving
              DJs a live dashboard to manage the room.
            </p>
            <p>
              Today, TipTune powers club nights, rooftop parties, and outdoor events in Kigali and
              beyond. Our goal is simple: turn every moment of a live event into a shared musical
              experience.
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <Icon className="h-6 w-6 text-[#00F5C3] mb-3" aria-hidden />
                <h2 className="font-semibold text-white mb-1">{title}</h2>
                <p className="text-xs leading-5 text-[#D1D5DB]">{text}</p>
              </div>
            ))}
          </section>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link href="/register" className="text-[#00F5C3] hover:text-white transition-colors">
              Get started →
            </Link>
            <span className="hidden sm:inline text-gray-600">|</span>
            <Link href="/contact" className="text-[#00F5C3] hover:text-white transition-colors">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
