import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Star, CheckCircle, AlertCircle, Lock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getJobById } from '../../api/jobs.api'
import { getEscrowForJob } from '../../api/payments.api'
import { submitRating, checkExistingRating } from '../../api/ratings.api'
import { queryKeys } from '../../constants/queryKeys'

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            size={40}
            fill={(hover || value) >= s ? '#ef9900' : 'none'}
            color={(hover || value) >= s ? '#ef9900' : '#c5c5d3'}
          />
        </button>
      ))}
    </div>
  )
}

const STAR_LABELS = ['', 'Poor', 'Below average', 'Average', 'Good', 'Excellent']

export default function RateWorker() {
  const { id: jobId } = useParams()
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const [score, setScore]           = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [formError, setFormError]   = useState('')

  const { data: job } = useQuery({
    queryKey: queryKeys.jobs.byId(jobId),
    queryFn:  () => getJobById(jobId),
    enabled:  !!jobId,
  })

  const { data: escrow } = useQuery({
    queryKey: queryKeys.escrows.forJob(jobId),
    queryFn:  () => getEscrowForJob(jobId),
    enabled:  !!jobId,
  })

  const { data: existingRating } = useQuery({
    queryKey: ['ratings', 'check', jobId, profile?.id],
    queryFn:  () => checkExistingRating(jobId, profile?.id),
    enabled:  !!jobId && !!profile?.id,
  })

  const mutation = useMutation({
    mutationFn: () => submitRating({
      jobId,
      raterId:    profile.id,
      ratedId:    job.selected_worker_id,
      score,
      reviewText,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings', 'check', jobId, profile?.id] })
    },
    onError: (err) => setFormError(err.message || 'Failed to submit rating.'),
  })

  const worker            = job?.selected_worker
  const paymentConfirmed  = escrow?.status === 'released'
  const alreadyRated      = !!existingRating

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-10" style={{ minHeight: '100%' }}>
      <Link to={`/employer/jobs/${jobId}`}
        className="inline-flex items-center gap-1 text-sm font-medium mb-6"
        style={{ color: '#00236f' }}>
        <ChevronLeft size={16} /> Back to Job
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ background: '#fff8e6' }}>
          <Star size={22} fill="#ef9900" color="#ef9900" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0b1c30' }}>Rate the Worker</h1>
          <p className="text-sm" style={{ color: '#444651' }}>{job?.title || 'Loading…'}</p>
        </div>
      </div>

      {/* Worker card */}
      {worker && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-5"
          style={{ background: '#eff4ff', border: '1px solid #c7d7fd' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
            style={{ background: '#00236f', color: '#fff' }}>
            {worker.avatar_url
              ? <img src={worker.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
              : worker.full_name?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#0b1c30' }}>Rating: {worker.full_name}</p>
            <p className="text-xs" style={{ color: '#444651' }}>Your honest feedback helps other employers</p>
          </div>
        </div>
      )}

      {/* Locked — payment not confirmed yet */}
      {!paymentConfirmed && !alreadyRated && (
        <div className="card text-center py-10">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#f3f4f6' }}>
            <Lock size={28} color="#9ca3af" />
          </div>
          <h2 className="text-base font-bold mb-2" style={{ color: '#0b1c30' }}>Rating locked</h2>
          <p className="text-sm mb-5" style={{ color: '#444651' }}>
            Rating unlocks once you release payment to the worker.
          </p>
          <Link to={`/employer/jobs/${jobId}/payment`} className="btn-primary">
            Release Payment First →
          </Link>
        </div>
      )}

      {/* Already rated */}
      {alreadyRated && !mutation.isSuccess && (
        <div className="card text-center py-10">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#dcfce7' }}>
            <CheckCircle size={28} color="#166534" />
          </div>
          <h2 className="text-base font-bold mb-2" style={{ color: '#0b1c30' }}>Rating submitted</h2>
          <p className="text-sm mb-5" style={{ color: '#444651' }}>
            You've already rated {worker?.full_name} for this job. Thank you!
          </p>
          <Link to={`/employer/jobs/${jobId}`} className="btn-secondary">Back to Job</Link>
        </div>
      )}

      {/* Rating submitted just now */}
      {mutation.isSuccess && (
        <div className="card text-center py-10">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#dcfce7' }}>
            <CheckCircle size={28} color="#166534" />
          </div>
          <h2 className="text-base font-bold mb-2" style={{ color: '#0b1c30' }}>Rating submitted — thank you!</h2>
          <p className="text-sm mb-5" style={{ color: '#444651' }}>
            Your rating helps build trust in the GigGle community.
          </p>
          <Link to="/employer/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      )}

      {/* Rating form */}
      {paymentConfirmed && !alreadyRated && !mutation.isSuccess && (
        <div className="card space-y-6">
          {formError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
              style={{ background: '#fee2e2', color: '#ba1a1a' }}>
              <AlertCircle size={15} /> {formError}
            </div>
          )}

          <div>
            <label className="label mb-3">Your rating *</label>
            <StarPicker value={score} onChange={setScore} />
            {score > 0 && (
              <p className="text-sm font-semibold mt-2" style={{ color: '#ef9900' }}>
                {STAR_LABELS[score]}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label">Written review <span style={{ color: '#9ca3af' }}>(optional)</span></label>
              <span className="text-xs" style={{ color: '#9ca3af' }}>{reviewText.length}/500</span>
            </div>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder={`Describe your experience working with ${worker?.full_name || 'the worker'}…`}
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Link to={`/employer/jobs/${jobId}`} className="btn-secondary flex-1 text-center">
              Cancel
            </Link>
            <button
              onClick={() => mutation.mutate()}
              disabled={score === 0 || mutation.isPending}
              className="btn-primary flex-1 disabled:opacity-60"
            >
              {mutation.isPending ? 'Submitting…' : 'Submit Rating'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
