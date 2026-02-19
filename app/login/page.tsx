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
import { Music, LogIn } from 'lucide-react'
import type { LoginRequest } from '@/lib/types'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string>('')

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      router.push('/dashboard')
    },
    onError: (err: any) => {
      console.error('Login error:', err)
      
      // Handle structured error response from backend
      if (err.response?.data) {
        const errorData = err.response.data
        if (errorData.message) {
          setError(errorData.message)
        } else if (typeof errorData === 'string') {
          setError(errorData)
        } else {
          setError('Invalid email or password')
        }
      } else if (err.message) {
        setError(err.message)
      } else if (err.code === 'ERR_NETWORK') {
        setError('Network error. Please check if the backend server is running.')
      } else {
        setError('Invalid email or password')
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    loginMutation.mutate(formData)
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
        <GlassCard glow="purple" className="p-6 sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 sm:mb-8"
          >
            <Music className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-purple-400" aria-hidden />
            <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">Welcome Back</h2>
            <p className="text-gray-400">Sign in to TipTune</p>
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
              transition={{ delay: 0.2 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlowButton
                type="submit"
                disabled={loginMutation.isPending}
                glowColor="pink"
                className="w-full min-h-[48px] touch-manipulation"
              >
                {loginMutation.isPending ? (
                  'Signing in...'
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign in
                  </>
                )}
              </GlowButton>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-6 space-y-2"
          >
            <div>
              <Link
                href="/forgot-password"
                className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
            <div>
              <Link
                href="/register"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Don&apos;t have an account? Register
              </Link>
            </div>
          </motion.div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
