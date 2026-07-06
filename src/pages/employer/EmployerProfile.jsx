import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../contexts/AuthContext'
import { updateProfile } from '../../api/profiles.api'
import { uploadAvatar } from '../../api/storage.api'
import { CITIES } from '../../constants/cities'
import { User, Camera, Star, AlertCircle, CheckCircle, ShieldCheck, LogOut } from 'lucide-react'
import { VerifiedBadge } from '../../components/VerifiedBadge'

const VERIFICATION_LABEL = {
  unverified: 'Not verified yet',
  pending: 'Pending review',
  approved: 'Verified',
  rejected: 'Rejected — resubmission needed',
}

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  company_name: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  city: z.string().min(1, 'Please select your city'),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional().or(z.literal('')),
})

function StarRating({ value }) {
  const filled = Math.round(value || 0)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={16}
          fill={i < filled ? '#ef9900' : 'none'}
          color={i < filled ? '#ef9900' : '#c5c5d3'}
        />
      ))}
    </div>
  )
}

export default function EmployerProfile() {
  const { user, profile, refetchProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile?.full_name || '',
      company_name: profile?.company_name || '',
      phone: profile?.phone || '',
      city: profile?.city || '',
      bio: profile?.bio || '',
    },
  })

  // Re-populate form if profile loads after mount
  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        phone: profile.phone || '',
        city: profile.city || '',
        bio: profile.bio || '',
      })
      setAvatarUrl(profile.avatar_url || null)
    }
  }, [profile, reset])

  const bioValue = watch('bio') || ''

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    setUploadError('')
    setUploading(true)
    try {
      const url = await uploadAvatar(user.id, file)
      setAvatarUrl(url)
      await refetchProfile()
    } catch (err) {
      setUploadError(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(values) {
    if (saving || !profile?.id) return
    setSaving(true)
    setSaveSuccess(false)
    setSaveError('')
    try {
      const selectedCity = CITIES.find(c => c.name === values.city)
      await updateProfile(profile.id, {
        full_name: values.full_name.trim(),
        company_name: values.company_name?.trim() || null,
        phone: values.phone?.trim() ? values.phone.trim().replace(/(?!^\+)[^0-9]/g, '') : null,
        city: values.city,
        bio: values.bio?.trim() || null,
        lat: selectedCity?.lat ?? undefined,
        lng: selectedCity?.lng ?? undefined,
      })
      await refetchProfile()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3500)
    } catch (err) {
      setSaveError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-6" style={{ color: '#0b1c30' }}>My Profile</h1>

      {/* ---- Verification Status ---- */}
      <div className="card mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#e5eeff' }}>
            <ShieldCheck size={17} color="#00236f" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#0b1c30' }}>Identity Verification</p>
            {profile?.verification_status === 'approved'
              ? <VerifiedBadge status={profile.verification_status} />
              : <p className="text-xs" style={{ color: '#444651' }}>{VERIFICATION_LABEL[profile?.verification_status] || 'Not verified yet'}</p>
            }
          </div>
        </div>
        <Link to="/employer/verify" className="text-sm font-semibold shrink-0" style={{ color: '#00236f' }}>
          Manage →
        </Link>
      </div>

      {/* ---- Avatar Section ---- */}
      <div className="card mb-6 flex flex-col items-center gap-4 py-6">
        <div
          className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center relative"
          style={{ background: '#e5eeff' }}
        >
          {avatarUrl
            ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            : <span className="text-2xl font-bold" style={{ color: '#00236f' }}>{initials}</span>
          }
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full" style={{ background: 'rgba(0,35,111,0.5)' }}>
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleAvatarChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-ghost flex items-center gap-2 text-sm"
        >
          <Camera size={15} />
          {uploading ? 'Uploading...' : 'Change photo'}
        </button>

        {uploadError && (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#ba1a1a' }}>
            <AlertCircle size={14} />
            {uploadError}
          </div>
        )}
        <p className="text-xs" style={{ color: '#444651' }}>JPG, PNG or WebP — max 2MB</p>

        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: '#e5eeff', color: '#00236f' }}
        >
          <User size={12} />
          Employer
        </div>
      </div>

      {/* ---- Edit Form ---- */}
      <form onSubmit={handleSubmit(onSubmit)} className="card mb-6 space-y-5">
        <h2 className="text-base font-semibold" style={{ color: '#0b1c30' }}>Personal Information</h2>

        {/* Success banner */}
        {saveSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: '#97f5cc', color: '#006c4e' }}>
            <CheckCircle size={16} />
            Profile updated!
          </div>
        )}

        {/* Error banner */}
        {saveError && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: '#ffdad6', color: '#ba1a1a' }}>
            <AlertCircle size={16} />
            {saveError}
          </div>
        )}

        <div>
          <label className="label">Full name *</label>
          <input
            className="input-field"
            placeholder="Your full name"
            {...register('full_name')}
          />
          {errors.full_name && (
            <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <label className="label">Company / Organization <span style={{ color: '#444651' }}>(optional)</span></label>
          <input
            className="input-field"
            placeholder="Leave blank if hiring personally"
            {...register('company_name')}
          />
          {errors.company_name && (
            <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.company_name.message}</p>
          )}
        </div>

        <div>
          <label className="label">Phone number <span style={{ color: '#444651' }}>(optional)</span></label>
          <input
            className="input-field"
            placeholder="+237 6XX XXX XXX"
            type="tel"
            {...register('phone')}
          />
          {errors.phone && (
            <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="label">City *</label>
          <select className="input-field" {...register('city')}>
            <option value="">Select your city</option>
            {CITIES.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          {errors.city && (
            <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.city.message}</p>
          )}
        </div>

        <div>
          <label className="label">About you / your hiring needs <span style={{ color: '#444651' }}>(optional)</span></label>
          <textarea
            className="input-field resize-none"
            rows={4}
            placeholder="Describe what you typically hire for..."
            {...register('bio')}
          />
          <p className="text-xs mt-1 text-right" style={{ color: '#444651' }}>
            {bioValue.length}/500
          </p>
          {errors.bio && (
            <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{errors.bio.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* ---- Rating Section ---- */}
      <div className="card">
        <h2 className="text-base font-semibold mb-3" style={{ color: '#0b1c30' }}>Your Rating</h2>
        {profile?.rating_average ? (
          <div className="flex items-center gap-3">
            <StarRating value={profile.rating_average} />
            <span className="font-bold text-lg" style={{ color: '#0b1c30' }}>
              {Number(profile.rating_average).toFixed(1)}
            </span>
            <span className="text-sm" style={{ color: '#444651' }}>
              ({profile.rating_count || 0} reviews)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <StarRating value={0} />
            <span className="text-sm" style={{ color: '#444651' }}>No ratings yet</span>
          </div>
        )}
        <p className="text-xs mt-2" style={{ color: '#444651' }}>
          Workers rate employers after completed jobs
        </p>
      </div>

      {/* ---- Sign out (mobile only — desktop has it in the sidebar) ---- */}
      <button
        onClick={handleSignOut}
        className="md:hidden w-full mt-6 flex items-center justify-center gap-2 font-semibold px-4 py-3 rounded-lg border-2"
        style={{ borderColor: '#ba1a1a', color: '#ba1a1a' }}
      >
        <LogOut size={17} />
        Sign Out
      </button>
    </div>
  )
}
