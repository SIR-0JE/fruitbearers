import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import SplashScreen from './SplashScreen'
import LandingPage from '../pages/LandingPage'
import { AnimatePresence } from 'framer-motion'

export default function RootRedirect() {
  const { user, profile, loading } = useAuth()
  
  if (loading) return <SplashScreen />
  
  return (
    <>
      <AnimatePresence mode="wait">
        {!user ? (
          <LandingPage key="landing" />
        ) : profile?.role === 'admin' ? (
          <Navigate to="/admin" replace />
        ) : (
          <Navigate to="/home" replace />
        )}
      </AnimatePresence>
    </>
  )
}
