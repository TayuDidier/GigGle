import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { getActiveJobAsWorker } from '../../api/jobs.api'
import { getMyApplications } from '../../api/applications.api'
import { queryKeys } from '../../constants/queryKeys'
import { Briefcase, Search, Star, ChevronRight, AlertCircle } from 'lucide-react'
import { CATEGORIES } from '../../constants/categories'

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
        <Star
          key={i}
          size={14}
          fill={i < filled ? '#ef9900' : 'none'}
          color={i < filled ? '#ef9900' : '#c5c5d3'}
        />
      ))}
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    pending:  { background: '#e5eeff', color: '#00236f' },
    accepted: { background: '#97f5cc', color: '#006c4e' },
    rejected: { background: '#f4f4f4', color: '#444651' },
  }
  const labels = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={styles[status] || styles.pending}
    >
      {labels[status] || status}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 rounded" style={{ background: '#e5eeff', width: '60%' }} />
      <div className="h-3 rounded mt-2" style={{ background: '#e5eeff', width: '40%' }} />
    </div>
  )
}

export default function WorkerDashboard() {
  const { profile } = useAuth()

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  const {
    data: activeJob,
    isLoading: loadingJob,
    error: jobError,
  } = useQuery({
    queryKey: queryKeys.jobs.activeWorker(profile?.id),
    queryFn: () => getActiveJobAsWorker(profile.id),
    enabled: !!profile?.id,
  })

  const {
    data: applications,
    isLoading: loadingApps,
    error: appsError,
  } = useQuery({
    queryKey: queryKeys.applications.forWorker(profile?.id),
    queryFn: () => getMyApplications(profile.id),
    enabled: !!profile?.id,
  })

  const recentApps = applications?.slice(0, 3) || []
  const totalApps = applications?.length || 0

  return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">

      {/* ---- Welcome Banner ---- */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{ background: 'linear-gradient(135deg, #00236f 0%, #1e3a8a 100%)' }}
      >
        <h1 className="text-xl font-bold text-white mb-1">
          {greeting()}, {firstName} 👋
        </h1>
        {profile?.rating_average ? (
          <div className="flex items-center gap-2">
            <StarRating value={profile.rating_average} />
            <span className="text-white/80 text-sm">
              {Number(profile.rating_average).toFixed(1)} ({profile.rating_count || 0} reviews)
            </span>
          </div>
        ) : (
          <p className="text-white/70 text-sm">Complete jobs to build your reputation</p>
        )}
      </div>

      {/* ---- Quick Stats ---- */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: '#00236f' }}>{totalApps}</p>
          <p className="text-xs mt-0.5" style={{ color: '#444651' }}>Applications</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: '#00236f' }}>
            {loadingJob ? '—' : activeJob ? '1' : '0'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#444651' }}>Active Job</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: '#00236f' }}>
            {profile?.rating_average ? Number(profile.rating_average).toFixed(1) : '—'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#444651' }}>Rating</p>
        </div>
      </div>

      {/* ---- Active Job ---- */}
      <section className="mb-6">
        <h2 className="text-base font-semibold mb-3" style={{ color: '#0b1c30' }}>Active Job</h2>

        {loadingJob && <SkeletonCard />}

        {jobError && (
          <div className="card flex items-center gap-2 p-4" style={{ borderColor: '#ffdad6' }}>
            <AlertCircle size={16} color="#ba1a1a" />
            <span className="text-sm" style={{ color: '#ba1a1a' }}>{jobError.message}</span>
          </div>
        )}

        {!loadingJob && !jobError && activeJob && (
          <div className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold" style={{ color: '#0b1c30' }}>{activeJob.title}</p>
                <p className="text-sm mt-0.5" style={{ color: '#444651' }}>
                  {activeJob.employer?.full_name} · {activeJob.city}
                </p>
                <p className="text-sm font-semibold mt-1" style={{ color: '#ef9900' }}>
                  {Number(activeJob.pay).toLocaleString()} XAF
                </p>
              </div>
              <Link
                to={`/worker/jobs/${activeJob.id}/chat`}
                className="btn-primary text-sm px-4 py-2 shrink-0"
              >
                Go to Chat →
              </Link>
            </div>
          </div>
        )}

        {!loadingJob && !jobError && !activeJob && (
          <div
            className="card flex flex-col sm:flex-row items-center justify-between gap-4 p-5"
            style={{ borderStyle: 'dashed', borderColor: '#c5c5d3' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#e5eeff' }}>
                <Briefcase size={18} color="#00236f" />
              </div>
              <div>
                <p className="font-medium" style={{ color: '#0b1c30' }}>No active job</p>
                <p className="text-sm" style={{ color: '#444651' }}>Browse available gigs near you</p>
              </div>
            </div>
            <Link to="/worker/browse" className="btn-primary text-sm shrink-0">
              Browse Jobs →
            </Link>
          </div>
        )}
      </section>

      {/* ---- Recent Applications ---- */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: '#0b1c30' }}>Recent Applications</h2>
          {totalApps > 0 && (
            <Link
              to="/worker/applications"
              className="text-sm font-medium flex items-center gap-0.5"
              style={{ color: '#00236f' }}
            >
              View all <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {loadingApps && (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {appsError && (
          <div className="card flex items-center gap-2 p-4" style={{ borderColor: '#ffdad6' }}>
            <AlertCircle size={16} color="#ba1a1a" />
            <span className="text-sm" style={{ color: '#ba1a1a' }}>{appsError.message}</span>
          </div>
        )}

        {!loadingApps && !appsError && recentApps.length > 0 && (
          <div className="space-y-3">
            {recentApps.map(app => {
              const cat = CATEGORIES.find(c => c.value === app.job?.category)
              return (
                <div key={app.id} className="card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{cat?.emoji || '💼'}</span>
                      <div className="min-w-0">
                        <p className="font-medium truncate" style={{ color: '#0b1c30' }}>
                          {app.job?.title || 'Job'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#444651' }}>
                          {app.job?.employer?.full_name} ·{' '}
                          <span style={{ color: '#ef9900', fontWeight: 600 }}>
                            {Number(app.job?.pay || 0).toLocaleString()} XAF
                          </span>
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loadingApps && !appsError && recentApps.length === 0 && (
          <div
            className="card flex flex-col sm:flex-row items-center justify-between gap-4 p-5"
            style={{ borderStyle: 'dashed', borderColor: '#c5c5d3' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#e5eeff' }}>
                <Search size={18} color="#00236f" />
              </div>
              <div>
                <p className="font-medium" style={{ color: '#0b1c30' }}>No applications yet</p>
                <p className="text-sm" style={{ color: '#444651' }}>Start browsing jobs!</p>
              </div>
            </div>
            <Link to="/worker/browse" className="btn-primary text-sm shrink-0">
              Browse Jobs →
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
