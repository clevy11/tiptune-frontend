'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamic imports to avoid SSR issues
const Canvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  { 
    ssr: false,
    loading: () => <div className="w-full h-[500px] flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>
  }
)

const VinylDisc = dynamic(
  () => import('./VinylDisc').then((mod) => ({ default: mod.VinylDisc })),
  { ssr: false }
)

const OrbitControls = dynamic(
  () => import('@react-three/drei').then((mod) => mod.OrbitControls),
  { ssr: false }
)

export function FloatingVinyl() {
  if (typeof window === 'undefined') {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-[500px] relative">
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      }>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          className="bg-transparent"
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />
          <VinylDisc />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}
