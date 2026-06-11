import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

// Layouts
import WorkerLayout from './components/layout/WorkerLayout'
import EmployerLayout from './components/layout/EmployerLayout'
import AdminLayout from './components/layout/AdminLayout'

// Public pages
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import AuthConfirm from './pages/auth/AuthConfirm'

// Shared authenticated pages
import PublicProfile from './pages/shared/PublicProfile'
import FileReport from './pages/shared/FileReport'
import NotFound from './pages/shared/NotFound'

// Complaints
import WorkerComplaints from './pages/worker/WorkerComplaints'
import EmployerComplaints from './pages/employer/EmployerComplaints'

// Payment & Rating dedicated pages
import SubmitPayment from './pages/employer/SubmitPayment'
import RateWorker from './pages/employer/RateWorker'
import ConfirmPayment from './pages/worker/ConfirmPayment'
import RateEmployer from './pages/worker/RateEmployer'

// Worker pages
import WorkerDashboard from './pages/worker/WorkerDashboard'
import WorkerOnboarding from './pages/worker/WorkerOnboarding'
import BrowseJobs from './pages/worker/BrowseJobs'
import JobDetailPage from './pages/worker/JobDetailPage'
import MyApplications from './pages/worker/MyApplications'
import WorkerHistory from './pages/worker/WorkerHistory'
import WorkerChat from './pages/worker/WorkerChat'
import WorkerProfile from './pages/worker/WorkerProfile'
import WorkerNotifications from './pages/worker/WorkerNotifications'
import WorkerSettings from './pages/worker/WorkerSettings'

// Employer pages
import EmployerDashboard from './pages/employer/EmployerDashboard'
import EmployerOnboarding from './pages/employer/EmployerOnboarding'
import PostJob from './pages/employer/PostJob'
import EmployerJobDetail from './pages/employer/EmployerJobDetail'
import EditJob from './pages/employer/EditJob'
import ManageApplicants from './pages/employer/ManageApplicants'
import EmployerChat from './pages/employer/EmployerChat'
import EmployerProfile from './pages/employer/EmployerProfile'
import EmployerNotifications from './pages/employer/EmployerNotifications'
import EmployerSettings from './pages/employer/EmployerSettings'
import MyJobs from './pages/employer/MyJobs'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminJobs from './pages/admin/AdminJobs'
import AdminReports from './pages/admin/AdminReports'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/auth/confirm" element={<AuthConfirm />} />

      {/* Worker routes */}
      <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
        {/* Onboarding outside layout — full-screen standalone design */}
        <Route path="/worker/onboarding" element={<WorkerOnboarding />} />

        {/* All other worker routes wrapped in WorkerLayout */}
        <Route element={<WorkerLayout />}>
          <Route path="/worker/dashboard" element={<WorkerDashboard />} />
          <Route path="/worker/browse" element={<BrowseJobs />} />
          <Route path="/worker/jobs/:id" element={<JobDetailPage />} />
          <Route path="/worker/applications" element={<MyApplications />} />
          <Route path="/worker/history" element={<WorkerHistory />} />
          <Route path="/worker/jobs/:id/chat" element={<WorkerChat />} />
          <Route path="/worker/profile" element={<WorkerProfile />} />
          <Route path="/worker/notifications" element={<WorkerNotifications />} />
          <Route path="/worker/settings" element={<WorkerSettings />} />
          <Route path="/worker/complaints" element={<WorkerComplaints />} />
          <Route path="/worker/jobs/:id/confirm-payment" element={<ConfirmPayment />} />
          <Route path="/worker/jobs/:id/rate" element={<RateEmployer />} />
        </Route>
      </Route>

      {/* Employer routes */}
      <Route element={<ProtectedRoute allowedRoles={['employer']} />}>
        {/* Onboarding outside layout — full-screen standalone design */}
        <Route path="/employer/onboarding" element={<EmployerOnboarding />} />

        {/* All other employer routes wrapped in EmployerLayout */}
        <Route element={<EmployerLayout />}>
          <Route path="/employer/dashboard" element={<EmployerDashboard />} />
          <Route path="/employer/my-jobs" element={<MyJobs />} />
          <Route path="/employer/post-job" element={<PostJob />} />
          <Route path="/employer/jobs/:id" element={<EmployerJobDetail />} />
          <Route path="/employer/jobs/:id/edit" element={<EditJob />} />
          <Route path="/employer/jobs/:id/applicants" element={<ManageApplicants />} />
          <Route path="/employer/jobs/:id/chat/:workerId" element={<EmployerChat />} />
          <Route path="/employer/profile" element={<EmployerProfile />} />
          <Route path="/employer/notifications" element={<EmployerNotifications />} />
          <Route path="/employer/settings" element={<EmployerSettings />} />
          <Route path="/employer/complaints" element={<EmployerComplaints />} />
          <Route path="/employer/jobs/:id/payment" element={<SubmitPayment />} />
          <Route path="/employer/jobs/:id/rate" element={<RateWorker />} />
        </Route>
      </Route>

      {/* Shared authenticated — no layout wrapper, accessible by either role */}
      <Route element={<ProtectedRoute allowedRoles={['worker', 'employer', 'admin']} />}>
        <Route path="/profile/:id" element={<PublicProfile />} />
        <Route path="/complaint/new" element={<FileReport />} />
        {/* legacy alias kept for any existing links */}
        <Route path="/report/:targetId" element={<FileReport />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users"     element={<AdminUsers />} />
          <Route path="/admin/jobs"      element={<AdminJobs />} />
          <Route path="/admin/reports"   element={<AdminReports />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
