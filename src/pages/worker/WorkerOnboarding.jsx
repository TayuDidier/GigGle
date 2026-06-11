import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { completeOnboarding } from '../../api/profiles.api'
import { uploadAvatar } from '../../api/storage.api'
import { CATEGORIES } from '../../constants/categories'
import { CITIES } from '../../constants/cities'
import { User, Camera, ChevronRight, ChevronLeft, Check } from 'lucide-react'

const STEP_TITLES = [
  'Tell us about yourself',
  'Describe your skills',
  'Add a profile photo',
]

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300"
            style={{
              background: i < current ? '#006c4e' : i === current ? '#00236f' : '#e5eeff',
              color: i <= current ? '#ffffff' : '#00236f',
            }}
          >
            {i < current ? <Check size={14} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className="w-8 h-0.5 transition-all duration-300"
              style={{ background: i < current ? '#006c4e' : '#c5c5d3' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default function WorkerOnboarding() {
  const { user, profile, refetchProfile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Step 1 state
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [city, setCity] = useState(profile?.city || '')
  const [step1Errors, setStep1Errors] = useState({})

  // Step 2 state
  const [bio, setBio] = useState(profile?.bio || '')
  const [selectedCategories, setSelectedCategories] = useState([])

  // Step 3 state
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef(null)

  function validateStep1() {
    const errs = {}
    if (!fullName.trim()) errs.fullName = 'Full name is required'
    if (!city) errs.city = 'Please select your city'
    setStep1Errors(errs)
    return Object.keys(errs).length === 0
  }

  function handleNext() {
    if (step === 0 && !validateStep1()) return
    setError('')
    setStep(s => s + 1)
  }

  function toggleCategory(val) {
    setSelectedCategories(prev =>
      prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]
    )
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setError('')
  }

  async function handleComplete() {
    if (submitting) return
    setSubmitting(true)
    setError('')

    try {
      // Upload avatar if selected
      if (avatarFile && user?.id) {
        setUploadingAvatar(true)
        await uploadAvatar(user.id, avatarFile)
        setUploadingAvatar(false)
      }

      // Compose bio with categories
      const selectedCity = CITIES.find(c => c.name === city)
      const categoryLabels = selectedCategories
        .map(v => CATEGORIES.find(c => c.value === v)?.label)
        .filter(Boolean)
        .join(', ')
      const fullBio = bio.trim()
        ? categoryLabels
          ? `${bio.trim()}\n\nSkills: ${categoryLabels}`
          : bio.trim()
        : categoryLabels
          ? `Skills: ${categoryLabels}`
          : ''

      await completeOnboarding(profile.id, {
        full_name: fullName.trim(),
        phone: phone.trim() ? phone.trim().replace(/(?!^\+)[^0-9]/g, '') : null,
        city,
        bio: fullBio || null,
        lat: selectedCity?.lat ?? null,
        lng: selectedCity?.lng ?? null,
      })

      await refetchProfile()
      navigate('/worker/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
      setUploadingAvatar(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: '#f8f9ff' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-1 mb-8">
        <span className="text-2xl font-bold" style={{ color: '#00236f' }}>GigGle</span>
        <span style={{ color: '#ef9900' }}>✦</span>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-card border w-full max-w-lg p-8" style={{ borderColor: '#c5c5d3' }}>
        {/* Step indicator */}
        <StepIndicator current={step} total={3} />

        {/* Step title */}
        <h1 className="text-xl font-bold text-center mb-1" style={{ color: '#0b1c30' }}>
          {STEP_TITLES[step]}
        </h1>
        <p className="text-sm text-center mb-6" style={{ color: '#444651' }}>
          {step === 0 && 'Help employers know who they\'re hiring'}
          {step === 1 && 'Let employers know what you\'re great at'}
          {step === 2 && 'A photo helps build trust with employers'}
        </p>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#ffdad6', color: '#ba1a1a' }}>
            {error}
          </div>
        )}

        {/* ---- STEP 1: Personal Info ---- */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="label">Full name <span style={{ color: '#ba1a1a' }}>*</span></label>
              <input
                className="input-field"
                placeholder="e.g. Jean-Pierre Mbarga"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
              {step1Errors.fullName && (
                <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{step1Errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="label">Phone number <span style={{ color: '#444651' }}>(optional)</span></label>
              <input
                className="input-field"
                placeholder="+237 6XX XXX XXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                type="tel"
              />
            </div>

            <div>
              <label className="label">Your city <span style={{ color: '#ba1a1a' }}>*</span></label>
              <select
                className="input-field"
                value={city}
                onChange={e => setCity(e.target.value)}
              >
                <option value="">Select your city</option>
                {CITIES.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              {step1Errors.city && (
                <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{step1Errors.city}</p>
              )}
            </div>
          </div>
        )}

        {/* ---- STEP 2: Skills ---- */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="label">About you</label>
              <textarea
                className="input-field resize-none"
                rows={4}
                placeholder="Briefly describe what you're good at and any experience you have..."
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs mt-1 text-right" style={{ color: '#444651' }}>
                {bio.length}/500
              </p>
            </div>

            <div>
              <label className="label">Types of work you can do</label>
              <p className="text-xs mb-3" style={{ color: '#444651' }}>Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => {
                  const selected = selectedCategories.includes(cat.value)
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => toggleCategory(cat.value)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border"
                      style={{
                        background: selected ? '#00236f' : '#ffffff',
                        color: selected ? '#ffffff' : '#0b1c30',
                        borderColor: selected ? '#00236f' : '#c5c5d3',
                      }}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ---- STEP 3: Photo ---- */}
        {step === 2 && (
          <div className="flex flex-col items-center gap-5">
            {/* Avatar preview */}
            <div
              className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center border-4"
              style={{ borderColor: '#e5eeff', background: '#e5eeff' }}
            >
              {avatarPreview
                ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                : <User size={44} color="#00236f" />
              }
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary flex items-center gap-2"
            >
              <Camera size={16} />
              {avatarPreview ? 'Change photo' : 'Upload photo'}
            </button>

            <p className="text-xs text-center" style={{ color: '#444651' }}>
              JPG, PNG or WebP — max 2MB
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="btn-ghost flex items-center gap-1"
              disabled={submitting}
            >
              <ChevronLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={handleComplete}
                className="text-sm font-medium"
                style={{ color: '#444651' }}
                disabled={submitting}
              >
                Skip for now
              </button>
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary flex items-center gap-1"
              >
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                className="btn-primary flex items-center gap-2"
                disabled={submitting}
              >
                {submitting
                  ? (uploadingAvatar ? 'Uploading...' : 'Saving...')
                  : 'Complete Setup'
                }
                {!submitting && <Check size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress text */}
      <p className="mt-4 text-xs" style={{ color: '#444651' }}>
        Step {step + 1} of 3
      </p>
    </div>
  )
}
