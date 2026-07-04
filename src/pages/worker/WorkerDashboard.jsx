import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { getActiveJobAsWorker } from '../../api/jobs.api'
import { getMyApplications } from '../../api/applications.api'
import { queryKeys } from '../../constants/queryKeys'
import { Briefcase, Search, Star, ChevronRight, AlertCircle, FileText, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import { CATEGORIES } from '../../constants/categories'
import { VerificationBanner } from '../../components/VerificationBanner'
import StatCard from '../../components/ui/StatCard'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function StarRating({ value }) {
  const filled = Math.round(value)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} fill={i < filled ? '#ef9900' : 'none'} color={i < filled ? '#ef9900' : 'rgba(255,255,255,0.3)'} />
      ))}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pending:  { bg: '#e5eeff', color: '#00236f', label: 'Pending'  },
    accepted: { bg: '#97f5cc', color: '#006c4e', label: 'Accepted' },
    rejected: { bg: '#f4f4f4', color: '#444651', label: 'Rejected' },
  }
  const s = map[status] || map.pending
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-outline-variant p-5 space-y-3 overflow-hidden">
      <div className="skeleton h-4 rounded-lg w-3/5" />
      <div className="skeleton h-3 rounded-lg w-2/5" />
      <div className="skeleton h-3 rounded-lg w-1/2" />
    </div>
  )
}

export default function WorkerDashboard() {
  const { profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  const { data: activeJob, isLoading: loadingJob, error: jobError } = useQuery({
    queryKey: queryKeys.jobs.activeWorker(profile?.id),
    queryFn: () => getActiveJobAsWorker(profile.id),
    enabled: !!profile?.id,
  })

  const { data: applications, isLoading: loadingApps, error: appsError } = useQuery({
    queryKey: queryKeys.applications.forWorker(profile?.id),
    queryFn: () => getMyApplications(profile.id),
    enabled: !!profile?.id,
  })

  const recentApps = applications?.slice(0, 3) || []
  const totalApps  = applications?.length || 0

  return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-6">

      <VerificationBanner profile={profile} />

      {/* ── Welcome Banner ── */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #001852 0%, #00236f 55%, #002f8a 100%)' }}
      >
        {/* Decorative blob */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'rgba(239,153,0,0.12)', filter: 'blur(24px)' }} />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">{greeting()}</p>
            <h1 className="text-xl font-bold text-white leading-tight">{firstName} 👋</h1>
            {profile?.rating_average ? (
              <div className="flex items-center gap-2 mt-2">
                <StarRating value={profile.rating_average} />
                <span className="text-white/70 text-xs">
                  {Number(profile.rating_average).toFixed(1)} ({profile.rating_count || 0} reviews)
                </span>
              </div>
            ) : (
              <p className="text-white/50 text-sm mt-1.5">Complete jobs to build your reputation</p>
            )}
          </div>
          <Link
            to="/worker/browse"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold self-start sm:self-auto transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'rgba(239,153,0,0.2)', color: '#ef9900', border: '1px solid rgba(239,153,0,0.3)' }}
          >
            <Search size={14} />
            Browse Jobs
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          value={totalApps}
          label="Applications"
          icon={FileText}
          tone="navy"
        />
        <StatCard
          value={loadingJob ? '—' : activeJob ? '1' : '0'}
          label="Active Job"
          icon={Briefcase}
          tone="green"
        />
        <StatCard
          value={profile?.rating_average ? Number(profile.rating_average).toFixed(1) : '—'}
          label="Rating"
          icon={Star}
          tone="orange"
        />
      </div>

      {/* ── Active Job ── */}
      <section>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: '#0b1c30' }}>
          <TrendingUp size={16} color="#ef9900" />
          Active Job
        </h2>

        {loadingJob && <SkeletonCard />}

        {jobError && (
          <div className="flex items-center gap-2 p-4 rounded-2xl text-sm"
            style={{ background: '#ffdad6', color: '#ba1a1a' }}>
            <AlertCircle size={15} /> {jobError.message}
          </div>
        )}

        {!loadingJob && !jobError && activeJob && (
          <div className="card-hover p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold" style={{ color: '#0b1c30' }}>{activeJob.title}</p>
                <p className="text-sm mt-0.5" style={{ color: '#444651' }}>
                  {activeJob.employer?.full_name} · {activeJob.city}
                </p>
                <p className="text-base font-bold mt-1.5" style={{ color: '#ef9900' }}>
                  {Number(activeJob.pay).toLocaleString('fr-CM')} XAF
                </p>
              </div>
              <Link to={`/worker/jobs/${activeJob.id}/chat`} className="btn-primary text-sm px-4 py-2 min-h-0 h-10 shrink-0">
                Go to Chat <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {!loadingJob && !jobError && !activeJob && (
          <div className="bg-white rounded-2xl border-2 border-dashed p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderColor: '#c5c5d3' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#e5eeff' }}>
                <Briefcase size={18} color="#00236f" />
              </div>
              <div>
                <p className="font-medium" style={{ color: '#0b1c30' }}>No active job</p>
                <p className="text-sm" style={{ color: '#888' }}>Browse available gigs near you</p>
              </div>
            </div>
            <Link to="/worker/browse" className="btn-primary text-sm min-h-0 h-10 px-4 shrink-0">
              Browse Jobs <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>

      {/* ── Recent Applications ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: '#0b1c30' }}>
            <Clock size={16} color="#00236f" />
            Recent Applications
          </h2>
          {totalApps > 0 && (
            <Link to="/worker/applications"
              className="text-xs font-semibold flex items-center gap-0.5 hover:underline"
              style={{ color: '#00236f' }}>
              View all <ChevronRight size={13} />
            </Link>
          )}
        </div>

        {loadingApps && (
          <div className="space-y-3">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        )}

        {appsError && (
          <div className="flex items-center gap-2 p-4 rounded-2xl text-sm"
            style={{ background: '#ffdad6', color: '#ba1a1a' }}>
            <AlertCircle size={15} /> {appsError.message}
          </div>
        )}

        {!loadingApps && !appsError && recentApps.length > 0 && (
          <div className="space-y-2">
            {recentApps.map(app => {
              const cat = CATEGORIES.find(c => c.value === app.job?.category)
              return (
                <div key={app.id}
                  className="bg-white rounded-2xl border border-outline-variant p-4 flex items-center justify-between gap-3 transition-all duration-200 hover:shadow-card-hover hover:border-primary/20">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg"
                      style={{ background: '#f4f4f8' }}>
                      {cat?.emoji || '💼'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: '#0b1c30' }}>
                        {app.job?.title || 'Job'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                        {app.job?.employer?.full_name} ·{' '}
                        <span style={{ color: '#ef9900', fontWeight: 600 }}>
                          {Number(app.job?.pay || 0).toLocaleString('fr-CM')} XAF
                        </span>
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              )
            })}
          </div>
        )}

        {!loadingApps && !appsError && recentApps.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-dashed p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderColor: '#c5c5d3' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#e5eeff' }}>
                <Search size={18} color="#00236f" />
              </div>
              <div>
                <p className="font-medium" style={{ color: '#0b1c30' }}>No applications yet</p>
                <p className="text-sm" style={{ color: '#888' }}>Start browsing jobs!</p>
              </div>
            </div>
            <Link to="/worker/browse" className="btn-primary text-sm min-h-0 h-10 px-4 shrink-0">
              Browse Jobs <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
