import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Briefcase, Flag, AlertTriangle, ArrowRight, ShieldOff, UserCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import StatCard from '../../components/ui/StatCard'

async function getAdminAnalytics() {
  const [usersRes, jobsRes, reportsRes, recentUsersRes, pendingVerificationsRes] = await Promise.all([
    supabase.from('profiles').select('id, role, is_suspended, created_at'),
    supabase.from('jobs').select('id, status, created_at'),
    supabase.from('reports').select('id, status'),
    supabase.from('profiles')
      .select('id, full_name, role, created_at, is_suspended')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
  ])

  const users   = usersRes.data   || []
  const jobs    = jobsRes.data    || []
  const reports = reportsRes.data || []

  return {
    totalUsers:    users.length,
    workers:       users.filter(u => u.role === 'worker').length,
    employers:     users.filter(u => u.role === 'employer').length,
    suspended:     users.filter(u => u.is_suspended).length,
    totalJobs:     jobs.length,
    openJobs:      jobs.filter(j => j.status === 'open').length,
    completedJobs: jobs.filter(j => j.status === 'completed').length,
    openReports:   reports.filter(r => r.status === 'open').length,
    pendingVerifications: pendingVerificationsRes.count || 0,
    recentUsers:   recentUsersRes.data || [],
  }
}

const ROLE_COLOR = {
  worker:   { bg: '#e5eeff', color: '#00236f' },
  employer: { bg: '#fff3cd', color: '#ef9900' },
  admin:    { bg: '#ffdad6', color: '#ba1a1a' },
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: getAdminAnalytics,
    refetchInterval: 60000,
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#0b1c30' }}>
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Admin'}
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
          Here's what's happening on GigGle today.
        </p>
      </div>

      {/* Alert banner */}
      {stats?.openReports > 0 && (
        <div className="flex items-center gap-3 mb-4 px-5 py-3.5 rounded-2xl border"
          style={{ background: '#fffbeb', borderColor: '#f0c040' }}>
          <AlertTriangle size={18} style={{ color: '#b36b00', flexShrink: 0 }} />
          <p className="text-sm font-medium flex-1" style={{ color: '#7c5e00' }}>
            {stats.openReports} open report{stats.openReports !== 1 ? 's' : ''} awaiting review
          </p>
          <Link to="/admin/reports"
            className="text-sm font-bold flex items-center gap-1 shrink-0"
            style={{ color: '#b36b00' }}>
            Review <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {stats?.pendingVerifications > 0 && (
        <div className="flex items-center gap-3 mb-6 px-5 py-3.5 rounded-2xl border"
          style={{ background: '#fffbeb', borderColor: '#f0c040' }}>
          <UserCheck size={18} style={{ color: '#b36b00', flexShrink: 0 }} />
          <p className="text-sm font-medium flex-1" style={{ color: '#7c5e00' }}>
            {stats.pendingVerifications} identity verification{stats.pendingVerifications !== 1 ? 's' : ''} awaiting review
          </p>
          <Link to="/admin/verifications"
            className="text-sm font-bold flex items-center gap-1 shrink-0"
            style={{ color: '#b36b00' }}>
            Review <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard
          icon={Users}
          tone="navy"
          label="Total Users"
          value={stats?.totalUsers}
          sub={`${stats?.workers} workers · ${stats?.employers} employers`}
          to="/admin/users"
        />
        <StatCard
          icon={Briefcase}
          tone="green"
          label="Total Jobs"
          value={stats?.totalJobs}
          sub={`${stats?.openJobs} open · ${stats?.completedJobs} completed`}
          to="/admin/jobs"
        />
        <StatCard
          icon={Flag}
          tone="alert"
          label="Open Reports"
          value={stats?.openReports}
          to="/admin/reports"
        />
        <StatCard
          icon={ShieldOff}
          tone="orange"
          label="Suspended Accounts"
          value={stats?.suspended}
          to="/admin/users"
        />
        <StatCard
          icon={UserCheck}
          tone="navy"
          label="Pending Verifications"
          value={stats?.pendingVerifications}
          to="/admin/verifications"
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Quick actions */}
        <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#e4e4ef' }}>
          <h2 className="text-sm font-bold mb-4 uppercase tracking-wide" style={{ color: '#6b7280' }}>Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: '/admin/users',         label: 'Manage Users',        color: '#00236f', bg: '#eff4ff' },
              { to: '/admin/verifications', label: 'Review Verifications', color: '#1e40af', bg: '#dbeafe' },
              { to: '/admin/jobs',          label: 'Review Jobs',          color: '#006c4e', bg: '#dcfce7' },
              { to: '/admin/reports',       label: 'Moderation Queue',     color: '#ba1a1a', bg: '#fee2e2' },
            ].map(({ to, label, color, bg }) => (
              <Link key={to} to={to}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                style={{ background: bg, color }}>
                {label}
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent registrations */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border" style={{ borderColor: '#e4e4ef' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: '#6b7280' }}>Recent Registrations</h2>
            <Link to="/admin/users" className="text-xs font-semibold hover:underline" style={{ color: '#00236f' }}>
              View all
            </Link>
          </div>
          {stats?.recentUsers?.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#aaa' }}>No users yet.</p>
          ) : (
            <div className="space-y-2">
              {stats?.recentUsers?.map(u => (
                <div key={u.id} className="flex items-center gap-3 py-1.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: ROLE_COLOR[u.role]?.bg || '#f3f4f6', color: ROLE_COLOR[u.role]?.color || '#444' }}>
                    {u.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: u.is_suspended ? '#aaa' : '#0b1c30' }}>
                      {u.full_name}
                      {u.is_suspended && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#fee2e2', color: '#ba1a1a' }}>
                          Suspended
                        </span>
                      )}
                    </p>
                    <p className="text-xs capitalize" style={{ color: '#9ca3af' }}>{u.role}</p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: '#c0c0cc' }}>
                    {new Date(u.created_at).toLocaleDateString('fr-CM', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
