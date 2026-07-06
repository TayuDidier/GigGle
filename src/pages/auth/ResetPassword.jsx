import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, AlertCircle, CheckCircle, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export default function ResetPassword() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ password }) => {
    setLoading(true)
    setServerError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setServerError(error.message)
      return
    }
    setSuccess(true)
    setTimeout(() => navigate('/login'), 2500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#f8f9ff' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-elevated"
              style={{ background: 'linear-gradient(135deg, #00236f, #002f8a)' }}>
              <Zap size={18} fill="#ef9900" color="#ef9900" />
            </div>
            <span className="text-3xl font-bold" style={{ color: '#00236f' }}>GigGle</span>
          </Link>
          <h1 className="text-2xl font-semibold mt-4" style={{ color: '#0b1c30' }}>Set new password</h1>
          <p className="text-sm mt-1" style={{ color: '#444651' }}>Choose a strong new password for your account</p>
        </div>

        <div className="bg-white border border-outline-variant rounded-xl shadow-card p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: '#97f5cc' }}>
                <CheckCircle size={28} color="#006c4e" />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: '#0b1c30' }}>Password updated!</h3>
              <p className="text-sm" style={{ color: '#444651' }}>Redirecting you to login...</p>
            </div>
          ) : (
            <>
              {serverError && (
                <div className="flex items-center gap-2 p-3 rounded-lg mb-5 text-sm"
                  style={{ background: '#ffdad6', color: '#ba1a1a' }}>
                  <AlertCircle size={15} />
                  <span>{serverError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="label">New password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field pr-12"
                      placeholder="Min. 8 characters"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                      style={{ color: '#444651' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Confirm new password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className="input-field pr-12"
                      placeholder="Repeat your password"
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                      style={{ color: '#444651' }}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </span>
                  ) : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
