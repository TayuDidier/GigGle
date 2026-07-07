import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { getMyJobsAsEmployer } from '../../api/jobs.api'
import { queryKeys } from '../../constants/queryKeys'
import { PlusCircle, Briefcase, ChevronRight, AlertCircle, CheckCircle, TrendingUp, Clock, Users, ArrowRight } from 'lucide-react'
import { CATEGORIES } from '../../constants/categories'
import { VerificationBanner } from '../../components/VerificationBanner'
import StatCard from '../../components/ui/StatCard'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const STATUS_MAP = {
  open:        { label: 'Open',        bg: '#97f5cc', color: '#006c4e' },
  in_progress: { label: 'In Progress', bg: '#e5eeff', color: '#00236f' },
  completed:   { label: 'Completed',   bg: '#f4f4f4', color: '#444651' },
  cancelled:   { label: 'Cancelled',   bg: '#ffdad6', color: '#ba1a1a' },
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, bg: '#f4f4f4', color: '#444651' }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-outline-variant p-5 space-y-3">
      <div className="skeleton h-4 rounded-lg w-3/5" />
      <div className="skeleton h-3 rounded-lg w-2/5" />
      <div className="skeleton h-3 rounded-lg w-1/2" />
    </div>
  )
}

export default function EmployerDashboard() {
  const { profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  const { data: jobs, isLoading, error } = useQuery({
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
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-6">

      <VerificationBanner profile={profile} />

      {/* ── Welcome Banner ── */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #001852 0%, #00236f 55%, #002f8a 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'rgba(239,153,0,0.12)', filter: 'blur(24px)' }} />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">{greeting()}</p>
            <h1 className="text-xl font-bold text-white">{firstName} 👋</h1>
            <p className="text-white/50 text-sm mt-1">Manage your job listings</p>
          </div>
          <Link
            to="/employer/post-job"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold self-start sm:self-auto transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'rgba(239,153,0,0.2)', color: '#ef9900', border: '1px solid rgba(239,153,0,0.3)' }}
          >
            <PlusCircle size={14} />
            Post a Job
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard value={total}      label="Total Posted"  icon={Briefcase}    color="#444651" bg="#f4f4f4" />
        <StatCard value={openCount}  label="Open"          icon={TrendingUp}   tone="green" />
        <StatCard value={inProgress} label="In Progress"   icon={Clock}        tone="navy" />
        <StatCard value={completed}  label="Completed"     icon={CheckCircle}  color="#444651" bg="#f4f4f4" />
      </div>

      {/* ── My Jobs ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: '#0b1c30' }}>
            <Briefcase size={16} color="#00236f" />
            My Jobs
          </h2>
          {total > 5 && (
            <Link to="/employer/my-jobs"
              className="text-xs font-semibold flex items-center gap-0.5 hover:underline"
              style={{ color: '#00236f' }}>
              View all <ChevronRight size={13} />
            </Link>
          )}
        </div>

        {isLoading && (
          <div className="space-y-3">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-2xl text-sm"
            style={{ background: '#ffdad6', color: '#ba1a1a' }}>
            <AlertCircle size={15} /> {error.message}
          </div>
        )}

        {!isLoading && !error && recentJobs.length > 0 && (
          <div className="space-y-2">
            {recentJobs.map(job => {
              const cat = CATEGORIES.find(c => c.value === job.category)
              const date = new Date(job.created_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short',
              })
              return (
                <div key={job.id}
                  className="bg-white rounded-2xl border border-outline-variant p-4 flex items-start justify-between gap-3 transition-all duration-200 hover:shadow-card-hover hover:border-primary/20">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg"
                      style={{ background: '#f4f4f8' }}>
                      {cat?.emoji || '💼'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: '#0b1c30' }}>{job.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-semibold" style={{ color: '#ef9900' }}>
                          {Number(job.pay).toLocaleString('fr-CM')} XAF
                        </span>
                        <span className="text-xs" style={{ color: '#888' }}>{date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={job.status} />
                    <Link to={`/employer/jobs/${job.id}/applicants`}
                      className="text-xs font-semibold flex items-center gap-0.5 hover:underline"
                      style={{ color: '#00236f' }}>
                      Manage <ChevronRight size={11} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!isLoading && !error && recentJobs.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-dashed p-8 flex flex-col items-center gap-4 text-center"
            style={{ borderColor: '#c5c5d3' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#e5eeff' }}>
              <Briefcase size={26} color="#00236f" />
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#0b1c30' }}>No jobs posted yet</p>
              <p className="text-sm mt-1" style={{ color: '#888' }}>
                Post your first job and start receiving applications
              </p>
            </div>
            <Link to="/employer/post-job" className="btn-primary text-sm min-h-0 h-10 px-5">
              <PlusCircle size={14} /> Post a Job
            </Link>
          </div>
        )}
      </section>

      {/* ── Quick links ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { to: '/employer/my-jobs', icon: Briefcase, label: 'All My Jobs', sub: 'View & manage listings' },
          { to: '/employer/post-job', icon: PlusCircle, label: 'Post New Job', sub: 'Hire in minutes' },
        ].map(({ to, icon: Icon, label, sub }) => (
          <Link
            key={to}
            to={to}
            className="bg-white rounded-2xl border border-outline-variant p-4 flex items-center gap-3 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary/20 group"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors"
              style={{ background: '#e5eeff' }}>
              <Icon size={17} color="#00236f" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#0b1c30' }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: '#888' }}>{sub}</p>
            </div>
            <ArrowRight size={14} className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#00236f' }} />
          </Link>
        ))}
      </div>
    </div>
  )
}
