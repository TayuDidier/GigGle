import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Shield, ShieldOff, Star, Pencil, Trash2, X, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

async function getAdminUsers({ search, role }) {
  const { data, error } = await supabase.rpc('admin_get_users', {
    p_search: search || null,
    p_role:   role   || null,
  })
  if (error) throw error
  return data
}

async function updateProfile(id, fields) {
  const { error } = await supabase.from('profiles').update(fields).eq('id', id)
  if (error) throw error
}

async function deleteUser(userAuthId) {
  const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userAuthId })
  if (error) throw error
}

async function toggleSuspend(id, suspended) {
  const { error } = await supabase.from('profiles').update({ is_suspended: suspended }).eq('id', id)
  if (error) throw error
}

const ROLE_STYLES = {
  worker:   { bg: '#eff4ff', color: '#00236f' },
  employer: { bg: '#fff8e6', color: '#b36b00' },
  admin:    { bg: '#fee2e2', color: '#ba1a1a' },
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

/* ── Edit modal ──────────────────────────────────────────── */
function EditModal({ user, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    full_name: user.full_name || '',
    role:      user.role      || 'worker',
    city:      user.city      || '',
    phone:     user.phone     || '',
  })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#f0f0f8' }}>
          <h2 className="text-base font-bold" style={{ color: '#0b1c30' }}>Edit User</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={18} color="#666" />
          </button>
        </div>

        {/* Avatar preview */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
            style={{ background: ROLE_STYLES[form.role]?.bg || '#f3f4f6', color: ROLE_STYLES[form.role]?.color || '#444' }}>
            {form.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#0b1c30' }}>{form.full_name || 'No name'}</p>
            <p className="text-xs capitalize" style={{ color: '#9ca3af' }}>{form.role}</p>
          </div>
        </div>

        {/* Fields */}
        <div className="px-6 pb-2 space-y-4 pt-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#444651' }}>Full Name</label>
            <input value={form.full_name} onChange={set('full_name')}
              className="input-field text-sm" placeholder="Full name" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#444651' }}>Role</label>
            <select value={form.role} onChange={set('role')} className="input-field text-sm">
              <option value="worker">Worker</option>
              <option value="employer">Employer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#444651' }}>City</label>
              <input value={form.city} onChange={set('city')}
                className="input-field text-sm" placeholder="City" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#444651' }}>Phone</label>
              <input value={form.phone} onChange={set('phone')}
                className="input-field text-sm" placeholder="+237…" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => onSave(user.id, form)}
            disabled={saving || !form.full_name.trim()}
            className="btn-primary flex-1 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Delete confirm modal ────────────────────────────────── */
function DeleteModal({ user, onClose, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: '#fee2e2' }}>
          <AlertTriangle size={22} color="#ba1a1a" />
        </div>
        <h2 className="text-base font-bold text-center mb-1" style={{ color: '#0b1c30' }}>Delete account?</h2>
        <p className="text-sm text-center mb-5" style={{ color: '#444651' }}>
          <strong>{user.full_name}</strong>'s account and all their data will be permanently removed.
          This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => onConfirm(user.user_id)}
            disabled={deleting}
            className="flex-1 font-semibold px-4 py-2.5 rounded-xl text-white disabled:opacity-60 transition-opacity"
            style={{ background: '#ba1a1a' }}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────── */
export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [search, setSearch]               = useState('')
  const [debouncedSearch, setDebounced]   = useState('')
  const [roleFilter, setRoleFilter]       = useState('')
  const [toast, setToast]                 = useState({ msg: '', type: 'success' })
  const [editUser, setEditUser]           = useState(null)
  const [deleteUser, setDeleteUser]       = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000)
  }

  const handleSearchChange = (v) => {
    setSearch(v)
    clearTimeout(window._adminSearchTimer)
    window._adminSearchTimer = setTimeout(() => setDebounced(v), 300)
  }

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users', { search: debouncedSearch, role: roleFilter }],
    queryFn:  () => getAdminUsers({ search: debouncedSearch, role: roleFilter }),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, fields }) => updateProfile(id, fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setEditUser(null)
      showToast('User updated successfully.')
    },
    onError: (e) => showToast(e.message || 'Failed to update user.', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (userAuthId) => deleteUser(userAuthId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setDeleteUser(null)
      showToast('User deleted.')
    },
    onError: (e) => showToast(e.message || 'Failed to delete user.', 'error'),
  })

  const suspendMutation = useMutation({
    mutationFn: ({ id, suspended }) => toggleSuspend(id, suspended),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      showToast(vars.suspended ? 'User suspended.' : 'User reinstated.')
    },
    onError: (e) => showToast(e.message || 'Action failed.', 'error'),
  })

  const totalShown = users.length

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0b1c30' }}>Manage Users</h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
          View, edit, suspend or delete any account on the platform.
        </p>
      </div>

      <Toast msg={toast.msg} type={toast.type} />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name or email…"
            className="input-field pl-9 text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field text-sm w-auto"
        >
          <option value="">All roles</option>
          <option value="worker">Workers</option>
          <option value="employer">Employers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Count */}
      {!isLoading && (
        <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>
          {totalShown} user{totalShown !== 1 ? 's' : ''} found
        </p>
      )}

      {/* List */}
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
            <div key={u.id}
              className="bg-white rounded-2xl border px-4 py-3.5 flex items-center gap-3"
              style={{ borderColor: '#e4e4ef', opacity: u.is_suspended ? 0.75 : 1 }}>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: ROLE_STYLES[u.role]?.bg || '#f3f4f6', color: ROLE_STYLES[u.role]?.color || '#444' }}>
                {u.full_name?.charAt(0) || '?'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold truncate" style={{ color: '#0b1c30' }}>
                    {u.full_name}
                  </span>
                  {/* Role badge */}
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium shrink-0"
                    style={{ background: ROLE_STYLES[u.role]?.bg, color: ROLE_STYLES[u.role]?.color }}>
                    {u.role}
                  </span>
                  {/* Account status badge */}
                  {u.is_suspended ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                      style={{ background: '#fee2e2', color: '#ba1a1a' }}>
                      Suspended
                    </span>
                  ) : !u.onboarding_done ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                      style={{ background: '#f3f4f6', color: '#6b7280' }}>
                      Pending Setup
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                      style={{ background: '#dcfce7', color: '#166534' }}>
                      Active
                    </span>
                  )}
                </div>
                {/* Email */}
                {u.email && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#444651' }}>{u.email}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs" style={{ color: '#9ca3af' }}>
                  {u.city  && <span>{u.city}</span>}
                  {u.phone && <span>{u.phone}</span>}
                  {u.rating_average != null && (
                    <span className="flex items-center gap-0.5">
                      <Star size={11} fill="#ef9900" color="#ef9900" />
                      {Number(u.rating_average).toFixed(1)} ({u.rating_count})
                    </span>
                  )}
                  <span>
                    Joined {new Date(u.created_at).toLocaleDateString('fr-CM', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Edit */}
                <button
                  onClick={() => setEditUser(u)}
                  title="Edit user"
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: '#00236f' }}>
                  <Pencil size={16} />
                </button>

                {/* Suspend / Reinstate */}
                <button
                  onClick={() => suspendMutation.mutate({ id: u.id, suspended: !u.is_suspended })}
                  disabled={suspendMutation.isPending}
                  title={u.is_suspended ? 'Reinstate user' : 'Suspend user'}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: u.is_suspended ? '#006c4e' : '#b36b00' }}>
                  {u.is_suspended ? <Shield size={16} /> : <ShieldOff size={16} />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => setDeleteUser(u)}
                  title="Delete account"
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                  style={{ color: '#ba1a1a' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <EditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={(id, fields) => editMutation.mutate({ id, fields })}
          saving={editMutation.isPending}
        />
      )}

      {/* Delete modal */}
      {deleteUser && (
        <DeleteModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={(uid) => deleteMutation.mutate(uid)}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
