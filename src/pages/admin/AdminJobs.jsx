import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { CategoryBadge } from '../../components/jobs/CategoryBadge'
import { JobStatusBadge } from '../../components/jobs/JobStatusBadge'

async function getAdminJobs(statusFilter) {
  let q = supabase
    .from('jobs')
    .select(`id, title, category, status, pay, city, created_at, employer:profiles!jobs_employer_id_fkey(id, full_name)`)
    .order('created_at', { ascending: false })
    .limit(100)
  if (statusFilter) q = q.eq('status', statusFilter)
  const { data, error } = await q
  if (error) throw error
  return data
}

const STATUSES = ['', 'open', 'in_progress', 'completed', 'cancelled']

export default function AdminJobs() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [actionMsg, setActionMsg] = useState('')

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['admin', 'jobs', statusFilter],
    queryFn: () => getAdminJobs(statusFilter),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => supabase.from('jobs').delete().eq('id', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] })
      setDeleteId(null)
      setActionMsg('Job removed.')
      setTimeout(() => setActionMsg(''), 4000)
    },
  })

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0b1c30' }}>Manage Jobs</h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Review and remove job listings across the platform.</p>
      </div>

      {actionMsg && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: '#dcfce7', color: '#166534' }}>
          {actionMsg}
        </div>
      )}

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="text-sm px-3 py-1.5 rounded-full border-2 transition-all capitalize"
            style={{
              borderColor: statusFilter === s ? '#00236f' : '#e4e4ef',
              background: statusFilter === s ? '#eff4ff' : '#fff',
              color: statusFilter === s ? '#00236f' : '#444',
            }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border text-center py-16" style={{ borderColor: '#e4e4ef' }}>
          <p className="text-sm" style={{ color: '#9ca3af' }}>No jobs found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl border px-4 py-3.5 flex items-start gap-3" style={{ borderColor: '#e4e4ef' }}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <CategoryBadge value={job.category} />
                  <JobStatusBadge status={job.status} />
                </div>
                <p className="text-sm font-semibold truncate" style={{ color: '#0b1c30' }}>{job.title}</p>
                <div className="text-xs mt-0.5" style={{ color: '#888' }}>
                  {job.city} · {Number(job.pay).toLocaleString('fr-CM')} XAF ·{' '}
                  <Link to={`/profile/${job.employer?.id}`} className="hover:underline" style={{ color: '#00236f' }}>
                    {job.employer?.full_name}
                  </Link>
                  {' · '}
                  {new Date(job.created_at).toLocaleDateString('fr-CM', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <button
                onClick={() => setDeleteId(job.id)}
                title="Remove job"
                className="p-2 rounded-lg shrink-0"
                style={{ color: '#ba1a1a' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-bold mb-2" style={{ color: '#0b1c30' }}>Remove this job?</h2>
            <p className="text-sm mb-5" style={{ color: '#444651' }}>
              This will permanently delete the job listing. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 font-semibold px-4 py-2.5 rounded-lg text-white disabled:opacity-60"
                style={{ background: '#ba1a1a' }}>
                {deleteMutation.isPending ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
