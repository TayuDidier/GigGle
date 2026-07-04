import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Briefcase, Users, Eye, EyeOff, AlertCircle, CheckCircle, Zap, Mail, Lock, User } from 'lucide-react'
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
    if (!role) { setServerError('Please select whether you want to work or hire.'); return }
    setLoading(true)
    setServerError('')
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.fullName, role } },
    })
    setLoading(false)
    if (error) { setServerError(error.message); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'radial-gradient(ellipse 100% 60% at 50% 0%, #97f5cc 0%, #f8f9ff 55%)' }}
      >
        <div
          className="max-w-md w-full bg-white rounded-2xl p-10 text-center animate-fade-up"
          style={{ boxShadow: '0 4px 24px rgba(0,108,78,0.12)', border: '1px solid rgba(151,245,204,0.6)' }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-elevated"
            style={{ background: 'linear-gradient(135deg, #97f5cc, #006c4e)' }}>
            <CheckCircle size={30} color="white" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#0b1c30' }}>Check your email</h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: '#444651' }}>
            We sent a confirmation link to your email. Click it to activate your account.
          </p>
          <Link to="/login" className="btn-primary w-full">Go to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(ellipse 100% 60% at 50% 0%, #e5eeff 0%, #f8f9ff 55%)' }}
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
          <h1 className="text-2xl font-bold mt-1" style={{ color: '#0b1c30' }}>Create your account</h1>
          <p className="text-sm mt-1.5" style={{ color: '#444651' }}>Join Cameroon's gig marketplace</p>
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

          {/* Role selector */}
          <div className="mb-6">
            <label className="label mb-2">I want to…</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'worker', icon: Briefcase, label: 'Find work', sub: 'Browse & apply to jobs' },
                { value: 'employer', icon: Users, label: 'Hire help', sub: 'Post jobs & hire workers' },
              ].map(({ value, icon: Icon, label, sub }) => {
                const active = role === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className="flex flex-col items-center gap-2 p-4 border-2 rounded-2xl transition-all duration-200 ease-in-out active:scale-[0.97] relative overflow-hidden"
                    style={{
                      borderColor: active ? '#00236f' : '#c5c5d3',
                      background: active ? '#eff4ff' : '#ffffff',
                    }}
                  >
                    {active && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: '#00236f' }}>
                        <CheckCircle size={10} color="white" />
                      </span>
                    )}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: active ? '#e5eeff' : '#f4f4f8' }}>
                      <Icon size={20} color={active ? '#00236f' : '#757682'} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold leading-tight" style={{ color: active ? '#00236f' : '#0b1c30' }}>
                        {label}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#888' }}>{sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#9ca3af' }} />
                <input type="text" className="input-field pl-10" placeholder="Jean-Baptiste Ngono"
                  {...register('fullName')} />
              </div>
              {errors.fullName && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#ba1a1a' }}>
                  <AlertCircle size={11} /> {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#9ca3af' }} />
                <input type="email" className="input-field pl-10" placeholder="you@example.com"
                  autoComplete="email" {...register('email')} />
              </div>
              {errors.email && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#ba1a1a' }}>
                  <AlertCircle size={11} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#9ca3af' }} />
                <input type={showPassword ? 'text' : 'password'} className="input-field pl-10 pr-12"
                  placeholder="Min. 6 characters" autoComplete="new-password" {...register('password')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-surface-low transition-colors"
                  style={{ color: '#444651' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#ba1a1a' }}>
                  <AlertCircle size={11} /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">Confirm password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#9ca3af' }} />
                <input type={showConfirm ? 'text' : 'password'} className="input-field pl-10 pr-12"
                  placeholder="Repeat your password" autoComplete="new-password" {...register('confirmPassword')} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-surface-low transition-colors"
                  style={{ color: '#444651' }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#ba1a1a' }}>
                  <AlertCircle size={11} /> {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#444651' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#00236f' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
