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
import { Music, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { getApiErrorMessage } from '@/lib/apiClient'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      setSuccess(true)
      setError('')
    },
    onError: (err: any) => {
      console.error('Forgot password error:', err)
      const msg = getApiErrorMessage(err)
      setError(msg)
      setSuccess(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    forgotPasswordMutation.mutate(email.trim())
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
            <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">Forgot Password</h2>
            <p className="text-gray-400">Enter your email to receive a reset link</p>
          </motion.div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <h3 className="text-xl font-bold text-green-400 mb-2">Email Sent!</h3>
              <p className="text-gray-300 mb-4">
                If an account exists with this email, you will receive a password reset link shortly.
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Please check your inbox and click the link to reset your password.
              </p>
              <div className="flex flex-col gap-3">
                <GlowButton
                  onClick={() => router.push('/login')}
                  glowColor="purple"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </GlowButton>
              </div>
            </motion.div>
          ) : (
            <>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                >
                  <p className="text-sm text-red-200">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 w-full"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <GlowButton
                  type="submit"
                  glowColor="purple"
                  className="w-full min-h-[48px]"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Reset Link'}
                </GlowButton>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-400 hover:text-purple-400 transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </GlassCard>
      </motion.div>
    </div>
  )
}
