import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Flag, ChevronLeft, CheckCircle, AlertCircle, Briefcase, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { submitReport } from '../../api/reports.api'
import { getJobById } from '../../api/jobs.api'
import { getPublicProfileById } from '../../api/profiles.api'

const CATEGORIES = [
  { value: 'no_payment',        emoji: '💸', label: 'No payment received after job completion',    roles: ['worker'] },
  { value: 'misleading_job',    emoji: '📋', label: 'Job description was false or misleading',      roles: ['worker'] },
  { value: 'unsafe_conditions', emoji: '⚠️', label: 'Unsafe or dangerous working conditions',        roles: ['worker'] },
  { value: 'employer_harass',   emoji: '😡', label: 'Harassment or abuse by employer',              roles: ['worker'] },
  { value: 'employer_noshow',   emoji: '📵', label: 'Employer no-show or unreachable',              roles: ['worker'] },
  { value: 'last_min_cancel',   emoji: '🚫', label: 'Job cancelled last minute without reason',     roles: ['worker'] },
  { value: 'worker_noshow',     emoji: '❌', label: 'Worker no-show or abandoned the job',          roles: ['employer'] },
  { value: 'poor_quality',      emoji: '🔧', label: 'Work quality was unacceptable',                roles: ['employer'] },
  { value: 'extra_pay_demand',  emoji: '💰', label: 'Worker demanded more than the agreed pay',     roles: ['employer'] },
  { value: 'theft_damage',      emoji: '🏚️', label: 'Theft or damage to property',                 roles: ['employer'] },
  { value: 'worker_harass',     emoji: '😡', label: 'Harassment or threats by worker',              roles: ['employer'] },
  { value: 'fraud_profile',     emoji: '🚷', label: 'Fraudulent profile or fake experience',        roles: ['employer'] },
  { value: 'payment_dispute',   emoji: '💳', label: 'Payment amount or method dispute',             roles: ['worker', 'employer'] },
  { value: 'communication',     emoji: '📵', label: 'Communication breakdown or unresponsive',       roles: ['worker', 'employer'] },
  { value: 'other',             emoji: '📝', label: 'Other issue not listed above',                  roles: ['worker', 'employer'] },
]

const STATUS_CFG = {
  open:      { label: 'Under Review', bg: '#fff3cd', color: '#ef9900' },
  resolved:  { label: 'Resolved',     bg: '#97f5cc', color: '#006c4e' },
  dismissed: { label: 'Dismissed',    bg: '#f4f4f4', color: '#444651' },
}

export default function FileReport() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const jobId    = searchParams.get('jobId')
  const userId   = searchParams.get('userId')

  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const { data: job } = useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => getJobById(jobId),
    enabled: !!jobId,
  })

  const { data: reportedUser } = useQuery({
    queryKey: ['profiles', 'public', userId],
    queryFn: () => getPublicProfileById(userId),
    enabled: !!userId,
  })

  const role = profile?.role
  const availableCategories = CATEGORIES.filter(c => c.roles.includes(role))
  const backPath = role === 'employer' ? '/employer/complaints' : '/worker/complaints'
  const charCount = description.length

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!category) { setError('Please select a complaint category.'); return }
    if (description.trim().length < 10) { setError('Description must be at least 10 characters.'); return }

    setError('')
    setSubmitting(true)
    try {
      const cat = CATEGORIES.find(c => c.value === category)
      const fullReason = `[${cat?.label || category}]\n\n${description.trim()}`
      await submitReport({
        reporterId:  profile.id,
        reportedId:  userId || null,
        jobId:       jobId || null,
        reason:      fullReason,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to submit complaint. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center px-4" style={{ background: '#f8f9ff', minHeight: '100%' }}>
        <div className="max-w-sm w-full card text-center py-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#dcfce7' }}>
            <CheckCircle size={30} color="#006c4e" />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#0b1c30' }}>Complaint submitted</h2>
          <p className="text-sm mb-6" style={{ color: '#444651' }}>
            Our admin team will review your complaint within 48 hours. You can track its status in <strong>My Complaints</strong>.
          </p>
          <div className="flex flex-col gap-2">
            <Link to={backPath} className="btn-primary">View My Complaints</Link>
            <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-8" style={{ background: '#f8f9ff', minHeight: '100%' }}>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm font-medium mb-6" style={{ color: '#00236f' }}>
          <ChevronLeft size={16} /> Back
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#fee2e2' }}>
            <Flag size={20} color="#ba1a1a" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#0b1c30' }}>File a Complaint</h1>
            <p className="text-sm" style={{ color: '#444651' }}>Submitted confidentially to the admin team</p>
          </div>
        </div>

        {/* Context card — show what/who is being reported */}
        {(job || reportedUser) && (
          <div className="mb-5 p-4 rounded-xl border space-y-2" style={{ background: '#fff', borderColor: '#c5c5d3' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#444651' }}>Complaint context</p>
            {job && (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#0b1c30' }}>
                <Briefcase size={15} style={{ color: '#00236f', flexShrink: 0 }} />
                <span className="font-medium">Job:</span>
                <span className="truncate">{job.title}</span>
              </div>
            )}
            {reportedUser && (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#0b1c30' }}>
                <User size={15} style={{ color: '#00236f', flexShrink: 0 }} />
                <span className="font-medium">Reporting:</span>
                <span>{reportedUser.full_name}</span>
                <span className="text-xs capitalize px-1.5 py-0.5 rounded" style={{ background: '#e5eeff', color: '#00236f' }}>
                  {reportedUser.role}
                </span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-5">

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="label mb-3">What happened? *</label>
            <div className="space-y-2">
              {availableCategories.map(cat => (
                <label key={cat.value}
                  className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                  style={{
                    borderColor: category === cat.value ? '#ba1a1a' : '#e4e4ef',
                    background: category === cat.value ? '#fff5f5' : '#fff',
                  }}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    checked={category === cat.value}
                    onChange={() => setCategory(cat.value)}
                    className="mt-0.5 accent-red-600 shrink-0"
                  />
                  <span className="text-sm" style={{ color: '#0b1c30' }}>{cat.emoji} {cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label">Describe what happened *</label>
              <span className="text-xs" style={{ color: charCount > 900 ? '#ba1a1a' : '#9ca3af' }}>
                {charCount}/1000
              </span>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input-field resize-none"
              rows={5}
              maxLength={1000}
              placeholder="Provide as much detail as possible: dates, amounts, what was agreed, what actually happened…"
            />
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Minimum 10 characters. Be specific — it helps the admin resolve this faster.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 font-semibold px-6 py-3 rounded-lg text-white transition-all disabled:opacity-60"
              style={{ background: '#ba1a1a' }}
            >
              {submitting ? 'Submitting…' : 'Submit Complaint'}
            </button>
          </div>
        </form>

        <p className="text-xs text-center mt-4" style={{ color: '#9ca3af' }}>
          Complaints are reviewed by the GigGle admin team within 48 hours.
          False or malicious complaints may result in account suspension.
        </p>
      </div>
    </div>
  )
}
