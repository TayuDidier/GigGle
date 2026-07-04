import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ShieldCheck, CheckCircle, Clock, AlertCircle, Star, Send } from 'lucide-react'
import { getJobById } from '../../api/jobs.api'
import { getEscrowForJob, PROVIDER_LABEL } from '../../api/payments.api'
import { queryKeys } from '../../constants/queryKeys'
import IconBadge from '../../components/ui/IconBadge'

const XAF = (n) => `${Number(n || 0).toLocaleString('fr-CM')} XAF`

export default function ConfirmPayment() {
  const { id: jobId } = useParams()

  const { data: job } = useQuery({
    queryKey: queryKeys.jobs.byId(jobId),
    queryFn:  () => getJobById(jobId),
    enabled:  !!jobId,
  })

  const { data: escrow, isLoading } = useQuery({
    queryKey: queryKeys.escrows.forJob(jobId),
    queryFn:  () => getEscrowForJob(jobId),
    enabled:  !!jobId,
    // Keep polling while the payment is mid-flight so the worker sees updates live.
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return s === 'pending_funding' || s === 'held' || s === 'releasing' ? 6_000 : false
    },
  })

  const employer = job?.employer
  const status   = escrow?.status ?? null

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-10" style={{ minHeight: '100%' }}>
      <Link to="/worker/applications" className="inline-flex items-center gap-1 text-sm font-medium mb-6" style={{ color: '#00236f' }}>
        <ChevronLeft size={16} /> My Applications
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <IconBadge icon={ShieldCheck} tone="navy" size="md" />
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0b1c30' }}>Payment</h1>
          <p className="text-sm" style={{ color: '#444651' }}>{job?.title ?? 'Loading…'}</p>
        </div>
      </div>

      {/* Employer card */}
      {employer && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-5" style={{ background: '#eff4ff', border: '1px solid #c7d7fd' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden" style={{ background: '#00236f', color: '#fff' }}>
            {employer.avatar_url ? <img src={employer.avatar_url} alt="" className="w-full h-full object-cover" /> : employer.full_name?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#0b1c30' }}>Employer: {employer.full_name}</p>
            <p className="text-xs" style={{ color: '#444651' }}>
              Agreed pay: <strong style={{ color: '#ef9900' }}>{XAF(job?.pay)}</strong>
            </p>
          </div>
        </div>
      )}

      {/* ── No escrow yet ── */}
      {!escrow && (
        <div className="card text-center py-10">
          <IconBadge icon={Clock} tone="orange" size="md" className="mx-auto mb-4" />
          <h2 className="text-base font-bold mb-2" style={{ color: '#0b1c30' }}>Waiting for funding</h2>
          <p className="text-sm mb-6" style={{ color: '#444651' }}>
            {employer?.full_name} hasn't funded the escrow yet. Once they do, your payment is secured before you start.
          </p>
          <Link to="/worker/applications" className="btn-secondary">Back to Applications</Link>
        </div>
      )}

      {/* ── Funding in progress ── */}
      {status === 'pending_funding' && (
        <div className="card text-center py-10">
          <IconBadge icon={Clock} tone="orange" size="md" className="mx-auto mb-4" />
          <h2 className="text-base font-bold mb-2" style={{ color: '#0b1c30' }}>Funding in progress</h2>
          <p className="text-sm mb-4" style={{ color: '#444651' }}>
            {employer?.full_name} is funding the escrow now. This page will update once it's secured.
          </p>
          <Link to="/worker/applications" className="btn-secondary">Back to Applications</Link>
        </div>
      )}

      {/* ── Held — payment secured, awaiting completion + release ── */}
      {status === 'held' && (
        <div className="card space-y-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#dcfce7', border: '1px solid #86efac' }}>
            <ShieldCheck size={18} color="#166534" className="shrink-0" />
            <p className="text-sm font-semibold" style={{ color: '#166534' }}>Payment secured in escrow 🔒</p>
          </div>
          <div className="space-y-2 p-4 rounded-xl" style={{ background: '#f8f9ff', border: '1px solid #e5eeff' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#444651' }}>You'll receive</span>
              <strong style={{ color: '#006c4e' }}>{XAF(escrow.payout_amount)}</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#444651' }}>Method</span>
              <strong style={{ color: '#0b1c30' }}>{PROVIDER_LABEL[escrow.provider_in] ?? 'Mobile money'}</strong>
            </div>
          </div>
          <p className="text-sm" style={{ color: '#444651' }}>
            {employer?.full_name} has secured your payment. You'll be paid automatically once they mark the job
            complete and release it. No need to chase them — the money is already held.
          </p>
        </div>
      )}

      {/* ── Releasing — payout on the way ── */}
      {status === 'releasing' && (
        <div className="card text-center py-10">
          <IconBadge icon={Send} tone="green" size="md" bg="#dcfce7" color="#166534" className="mx-auto mb-4" />
          <h2 className="text-base font-bold mb-2" style={{ color: '#0b1c30' }}>Payment on the way</h2>
          <p className="text-sm" style={{ color: '#444651' }}>
            {employer?.full_name} released <strong>{XAF(escrow.payout_amount)}</strong>. It should land in your
            {' '}{PROVIDER_LABEL[escrow.provider_out] ?? 'mobile money'} account in a few seconds.
          </p>
        </div>
      )}

      {/* ── Released — paid ── */}
      {status === 'released' && (
        <div className="card space-y-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#dcfce7', border: '1px solid #86efac' }}>
            <CheckCircle size={18} color="#166534" className="shrink-0" />
            <p className="text-sm font-semibold" style={{ color: '#166534' }}>You've been paid 🎉</p>
          </div>
          <div className="space-y-2 p-4 rounded-xl" style={{ background: '#f8f9ff', border: '1px solid #e5eeff' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#444651' }}>Amount received</span>
              <strong style={{ color: '#006c4e' }}>{XAF(escrow.payout_amount)}</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#444651' }}>Sent to</span>
              <strong style={{ color: '#0b1c30' }}>+237{escrow.worker_phone}</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#444651' }}>Fapshi reference</span>
              <strong className="text-xs font-mono" style={{ color: '#0b1c30' }}>{escrow.payout_trans_id ?? '—'}</strong>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <Link to={`/worker/jobs/${jobId}/rate`} className="btn-primary flex items-center justify-center gap-2">
              <Star size={15} /> Rate {employer?.full_name}
            </Link>
            <Link to="/worker/applications" className="btn-secondary text-center">Back to Applications</Link>
          </div>
        </div>
      )}

      {/* ── Failed ── */}
      {status === 'failed' && (
        <div className="card text-center py-10">
          <IconBadge icon={AlertCircle} tone="alert" size="md" bg="#fee2e2" className="mx-auto mb-4" />
          <h2 className="text-base font-bold mb-2" style={{ color: '#0b1c30' }}>Payment didn't go through</h2>
          <p className="text-sm mb-6" style={{ color: '#444651' }}>
            The escrow payment for this job failed. Message {employer?.full_name} to sort it out.
          </p>
          <Link to={`/worker/jobs/${jobId}/chat`} className="btn-primary">Open Chat</Link>
        </div>
      )}
    </div>
  )
}
