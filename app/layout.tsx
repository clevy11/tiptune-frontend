import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

/** ISR: revalidate server-rendered content every 60s (e.g. metadata, server components) */
export const revalidate = 60

export const metadata: Metadata = {
  title: 'TipTune - Turn Moments Into Music',
  description: 'Create instant song request experiences. Generate a QR code, share it at your event, and let the music flow.',
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
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
