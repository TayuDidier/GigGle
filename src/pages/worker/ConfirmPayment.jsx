import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, CreditCard, CheckCircle, Clock, AlertCircle, Star } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getJobById } from '../../api/jobs.api'
import { getPaymentForJob, confirmPayment } from '../../api/payments.api'
import { queryKeys } from '../../constants/queryKeys'

const PROVIDER_LABEL = { mtn_momo: 'MTN MoMo', orange_money: 'Orange Money' }

export default function ConfirmPayment() {
  const { id: jobId } = useParams()
  const { profile }   = useAuth()
  const navigate      = useNavigate()
  const queryClient   = useQueryClient()
  const [ackError, setAckError] = useState('')

  const { data: job } = useQuery({
    queryKey: queryKeys.jobs.byId(jobId),
    queryFn:  () => getJobById(jobId),
    enabled:  !!jobId,
  })

  const { data: payment, isLoading } = useQuery({
    queryKey: queryKeys.payments.forJob(jobId),
    queryFn:  () => getPaymentForJob(jobId),
    enabled:  !!jobId,
    // Keep polling until payment is confirmed (handles race with CamPay webhook)
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return !s || s === 'pending' ? 6_000 : false
    },
  })

  const mutation = useMutation({
    mutationFn: () => confirmPayment({ paymentId: payment.id, confirmedBy: profile.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.forJob(jobId) })
      navigate(`/worker/jobs/${jobId}/rate`)
    },
    onError: (err) => setAckError(err.message || 'Could not acknowledge payment.'),
  })

  const employer = job?.employer

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-10" style={{ minHeight: '100%' }}>

      <Link to="/worker/applications"
        className="inline-flex items-center gap-1 text-sm font-medium mb-6"
        style={{ color: '#00236f' }}>
        <ChevronLeft size={16} /> My Applications
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ background: '#fff8e6' }}>
          <CreditCard size={22} style={{ color: '#ef9900' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0b1c30' }}>Payment Receipt</h1>
          <p className="text-sm" style={{ color: '#444651' }}>{job?.title ?? 'Loading…'}</p>
        </div>
      </div>

      {/* Employer card */}
      {employer && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-5"
          style={{ background: '#eff4ff', border: '1px solid #c7d7fd' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
            style={{ background: '#00236f', color: '#fff' }}>
            {employer.avatar_url
              ? <img src={employer.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
              : employer.full_name?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#0b1c30' }}>From: {employer.full_name}</p>
            <p className="text-xs" style={{ color: '#444651' }}>
              Agreed pay:{' '}
              <strong style={{ color: '#ef9900' }}>{Number(job?.pay).toLocaleString('fr-CM')} XAF</strong>
            </p>
          </div>
        </div>
      )}

      {/* ── No payment yet ── */}
      {!payment && (
        <div className="card text-center py-10">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#fff8e6' }}>
            <Clock size={28} style={{ color: '#ef9900' }} />
          </div>
          <h2 className="text-base font-bold mb-2" style={{ color: '#0b1c30' }}>
            Waiting for payment
          </h2>
          <p className="text-sm mb-6" style={{ color: '#444651' }}>
            {employer?.full_name} hasn't initiated a payment yet. You'll be notified when
            they send one through CamPay.
          </p>
          <Link to="/worker/applications" className="btn-secondary">Back to Applications</Link>
        </div>
      )}

      {/* ── Payment pending (CamPay in progress) ── */}
      {payment?.status === 'pending' && (
        <div className="card text-center py-10">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#fff8e6' }}>
            <Clock size={28} style={{ color: '#ef9900' }} />
          </div>
          <h2 className="text-base font-bold mb-2" style={{ color: '#0b1c30' }}>
            Payment in progress
          </h2>
          <p className="text-sm mb-4" style={{ color: '#444651' }}>
            {employer?.full_name} has initiated a CamPay payment of{' '}
            <strong>{Number(payment.amount).toLocaleString('fr-CM')} XAF</strong>.
            Waiting for their approval on their phone.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs mb-6"
            style={{ color: '#9ca3af' }}>
            <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#ef9900', borderTopColor: 'transparent' }} />
            Checking automatically…
          </div>
          <Link to="/worker/applications" className="btn-secondary">Back to Applications</Link>
        </div>
      )}

      {/* ── CamPay confirmed — worker acknowledges ── */}
      {payment?.status === 'confirmed' && !mutation.isSuccess && (
        <div className="card space-y-4">
          {/* CamPay confirmed banner */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: '#dcfce7', border: '1px solid #86efac' }}>
            <CheckCircle size={18} color="#166534" className="shrink-0" />
            <p className="text-sm font-semibold" style={{ color: '#166534' }}>
              CamPay confirmed this payment
            </p>
          </div>

          {/* Payment details */}
          <div className="space-y-2 p-4 rounded-xl" style={{ background: '#f8f9ff', border: '1px solid #e5eeff' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#444651' }}>Payment method</span>
              <strong style={{ color: '#0b1c30' }}>
                {PROVIDER_LABEL[payment.provider] ?? payment.provider}
              </strong>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#444651' }}>CamPay reference</span>
              <strong className="text-xs font-mono" style={{ color: '#0b1c30' }}>
                {payment.reference_code ?? payment.transaction_ref ?? '—'}
              </strong>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#444651' }}>Amount</span>
              <strong style={{ color: '#ef9900' }}>
                {Number(payment.amount).toLocaleString('fr-CM')} XAF
              </strong>
            </div>
          </div>

          <p className="text-sm" style={{ color: '#444651' }}>
            CamPay has confirmed that <strong>{employer?.full_name}</strong> paid{' '}
            <strong>{Number(payment.amount).toLocaleString('fr-CM')} XAF</strong>.
            Acknowledge receipt to proceed to rating.
          </p>

          {ackError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
              style={{ background: '#fee2e2', color: '#ba1a1a' }}>
              <AlertCircle size={15} /> {ackError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Link to="/worker/applications" className="btn-secondary flex-1 text-center">
              Later
            </Link>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: '#006c4e' }}
            >
              {mutation.isPending
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <CheckCircle size={15} />
              }
              {mutation.isPending ? 'Saving…' : 'Acknowledge & Rate'}
            </button>
          </div>
        </div>
      )}

      {/* ── Worker acknowledged — go rate ── */}
      {(payment?.status === 'confirmed' && mutation.isSuccess) && (
        <div className="card text-center py-10">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#dcfce7' }}>
            <CheckCircle size={28} color="#166534" />
          </div>
          <h2 className="text-base font-bold mb-2" style={{ color: '#0b1c30' }}>
            Payment acknowledged!
          </h2>
          <p className="text-sm mb-6" style={{ color: '#444651' }}>
            Great — take a moment to rate your experience with {employer?.full_name}.
          </p>
          <div className="flex flex-col gap-2">
            <Link to={`/worker/jobs/${jobId}/rate`} className="btn-primary flex items-center justify-center gap-2">
              <Star size={15} /> Rate {employer?.full_name}
            </Link>
            <Link to="/worker/applications" className="btn-secondary">Skip for now</Link>
          </div>
        </div>
      )}

      {/* ── Payment failed ── */}
      {payment?.status === 'failed' && (
        <div className="card text-center py-10">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#fee2e2' }}>
            <AlertCircle size={28} color="#ba1a1a" />
          </div>
          <h2 className="text-base font-bold mb-2" style={{ color: '#0b1c30' }}>
            Payment was not completed
          </h2>
          <p className="text-sm mb-6" style={{ color: '#444651' }}>
            The CamPay payment initiated by {employer?.full_name} was declined or timed out.
            Please contact them directly to arrange payment.
          </p>
          <Link to={`/worker/jobs/${jobId}/chat`} className="btn-primary">Open Chat</Link>
        </div>
      )}
    </div>
  )
}
