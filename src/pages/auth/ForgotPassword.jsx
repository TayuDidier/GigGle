import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export default function ForgotPassword() {
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email }) => {
    setLoading(true)
    setServerError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/reset-password',
    })
    setLoading(false)
    if (error) {
      setServerError(error.message)
      return
    }
    setSuccess(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#f8f9ff' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1">
            <span className="text-3xl font-bold" style={{ color: '#00236f' }}>GigGle</span>
            <span className="text-2xl" style={{ color: '#ef9900' }}>✦</span>
          </Link>
          <h1 className="text-2xl font-semibold mt-4" style={{ color: '#0b1c30' }}>Reset your password</h1>
          <p className="text-sm mt-1" style={{ color: '#444651' }}>Enter your email and we'll send you a reset link</p>
        </div>

        <div className="bg-white border border-outline-variant rounded-xl shadow-card p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: '#97f5cc' }}>
                <CheckCircle size={28} color="#006c4e" />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: '#0b1c30' }}>Check your inbox</h3>
              <p className="text-sm mb-6" style={{ color: '#444651' }}>
                We sent a password reset link to your email address.
              </p>
              <Link to="/login" className="btn-primary w-full">Back to Login</Link>
            </div>
          ) : (
            <>
              {serverError && (
                <div className="flex items-center gap-2 p-3 rounded-lg mb-5 text-sm"
                  style={{ background: '#ffdad6', color: '#ba1a1a' }}>
                  <AlertCircle size={16} />
                  <span>{serverError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.email.message}</p>
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
                      Sending...
                    </span>
                  ) : 'Send Reset Link'}
                </button>
              </form>

              <Link to="/login"
                className="flex items-center justify-center gap-2 mt-5 text-sm font-medium hover:underline"
                style={{ color: '#00236f' }}>
                <ArrowLeft size={15} />
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
