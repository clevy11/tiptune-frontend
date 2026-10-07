import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarPlus, Share2, Radio, QrCode, ThumbsUp, Music, Banknote } from 'lucide-react'
import { SiteLayout } from '@/components/landing/SiteLayout'

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Learn how to host an event or join one with TipTune in minutes.',
  alternates: {
    canonical: '/how-it-works',
  },
}

// Venue-stage metaphors: DJs and attendees experience the night in different zones
const DJ_STEPS = [
  {
    icon: CalendarPlus,
    title: 'Create your event',
    desc: 'Set your event name, date, location, and MoMo code. TipTune generates your unique QR code instantly. Like booking the main floor.',
    accent: 'teal' as const,
  },
  {
    icon: Share2,
    title: 'Share the link',
    desc: 'Print your QR, post on socials, or display on a screen at the venue. Like hanging the flyer at the club door.',
    accent: 'purple' as const,
  },
  {
    icon: Radio,
    title: 'Manage requests live',
    desc: 'Watch the queue fill. Accept, play, or decline requests in real-time. Like reading the room from the DJ booth.',
    accent: 'pink' as const,
  },
  {
    icon: Banknote,
    title: 'Track tips',
    desc: 'See who tipped what, when. Export CSV/PDF reports after the set. Like counting the till at close.',
    accent: 'green' as const,
  },
]

const ATTENDEE_STEPS = [
  {
    icon: QrCode,
    title: 'Open the event',
    desc: 'Scan the QR at the venue or enter the code on the landing page. Like finding the door list.',
  },
  {
    icon: ThumbsUp,
    title: 'Request & vote',
    desc: 'Search for a song, add a message, and send it to the queue. Upvote the tracks you want to hear next. Like adding to the setlist.',
  },
  {
    icon: Music,
    title: 'Feel the vibe',
    desc: 'The DJ sees every request instantly and plays the tracks the crowd is asking for. Like the crowd responding to the beat.',
  },
]

// Accent color mappings for consistent theming
const accentStyles: Record<string, { bg: string; border: string; numberBg: string; numberText: string }> = {
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-400/20 hover:border-teal-400/40', numberBg: 'bg-teal-500/20', numberText: 'text-teal-300' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-400/20 hover:border-purple-400/40', numberBg: 'bg-purple-500/20', numberText: 'text-purple-300' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-400/20 hover:border-pink-400/40', numberBg: 'bg-pink-500/20', numberText: 'text-pink-300' },
  green: { bg: 'bg-green-500/10', border: 'border-green-400/20 hover:border-green-400/40', numberBg: 'bg-green-500/20', numberText: 'text-green-300' },
}

export default function HowItWorksPage() {
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3">How It Works</h1>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
              TipTune turns any venue into a live request experience — whether you&apos;re running the booth or on the dancefloor.
            </p>
          </div>

          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-8 text-center">For DJs, Artists &amp; Organizers</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {DJ_STEPS.map(({ icon: Icon, title, desc, accent }, i) => {
                const styles = accentStyles[accent]
                return (
                  <div
                    key={title}
                    className={`rounded-2xl border p-6 relative overflow-hidden ${styles.bg} ${styles.border} transition-all`}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 opacity-5 rounded-full" style={{ backgroundColor: accent === 'teal' ? 'rgba(0,245,195,0.2)' : accent === 'purple' ? 'rgba(124,58,237,0.2)' : accent === 'pink' ? 'rgba(236,72,153,0.2)' : 'rgba(34,197,94,0.2)' }} aria-hidden />
                    <div className="relative z-10">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.numberBg} ${styles.numberText} text-xl font-bold mb-4`}>
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="w-10 h-10 rounded-xl border border-white/10 mb-4">
                        <Icon className="w-5 h-5 mx-auto" aria-hidden />
                      </div>
                      <h3 className="font-semibold text-white mb-2">{title}</h3>
                      <p className="text-sm text-gray-300 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-8 text-center">For Attendees</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {ATTENDEE_STEPS.map(({ icon: Icon, title, desc }, i) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-teal-400/30 transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 text-xl font-bold mb-4">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="w-10 h-10 rounded-xl border border-white/10 mb-4">
                    <Icon className="w-5 h-5 mx-auto text-teal-400" aria-hidden />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-black hover:bg-teal-500/90 transition-colors min-h-[48px]"
            >
              Drop Your First Beat
              <CalendarPlus className="w-4 h-4" aria-hidden />
            </Link>
            <Link href="/" className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-sm font-medium text-teal-400 hover:text-white transition-colors rounded-xl border border-teal-400/30">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
