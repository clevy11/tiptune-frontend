import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

/** ISR: revalidate server-rendered content every 60s (e.g. metadata, server components) */
export const revalidate = 60

export const metadata: Metadata = {
  metadataBase: new URL('https://tiptune.space'),
  title: {
    default: 'TipTune - Turn Moments Into Music',
    template: '%s | TipTune',
  },
  description: 'Create instant song request experiences. Generate a QR code, share it at your event, and let the music flow.',
  applicationName: 'TipTune',
  keywords: [
    'TipTune',
    'DJ tipping',
    'song requests',
    'event QR code',
    'Rwanda nightlife',
    'Kigali DJs',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: 'https://tiptune.space',
    title: 'TipTune - Turn Moments Into Music',
    description: 'Create instant song request experiences. Generate a QR code, share it at your event, and let the music flow.',
    siteName: 'TipTune',
    images: [
      {
        url: '/images/landing/logo.png',
        width: 512,
        height: 512,
        alt: 'TipTune logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TipTune - Turn Moments Into Music',
    description: 'Create instant song request experiences. Generate a QR code, share it at your event, and let the music flow.',
    images: ['/images/landing/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TipTune',
    url: 'https://tiptune.space',
    logo: 'https://tiptune.space/images/landing/logo.png',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'titunerw@gmail.com',
        telephone: '+250792548195',
      },
    ],
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TipTune',
    url: 'https://tiptune.space',
    potentialAction: {
      '@type': 'ViewAction',
      target: 'https://tiptune.space/events',
    },
  }

  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
