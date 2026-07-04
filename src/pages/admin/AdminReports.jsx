import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Flag } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import IconBadge from '../../components/ui/IconBadge'
import { ICON_SIZE } from '../../constants/iconTokens'

async function getAdminReports(statusFilter) {
  let q = supabase
    .from('reports')
    .select(`
      id, reason, status, admin_note, created_at, resolved_at,
      reporter:profiles!reports_reporter_id_fkey(id, full_name, role),
      reported:profiles!reports_reported_id_fkey(id, full_name, role),
      job:jobs(id, title)
    `)
    .order('created_at', { ascending: false })
    .limit(100)
  if (statusFilter) q = q.eq('status', statusFilter)
  const { data, error } = await q
  if (error) throw error
  return data
}

const STATUSES = ['', 'open', 'resolved', 'dismissed']

export default function AdminReports() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('open')
  const [actionNotes, setActionNotes] = useState({})
  const [actionMsg, setActionMsg] = useState('')

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin', 'reports', statusFilter],
    queryFn: () => getAdminReports(statusFilter),
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, status, note }) =>
      supabase.from('reports').update({
        status,
        admin_note: note || null,
        resolved_at: new Date().toISOString(),
      }).eq('id', id),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
      setActionMsg(vars.status === 'resolved' ? 'Report resolved.' : 'Report dismissed.')
      setTimeout(() => setActionMsg(''), 4000)
    },
  })

  const handleAction = (id, status) => {
    resolveMutation.mutate({ id, status, note: actionNotes[id] || '' })
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0b1c30' }}>Reports & Moderation</h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Review and resolve user-submitted reports.</p>
      </div>

      {actionMsg && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: '#dcfce7', color: '#166534' }}>
          {actionMsg}
        </div>
      )}

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
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
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border text-center py-16" style={{ borderColor: '#e4e4ef' }}>
          <IconBadge icon={CheckCircle} tone="green" size="md" className="mx-auto mb-3" />
          <p className="text-sm font-medium" style={{ color: '#166534' }}>No reports in this queue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border p-5" style={{ borderColor: '#e4e4ef' }}>
              <div className="flex items-start gap-2 flex-wrap mb-2">
                <div className="flex items-center gap-1.5">
                  <Flag size={14} style={{ color: r.status === 'open' ? '#ba1a1a' : '#aaa' }} />
                  <span className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: r.status === 'open' ? '#ba1a1a' : '#aaa' }}>
                    {r.status}
                  </span>
                </div>
                <span className="text-xs ml-auto" style={{ color: '#aaa' }}>
                  {new Date(r.created_at).toLocaleDateString('fr-CM', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <p className="text-sm mb-2" style={{ color: '#0b1c30' }}>{r.reason}</p>

              <div className="flex flex-wrap gap-3 text-xs mb-3" style={{ color: '#666' }}>
                {r.reporter && (
                  <span>
                    By: <Link to={`/profile/${r.reporter.id}`} className="font-medium hover:underline" style={{ color: '#00236f' }}>
                      {r.reporter.full_name}
                    </Link>
                    <span className="ml-1 capitalize px-1 py-0.5 rounded text-xs" style={{ background: '#e5eeff', color: '#00236f' }}>
                      {r.reporter.role}
                    </span>
                  </span>
                )}
                {r.reported && (
                  <span>
                    Against: <Link to={`/profile/${r.reported.id}`} className="font-medium hover:underline" style={{ color: '#ba1a1a' }}>
                      {r.reported.full_name}
                    </Link>
                    <span className="ml-1 capitalize px-1 py-0.5 rounded text-xs" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
                      {r.reported.role}
                    </span>
                  </span>
                )}
                {r.job && (
                  <span>
                    Job: <span className="font-medium" style={{ color: '#374151' }}>{r.job.title}</span>
                  </span>
                )}
              </div>

              {r.admin_note && (
                <div className="mb-3 px-3 py-2 rounded-lg text-xs" style={{ background: '#f3f4f6', color: '#444' }}>
                  Admin note: {r.admin_note}
                </div>
              )}

              {r.status === 'open' && (
                <div className="mt-2 pt-3 border-t space-y-2" style={{ borderColor: '#f0f0f8' }}>
                  <input
                    value={actionNotes[r.id] || ''}
                    onChange={(e) => setActionNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="Admin note (optional)"
                    className="input-field text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(r.id, 'resolved')}
                      disabled={resolveMutation.isPending}
                      className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60"
                      style={{ background: '#006c4e' }}>
                      <CheckCircle size={ICON_SIZE.inline} /> Resolve
                    </button>
                    <button
                      onClick={() => handleAction(r.id, 'dismissed')}
                      disabled={resolveMutation.isPending}
                      className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg border disabled:opacity-60"
                      style={{ borderColor: '#c5c5d3', color: '#444' }}>
                      <XCircle size={ICON_SIZE.inline} /> Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
