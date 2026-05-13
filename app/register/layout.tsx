import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create an Account',
  description: 'Create a TipTune account to manage DJ events, song requests, and tips.',
  alternates: {
    canonical: '/register',
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
