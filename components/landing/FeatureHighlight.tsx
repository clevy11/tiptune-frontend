'use client'

import { motion } from 'framer-motion'
import { Zap, Music, Sparkles } from 'lucide-react'

const FEATURES = [
  { icon: Zap, text: 'Instant Setup' },
  { icon: Music, text: 'Live Requests' },
  { icon: Sparkles, text: 'Real-time Updates' },
]

export function FeatureHighlight() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="grid grid-cols-3 gap-6 md:gap-8 pt-8"
    >
      {FEATURES.map((feature, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
          className="text-center"
        >
          <feature.icon className="w-10 h-10 md:w-12 md:h-12 text-[#00F5C3] mx-auto mb-3" aria-hidden />
          <p className="text-base md:text-lg font-medium text-[#D1D5DB]">{feature.text}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}
