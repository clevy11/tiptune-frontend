import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the terms for using the TipTune platform.',
  alternates: {
    canonical: '/terms',
  },
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#07090f] text-slate-200">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-3">Terms of Service</h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: May 4, 2026</p>

        <div className="space-y-6 text-sm leading-7">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Acceptance of terms</h2>
            <p>
              By using TipTune, you agree to these terms. If you do not agree, you should not use
              the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Account responsibilities</h2>
            <p>
              You are responsible for keeping your login credentials secure and for all activities
              that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Payments and fees</h2>
            <p>
              Tips and payment requests are processed through supported providers. Platform service
              fees, if applicable, are communicated in the product or separate commercial agreements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Acceptable use</h2>
            <p>
              You agree not to misuse the platform, attempt unauthorized access, or use TipTune for
              fraudulent or illegal activity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Service availability</h2>
            <p>
              We may update, suspend, or discontinue parts of the service to maintain quality,
              security, or legal compliance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Contact</h2>
            <p>
              For questions about these terms, contact{' '}
              <a className="text-cyan-300 hover:text-cyan-200" href="mailto:titunerw@gmail.com">
                titunerw@gmail.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-10">
          <Link href="/" className="text-cyan-300 hover:text-cyan-200">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
