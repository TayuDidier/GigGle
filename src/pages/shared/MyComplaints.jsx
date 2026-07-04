import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Flag, ChevronRight, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getMyReports } from '../../api/reports.api'

const STATUS_CFG = {
  open:      { label: 'Under Review', icon: Clock,         bg: '#fff3cd', color: '#ef9900' },
  resolved:  { label: 'Resolved',     icon: CheckCircle,   bg: '#97f5cc', color: '#006c4e' },
  dismissed: { label: 'Dismissed',    icon: XCircle,       bg: '#f4f4f4', color: '#444651' },
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 30)  return `${d} days ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function extractCategory(reason) {
  const match = reason?.match(/^\[(.+)\]/)
  return match ? match[1] : null
}

function extractDescription(reason) {
  return reason?.replace(/^\[.+\]\n\n/, '') || reason || ''
}

export default function MyComplaints({ newComplaintParams = '' }) {
  const { profile } = useAuth()

  const { data: complaints = [], isLoading, error } = useQuery({
    queryKey: ['reports', 'mine', profile?.id],
    queryFn: () => getMyReports(profile.id),
    enabled: !!profile?.id,
  })

  const open       = complaints.filter(c => c.status === 'open').length
  const resolved   = complaints.filter(c => c.status === 'resolved').length
  const dismissed  = complaints.filter(c => c.status === 'dismissed').length

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-10" style={{ minHeight: '100%' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#fee2e2' }}>
            <Flag size={18} color="#ba1a1a" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#0b1c30' }}>My Complaints</h1>
            <p className="text-xs" style={{ color: '#444651' }}>Submitted to the admin team</p>
          </div>
        </div>
        <Link
          to={`/complaint/new${newComplaintParams}`}
          className="text-sm font-semibold px-4 py-2 rounded-lg text-white flex items-center gap-1.5"
          style={{ background: '#ba1a1a' }}
        >
          <Flag size={14} />
          New
        </Link>
      </div>

      {/* Summary stats */}
      {complaints.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: 'Under Review', value: open,      bg: '#fff3cd', color: '#ef9900' },
            { label: 'Resolved',     value: resolved,  bg: '#97f5cc', color: '#006c4e' },
            { label: 'Dismissed',    value: dismissed, bg: '#f4f4f4', color: '#444651' },
          ].map(s => (
            <div key={s.label} className="text-center py-3 rounded-xl" style={{ background: s.bg }}>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5 font-medium" style={{ color: s.color }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg text-sm" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
          <AlertCircle size={15} /> {error.message || 'Failed to load complaints.'}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#ba1a1a', borderTopColor: 'transparent' }} />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && complaints.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#f3f4f6' }}>
            <Flag size={28} color="#9ca3af" />
          </div>
          <p className="font-semibold mb-1" style={{ color: '#0b1c30' }}>No complaints filed</p>
          <p className="text-sm mb-5" style={{ color: '#444651' }}>
            If you have an issue with a job or user, file a complaint and our team will review it.
          </p>
          <Link
            to={`/complaint/new${newComplaintParams}`}
            className="font-semibold px-5 py-2.5 rounded-lg text-white text-sm"
            style={{ background: '#ba1a1a' }}
          >
            File a Complaint
          </Link>
        </div>
      )}

      {/* Complaint cards */}
      {!isLoading && complaints.length > 0 && (
        <div className="space-y-3">
          {complaints.map(c => {
            const cfg = STATUS_CFG[c.status] || STATUS_CFG.open
            const StatusIcon = cfg.icon
            const category = extractCategory(c.reason)
            const description = extractDescription(c.reason)

            return (
              <div key={c.id} className="bg-white border rounded-xl shadow-sm p-4" style={{ borderColor: '#c5c5d3' }}>

                {/* Top row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    <StatusIcon size={12} />
                    {cfg.label}
                  </span>
                  <span className="text-xs" style={{ color: '#9ca3af' }}>{timeAgo(c.created_at)}</span>
                </div>

                {/* Category pill */}
                {category && (
                  <p className="text-xs font-semibold mb-1.5" style={{ color: '#ba1a1a' }}>
                    {category}
                  </p>
                )}

                {/* Description */}
                <p className="text-sm line-clamp-2 mb-2" style={{ color: '#374151' }}>
                  {description}
                </p>

                {/* Job + Person context */}
                <div className="flex flex-wrap gap-3 text-xs mb-2" style={{ color: '#666' }}>
                  {c.job && (
                    <span className="flex items-center gap-1">
                      <span style={{ color: '#9ca3af' }}>Job:</span>
                      <span className="font-medium truncate max-w-[140px]" style={{ color: '#0b1c30' }}>
                        {c.job.title}
                      </span>
                    </span>
                  )}
                  {c.reported && (
                    <span className="flex items-center gap-1">
                      <span style={{ color: '#9ca3af' }}>Against:</span>
                      <span className="font-medium" style={{ color: '#0b1c30' }}>{c.reported.full_name}</span>
                    </span>
                  )}
                </div>

                {/* Admin note */}
                {c.admin_note && (
                  <div className="mt-2 px-3 py-2 rounded-lg text-xs" style={{ background: '#f8f9ff', borderLeft: '3px solid #00236f' }}>
                    <p className="font-semibold mb-0.5" style={{ color: '#00236f' }}>Admin response:</p>
                    <p style={{ color: '#374151' }}>{c.admin_note}</p>
                    {c.resolved_at && (
                      <p className="mt-1" style={{ color: '#9ca3af' }}>{timeAgo(c.resolved_at)}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
