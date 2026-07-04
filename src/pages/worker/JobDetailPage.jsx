import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { MapPin, Clock, Star, ChevronLeft, CheckCircle, AlertCircle, Send } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getJobById } from '../../api/jobs.api'
import { applyForJob, checkExistingApplication } from '../../api/applications.api'
import { queryKeys } from '../../constants/queryKeys'
import { CategoryBadge } from '../../components/jobs/CategoryBadge'
import { JobStatusBadge } from '../../components/jobs/JobStatusBadge'

function StarRating({ rating, count }) {
  const stars = Math.round(Number(rating) || 0)
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={14} fill={i <= stars ? '#ef9900' : 'none'} color={i <= stars ? '#ef9900' : '#c5c5d3'} />
      ))}
      {count !== undefined && (
        <span className="text-xs ml-1" style={{ color: '#444651' }}>({count})</span>
      )}
    </span>
  )
}

export default function JobDetailPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [coverNote, setCoverNote] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const { data: job, isLoading, error } = useQuery({
    queryKey: queryKeys.jobs.byId(id),
    queryFn: () => getJobById(id),
  })

  const { data: existingApp } = useQuery({
    queryKey: ['application-check', id, profile?.id],
    queryFn: () => checkExistingApplication(id, profile.id),
    enabled: !!profile?.id,
  })

  const applyMutation = useMutation({
    mutationFn: () => applyForJob({ jobId: id, workerId: profile.id, coverNote }),
    onSuccess: () => {
      queryClient.invalidateQueries(['application-check', id, profile?.id])
      queryClient.invalidateQueries(queryKeys.applications.forWorker(profile?.id))
      setShowApplyDialog(false)
      setCoverNote('')
      setSuccessMessage('Application submitted successfully!')
      setTimeout(() => setSuccessMessage(''), 5000)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="p-4">
        <div className="px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
          {error?.message || 'Job not found.'}
        </div>
      </div>
    )
  }

  const employer = job.employer || {}
  const isOpen = job.status === 'open'
  const appStatus = existingApp?.status

  const applySection = () => {
    if (existingApp) {
      if (appStatus === 'accepted') {
        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ background: '#dcfce7', color: '#166534' }}>
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Your application was accepted!</span>
            </div>
            <Link
              to={`/worker/jobs/${id}/chat`}
              className="btn-primary w-full text-center"
            >
              Go to Chat
            </Link>
          </div>
        )
      }
      if (appStatus === 'rejected') {
        return (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ background: '#f3f4f6', color: '#374151' }}>
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Your application was not selected for this job.</span>
          </div>
        )
      }
      // pending
      return (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ background: '#dbeafe', color: '#1e40af' }}>
          <Clock size={16} />
          <span className="text-sm font-medium">Application pending — waiting for employer review.</span>
        </div>
      )
    }

    if (profile?.verification_status !== 'approved') {
      return (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ background: '#fff7ed', color: '#c2410c' }}>
          <AlertCircle size={16} />
          <span className="text-sm font-medium flex-1">Verify your identity to apply for jobs.</span>
          <Link to="/worker/verify" className="text-sm font-semibold underline shrink-0">Verify now</Link>
        </div>
      )
    }

    if (!isOpen) {
      return (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: '#f3f4f6', color: '#444651' }}>
          This job is no longer accepting applications.
        </div>
      )
    }

    return (
      <button
        onClick={() => setShowApplyDialog(true)}
        className="btn-primary w-full"
      >
        <Send size={16} className="mr-2" />
        Apply Now
      </button>
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-6" style={{ background: '#f8f9ff' }}>
      {/* Back button */}
      <div className="px-4 pt-4 pb-2">
        <Link to="/worker/browse" className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: '#00236f' }}>
          <ChevronLeft size={16} />
          Browse Jobs
        </Link>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="mx-4 mb-3 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#dcfce7', color: '#166534' }}>
          <CheckCircle size={16} />
          {successMessage}
        </div>
      )}

      {/* Apply mutation error */}
      {applyMutation.isError && (
        <div className="mx-4 mb-3 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
          {applyMutation.error?.message || 'Failed to submit application.'}
        </div>
      )}

      <div className="px-4 space-y-4">
        {/* Header */}
        <div className="card">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <CategoryBadge value={job.category} />
            <JobStatusBadge status={job.status} />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#0b1c30' }}>{job.title}</h1>
          <div className="text-3xl font-bold mb-4" style={{ color: '#ef9900' }}>
            {Number(job.pay).toLocaleString('fr-CM')} XAF
          </div>
          <div className="flex flex-wrap gap-4 text-sm" style={{ color: '#444651' }}>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} />
              {job.city}{job.address_text ? ` · ${job.address_text}` : ''}
            </span>
            {job.timeline_days && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {job.timeline_days} day{job.timeline_days !== 1 ? 's' : ''}
              </span>
            )}
            {job.distance_km !== undefined && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} />
                {job.distance_km < 1
                  ? `${Math.round(job.distance_km * 1000)}m away`
                  : `${Number(job.distance_km).toFixed(1)}km away`}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="card">
          <h2 className="text-base font-semibold mb-2" style={{ color: '#0b1c30' }}>Job Description</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#444651' }}>{job.description}</p>
        </div>

        {/* Employer card */}
        <div className="card">
          <h2 className="text-base font-semibold mb-3" style={{ color: '#0b1c30' }}>About the Employer</h2>
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold shrink-0"
              style={{ background: '#e5eeff', color: '#00236f' }}
            >
              {employer.avatar_url
                ? <img src={employer.avatar_url} alt="" className="w-full h-full object-cover" />
                : (employer.full_name || 'E').charAt(0)
              }
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: '#0b1c30' }}>{employer.full_name || 'Employer'}</p>
              {employer.city && (
                <p className="text-sm" style={{ color: '#444651' }}>{employer.city}</p>
              )}
              {employer.rating_average && (
                <StarRating rating={employer.rating_average} />
              )}
            </div>
            <Link
              to={`/profile/${employer.id}`}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border"
              style={{ color: '#00236f', borderColor: '#00236f' }}
            >
              View Profile
            </Link>
          </div>
        </div>

        {/* Apply section — inline card on desktop */}
        <div className="card">
          <h2 className="text-base font-semibold mb-3" style={{ color: '#0b1c30' }}>Apply for this Job</h2>
          {applySection()}
        </div>
      </div>

      {/* Sticky apply bar on mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-white md:hidden" style={{ borderColor: '#c5c5d3' }}>
        {applySection()}
      </div>

      {/* Apply dialog */}
      {showApplyDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#0b1c30' }}>Apply for "{job.title}"</h2>
            <p className="text-sm mb-4" style={{ color: '#444651' }}>Add a cover note to introduce yourself (optional).</p>
            <label className="label">Cover Note</label>
            <textarea
              value={coverNote}
              onChange={e => setCoverNote(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="Tell the employer why you're a great fit…"
              className="input-field resize-none mb-1"
            />
            <p className="text-xs text-right mb-4" style={{ color: '#444651' }}>{coverNote.length}/500</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowApplyDialog(false); setCoverNote('') }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
                className="btn-primary flex-1"
              >
                {applyMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send size={16} />
                    Submit Application
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
