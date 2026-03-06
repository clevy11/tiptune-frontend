'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { authApi } from '@/lib/api'
import { Mail, Eye, EyeOff, ArrowRight } from 'lucide-react'
import type { LoginRequest } from '@/lib/types'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      setIsRedirecting(true)
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
    <AuthSplitLayout
      right={
        <div className="w-full max-w-[360px] mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Image
              src="/images/landing/logo.png"
              alt="TipTune"
              width={32}
              height={32}
              className="h-8 w-8 rounded-xl shadow-[0_0_16px_rgba(123,47,247,0.5)]"
            />
            <span className="text-sm font-semibold tracking-[0.22em] uppercase text-slate-200">
              TipTune
            </span>
          </Link>

          <p className="text-[10px] tracking-[0.28em] uppercase text-purple-400 mb-2 flex items-center gap-2">
            <span className="inline-block h-px w-5 bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.6)]" />
            Sign in to continue
          </p>

          <h1 className="text-white leading-none font-[Rajdhani,system-ui] font-bold text-4xl tracking-wide uppercase">
            Welcome
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-cyan-300 bg-[length:200%_100%] bg-clip-text text-transparent animate-[auth-shimmer_4s_linear_infinite]">
              Back
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-2">Access your TipTune dashboard</p>

          <div className="h-px bg-gradient-to-r from-purple-500/30 to-transparent my-8" />

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] tracking-[0.22em] uppercase text-slate-500 mb-2">
                Email address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full h-12 rounded-xl bg-white/[0.03] border border-purple-500/20 px-4 pr-11 text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-cyan-300/50 focus:bg-cyan-300/[0.03] focus:shadow-[0_0_0_1px_rgba(34,211,238,0.15),0_10px_30px_rgba(34,211,238,0.06)]"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" aria-hidden />
              </div>
            </div>

            <div>
              <label className="block text-[10px] tracking-[0.22em] uppercase text-slate-500 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full h-12 rounded-xl bg-white/[0.03] border border-purple-500/20 px-4 pr-12 text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-cyan-300/50 focus:bg-cyan-300/[0.03] focus:shadow-[0_0_0_1px_rgba(34,211,238,0.15),0_10px_30px_rgba(34,211,238,0.06)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-1">
              <Link href="/forgot-password" className="text-xs text-slate-500 hover:text-cyan-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending || isRedirecting}
              className="w-full h-12 rounded-xl text-white font-[Rajdhani,system-ui] font-semibold tracking-[0.22em] uppercase bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 shadow-[0_10px_30px_rgba(123,47,247,0.35),0_0_0_1px_rgba(155,89,247,0.25)] transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="inline-flex items-center justify-center gap-3">
                {loginMutation.isPending || isRedirecting ? 'Signing in…' : 'Sign in'}
                <span className="h-6 w-6 rounded-full bg-white/15 inline-flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </span>
              </span>
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-purple-500/15" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-slate-600">or</span>
            <div className="h-px flex-1 bg-purple-500/15" />
          </div>

          <p className="text-center text-sm text-slate-500">
            New to TipTune?{' '}
            <Link href="/register" className="text-cyan-300 hover:text-cyan-200 transition-colors underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      }
    />
  )
}
