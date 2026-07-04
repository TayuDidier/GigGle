import { Link } from 'react-router-dom'
import { AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react'

export function VerificationBanner({ profile }) {
  const status = profile?.verification_status
  if (!status || status === 'approved') return null

  const verifyTo = `/${profile.role}/verify`
  const isRejected = status === 'rejected'
  const isPending = status === 'pending'

  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border"
      style={isRejected
        ? { background: '#ffdad6', borderColor: '#f5b5ab' }
        : { background: '#fffbeb', borderColor: '#f0c040' }}
    >
      {isRejected
        ? <AlertCircle size={18} style={{ color: '#ba1a1a', flexShrink: 0 }} />
        : <ShieldAlert size={18} style={{ color: '#b36b00', flexShrink: 0 }} />}
      <p className="text-sm font-medium flex-1" style={isRejected ? { color: '#ba1a1a' } : { color: '#7c5e00' }}>
        {isRejected
          ? `Verification rejected: ${profile.verification_rejection_reason || 'please resubmit your document.'}`
          : isPending
            ? 'Your identity verification is pending review.'
            : 'Verify your identity to unlock the full platform.'}
      </p>
      <Link
        to={verifyTo}
        className="text-sm font-bold flex items-center gap-1 shrink-0"
        style={isRejected ? { color: '#ba1a1a' } : { color: '#b36b00' }}
      >
        {isPending ? 'View status' : 'Verify now'} <ArrowRight size={14} />
      </Link>
    </div>
  )
}
