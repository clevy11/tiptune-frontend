'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'

export function VinylDisc() {
  const discRef = useRef<Mesh>(null)
  const innerRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (discRef.current) {
      discRef.current.rotation.y += 0.005
    }
    if (innerRef.current) {
      innerRef.current.rotation.y += 0.005
    }
  })

  return (
    <group>
      {/* Outer disc */}
      <mesh ref={discRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <cylinderGeometry args={[2, 2, 0.1, 64]} />
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.8}
          roughness={0.2}
          emissive="#000000"
        />
      </mesh>
      
      {/* Inner groove ring */}
      <mesh ref={innerRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <torusGeometry args={[1.5, 0.02, 16, 100]} />
        <meshStandardMaterial
          color="#2a2a2a"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Center label */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
        <meshStandardMaterial
          color="#a855f7"
          metalness={0.7}
          roughness={0.3}
          emissive="#a855f7"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <cylinderGeometry args={[2.1, 2.1, 0.02, 64]} />
        <meshStandardMaterial
          color="#a855f7"
          transparent
          opacity={0.2}
          emissive="#a855f7"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  )
}
