'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { GlassCard } from '@/components/GlassCard'
import { GlowButton } from '@/components/GlowButton'
import { Input } from '@/components/ui/input'
import { Music, UserPlus } from 'lucide-react'
import type { RegisterRequest } from '@/lib/types'
import { Role } from '@/lib/types'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<RegisterRequest>({
    name: '',
    email: '',
    password: '',
    role: Role.USER,
  })
  const [error, setError] = useState<string>('')

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      router.push('/dashboard')
    },
    onError: (err: any) => {
      console.error('Registration error:', err)
      
      // Handle structured error response from backend
      if (err.response?.data) {
        const errorData = err.response.data
        if (errorData.message) {
          setError(errorData.message)
        } else if (typeof errorData === 'string') {
          setError(errorData)
        } else {
          setError('Registration failed. Please check your input.')
        }
      } else if (err.message) {
        setError(err.message)
      } else if (err.code === 'ERR_NETWORK') {
        setError('Network error. Please check if the backend server is running.')
      } else {
        setError('Registration failed. Please try again.')
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    registerMutation.mutate(formData)
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <AnimatedBackground />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard glow="blue" className="p-6 sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 sm:mb-8"
          >
            <Music className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-blue-400" aria-hidden />
            <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">Join TipTune</h2>
            <p className="text-gray-400">Create your account</p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Input
                type="text"
                placeholder="Full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Input
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="w-full"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="w-full"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background/50 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-300 hover:border-primary/50"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as Role })
                }
              >
                <option value={Role.USER}>User</option>
                <option value={Role.DJ}>DJ</option>
                <option value={Role.ARTIST}>Artist</option>
              </select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GlowButton
                type="submit"
                disabled={registerMutation.isPending}
                glowColor="pink"
                className="w-full min-h-[48px] touch-manipulation"
              >
                {registerMutation.isPending ? (
                  'Creating account...'
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register
                  </>
                )}
              </GlowButton>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-6"
          >
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </motion.div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
