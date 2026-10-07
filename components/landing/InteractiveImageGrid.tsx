'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

/** Kigali nightlife images — place in public/images/landing/ */
const GRID_IMAGES = [
  { src: '/images/landing/grid-1.jpg', alt: 'Kigali dancefloor — the crowd responding to the beat' },
  { src: '/images/landing/grid-2.jpg', alt: 'Reading the room from the DJ booth' },
  { src: '/images/landing/grid-3.jpg', alt: 'The main floor — where the night comes alive' },
]

export function InteractiveImageGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
      {GRID_IMAGES.map((img, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          whileHover={{ y: -4 }}
          className="relative rounded-2xl overflow-hidden border border-white/10 hover:border-[#00F5C3]/25 hover:shadow-[0_0_20px_rgba(0,245,195,0.12)] transition-all duration-300"
        >
          <div className="relative aspect-[4/5] bg-[#121826]">
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
              loading="lazy"
              onError={(e) => {
                const t = e.target as HTMLImageElement
                t.style.display = 'none'
                t.parentElement?.querySelector<HTMLElement>('.img-fallback')?.classList.remove('hidden')
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14]/70 to-transparent" />
            <div className="img-fallback absolute inset-0 bg-[#121826] hidden" aria-hidden />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
