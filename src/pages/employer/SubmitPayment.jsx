import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, CreditCard, CheckCircle, Clock,
  AlertCircle, Smartphone, RefreshCw, Hash,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getJobById } from '../../api/jobs.api'
import { getPaymentForJob } from '../../api/payments.api'
import { initiatePayment, checkPaymentStatus } from '../../api/campay.api'
import { queryKeys } from '../../constants/queryKeys'

// ─── Phase constants ──────────────────────────────────────────────────────────
// form      → employer fills in phone number
// initiating → calling Edge Function
// pending   → waiting for employer to approve on phone (polling)
// confirmed → CamPay confirmed the debit
// failed    → CamPay declined / timed out
const PHASE = { FORM: 'form', INITIATING: 'initiating', PENDING: 'pending', CONFIRMED: 'confirmed', FAILED: 'failed' }

// ─── Phone number helpers ─────────────────────────────────────────────────────
function normPhone(raw) {
  const d = raw.replace(/\D/g, '')
  if (d.startsWith('237') && d.length === 12) return d
  if (d.length === 9) return `237${d}`
  return d
}
function isValidPhone(raw) {
  const n = normPhone(raw)
  return n.length === 12 && n.startsWith('237')
}
function detectProvider(raw) {
  const local = normPhone(raw).replace(/^237/, '')
  const pfx = parseInt(local.slice(0, 3), 10)
  if ((pfx >= 650 && pfx <= 659) || (pfx >= 670 && pfx <= 689)) return 'MTN MoMo'
  return 'Orange Money'
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Step({ n, label, active, done }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{
          background: done ? '#006c4e' : active ? '#00236f' : '#e5eeff',
          color:      done || active ? '#fff' : '#9ca3af',
        }}
      >
        {done ? '✓' : n}
      </span>
      <span className="text-sm font-medium" style={{ color: done ? '#006c4e' : active ? '#0b1c30' : '#9ca3af' }}>
        {label}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SubmitPayment() {
  const { id: jobId } = useParams()
  const { profile }   = useAuth()
  const queryClient   = useQueryClient()

  const [phase,    setPhase]    = useState(PHASE.FORM)
  const [phone,    setPhone]    = useState('')
  const [ussdCode, setUssdCode] = useState(null)
  const [txRef,    setTxRef]    = useState(null)
  const [error,    setError]    = useState('')

  const { data: job } = useQuery({
    queryKey: queryKeys.jobs.byId(jobId),
    queryFn:  () => getJobById(jobId),
    enabled:  !!jobId,
  })

  // Load existing payment — handles page refresh mid-flow
  const { data: existingPayment, isLoading: loadingPayment } = useQuery({
    queryKey: queryKeys.payments.forJob(jobId),
    queryFn:  () => getPaymentForJob(jobId),
    enabled:  !!jobId,
  })

  // Sync phase from DB on first load (e.g. user refreshes mid-flow)
  useEffect(() => {
    if (!existingPayment) return
    if (existingPayment.status === 'confirmed') setPhase(PHASE.CONFIRMED)
    else if (existingPayment.status === 'failed')  setPhase(PHASE.FAILED)
    else if (existingPayment.status === 'pending') {
      setTxRef(existingPayment.transaction_ref)
      setPhone(existingPayment.phone_number ?? '')
      setPhase(PHASE.PENDING)
    }
  }, [existingPayment])

  // Poll CamPay status while in PENDING phase
  const { data: statusData } = useQuery({
    queryKey: ['campay-status', jobId],
    queryFn:  () => checkPaymentStatus(jobId),
    enabled:  phase === PHASE.PENDING,
    refetchInterval: 5_000,
    staleTime: 0,
  })

  useEffect(() => {
    if (!statusData) return
    if (statusData.status === 'confirmed') {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.forJob(jobId) })
      setPhase(PHASE.CONFIRMED)
    }
    if (statusData.status === 'failed') {
      setPhase(PHASE.FAILED)
      setError('The payment was declined or could not be completed. You can try again.')
    }
  }, [statusData, jobId, queryClient])

  // ── Initiate payment ────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!isValidPhone(phone)) { setError('Enter a valid Cameroonian number, e.g. 670 000 000'); return }
    setError('')
    setPhase(PHASE.INITIATING)
    try {
      const result = await initiatePayment({
        jobId,
        phoneNumber: phone,
        amount: Number(job?.pay),
      })
      setTxRef(result.transaction_ref)
      setUssdCode(result.ussd_code ?? null)
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.forJob(jobId) })
      setPhase(PHASE.PENDING)
    } catch (err) {
      setError(err.message ?? 'Failed to initiate payment. Please try again.')
      setPhase(PHASE.FORM)
    }
  }

  const worker    = job?.selected_worker
  const provider  = phone ? detectProvider(phone) : null
  const isMtn     = provider === 'MTN MoMo'

  if (loadingPayment) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-10" style={{ minHeight: '100%' }}>

      {/* Back */}
      <Link to={`/employer/jobs/${jobId}`}
        className="inline-flex items-center gap-1 text-sm font-medium mb-6"
        style={{ color: '#00236f' }}>
        <ChevronLeft size={16} /> Back to Job
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ background: '#fff8e6' }}>
          <CreditCard size={22} style={{ color: '#ef9900' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0b1c30' }}>Pay via CamPay</h1>
          <p className="text-sm" style={{ color: '#444651' }}>{job?.title ?? 'Loading…'}</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-4 mb-6 px-2">
        <Step n={1} label="Enter phone" active={phase === PHASE.FORM || phase === PHASE.INITIATING} done={phase !== PHASE.FORM && phase !== PHASE.INITIATING} />
        <div className="flex-1 h-px" style={{ background: '#e4e4ef' }} />
        <Step n={2} label="Approve on phone" active={phase === PHASE.PENDING} done={phase === PHASE.CONFIRMED} />
        <div className="flex-1 h-px" style={{ background: '#e4e4ef' }} />
        <Step n={3} label="Confirmed" active={phase === PHASE.CONFIRMED} done={false} />
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
            <p className="font-semibold text-sm" style={{ color: '#0b1c30' }}>Paying: {worker.full_name}</p>
            <p className="text-xs" style={{ color: '#444651' }}>
              Amount: <strong style={{ color: '#ef9900' }}>
                {Number(job?.pay).toLocaleString('fr-CM')} XAF
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* ── PHASE: FORM ── */}
      {(phase === PHASE.FORM || phase === PHASE.INITIATING) && (
        <div className="card space-y-5">
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#0b1c30' }}>
              How it works
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#444651' }}>
              Enter your MTN MoMo or Orange Money number. CamPay will send a payment
              prompt to your phone. Approve it to complete the payment to {worker?.full_name ?? 'the worker'}.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm"
              style={{ background: '#fee2e2', color: '#ba1a1a' }}>
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Phone input */}
          <div>
            <label className="label">Your mobile money number *</label>
            <div className="flex gap-2 items-center">
              <span className="text-sm font-semibold px-3 py-2.5 rounded-lg border"
                style={{ borderColor: '#c5c5d3', color: '#444651', background: '#f8f9ff' }}>
                +237
              </span>
              <input
                type="tel"
                value={phone.replace(/^237/, '')}
                onChange={e => { setPhone(e.target.value); setError('') }}
                placeholder="6XX XXX XXX"
                className="input-field flex-1"
                maxLength={9}
                disabled={phase === PHASE.INITIATING}
              />
            </div>
            {phone && isValidPhone(phone) && (
              <p className="text-xs mt-1 font-medium" style={{ color: isMtn ? '#c47d00' : '#cc4400' }}>
                Detected: {provider}
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
              MTN prefixes: 650–659, 670–689 · Orange prefixes: 690–699
            </p>
          </div>

          {/* Amount display */}
          <div className="flex justify-between items-center px-4 py-3 rounded-xl"
            style={{ background: '#f8f9ff', border: '1px solid #e5eeff' }}>
            <span className="text-sm" style={{ color: '#444651' }}>Amount to pay</span>
            <span className="text-lg font-bold" style={{ color: '#ef9900' }}>
              {Number(job?.pay).toLocaleString('fr-CM')} XAF
            </span>
          </div>

          <button
            onClick={handlePay}
            disabled={!isValidPhone(phone) || phase === PHASE.INITIATING}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {phase === PHASE.INITIATING ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending payment request…
              </>
            ) : (
              <>
                <Smartphone size={16} />
                Send Payment Request via CamPay
              </>
            )}
          </button>
        </div>
      )}

      {/* ── PHASE: PENDING ── */}
      {phase === PHASE.PENDING && (
        <div className="card text-center space-y-5">
          {/* Animated pulse ring */}
          <div className="relative w-20 h-20 mx-auto mt-2">
            <div className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ background: isMtn ? '#ffcf00' : '#ff6600' }} />
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: isMtn ? '#fff8e0' : '#fff3ec' }}>
              <Smartphone size={32} style={{ color: isMtn ? '#a07800' : '#cc4400' }} />
            </div>
          </div>

          <div>
            <p className="text-base font-bold mb-1" style={{ color: '#0b1c30' }}>
              Check your phone
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#444651' }}>
              CamPay sent a payment prompt to{' '}
              <strong>+{normPhone(phone)}</strong> for{' '}
              <strong>{Number(job?.pay).toLocaleString('fr-CM')} XAF</strong>.{' '}
              Approve it in your {provider} app to complete the payment.
            </p>
          </div>

          {ussdCode && (
            <div className="px-4 py-3 rounded-xl flex items-center gap-3 text-left"
              style={{ background: '#f8f9ff', border: '1px solid #e5eeff' }}>
              <Hash size={16} style={{ color: '#00236f', flexShrink: 0 }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: '#00236f' }}>
                  No app? Dial this USSD code:
                </p>
                <p className="text-base font-bold tracking-wide mt-0.5" style={{ color: '#0b1c30' }}>
                  {ussdCode}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-sm"
            style={{ color: '#9ca3af' }}>
            <RefreshCw size={13} className="animate-spin" />
            Checking payment status every 5 seconds…
          </div>

          <p className="text-xs" style={{ color: '#9ca3af' }}>
            This page will update automatically once your payment is approved.
            Do not close or refresh.
          </p>
        </div>
      )}

      {/* ── PHASE: CONFIRMED ── */}
      {phase === PHASE.CONFIRMED && (
        <div className="card text-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: '#dcfce7' }}>
            <CheckCircle size={32} color="#166534" />
          </div>
          <div>
            <h2 className="text-base font-bold mb-1" style={{ color: '#0b1c30' }}>
              Payment confirmed by CamPay
            </h2>
            <p className="text-sm" style={{ color: '#444651' }}>
              {Number(job?.pay).toLocaleString('fr-CM')} XAF has been collected from your{' '}
              {provider} account. {worker?.full_name} will be notified.
            </p>
          </div>
          {txRef && (
            <p className="text-xs px-4 py-2 rounded-lg inline-block"
              style={{ background: '#f0fdf4', color: '#166534' }}>
              CamPay ref: <strong>{txRef}</strong>
            </p>
          )}
          <div className="flex flex-col gap-2 pt-2">
            <Link to={`/employer/jobs/${jobId}/rate`} className="btn-primary">
              Rate {worker?.full_name} →
            </Link>
            <Link to={`/employer/jobs/${jobId}`} className="btn-secondary">
              Back to Job
            </Link>
          </div>
        </div>
      )}

      {/* ── PHASE: FAILED ── */}
      {phase === PHASE.FAILED && (
        <div className="card text-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: '#fee2e2' }}>
            <AlertCircle size={32} color="#ba1a1a" />
          </div>
          <div>
            <h2 className="text-base font-bold mb-1" style={{ color: '#0b1c30' }}>
              Payment failed
            </h2>
            <p className="text-sm" style={{ color: '#444651' }}>
              {error || 'The payment was not completed. Please check your balance and try again.'}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => { setPhase(PHASE.FORM); setError(''); setTxRef(null) }}
              className="btn-primary"
            >
              Try Again
            </button>
            <Link to={`/employer/jobs/${jobId}`} className="btn-secondary">
              Back to Job
            </Link>
          </div>
        </div>
      )}

      {/* Powered by CamPay badge */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <span className="text-xs" style={{ color: '#9ca3af' }}>Payments powered by</span>
        <span className="text-xs font-bold" style={{ color: '#00236f' }}>CamPay</span>
        <span className="text-xs" style={{ color: '#9ca3af' }}>·</span>
        <span className="text-xs" style={{ color: '#9ca3af' }}>MTN MoMo & Orange Money</span>
      </div>
    </div>
  )
}
