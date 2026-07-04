import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import WorkerLayout from './WorkerLayout'
import EmployerLayout from './EmployerLayout'
import AdminLayout from './AdminLayout'

// Renders whichever role's layout (sidebar/nav) matches the current viewer,
// for routes shared across roles (e.g. /profile/:id) that would otherwise
// render standalone with no navigation chrome.
export default function RoleAwareLayout() {
  const { profile, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role === 'employer') return <EmployerLayout />
  if (profile.role === 'admin') return <AdminLayout />
  return <WorkerLayout />
}
