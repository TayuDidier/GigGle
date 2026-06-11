import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useEmployerNotificationCount } from '../../hooks/useNotificationCount'
import {
  LayoutDashboard, PlusCircle, Briefcase,
  Bell, User, Settings, LogOut, Flag,
} from 'lucide-react'

const NAV = [
  { to: '/employer/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employer/post-job',      icon: PlusCircle,      label: 'Post a Job' },
  { to: '/employer/notifications', icon: Bell,            label: 'Notifications' },
  { to: '/employer/complaints',    icon: Flag,            label: 'Complaints' },
]

const BOTTOM_NAV = [
  { to: '/employer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employer/post-job',  icon: PlusCircle,      label: 'Post Job' },
  { to: '/employer/my-jobs',   icon: Briefcase,       label: 'My Jobs' },
  { to: '/employer/profile',   icon: User,            label: 'Profile' },
]

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'text-white'
            : 'hover:bg-white/10 text-white/70 hover:text-white'
        }`
      }
      style={({ isActive }) => isActive ? { background: 'rgba(255,255,255,0.15)' } : {}}
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  )
}

function NotifBadge({ count }) {
  if (!count) return null
  return (
    <span
      className="ml-auto inline-flex items-center justify-center rounded-full text-white font-bold"
      style={{
        background: '#ba1a1a',
        fontSize: '10px',
        minWidth: '18px',
        height: '18px',
        padding: '0 4px',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default function EmployerLayout() {
  const { profile, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const { data: notifCount = 0 } = useEmployerNotificationCount(profile?.id)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9ff' }}>
      <div
        className="w-8 h-8 border-4 rounded-full animate-spin"
        style={{ borderColor: '#00236f', borderTopColor: 'transparent' }}
      />
    </div>
  )

  // Redirect to onboarding if not completed
  if (profile && !profile.onboarding_done) {
    return <Navigate to="/employer/onboarding" replace />
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f8f9ff' }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0 fixed top-0 left-0 h-full z-30"
        style={{ background: '#00236f' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-1 px-6 py-5 border-b border-white/10">
          <span className="text-xl font-bold text-white">GigGle</span>
          <span style={{ color: '#ef9900' }}>✦</span>
        </div>

        {/* User chip */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <User size={16} color="white" />
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile?.full_name}</p>
              <p className="text-xs text-white/60">Employer</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive ? 'text-white' : 'hover:bg-white/10 text-white/70 hover:text-white'
                }`
              }
              style={({ isActive }) => isActive ? { background: 'rgba(255,255,255,0.15)' } : {}}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.to === '/employer/notifications' && <NotifBadge count={notifCount} />}
            </NavLink>
          ))}
          <NavLink
            to="/employer/my-jobs"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive ? 'text-white' : 'hover:bg-white/10 text-white/70 hover:text-white'
              }`
            }
            style={({ isActive }) => isActive ? { background: 'rgba(255,255,255,0.15)' } : {}}
          >
            <Briefcase size={18} />
            <span>My Jobs</span>
          </NavLink>
        </nav>

        {/* Bottom links */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <NavItem to="/employer/profile"  icon={User}     label="Profile" />
          <NavItem to="/employer/settings" icon={Settings} label="Settings" />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium w-full transition-all hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-60 min-h-screen">
        {/* Mobile top header */}
        <header
          className="md:hidden flex items-center justify-between px-4 h-14 border-b bg-white sticky top-0 z-20"
          style={{ borderColor: '#c5c5d3' }}
        >
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold" style={{ color: '#00236f' }}>GigGle</span>
            <span style={{ color: '#ef9900' }}>✦</span>
          </div>
          <div className="flex items-center gap-3">
            <NavLink to="/employer/notifications" className="relative">
              <Bell size={20} color="#00236f" />
              {notifCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full text-white font-bold"
                  style={{ background: '#ba1a1a', fontSize: '9px', minWidth: '16px', height: '16px', padding: '0 3px' }}
                >
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/employer/profile">
              <div
                className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: '#e5eeff' }}
              >
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <User size={15} color="#00236f" />
                }
              </div>
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-20 flex"
        style={{ borderColor: '#c5c5d3' }}
      >
        {BOTTOM_NAV.map(({ to, icon: Icon, label }, idx) => (
          <NavLink
            key={`${to}-${idx}`}
            to={to}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors"
            style={({ isActive }) => ({ color: isActive ? '#00236f' : '#444651' })}
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
