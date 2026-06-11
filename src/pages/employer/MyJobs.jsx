import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { getMyJobsAsEmployer } from '../../api/jobs.api'
import { queryKeys } from '../../constants/queryKeys'
import { CATEGORIES } from '../../constants/categories'
import { PlusCircle, Briefcase, ChevronRight, AlertCircle, Search } from 'lucide-react'

const STATUS_TABS = [
  { value: 'all',         label: 'All' },
  { value: 'open',        label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
]

const STATUS_CONFIG = {
  open:        { label: 'Open',        bg: '#97f5cc', color: '#006c4e' },
  in_progress: { label: 'In Progress', bg: '#e5eeff', color: '#00236f' },
  completed:   { label: 'Completed',   bg: '#f4f4f4', color: '#444651' },
  cancelled:   { label: 'Cancelled',   bg: '#ffdad6', color: '#ba1a1a' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#f4f4f4', color: '#444651' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse space-y-2 p-4">
      <div className="h-4 rounded" style={{ background: '#e5eeff', width: '55%' }} />
      <div className="h-3 rounded" style={{ background: '#e5eeff', width: '35%' }} />
      <div className="h-3 rounded" style={{ background: '#e5eeff', width: '45%' }} />
    </div>
  )
}

export default function MyJobs() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: queryKeys.jobs.mine(profile?.id),
    queryFn: () => getMyJobsAsEmployer(profile.id),
    enabled: !!profile?.id,
  })

  const filtered = jobs.filter(job => {
    const matchStatus = activeTab === 'all' || job.status === activeTab
    const matchSearch = !search || job.title.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const tabCount = (val) =>
    val === 'all' ? jobs.length : jobs.filter(j => j.status === val).length

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0b1c30' }}>My Jobs</h1>
          <p className="text-sm mt-0.5" style={{ color: '#444651' }}>
            {jobs.length} job{jobs.length !== 1 ? 's' : ''} posted
          </p>
        </div>
        <Link to="/employer/post-job" className="btn-primary flex items-center gap-2 shrink-0">
          <PlusCircle size={16} />
          Post a New Job
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-200"
          style={{ borderColor: '#c5c5d3', background: '#fff' }}
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => {
          const count = tabCount(tab.value)
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border"
              style={{
                background: isActive ? '#00236f' : '#fff',
                color: isActive ? '#fff' : '#444651',
                borderColor: isActive ? '#00236f' : '#c5c5d3',
              }}
            >
              {tab.label} {count > 0 && <span className="opacity-70">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card flex items-center gap-2 p-4" style={{ borderColor: '#ffdad6' }}>
          <AlertCircle size={16} color="#ba1a1a" />
          <span className="text-sm" style={{ color: '#ba1a1a' }}>{error.message}</span>
        </div>
      )}

      {/* Jobs list */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(job => {
            const cat = CATEGORIES.find(c => c.value === job.category)
            const postedDate = new Date(job.created_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })
            return (
              <div key={job.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-xl shrink-0 mt-0.5">{cat?.emoji || '💼'}</span>
                    <div className="min-w-0">
                      <p className="font-semibold truncate" style={{ color: '#0b1c30' }}>
                        {job.title}
                      </p>
                      <div className="flex items-center flex-wrap gap-2 mt-1">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: '#e5eeff', color: '#00236f' }}
                        >
                          {cat?.label || job.category}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: '#ef9900' }}>
                          {Number(job.pay).toLocaleString()} XAF
                        </span>
                        <span className="text-xs" style={{ color: '#444651' }}>
                          {postedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={job.status} />
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/employer/jobs/${job.id}`}
                        className="text-xs font-semibold flex items-center gap-0.5"
                        style={{ color: '#444651' }}
                      >
                        Details
                      </Link>
                      <Link
                        to={`/employer/jobs/${job.id}/applicants`}
                        className="text-xs font-semibold flex items-center gap-0.5"
                        style={{ color: '#00236f' }}
                      >
                        Manage <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state — no jobs at all */}
      {!isLoading && !error && jobs.length === 0 && (
        <div
          className="card flex flex-col items-center justify-center gap-4 py-12"
          style={{ borderStyle: 'dashed', borderColor: '#c5c5d3' }}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#e5eeff' }}>
            <Briefcase size={26} color="#00236f" />
          </div>
          <div className="text-center">
            <p className="font-semibold" style={{ color: '#0b1c30' }}>No jobs posted yet</p>
            <p className="text-sm mt-1" style={{ color: '#444651' }}>
              Post your first job and start receiving applications
            </p>
          </div>
          <Link to="/employer/post-job" className="btn-primary flex items-center gap-2">
            <PlusCircle size={16} />
            Post a Job
          </Link>
        </div>
      )}

      {/* Empty state — filter returns nothing */}
      {!isLoading && !error && jobs.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="font-semibold" style={{ color: '#0b1c30' }}>No jobs match this filter</p>
          <p className="text-sm mt-1" style={{ color: '#444651' }}>Try a different status tab or clear your search</p>
        </div>
      )}
    </div>
  )
}
