import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { AudioProvider } from './contexts/AudioContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import RootRedirect from './components/RootRedirect'

// Lazy loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AdminPortalLogin = lazy(() => import('./pages/AdminPortalLogin'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const CheckInPage = lazy(() => import('./pages/CheckInPage'))
const HomeScreen = lazy(() => import('./pages/HomeScreen'))
const MediaScreen = lazy(() => import('./pages/MediaScreen'))
const TopicsScreen = lazy(() => import('./pages/TopicsScreen'))
const GivingScreen = lazy(() => import('./pages/GivingScreen'))
const AccountScreen = lazy(() => import('./pages/AccountScreen'))
const ScannerPage = lazy(() => import('./pages/ScannerPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const Unauthorized = lazy(() => import('./pages/Unauthorized'))
const AttendanceHistory = lazy(() => import('./pages/AttendanceHistory'))

const LoadingFallback = () => (
  <div style={{ minHeight: '100vh', background: '#0e0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid rgba(44,95,45,0.2)', borderTopColor: '#2C5F2D', borderRadius: '50%' }} />
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <BrowserRouter>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.9rem',
                borderRadius: '1rem',
              },
            }}
          />
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/"               element={<RootRedirect />} />
                <Route path="/login"          element={<LoginPage />} />
                <Route path="/signup"         element={<SignupPage />} />
                <Route path="/unauthorized"   element={<Unauthorized />} />
                <Route path="/admin-portal"   element={<AdminPortalLogin />} />

                {/* Protected Member Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/home"          element={<HomeScreen />} />
                  <Route path="/media"         element={<MediaScreen />} />
                  <Route path="/topics"        element={<TopicsScreen />} />
                  <Route path="/giving"        element={<GivingScreen />} />
                  <Route path="/account"       element={<AccountScreen />} />
                  <Route path="/profile"       element={<ProfilePage />} />
                  <Route path="/scan"          element={<ScannerPage />} />
                  <Route path="/check-in/:id"  element={<CheckInPage />} />
                  <Route path="/history"       element={<AttendanceHistory />} />
                </Route>

                {/* Admin-only routes */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin"         element={<AdminDashboard />} />
                  <Route path="/dashboard"     element={<AdminDashboard />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </AudioProvider>
    </AuthProvider>
  )
}
