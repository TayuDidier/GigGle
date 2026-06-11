import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LayoutDashboard, Users, Briefcase, Flag, LogOut, ShieldCheck, Menu, X } from 'lucide-react'

const NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users',     icon: Users,           label: 'Users'     },
  { to: '/admin/jobs',      icon: Briefcase,       label: 'Jobs'      },
  { to: '/admin/reports',   icon: Flag,            label: 'Reports'   },
]

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'text-white'
            : 'text-white/60 hover:text-white hover:bg-white/10'
        }`
      }
      style={({ isActive }) => isActive ? { background: 'rgba(255,255,255,0.15)' } : {}}
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  )
}

function Sidebar({ profile, onSignOut, onClose }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(239,153,0,0.2)' }}>
            <ShieldCheck size={17} style={{ color: '#ef9900' }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">GigGle</p>
            <p className="text-xs leading-none mt-0.5" style={{ color: '#ef9900' }}>Admin Panel</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/60 hover:text-white md:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* User chip */}
      <div className="px-4 py-4 mx-3 mt-3 rounded-xl border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
            style={{ background: 'rgba(239,153,0,0.3)' }}>
            {profile?.full_name?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{profile?.full_name || 'Admin'}</p>
            <p className="text-xs font-medium" style={{ color: '#ef9900' }}>Administrator</p>
          </div>
        </div>
      </div>

      {/* Section label */}
      <p className="px-7 pt-5 pb-1.5 text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Navigation
      </p>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => <NavItem key={item.to} {...item} onClick={onClose} />)}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium w-full transition-all hover:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f0f2f8' }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 shrink-0 fixed top-0 left-0 h-full z-30"
        style={{ background: '#0b1c30' }}
      >
        <Sidebar profile={profile} onSignOut={handleSignOut} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <aside className="flex flex-col w-64 h-full" style={{ background: '#0b1c30' }}>
            <Sidebar profile={profile} onSignOut={handleSignOut} onClose={() => setMobileOpen(false)} />
          </aside>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        {/* Mobile top bar */}
        <header
          className="md:hidden flex items-center justify-between px-4 h-14 border-b sticky top-0 z-20"
          style={{ background: '#0b1c30', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} style={{ color: '#ef9900' }} />
            <span className="text-base font-bold text-white">Admin Panel</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="text-white/70 hover:text-white">
            <Menu size={22} />
          </button>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
