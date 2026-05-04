import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how TipTune collects, uses, and protects your personal data.',
  alternates: {
    canonical: '/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#07090f] text-slate-200">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-3">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: May 4, 2026</p>

        <div className="space-y-6 text-sm leading-7">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Information we collect</h2>
            <p>
              TipTune collects information you provide directly, such as your name, email address,
              account role, and event details. For public tipping and requests, we may collect payer
              names, phone numbers, and payment-related status data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">How we use information</h2>
            <p>
              We use your data to operate the platform, process song requests and tips, secure
              accounts, provide customer support, and improve performance and reliability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Payments and third-party services</h2>
            <p>
              Mobile money payments are handled through integrated providers. We store only the
              details required to track request and payment status and do not store full mobile money
              credentials.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Data retention</h2>
            <p>
              We keep data only as long as needed for service delivery, legal obligations, fraud
              prevention, and business records.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Your rights</h2>
            <p>
              You can request access, correction, or deletion of your personal data by contacting our
              support team.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Contact</h2>
            <p>
              For privacy-related questions, contact us at{' '}
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
