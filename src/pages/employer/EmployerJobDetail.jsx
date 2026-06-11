import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ChevronLeft, MapPin, Clock, Star, Users, MessageSquare, CheckCircle, AlertCircle, Edit2, XCircle, CreditCard, Lock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getJobById, updateJobStatus } from '../../api/jobs.api'
import { getJobApplicants } from '../../api/applications.api'
import { getPaymentForJob } from '../../api/payments.api'
import { checkExistingRating } from '../../api/ratings.api'
import { queryKeys } from '../../constants/queryKeys'
import { CategoryBadge } from '../../components/jobs/CategoryBadge'
import { JobStatusBadge } from '../../components/jobs/JobStatusBadge'

function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="text-base font-bold mb-2" style={{ color: '#0b1c30' }}>{title}</h2>
        <p className="text-sm mb-5" style={{ color: '#444651' }}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            className="flex-1 font-semibold px-6 py-3 rounded-lg text-white inline-flex items-center justify-center transition-all"
            style={{ background: danger ? '#ba1a1a' : '#ef9900' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EmployerJobDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmDialog, setConfirmDialog] = useState(null) // { type: 'complete' | 'cancel' }
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { data: job, isLoading, error } = useQuery({
    queryKey: queryKeys.jobs.byId(id),
    queryFn: () => getJobById(id),
  })

  const { data: applicants = [] } = useQuery({
    queryKey: queryKeys.applications.forJob(id),
    queryFn: () => getJobApplicants(id),
    enabled: !!id,
  })

  const { data: payment } = useQuery({
    queryKey: queryKeys.payments.forJob(id),
    queryFn:  () => getPaymentForJob(id),
    enabled:  !!id && job?.status === 'completed',
  })

  const { data: myRating } = useQuery({
    queryKey: ['ratings', 'check', id, profile?.id],
    queryFn:  () => checkExistingRating(id, profile?.id),
    enabled:  !!id && !!profile?.id && job?.status === 'completed',
  })

  const statusMutation = useMutation({
    mutationFn: (status) => updateJobStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries(queryKeys.jobs.byId(id))
      queryClient.invalidateQueries(queryKeys.jobs.mine(profile?.id))
      setConfirmDialog(null)
      setSuccessMessage(
        updated.status === 'completed' ? 'Job marked as completed.' : 'Job has been cancelled.'
      )
      setTimeout(() => setSuccessMessage(''), 5000)
    },
    onError: (err) => {
      setConfirmDialog(null)
      setErrorMsg(err.message || 'Action failed. Please try again.')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
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

  const selectedWorker = job.selected_worker
  const appCount = applicants.length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-10" style={{ background: '#f8f9ff', minHeight: '100%' }}>
      {/* Back */}
      <Link to="/employer/my-jobs" className="inline-flex items-center gap-1 text-sm font-medium mb-4" style={{ color: '#00236f' }}>
        <ChevronLeft size={16} />
        My Jobs
      </Link>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#dcfce7', color: '#166534' }}>
          <CheckCircle size={16} /> {successMessage}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {/* Header card */}
      <div className="card mb-4">
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
        </div>
      </div>

      {/* Description */}
      <div className="card mb-4">
        <h2 className="text-base font-semibold mb-2" style={{ color: '#0b1c30' }}>Description</h2>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#444651' }}>{job.description}</p>
      </div>

      {/* Action bar */}
      <div className="card mb-4">
        <h2 className="text-base font-semibold mb-3" style={{ color: '#0b1c30' }}>Actions</h2>
        {job.status === 'open' && (
          <div className="flex flex-wrap gap-2">
            <Link to={`/employer/jobs/${id}/edit`} className="btn-secondary flex items-center gap-2">
              <Edit2 size={16} /> Edit Job
            </Link>
            <Link
              to={`/employer/jobs/${id}/applicants`}
              className="btn-primary flex items-center gap-2"
            >
              <Users size={16} />
              View Applicants {appCount > 0 && `(${appCount})`}
            </Link>
            <button
              onClick={() => setConfirmDialog({ type: 'cancel' })}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg border transition-all"
              style={{ borderColor: '#ba1a1a', color: '#ba1a1a' }}
            >
              <XCircle size={16} /> Cancel Job
            </button>
          </div>
        )}
        {job.status === 'in_progress' && (
          <div className="space-y-3">
            {/* Prominent completion CTA */}
            <div className="p-4 rounded-xl" style={{ background: '#fff8e6', border: '2px solid #ef9900' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#0b1c30' }}>
                Work in progress with {selectedWorker?.full_name}
              </p>
              <p className="text-xs mb-3" style={{ color: '#444651' }}>
                Once the work is done, mark it as completed to begin the payment process.
              </p>
              <button
                onClick={() => setConfirmDialog({ type: 'complete' })}
                className="btn-primary flex items-center gap-2 w-full justify-center"
              >
                <CheckCircle size={16} /> Mark Job as Completed
              </button>
            </div>
            <Link to={`/employer/jobs/${id}/chat/${selectedWorker?.id}`} className="btn-secondary flex items-center gap-2">
              <MessageSquare size={16} /> Open Chat with Worker
            </Link>
          </div>
        )}
        {job.status === 'completed' && (
          <div className="space-y-3">
            {/* Step 1 — Payment */}
            <div className="p-4 rounded-xl" style={{
              background: payment ? '#f0fdf4' : '#fff8e6',
              border: `1.5px solid ${payment ? '#86efac' : '#f0c040'}`,
            }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} style={{ color: payment ? '#166534' : '#ef9900' }} />
                  <span className="text-sm font-bold" style={{ color: '#0b1c30' }}>Step 1 — Submit Payment</span>
                </div>
                {payment
                  ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#dcfce7', color: '#166534' }}>
                      {payment.status === 'confirmed' ? '✓ Confirmed' : '⏳ Awaiting worker'}
                    </span>
                  : <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#fef3c7', color: '#b45309' }}>Pending</span>
                }
              </div>
              <p className="text-xs mb-3" style={{ color: '#444651' }}>
                Send {Number(job.pay).toLocaleString('fr-CM')} XAF to {selectedWorker?.full_name} via MTN MoMo or Orange Money, then submit the reference code here.
              </p>
              {!payment
                ? <Link to={`/employer/jobs/${id}/payment`} className="btn-primary flex items-center gap-2 w-full justify-center">
                    <CreditCard size={15} /> Submit Payment Reference
                  </Link>
                : <Link to={`/employer/jobs/${id}/payment`} className="btn-secondary flex items-center gap-2 text-sm">
                    View payment details
                  </Link>
              }
            </div>

            {/* Step 2 — Rate */}
            <div className="p-4 rounded-xl" style={{
              background: myRating ? '#f0fdf4' : '#f8f9ff',
              border: `1.5px solid ${myRating ? '#86efac' : '#c7d7fd'}`,
              opacity: payment?.status === 'confirmed' || myRating ? 1 : 0.65,
            }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Star size={16}
                    fill={myRating ? '#ef9900' : 'none'}
                    color={myRating ? '#ef9900' : '#9ca3af'} />
                  <span className="text-sm font-bold" style={{ color: '#0b1c30' }}>Step 2 — Rate {selectedWorker?.full_name}</span>
                </div>
                {myRating
                  ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#dcfce7', color: '#166534' }}>✓ Done</span>
                  : payment?.status !== 'confirmed'
                    ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: '#f3f4f6', color: '#9ca3af' }}>
                        <Lock size={11} /> Locked
                      </span>
                    : null
                }
              </div>
              <p className="text-xs mb-3" style={{ color: '#444651' }}>
                {payment?.status === 'confirmed'
                  ? 'Payment confirmed. Share your honest experience with the GigGle community.'
                  : 'Unlocks once the worker confirms payment receipt.'}
              </p>
              {!myRating && payment?.status === 'confirmed'
                ? <Link to={`/employer/jobs/${id}/rate`} className="btn-primary flex items-center gap-2 w-full justify-center">
                    <Star size={15} /> Rate {selectedWorker?.full_name}
                  </Link>
                : myRating
                  ? <Link to={`/employer/jobs/${id}/rate`} className="btn-secondary flex items-center gap-2 text-sm">
                      View my rating
                    </Link>
                  : null
              }
            </div>

            <Link to={`/employer/jobs/${id}/chat/${selectedWorker?.id}`} className="btn-secondary flex items-center gap-2 text-sm">
              <MessageSquare size={15} /> View Chat History
            </Link>
          </div>
        )}
        {job.status === 'cancelled' && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ background: '#fee2e2', color: '#991b1b' }}>
            <XCircle size={16} />
            <span className="text-sm font-medium">This job has been cancelled.</span>
          </div>
        )}
      </div>

      {/* Selected worker card */}
      {selectedWorker && (job.status === 'in_progress' || job.status === 'completed') && (
        <div className="card mb-4">
          <h2 className="text-base font-semibold mb-3" style={{ color: '#0b1c30' }}>Selected Worker</h2>
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold shrink-0"
              style={{ background: '#e5eeff', color: '#00236f' }}
            >
              {selectedWorker.avatar_url
                ? <img src={selectedWorker.avatar_url} alt="" className="w-full h-full object-cover" />
                : (selectedWorker.full_name || 'W').charAt(0)
              }
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: '#0b1c30' }}>{selectedWorker.full_name}</p>
              {selectedWorker.rating_average && (
                <span className="flex items-center gap-0.5 text-sm">
                  <Star size={13} fill="#ef9900" color="#ef9900" />
                  <span style={{ color: '#0b1c30' }}>{Number(selectedWorker.rating_average).toFixed(1)}</span>
                </span>
              )}
            </div>
            <Link
              to={`/profile/${selectedWorker.id}`}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border"
              style={{ color: '#00236f', borderColor: '#00236f' }}
            >
              View Profile
            </Link>
          </div>
        </div>
      )}

      {/* Confirm dialogs */}
      {confirmDialog?.type === 'complete' && (
        <ConfirmDialog
          title="Mark as Completed?"
          message="This will mark the job as completed and notify the worker. This action cannot be undone."
          confirmLabel="Mark Completed"
          onConfirm={() => statusMutation.mutate('completed')}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      {confirmDialog?.type === 'cancel' && (
        <ConfirmDialog
          title="Cancel Job?"
          message="This will cancel the job posting and notify any applicants. This action cannot be undone."
          confirmLabel="Cancel Job"
          danger
          onConfirm={() => statusMutation.mutate('cancelled')}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}
