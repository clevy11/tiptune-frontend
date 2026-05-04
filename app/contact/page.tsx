import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact TipTune support by WhatsApp or email.',
  alternates: {
    canonical: '/contact',
  },
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#07090f] text-slate-200">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-3">Contact TipTune</h1>
        <p className="text-slate-400 mb-8">We usually reply quickly during business hours.</p>

        <div className="space-y-4">
          <a
            href="https://wa.me/250792548195"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:border-cyan-300/40"
          >
            <MessageCircle className="h-5 w-5 text-cyan-300" aria-hidden />
            <span>WhatsApp: +250 792 548 195</span>
          </a>
          <a
            href="mailto:titunerw@gmail.com"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:border-cyan-300/40"
          >
            <Mail className="h-5 w-5 text-cyan-300" aria-hidden />
            <span>Email: titunerw@gmail.com</span>
          </a>
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
