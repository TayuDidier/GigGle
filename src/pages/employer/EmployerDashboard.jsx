import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { getMyJobsAsEmployer } from '../../api/jobs.api'
import { queryKeys } from '../../constants/queryKeys'
import { PlusCircle, Briefcase, ChevronRight, AlertCircle } from 'lucide-react'
import { CATEGORIES } from '../../constants/categories'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

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
    <div className="card animate-pulse space-y-2">
      <div className="h-4 rounded" style={{ background: '#e5eeff', width: '55%' }} />
      <div className="h-3 rounded" style={{ background: '#e5eeff', width: '35%' }} />
      <div className="h-3 rounded" style={{ background: '#e5eeff', width: '45%' }} />
    </div>
  )
}

function StatCard({ value, label, color }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-2xl font-bold" style={{ color: color || '#00236f' }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: '#444651' }}>{label}</p>
    </div>
  )
}

export default function EmployerDashboard() {
  const { profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  const {
    data: jobs,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.jobs.mine(profile?.id),
    queryFn: () => getMyJobsAsEmployer(profile.id),
    enabled: !!profile?.id,
  })

  const total      = jobs?.length || 0
  const openCount  = jobs?.filter(j => j.status === 'open').length || 0
  const inProgress = jobs?.filter(j => j.status === 'in_progress').length || 0
  const completed  = jobs?.filter(j => j.status === 'completed').length || 0

  const recentJobs = jobs?.slice(0, 5) || []

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">

      {/* ---- Welcome + CTA ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0b1c30' }}>
            {greeting()}, {firstName} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#444651' }}>
            Manage your job listings
          </p>
        </div>
        <Link to="/employer/post-job" className="btn-primary flex items-center gap-2 shrink-0">
          <PlusCircle size={16} />
          Post a New Job
        </Link>
      </div>

      {/* ---- Stats Row ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard value={total}      label="Total Posted"  />
        <StatCard value={openCount}  label="Open"          color="#006c4e" />
        <StatCard value={inProgress} label="In Progress"   color="#00236f" />
        <StatCard value={completed}  label="Completed"     color="#444651" />
      </div>

      {/* ---- My Jobs List ---- */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: '#0b1c30' }}>My Jobs</h2>
          {total > 5 && (
            <Link
              to="/employer/my-jobs"
              className="text-sm font-medium flex items-center gap-0.5"
              style={{ color: '#00236f' }}
            >
              View all <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="card flex items-center gap-2 p-4" style={{ borderColor: '#ffdad6' }}>
            <AlertCircle size={16} color="#ba1a1a" />
            <span className="text-sm" style={{ color: '#ba1a1a' }}>{error.message}</span>
          </div>
        )}

        {/* Job list */}
        {!isLoading && !error && recentJobs.length > 0 && (
          <div className="space-y-3">
            {recentJobs.map(job => {
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
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && recentJobs.length === 0 && (
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
      </section>
    </div>
  )
}
