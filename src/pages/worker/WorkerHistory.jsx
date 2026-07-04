import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Briefcase, Star, MapPin, Calendar } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { CategoryBadge } from '../../components/jobs/CategoryBadge'
import { queryKeys } from '../../constants/queryKeys'
import IconBadge from '../../components/ui/IconBadge'

async function getWorkerCompletedJobs(workerId) {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      id, title, category, pay, city, status, updated_at,
      employer:profiles!jobs_employer_id_fkey(id, full_name, avatar_url, rating_average)
    `)
    .eq('selected_worker_id', workerId)
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

async function getWorkerRatingsMap(workerId) {
  const { data, error } = await supabase
    .from('ratings')
    .select('job_id, score, review_text')
    .eq('rated_id', workerId)
  if (error) throw error
  const map = {}
  for (const r of data || []) map[r.job_id] = r
  return map
}

export default function WorkerHistory() {
  const { profile } = useAuth()

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['worker-history', profile?.id],
    queryFn: () => getWorkerCompletedJobs(profile.id),
    enabled: !!profile?.id,
  })

  const { data: ratingsMap = {} } = useQuery({
    queryKey: ['worker-ratings-map', profile?.id],
    queryFn: () => getWorkerRatingsMap(profile.id),
    enabled: !!profile?.id,
  })

  const totalEarned = jobs.reduce((sum, j) => sum + Number(j.pay), 0)
  const avgRating = Object.values(ratingsMap).length
    ? (Object.values(ratingsMap).reduce((s, r) => s + r.score, 0) / Object.values(ratingsMap).length).toFixed(1)
    : null

  return (
    <div className="max-w-xl mx-auto px-4 py-6" style={{ background: '#f8f9ff', minHeight: '100%' }}>
      <h1 className="text-xl font-bold mb-2" style={{ color: '#0b1c30' }}>Work History</h1>

      {/* Stats strip */}
      {jobs.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center py-3">
            <p className="text-2xl font-bold" style={{ color: '#00236f' }}>{jobs.length}</p>
            <p className="text-xs mt-0.5" style={{ color: '#888' }}>Jobs done</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-lg font-bold" style={{ color: '#ef9900' }}>
              {totalEarned > 999999
                ? `${(totalEarned / 1000000).toFixed(1)}M`
                : `${(totalEarned / 1000).toFixed(0)}k`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#888' }}>XAF earned</p>
          </div>
          <div className="card text-center py-3">
            <div className="flex items-center justify-center gap-1">
              {avgRating
                ? <>
                    <Star size={16} fill="#ef9900" color="#ef9900" />
                    <span className="text-lg font-bold" style={{ color: '#0b1c30' }}>{avgRating}</span>
                  </>
                : <span className="text-sm" style={{ color: '#aaa' }}>—</span>
              }
            </div>
            <p className="text-xs mt-0.5" style={{ color: '#888' }}>Avg rating</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
        </div>
      )}

      {!isLoading && jobs.length === 0 && (
        <div className="text-center py-16">
          <IconBadge icon={Briefcase} tone="navy" size="md" className="mx-auto mb-4" />
          <p className="text-base font-semibold mb-1" style={{ color: '#0b1c30' }}>No completed jobs yet</p>
          <p className="text-sm mb-5" style={{ color: '#888' }}>Jobs you complete will appear here.</p>
          <Link to="/worker/browse" className="btn-primary">Browse Jobs</Link>
        </div>
      )}

      <div className="space-y-3">
        {jobs.map((job) => {
          const rating = ratingsMap[job.id]
          const date = new Date(job.updated_at).toLocaleDateString('fr-CM', { month: 'short', day: 'numeric', year: 'numeric' })
          return (
            <div key={job.id} className="card">
              <div className="flex items-start justify-between gap-2 mb-2">
                <CategoryBadge value={job.category} />
                <span className="text-xs shrink-0" style={{ color: '#aaa' }}>
                  <Calendar size={11} className="inline mr-1" />{date}
                </span>
              </div>
              <h3 className="text-base font-semibold mb-1" style={{ color: '#0b1c30' }}>{job.title}</h3>
              <div className="flex flex-wrap items-center gap-3 text-sm mb-2" style={{ color: '#444651' }}>
                <span style={{ color: '#ef9900', fontWeight: 700 }}>
                  {Number(job.pay).toLocaleString('fr-CM')} XAF
                </span>
                {job.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {job.city}
                  </span>
                )}
              </div>

              {/* Employer row */}
              {job.employer && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden shrink-0"
                    style={{ background: '#e5eeff', color: '#00236f' }}>
                    {job.employer.avatar_url
                      ? <img src={job.employer.avatar_url} alt="" className="w-full h-full object-cover" />
                      : job.employer.full_name?.charAt(0)
                    }
                  </div>
                  <Link to={`/profile/${job.employer.id}`} className="text-xs font-medium hover:underline" style={{ color: '#00236f' }}>
                    {job.employer.full_name}
                  </Link>
                </div>
              )}

              {/* Rating received */}
              {rating && (
                <div className="mt-2 pt-2 border-t" style={{ borderColor: '#f0f0f8' }}>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={13} fill={s <= rating.score ? '#ef9900' : 'none'} color={s <= rating.score ? '#ef9900' : '#c5c5d3'} />
                    ))}
                    <span className="text-xs ml-1" style={{ color: '#888' }}>Rating received</span>
                  </div>
                  {rating.review_text && (
                    <p className="text-xs italic" style={{ color: '#666' }}>"{rating.review_text}"</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
