import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Check, X, AlertTriangle, ExternalLink } from 'lucide-react'
import { adminGetVerifications, adminReviewVerification } from '../../api/verifications.api'
import { getSignedDocUrl } from '../../api/storage.api'
import { queryKeys } from '../../constants/queryKeys'
import IconBadge from '../../components/ui/IconBadge'
import { ICON_SIZE } from '../../constants/iconTokens'

const STATUS_STYLES = {
  unverified: { bg: '#f3f4f6', color: '#6b7280', label: 'Unverified' },
  pending:    { bg: '#dbeafe', color: '#1e40af', label: 'Pending'     },
  approved:   { bg: '#dcfce7', color: '#166534', label: 'Approved'    },
  rejected:   { bg: '#fee2e2', color: '#ba1a1a', label: 'Rejected'    },
}

const ROLE_STYLES = {
  worker:   { bg: '#eff4ff', color: '#00236f' },
  employer: { bg: '#fff8e6', color: '#b36b00' },
}

function Toast({ msg, type = 'success' }) {
  if (!msg) return null
  return (
    <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
      style={type === 'success'
        ? { background: '#dcfce7', color: '#166534' }
        : { background: '#fee2e2', color: '#ba1a1a' }}>
      {msg}
    </div>
  )
}

function RejectModal({ user, onClose, onConfirm, rejecting }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <IconBadge icon={AlertTriangle} tone="alert" size="md" className="mx-auto mb-4" />
        <h2 className="text-base font-bold text-center mb-1" style={{ color: '#0b1c30' }}>Reject verification?</h2>
        <p className="text-sm text-center mb-4" style={{ color: '#444651' }}>
          <strong>{user.full_name}</strong> will be notified and can resubmit a document.
        </p>
        <label className="label">Reason <span style={{ color: '#ba1a1a' }}>*</span></label>
        <textarea
          className="input-field resize-none mb-5"
          rows={3}
          placeholder="e.g. Document is blurry, please retake the photo."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={rejecting || !reason.trim()}
            className="flex-1 font-semibold px-4 py-2.5 rounded-xl text-white disabled:opacity-60 transition-opacity"
            style={{ background: '#ba1a1a' }}>
            {rejecting ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminVerifications() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pending')
  const [toast, setToast] = useState({ msg: '', type: 'success' })
  const [rejectUser, setRejectUser] = useState(null)
  const [viewingId, setViewingId] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000)
  }

  const { data: users = [], isLoading } = useQuery({
    queryKey: queryKeys.verifications.admin({ status: statusFilter }),
    queryFn: () => adminGetVerifications(statusFilter || null),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, reason }) => adminReviewVerification(id, { status, reason }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.analytics() })
      setRejectUser(null)
      showToast(vars.status === 'approved' ? 'Verification approved.' : 'Verification rejected.')
    },
    onError: (e) => showToast(e.message || 'Action failed.', 'error'),
  })

  async function handleView(path) {
    setViewingId(path)
    try {
      const url = await getSignedDocUrl(path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      showToast(err.message || 'Could not open document.', 'error')
    } finally {
      setViewingId(null)
    }
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0b1c30' }}>Identity Verifications</h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
          Review submitted ID documents and approve or reject access.
        </p>
      </div>

      <Toast msg={toast.msg} type={toast.type} />

      <div className="flex flex-wrap gap-2 mb-5">
        {['pending', 'approved', 'rejected', 'unverified', ''].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
            style={statusFilter === s
              ? { background: '#00236f', color: '#fff', borderColor: '#00236f' }
              : { background: '#fff', color: '#444651', borderColor: '#e4e4ef' }}
          >
            {s ? STATUS_STYLES[s].label : 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border text-center py-16" style={{ borderColor: '#e4e4ef' }}>
          <p className="text-sm" style={{ color: '#9ca3af' }}>No users found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="bg-white rounded-2xl border px-4 py-3.5" style={{ borderColor: '#e4e4ef' }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: ROLE_STYLES[u.role]?.bg, color: ROLE_STYLES[u.role]?.color }}>
                  {u.full_name?.charAt(0) || '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold truncate" style={{ color: '#0b1c30' }}>{u.full_name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium shrink-0"
                      style={{ background: ROLE_STYLES[u.role]?.bg, color: ROLE_STYLES[u.role]?.color }}>
                      {u.role}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                      style={{ background: STATUS_STYLES[u.verification_status].bg, color: STATUS_STYLES[u.verification_status].color }}>
                      {STATUS_STYLES[u.verification_status].label}
                    </span>
                    {u.is_suspended && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
                        Suspended
                      </span>
                    )}
                  </div>
                  {u.email && <p className="text-xs mt-0.5 truncate" style={{ color: '#444651' }}>{u.email}</p>}
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs" style={{ color: '#9ca3af' }}>
                    {u.verification_submitted_at && (
                      <span>Submitted {new Date(u.verification_submitted_at).toLocaleDateString('fr-CM', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    )}
                    {u.credentials_count > 0 && (
                      <span className="flex items-center gap-1">
                        <FileText size={ICON_SIZE.metadata} /> {u.credentials_count} supporting doc{u.credentials_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {u.verification_status === 'rejected' && u.verification_rejection_reason && (
                    <p className="text-xs mt-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
                      {u.verification_rejection_reason}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: '#f0f0f8' }}>
                {u.id_document_url && (
                  <button
                    onClick={() => handleView(u.id_document_url)}
                    disabled={viewingId === u.id_document_url}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border"
                    style={{ color: '#00236f', borderColor: '#c5c5d3' }}
                  >
                    <ExternalLink size={ICON_SIZE.inline} /> View ID document
                  </button>
                )}
                {u.verification_status === 'pending' && (
                  <>
                    <button
                      onClick={() => reviewMutation.mutate({ id: u.id, status: 'approved' })}
                      disabled={reviewMutation.isPending}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-60"
                      style={{ background: '#006c4e' }}
                    >
                      <Check size={ICON_SIZE.inline} /> Approve
                    </button>
                    <button
                      onClick={() => setRejectUser(u)}
                      disabled={reviewMutation.isPending}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-60"
                      style={{ background: '#ba1a1a' }}
                    >
                      <X size={ICON_SIZE.inline} /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectUser && (
        <RejectModal
          user={rejectUser}
          onClose={() => setRejectUser(null)}
          onConfirm={(reason) => reviewMutation.mutate({ id: rejectUser.id, status: 'rejected', reason })}
          rejecting={reviewMutation.isPending}
        />
      )}
    </div>
  )
}
