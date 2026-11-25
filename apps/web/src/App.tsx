import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { AppLayout } from '@/components/layout/AppLayout'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/app/DashboardPage'

const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))
const IncidentsPage = lazy(() => import('@/pages/app/IncidentsPage'))
const DocumentsPage = lazy(() => import('@/pages/app/DocumentsPage'))
const EvidencePage = lazy(() => import('@/pages/app/EvidencePage'))
const RisksPage = lazy(() => import('@/pages/app/RisksPage'))
const RecommendationsPage = lazy(() => import('@/pages/app/RecommendationsPage'))
const TasksPage = lazy(() => import('@/pages/app/TasksPage'))
const AuditPage = lazy(() => import('@/pages/app/AuditPage'))
const ProfilePage = lazy(() => import('@/pages/app/ProfilePage'))

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050607] text-slate-300 text-sm">
      Loading SENTINELA AI...
    </div>
  )
}

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageFallback />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/app" element={<Protected><AppLayout /></Protected>}>
          <Route index element={<DashboardPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="evidence" element={<EvidencePage />} />
          <Route path="risks" element={<RisksPage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
