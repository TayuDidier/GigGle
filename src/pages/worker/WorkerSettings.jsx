import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Trash2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const pwSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

function ChangePasswordSection() {
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(pwSchema),
  })

  const onSubmit = async (data) => {
    setServerError('')
    setSuccess(false)
    const { error } = await supabase.auth.updateUser({ password: data.newPassword })
    if (error) { setServerError(error.message); return }
    setSuccess(true)
    reset()
  }

  return (
    <div className="card mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Lock size={18} style={{ color: '#00236f' }} />
        <h2 className="text-base font-semibold" style={{ color: '#0b1c30' }}>Change Password</h2>
      </div>

      {success && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg text-sm" style={{ background: '#dcfce7', color: '#166534' }}>
          <CheckCircle size={15} /> Password updated successfully.
        </div>
      )}
      {serverError && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg text-sm" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
          <AlertCircle size={15} /> {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">New password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              className="input-field pr-12"
              placeholder="Min. 6 characters"
              {...register('newPassword')}
            />
            <button type="button" onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: '#444651' }}>
              {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.newPassword && <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.newPassword.message}</p>}
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
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: '#444651' }}>
              {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
          {isSubmitting ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}

function DeleteAccountSection() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    const { error: upErr } = await supabase.from('profiles').update({ is_suspended: true }).eq('id', profile.id)
    if (upErr) { setError(upErr.message); setDeleting(false); return }
    await signOut()
    navigate('/')
  }

  return (
    <div className="card" style={{ border: '1px solid #fca5a5' }}>
      <div className="flex items-center gap-2 mb-3">
        <Trash2 size={18} style={{ color: '#ba1a1a' }} />
        <h2 className="text-base font-semibold" style={{ color: '#ba1a1a' }}>Deactivate Account</h2>
      </div>
      <p className="text-sm mb-4" style={{ color: '#444651' }}>
        Deactivating your account will hide your profile and remove you from job listings. This cannot be undone from the app.
      </p>
      {error && <p className="text-xs mb-3" style={{ color: '#ba1a1a' }}>{error}</p>}
      {!confirm ? (
        <button onClick={() => setConfirm(true)}
          className="text-sm font-semibold px-4 py-2.5 rounded-lg border-2"
          style={{ borderColor: '#ba1a1a', color: '#ba1a1a' }}>
          Deactivate Account
        </button>
      ) : (
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: '#ba1a1a' }}>
            Are you sure? This will deactivate your account immediately.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirm(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 font-semibold px-4 py-2.5 rounded-lg text-white disabled:opacity-60"
              style={{ background: '#ba1a1a' }}>
              {deleting ? 'Deactivating…' : 'Yes, Deactivate'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function WorkerSettings() {
  return (
    <div className="max-w-xl mx-auto px-4 py-6" style={{ background: '#f8f9ff', minHeight: '100%' }}>
      <h1 className="text-xl font-bold mb-6" style={{ color: '#0b1c30' }}>Settings</h1>
      <ChangePasswordSection />
      <DeleteAccountSection />
    </div>
  )
}
