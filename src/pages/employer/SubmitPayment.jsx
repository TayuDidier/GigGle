import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, ShieldCheck, CheckCircle, Lock,
  AlertCircle, Smartphone, RefreshCw, Send,
} from 'lucide-react'
import { getJobById } from '../../api/jobs.api'
import { getEscrowForJob } from '../../api/payments.api'
import { fundEscrow, releaseEscrow, checkEscrowStatus } from '../../api/fapshi.api'
import { queryKeys } from '../../constants/queryKeys'

// ─── Phone helpers (Fapshi uses the 9-digit local form 6XXXXXXXX) ─────────────
function normPhone(raw) {
  const d = String(raw ?? '').replace(/\D/g, '')
  if (d.startsWith('237') && d.length === 12) return d.slice(3)
  return d
}
function isValidPhone(raw) {
  return /^6\d{8}$/.test(normPhone(raw))
}
function detectProvider(raw) {
  const pfx = parseInt(normPhone(raw).slice(0, 3), 10)
  if ((pfx >= 650 && pfx <= 659) || (pfx >= 670 && pfx <= 689)) return 'MTN MoMo'
  return 'Orange Money'
}
const XAF = (n) => `${Number(n || 0).toLocaleString('fr-CM')} XAF`

// ─── Progress steps ───────────────────────────────────────────────────────────
function Step({ n, label, active, done }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: done ? '#006c4e' : active ? '#00236f' : '#e5eeff', color: done || active ? '#fff' : '#9ca3af' }}>
        {done ? '✓' : n}
      </span>
      <span className="text-sm font-medium" style={{ color: done ? '#006c4e' : active ? '#0b1c30' : '#9ca3af' }}>
        {label}
      </span>
    </div>
  )
}

export default function SubmitPayment() {
  const { id: jobId } = useParams()
  const queryClient   = useQueryClient()

  const [phone, setPhone]             = useState('')
  const [workerPhone, setWorkerPhone] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')

  const { data: job } = useQuery({
    queryKey: queryKeys.jobs.byId(jobId),
    queryFn:  () => getJobById(jobId),
    enabled:  !!jobId,
  })

  const { data: escrow, isLoading } = useQuery({
    queryKey: queryKeys.escrows.forJob(jobId),
    queryFn:  () => getEscrowForJob(jobId),
    enabled:  !!jobId,
  })

  const status       = escrow?.status ?? null
  const jobCompleted = job?.status === 'completed'
  const worker       = job?.selected_worker

  // Prefill the worker payout number from their profile once known.
  useEffect(() => {
    if (worker?.phone && !workerPhone) setWorkerPhone(normPhone(worker.phone))
  }, [worker, workerPhone])

  // Poll while a leg is in flight; refetch the escrow row when status changes.
  const inFlight = status === 'pending_funding' || status === 'releasing'
  const { data: poll } = useQuery({
    queryKey: ['escrow-status', jobId],
    queryFn:  () => checkEscrowStatus(jobId),
    enabled:  inFlight,
    refetchInterval: 5_000,
    staleTime: 0,
  })
  useEffect(() => {
    if (poll?.status && poll.status !== status) {
      queryClient.invalidateQueries({ queryKey: queryKeys.escrows.forJob(jobId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.byId(jobId) })
    }
  }, [poll, status, jobId, queryClient])

  // Money breakdown (worker bears the commission)
  const gross      = escrow?.gross_amount      ?? Math.round(Number(job?.pay ?? 0))
  const commission = escrow?.commission_amount ?? null
  const payout     = escrow?.payout_amount     ?? null

  async function handleFund() {
    if (!isValidPhone(phone)) { setError('Enter a valid Cameroonian number, e.g. 6 70 00 00 00'); return }
    setSubmitting(true); setError('')
    try {
      await fundEscrow({ jobId, phoneNumber: normPhone(phone) })
      queryClient.invalidateQueries({ queryKey: queryKeys.escrows.forJob(jobId) })
    } catch (e) { setError(e.message ?? 'Failed to start the payment.') }
    finally { setSubmitting(false) }
  }

  async function handleRelease() {
    if (!isValidPhone(workerPhone)) { setError("Enter the worker's mobile money number to pay them"); return }
    setSubmitting(true); setError('')
    try {
      await releaseEscrow({ jobId, workerPhone: normPhone(workerPhone) })
      queryClient.invalidateQueries({ queryKey: queryKeys.escrows.forJob(jobId) })
    } catch (e) { setError(e.message ?? 'Failed to release the payout.') }
    finally { setSubmitting(false) }
  }

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
    </div>
  )

  // Which high-level phase are we in?
  const phase =
    status === 'released'              ? 'released'
    : status === 'releasing'           ? 'releasing'
    : status === 'held' && jobCompleted ? 'release_form'
    : status === 'held'                ? 'held_waiting'
    : status === 'pending_funding'     ? 'funding_pending'
    : 'fund_form' // null or failed

  const provider = phase === 'release_form' ? detectProvider(workerPhone) : detectProvider(phone)
  const isMtn    = provider === 'MTN MoMo'

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-10" style={{ minHeight: '100%' }}>
      <Link to={`/employer/jobs/${jobId}`} className="inline-flex items-center gap-1 text-sm font-medium mb-6" style={{ color: '#00236f' }}>
        <ChevronLeft size={16} /> Back to Job
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: '#eaf3ff' }}>
          <ShieldCheck size={22} style={{ color: '#00236f' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0b1c30' }}>Escrow Payment</h1>
          <p className="text-sm" style={{ color: '#444651' }}>{job?.title ?? 'Loading…'}</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-4 mb-6 px-2">
        <Step n={1} label="Fund escrow" active={phase === 'fund_form' || phase === 'funding_pending'} done={['held_waiting', 'release_form', 'releasing', 'released'].includes(phase)} />
        <div className="flex-1 h-px" style={{ background: '#e4e4ef' }} />
        <Step n={2} label="Release to worker" active={phase === 'release_form' || phase === 'releasing'} done={phase === 'released'} />
        <div className="flex-1 h-px" style={{ background: '#e4e4ef' }} />
        <Step n={3} label="Paid" active={phase === 'released'} done={false} />
      </div>

      {/* Worker + breakdown card */}
      {worker && (
        <div className="p-4 rounded-xl mb-5" style={{ background: '#eff4ff', border: '1px solid #c7d7fd' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden" style={{ background: '#00236f', color: '#fff' }}>
              {worker.avatar_url ? <img src={worker.avatar_url} alt="" className="w-full h-full object-cover" /> : worker.full_name?.charAt(0)}
            </div>
            <p className="font-semibold text-sm" style={{ color: '#0b1c30' }}>Worker: {worker.full_name}</p>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span style={{ color: '#444651' }}>You pay</span><strong style={{ color: '#0b1c30' }}>{XAF(gross)}</strong></div>
            {commission != null && (
              <div className="flex justify-between"><span style={{ color: '#444651' }}>GigGle fee</span><span style={{ color: '#9ca3af' }}>− {XAF(commission)}</span></div>
            )}
            {payout != null && (
              <div className="flex justify-between pt-1.5 border-t" style={{ borderColor: '#c7d7fd' }}>
                <span style={{ color: '#444651' }}>Worker receives</span><strong style={{ color: '#006c4e' }}>{XAF(payout)}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm mb-4" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
          <AlertCircle size={15} className="shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {/* ── PHASE: FUND FORM ── */}
      {phase === 'fund_form' && (
        <div className="card space-y-5">
          <p className="text-sm leading-relaxed" style={{ color: '#444651' }}>
            Secure the payment to start the job. Enter your MTN MoMo or Orange Money number — Fapshi will send a
            prompt to your phone. The money is held safely and only released to {worker?.full_name ?? 'the worker'} when
            you mark the job complete.
          </p>
          <div>
            <label className="label">Your mobile money number *</label>
            <div className="flex gap-2 items-center">
              <span className="text-sm font-semibold px-3 py-2.5 rounded-lg border" style={{ borderColor: '#c5c5d3', color: '#444651', background: '#f8f9ff' }}>+237</span>
              <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setError('') }}
                placeholder="6XX XXX XXX" className="input-field flex-1" maxLength={12} />
            </div>
            {phone && isValidPhone(phone) && (
              <p className="text-xs mt-1 font-medium" style={{ color: isMtn ? '#c47d00' : '#cc4400' }}>Detected: {provider}</p>
            )}
          </div>
          <button onClick={handleFund} disabled={!isValidPhone(phone) || submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
            {submitting
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending request…</>
              : <><Smartphone size={16} /> Fund Escrow · {XAF(gross)}</>}
          </button>
        </div>
      )}

      {/* ── PHASE: FUNDING PENDING ── */}
      {phase === 'funding_pending' && (
        <div className="card text-center space-y-5">
          <div className="relative w-20 h-20 mx-auto mt-2">
            <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: '#ffcf00' }} />
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#fff8e0' }}>
              <Smartphone size={32} style={{ color: '#a07800' }} />
            </div>
          </div>
          <div>
            <p className="text-base font-bold mb-1" style={{ color: '#0b1c30' }}>Check your phone</p>
            <p className="text-sm leading-relaxed" style={{ color: '#444651' }}>
              Approve the {XAF(gross)} prompt in your mobile money app to secure the payment.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
            <RefreshCw size={13} className="animate-spin" /> Checking every 5 seconds…
          </div>
          <p className="text-xs" style={{ color: '#9ca3af' }}>This page updates automatically. Don't close or refresh.</p>
        </div>
      )}

      {/* ── PHASE: HELD, JOB NOT YET COMPLETE ── */}
      {phase === 'held_waiting' && (
        <div className="card text-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: '#dcfce7' }}>
            <ShieldCheck size={32} color="#166534" />
          </div>
          <div>
            <h2 className="text-base font-bold mb-1" style={{ color: '#0b1c30' }}>Funds secured in escrow</h2>
            <p className="text-sm" style={{ color: '#444651' }}>
              {XAF(gross)} is being held safely. Once {worker?.full_name} finishes, mark the job complete to
              release {XAF(payout)} to them.
            </p>
          </div>
          <Link to={`/employer/jobs/${jobId}`} className="btn-secondary">Back to Job</Link>
        </div>
      )}

      {/* ── PHASE: RELEASE FORM ── */}
      {phase === 'release_form' && (
        <div className="card space-y-5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#dcfce7', border: '1px solid #86efac' }}>
            <ShieldCheck size={18} color="#166534" className="shrink-0" />
            <p className="text-sm font-semibold" style={{ color: '#166534' }}>Escrow funded — ready to release</p>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#444651' }}>
            The job is complete. Release {XAF(payout)} to {worker?.full_name} via mobile money. Confirm their number below.
          </p>
          <div>
            <label className="label">Worker's mobile money number *</label>
            <div className="flex gap-2 items-center">
              <span className="text-sm font-semibold px-3 py-2.5 rounded-lg border" style={{ borderColor: '#c5c5d3', color: '#444651', background: '#f8f9ff' }}>+237</span>
              <input type="tel" value={workerPhone} onChange={e => { setWorkerPhone(e.target.value); setError('') }}
                placeholder="6XX XXX XXX" className="input-field flex-1" maxLength={12} />
            </div>
            {workerPhone && isValidPhone(workerPhone) && (
              <p className="text-xs mt-1 font-medium" style={{ color: isMtn ? '#c47d00' : '#cc4400' }}>Detected: {provider}</p>
            )}
          </div>
          <button onClick={handleRelease} disabled={!isValidPhone(workerPhone) || submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: '#006c4e' }}>
            {submitting
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Releasing…</>
              : <><Send size={16} /> Release {XAF(payout)} to {worker?.full_name?.split(' ')[0]}</>}
          </button>
        </div>
      )}

      {/* ── PHASE: RELEASING (payout in flight) ── */}
      {phase === 'releasing' && (
        <div className="card text-center space-y-5">
          <div className="relative w-20 h-20 mx-auto mt-2">
            <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: '#34d399' }} />
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#dcfce7' }}>
              <Send size={30} style={{ color: '#166534' }} />
            </div>
          </div>
          <div>
            <p className="text-base font-bold mb-1" style={{ color: '#0b1c30' }}>Sending payout…</p>
            <p className="text-sm leading-relaxed" style={{ color: '#444651' }}>
              {XAF(payout)} is on its way to {worker?.full_name}. This usually takes a few seconds.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
            <RefreshCw size={13} className="animate-spin" /> Confirming payout…
          </div>
        </div>
      )}

      {/* ── PHASE: RELEASED ── */}
      {phase === 'released' && (
        <div className="card text-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: '#dcfce7' }}>
            <CheckCircle size={32} color="#166534" />
          </div>
          <div>
            <h2 className="text-base font-bold mb-1" style={{ color: '#0b1c30' }}>Payout complete</h2>
            <p className="text-sm" style={{ color: '#444651' }}>
              {XAF(payout)} was sent to {worker?.full_name}. They'll be notified right away.
            </p>
          </div>
          {escrow?.payout_trans_id && (
            <p className="text-xs px-4 py-2 rounded-lg inline-block" style={{ background: '#f0fdf4', color: '#166534' }}>
              Fapshi ref: <strong>{escrow.payout_trans_id}</strong>
            </p>
          )}
          <div className="flex flex-col gap-2 pt-2">
            <Link to={`/employer/jobs/${jobId}/rate`} className="btn-primary">Rate {worker?.full_name} →</Link>
            <Link to={`/employer/jobs/${jobId}`} className="btn-secondary">Back to Job</Link>
          </div>
        </div>
      )}

      {/* Retry hint after a failed attempt */}
      {phase === 'fund_form' && status === 'failed' && (
        <div className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-lg text-sm" style={{ background: '#fef3c7', color: '#b45309' }}>
          <Lock size={14} /> The previous attempt didn't go through. You can try funding again above.
        </div>
      )}

      {/* Powered by Fapshi */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <span className="text-xs" style={{ color: '#9ca3af' }}>Secured by</span>
        <span className="text-xs font-bold" style={{ color: '#00236f' }}>Fapshi</span>
        <span className="text-xs" style={{ color: '#9ca3af' }}>· MTN MoMo &amp; Orange Money</span>
      </div>
    </div>
  )
}
