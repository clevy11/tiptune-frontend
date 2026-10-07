'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

/** Full-width Kigali nightlife imagery. Add images to public/images/landing/gallery/ */
const GALLERY_IMAGES = [
  { src: '/images/landing/gallery/1.jpg', alt: 'Kigali nightlife — the dancefloor coming alive' },
  { src: '/images/landing/gallery/2.jpg', alt: 'From the DJ booth — reading the room' },
  { src: '/images/landing/gallery/3.jpg', alt: 'The main floor — where the night belongs' },
]

export function NightlifeGallery() {
  return (
    <section className="w-full py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto px-6 mb-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2"
        >
          From the Booth to the Dancefloor
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg text-[#D1D5DB] max-w-2xl"
        >
          The simplest way for DJs to read the room and for the crowd to shape the set — live in Kigali and beyond.
        </motion.p>
      </div>
      <div className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 px-6 scrollbar-hide">
        {GALLERY_IMAGES.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative flex-shrink-0 w-[85vw] md:w-[70vw] lg:w-[50vw] snap-center"
          >
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 bg-[#121826]">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 768px) 85vw, 70vw"
                className="object-cover"
                loading="lazy"
                onError={(e) => {
                  const t = e.target as HTMLImageElement
                  t.style.display = 'none'
                  t.parentElement?.querySelector<HTMLElement>('.img-fallback')?.classList.remove('hidden')
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14]/80 via-transparent to-transparent" />
              <div className="img-fallback absolute inset-0 bg-[#121826] hidden" aria-hidden />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
