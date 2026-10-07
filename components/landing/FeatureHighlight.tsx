'use client'

import { motion } from 'framer-motion'
import { CalendarPlus, Share2, Radio, Banknote } from 'lucide-react'

type Accent = 'teal' | 'purple' | 'pink' | 'green'

// Music-metaphor feature cards with domain-specific styling
const FEATURES: Array<{
  icon: React.ElementType
  title: string
  desc: string
  accent: Accent
}> = [
  {
    icon: CalendarPlus,
    title: 'Book the Floor',
    desc: 'Set your event name, time, and MoMo code. TipTune generates your unique QR code instantly — like booking the main floor.',
    accent: 'teal',
  },
  {
    icon: Share2,
    title: 'Hang the Flyer',
    desc: 'Print your QR, post on socials, or display on screen. Guests request from their phones — like finding the door list.',
    accent: 'purple',
  },
  {
    icon: Radio,
    title: 'Read the Room',
    desc: 'Watch the queue fill in real-time. Accept, play, or decline requests as they come in — from the DJ booth.',
    accent: 'pink',
  },
  {
    icon: Banknote,
    title: 'Count the Till',
    desc: 'See who tipped what, in real-time. Export CSV/PDF reports after the set — like closing out at the end of the night.',
    accent: 'green',
  },
]

const accentStyles: Record<Accent, { icon: string; card: string; border: string }> = {
  teal: {
    icon: 'text-teal-400',
    card: 'bg-teal-500/10 border-teal-400/20',
    border: 'hover:border-teal-400/40',
  },
  purple: {
    icon: 'text-purple-400',
    card: 'bg-purple-500/10 border-purple-400/20',
    border: 'hover:border-purple-400/40',
  },
  pink: {
    icon: 'text-pink-400',
    card: 'bg-pink-500/10 border-pink-400/20',
    border: 'hover:border-pink-400/40',
  },
  green: {
    icon: 'text-green-400',
    card: 'bg-green-500/10 border-green-400/20',
    border: 'hover:border-green-400/40',
  },
}

export function FeatureHighlight() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-8"
    >
      {FEATURES.map((feature, i) => {
        const styles = accentStyles[feature.accent]
        return (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
            className={`rounded-2xl border bg-white/5 p-5 hover:bg-white/8 transition-all ${styles.card} ${styles.border}`}
          >
            <div className="mb-4">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${styles.card}`}>
                <feature.icon className={`w-5 h-5 ${styles.icon}`} aria-hidden />
              </div>
            </div>
            <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{feature.desc}</p>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
