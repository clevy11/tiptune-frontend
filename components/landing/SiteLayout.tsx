import { SiteBackground } from '@/components/landing/SiteBackground'
import { SiteNav } from '@/components/landing/SiteNav'
import { Footer } from '@/components/landing/Footer'

/** Shared landing-page shell: background image + nav + footer. */
export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      <SiteBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteNav />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  )
}
