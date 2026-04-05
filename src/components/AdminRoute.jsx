import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function AdminRoute() {
  const { user, profile, loading } = useAuth()

  // Still loading auth/profile — wait
  if (loading) return <LoadingSpinner />

  // Not logged in → send to admin portal login
  if (!user) return <Navigate to="/admin-portal" replace />

  // Profile loaded and not admin → deny
  if (profile && profile.role !== 'admin') return <Navigate to="/unauthorized" replace />

  // Profile null but user exists → keep waiting a moment (profile may still be fetching)
  // This prevents a flash redirect while the profile row loads from Supabase
  if (!profile) return <LoadingSpinner />

  return <Outlet />
}
