import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, AlertCircle, Zap, Mail, Lock } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setServerError('')
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    setLoading(false)

    if (error) { setServerError(error.message); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', authData.user.id)
      .single()

    navigate(`/${profile?.role ?? 'worker'}/dashboard`, { replace: true })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: 'radial-gradient(ellipse 100% 60% at 50% 0%, #e5eeff 0%, #f8f9ff 55%)',
      }}
    >
      <div className="w-full max-w-md animate-fade-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-elevated"
              style={{ background: 'linear-gradient(135deg, #00236f, #002f8a)' }}>
              <Zap size={18} fill="#ef9900" color="#ef9900" />
            </div>
            <span className="text-2xl font-bold" style={{ color: '#00236f' }}>GigGle</span>
          </Link>
          <h1 className="text-2xl font-bold mt-1" style={{ color: '#0b1c30' }}>Welcome back</h1>
          <p className="text-sm mt-1.5" style={{ color: '#444651' }}>Sign in to your account to continue</p>
        </div>

        <div
          className="bg-white rounded-2xl p-8"
          style={{
            boxShadow: '0 4px 24px rgba(0,35,111,0.08), 0 1px 3px rgba(0,0,0,0.04)',
            border: '1px solid rgba(197,197,211,0.6)',
          }}
        >
          {serverError && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 text-sm"
              style={{ background: '#ffdad6', color: '#ba1a1a' }}>
              <AlertCircle size={15} />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#9ca3af' }} />
                <input
                  type="email"
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#ba1a1a' }}>
                  <AlertCircle size={11} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link to="/auth/forgot-password"
                  className="text-xs font-medium hover:underline"
                  style={{ color: '#00236f' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#9ca3af' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-10 pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-surface-low transition-colors"
                  style={{ color: '#444651' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#ba1a1a' }}>
                  <AlertCircle size={11} /> {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: '#e4e4ef' }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white" style={{ color: '#757682' }}>New to GigGle?</span>
            </div>
          </div>

          <Link to="/register" className="btn-secondary w-full text-sm">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  )
}
