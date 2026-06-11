import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Star, MessageSquare, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getMyApplications } from '../../api/applications.api'
import { queryKeys } from '../../constants/queryKeys'
import { CategoryBadge } from '../../components/jobs/CategoryBadge'
import { JobStatusBadge } from '../../components/jobs/JobStatusBadge'

function relativeTime(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff} days ago`
}

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
]

const APP_STATUS_CONFIG = {
  pending:  { label: 'Pending',  bg: '#fef3c7', color: '#b45309' },
  accepted: { label: 'Accepted', bg: '#dcfce7', color: '#166534' },
  rejected: { label: 'Rejected', bg: '#f3f4f6', color: '#374151' },
}

function ApplicationCard({ app }) {
  const job = app.job || {}
  const employer = job.employer || {}
  const statusCfg = APP_STATUS_CONFIG[app.status] || APP_STATUS_CONFIG.pending

  return (
    <div className="bg-white border rounded-xl shadow-sm p-4" style={{ borderColor: '#c5c5d3' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <CategoryBadge value={job.category} />
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
          style={{ background: statusCfg.bg, color: statusCfg.color }}
        >
          {statusCfg.label}
        </span>
      </div>

      <Link to={`/worker/jobs/${job.id}`}>
        <h3 className="font-semibold text-base mb-1 hover:underline" style={{ color: '#0b1c30' }}>{job.title}</h3>
      </Link>

      <div className="flex items-center gap-2 text-sm mb-2" style={{ color: '#444651' }}>
        {employer.full_name && (
          <span className="flex items-center gap-1">
            <span>{employer.full_name}</span>
            {employer.rating_average && (
              <span className="flex items-center gap-0.5">
                <Star size={11} fill="#ef9900" color="#ef9900" />
                <span>{Number(employer.rating_average).toFixed(1)}</span>
              </span>
            )}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-base font-bold" style={{ color: '#ef9900' }}>
          {Number(job.pay).toLocaleString('fr-CM')} XAF
        </span>
        <span className="text-xs" style={{ color: '#444651' }}>
          Applied {relativeTime(app.created_at)}
        </span>
      </div>

      {/* Chat + action buttons */}
      {(app.status === 'pending' || app.status === 'accepted') && job.status !== 'cancelled' && (
        <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: '#e5eeff' }}>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/worker/jobs/${job.id}/chat`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
              style={{ background: '#e5eeff', color: '#00236f' }}
            >
              <MessageSquare size={13} />
              {app.status === 'pending' ? 'Message Employer' : 'Open Chat'}
            </Link>

            {app.status === 'accepted' && job.status === 'completed' && (
              <>
                <Link
                  to={`/worker/jobs/${job.id}/confirm-payment`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
                  style={{ background: '#fff8e6', color: '#b45309', border: '1px solid #f0c040' }}
                >
                  <CreditCard size={13} /> Confirm Payment
                </Link>
                <Link
                  to={`/worker/jobs/${job.id}/rate`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
                  style={{ background: '#eff4ff', color: '#00236f', border: '1px solid #c7d7fd' }}
                >
                  <Star size={13} /> Rate Employer
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MyApplications() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('all')

  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: queryKeys.applications.forWorker(profile?.id),
    queryFn: () => getMyApplications(profile.id),
    enabled: !!profile?.id,
  })

  const filtered = useMemo(() => {
    if (activeTab === 'all') return applications
    return applications.filter(a => a.status === activeTab)
  }, [applications, activeTab])

  const counts = useMemo(() => {
    return STATUS_TABS.reduce((acc, tab) => {
      acc[tab.key] = tab.key === 'all'
        ? applications.length
        : applications.filter(a => a.status === tab.key).length
      return acc
    }, {})
  }, [applications])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6" style={{ background: '#f8f9ff', minHeight: '100%' }}>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold" style={{ color: '#0b1c30' }}>My Applications</h1>
        <p className="text-sm" style={{ color: '#444651' }}>
          {isLoading ? 'Loading…' : `${applications.length} total application${applications.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
          {error.message || 'Failed to load applications.'}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: '#e5eeff' }}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-xs py-2 px-2 rounded-lg font-medium transition-all ${
              activeTab === tab.key ? 'bg-white shadow-sm' : ''
            }`}
            style={{ color: activeTab === tab.key ? '#00236f' : '#444651' }}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className="ml-1 text-xs">({counts[tab.key]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock size={48} className="mb-4 opacity-30" style={{ color: '#444651' }} />
          <p className="font-semibold mb-1" style={{ color: '#0b1c30' }}>
            {activeTab === 'all' ? 'No applications yet' : `No ${activeTab} applications`}
          </p>
          <p className="text-sm" style={{ color: '#444651' }}>
            {activeTab === 'all'
              ? 'Browse available jobs and apply to get started.'
              : `You have no ${activeTab} applications at this time.`}
          </p>
          {activeTab === 'all' && (
            <Link to="/worker/browse" className="btn-primary mt-4 text-sm">
              Browse Jobs
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  )
}
