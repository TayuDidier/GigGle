import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Briefcase, Users, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export default function Register() {
  const navigate = useNavigate()
  const [role, setRole] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    if (!role) {
      setServerError('Please select whether you want to work or hire.')
      return
    }
    setLoading(true)
    setServerError('')

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName, role },
      },
    })

    setLoading(false)
    if (error) {
      setServerError(error.message)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f8f9ff' }}>
        <div className="max-w-md w-full bg-white border border-outline-variant rounded-xl shadow-card p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#97f5cc' }}>
            <CheckCircle size={32} color="#006c4e" />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#0b1c30' }}>Check your email</h2>
          <p className="text-sm mb-6" style={{ color: '#444651' }}>
            We sent a confirmation link to your email. Click it to activate your account.
          </p>
          <Link to="/login" className="btn-primary w-full">Go to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#f8f9ff' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1">
            <span className="text-3xl font-bold" style={{ color: '#00236f' }}>GigGle</span>
            <span className="text-2xl" style={{ color: '#ef9900' }}>✦</span>
          </Link>
          <h1 className="text-2xl font-semibold mt-4" style={{ color: '#0b1c30' }}>Create your account</h1>
          <p className="text-sm mt-1" style={{ color: '#444651' }}>Join Cameroon's gig marketplace</p>
        </div>

        <div className="bg-white border border-outline-variant rounded-xl shadow-card p-8">
          {serverError && (
            <div className="flex items-center gap-2 p-3 rounded-lg mb-5 text-sm"
              style={{ background: '#ffdad6', color: '#ba1a1a' }}>
              <AlertCircle size={16} />
              <span>{serverError}</span>
            </div>
          )}

          {/* Role selector */}
          <div className="mb-6">
            <label className="label mb-3">I want to...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('worker')}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all duration-150 ${
                  role === 'worker' ? 'border-primary' : 'border-outline-variant'
                }`}
                style={{
                  borderColor: role === 'worker' ? '#00236f' : '#c5c5d3',
                  background: role === 'worker' ? '#eff4ff' : '#ffffff',
                }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: role === 'worker' ? '#e5eeff' : '#f8f9ff' }}>
                  <Briefcase size={20} color="#00236f" />
                </div>
                <span className="text-sm font-semibold text-center leading-tight" style={{ color: '#0b1c30' }}>
                  I'm looking for work
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole('employer')}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all duration-150`}
                style={{
                  borderColor: role === 'employer' ? '#00236f' : '#c5c5d3',
                  background: role === 'employer' ? '#eff4ff' : '#ffffff',
                }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: role === 'employer' ? '#e5eeff' : '#f8f9ff' }}>
                  <Users size={20} color="#00236f" />
                </div>
                <span className="text-sm font-semibold text-center leading-tight" style={{ color: '#0b1c30' }}>
                  I need to hire someone
                </span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="label">Full name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Jean-Baptiste Ngono"
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: '#444651' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: '#444651' }}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#444651' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#00236f' }}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
