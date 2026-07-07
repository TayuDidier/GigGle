import { NavLink, Outlet, useNavigate, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkerNotificationCount } from '../../hooks/useNotificationCount'
import {
  LayoutDashboard, Search, FileText, Clock,
  Bell, User, Settings, LogOut, Flag, Zap,
} from 'lucide-react'

const NAV = [
  { to: '/worker/dashboard',     icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/worker/browse',        icon: Search,          label: 'Browse Jobs'  },
  { to: '/worker/applications',  icon: FileText,        label: 'Applications' },
  { to: '/worker/history',       icon: Clock,           label: 'History'      },
  { to: '/worker/notifications', icon: Bell,            label: 'Notifications'},
  { to: '/worker/complaints',    icon: Flag,            label: 'Complaints'   },
]

const BOTTOM_NAV = [
  { to: '/worker/dashboard',    icon: LayoutDashboard, label: 'Home'    },
  { to: '/worker/browse',       icon: Search,          label: 'Browse'  },
  { to: '/worker/applications', icon: FileText,        label: 'Applied' },
  { to: '/worker/profile',      icon: User,            label: 'Profile' },
]

function NotifBadge({ count }) {
  if (!count) return null
  return (
    <span
      className="ml-auto inline-flex items-center justify-center rounded-full text-white font-bold text-[9px] min-w-[18px] h-[18px] px-1"
      style={{ background: '#ba1a1a' }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function SidebarNavItem({ to, icon: Icon, label, notifCount, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={to.endsWith('dashboard')}
      className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
    >
      <Icon size={17} strokeWidth={1.75} />
      <span>{label}</span>
      {to === '/worker/notifications' && <NotifBadge count={notifCount} />}
    </NavLink>
  )
}

export default function WorkerLayout() {
  const { profile, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isBrowse = location.pathname === '/worker/browse'
  const { data: notifCount = 0 } = useWorkerNotificationCount(profile?.id)

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#f8f9ff' }}>
      <div className="flex items-center gap-1.5">
        <Zap size={22} fill="#ef9900" color="#ef9900" />
        <span className="text-xl font-bold" style={{ color: '#00236f' }}>GigGle</span>
      </div>
      <div className="w-6 h-6 border-[3px] rounded-full animate-spin"
        style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
    </div>
  )

  if (profile && !profile.onboarding_done) {
    return <Navigate to="/worker/onboarding" replace />
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f8f9ff' }}>

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`${isBrowse ? 'hidden' : 'hidden md:flex'} flex-col w-60 shrink-0 fixed top-0 left-0 h-full z-30`}
        style={{ background: 'linear-gradient(160deg, #001852 0%, #00236f 55%, #002f8a 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(239,153,0,0.2)' }}>
            <Zap size={16} fill="#ef9900" color="#ef9900" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">GigGle</p>
            <p className="text-[10px] mt-0.5 font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Worker Portal</p>
          </div>
        </div>

        {/* User chip */}
        <div className="px-3 py-3 mx-3 mt-3 rounded-2xl border border-white/10"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center ring-2 ring-white/20"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <User size={15} color="white" />
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">{profile?.full_name}</p>
              <p className="text-[10px] mt-0.5 font-medium" style={{ color: '#ef9900' }}>Worker</p>
            </div>
          </div>
        </div>

        {/* Section label */}
        <p className="px-6 pt-5 pb-2 text-[10px] font-semibold tracking-widest uppercase"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          Menu
        </p>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          {NAV.map(item => (
            <SidebarNavItem key={item.to} {...item} notifCount={notifCount} />
          ))}
        </nav>

        {/* Bottom links */}
        <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
          <SidebarNavItem to="/worker/profile"  icon={User}     label="Profile"  />
          <SidebarNavItem to="/worker/settings" icon={Settings} label="Settings" />
          <button
            onClick={handleSignOut}
            className="nav-item w-full hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={17} strokeWidth={1.75} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className={`flex-1 min-w-0 flex flex-col ${isBrowse ? '' : 'md:ml-60'} min-h-screen`}>

        {/* Mobile top header */}
        <header
          className="md:hidden flex items-center justify-between px-4 h-14 border-b bg-white sticky top-0 z-20"
          style={{ borderColor: '#e4e4ef' }}
        >
          <div className="flex items-center gap-1.5">
            <Zap size={18} fill="#ef9900" color="#ef9900" />
            <span className="text-base font-bold" style={{ color: '#00236f' }}>GigGle</span>
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/worker/notifications" className="relative p-1.5">
              <Bell size={18} color="#00236f" strokeWidth={1.75} />
              {notifCount > 0 && (
                <span
                  className="absolute top-0.5 right-0.5 flex items-center justify-center rounded-full text-white font-bold text-[8px] min-w-[14px] h-[14px] px-0.5"
                  style={{ background: '#ba1a1a' }}
                >
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/worker/profile">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center ring-2"
                style={{ background: '#e5eeff', ringColor: '#00236f' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <User size={14} color="#00236f" />
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

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 border-t z-20 flex"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderColor: '#e4e4ef',
        }}
      >
        {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition-colors duration-200"
            style={({ isActive }) => ({ color: isActive ? '#00236f' : '#9ca3af' })}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.25 : 1.6} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
