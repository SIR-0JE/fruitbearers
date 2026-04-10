import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { AudioProvider } from './contexts/AudioContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'

// Pages
import LoginPage from './pages/LoginPage'
import AdminPortalLogin from './pages/AdminPortalLogin'
import SignupPage from './pages/SignupPage'
import AdminDashboard from './pages/AdminDashboard'
import CheckInPage from './pages/CheckInPage'
import HomeScreen from './pages/HomeScreen'
import MediaScreen from './pages/MediaScreen'
import TopicsScreen from './pages/TopicsScreen'
import GivingScreen from './pages/GivingScreen'
import AccountScreen from './pages/AccountScreen'
import ScannerPage from './pages/ScannerPage'
import ProfilePage from './pages/ProfilePage'
import Unauthorized from './pages/Unauthorized'
import RootRedirect from './components/RootRedirect'

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
              </Route>

              {/* Admin-only routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin"         element={<AdminDashboard />} />
                <Route path="/dashboard"     element={<AdminDashboard />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AudioProvider>
    </AuthProvider>
  )
}
