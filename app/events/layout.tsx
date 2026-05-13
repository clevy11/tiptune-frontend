import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Active Events',
  description: 'Browse active TipTune events and request songs using event QR links.',
  alternates: {
    canonical: '/events',
  },
}

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
