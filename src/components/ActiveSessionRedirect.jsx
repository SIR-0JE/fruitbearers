import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'

export default function ActiveSessionRedirect() {
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading]     = useState(true)
  const navigate                  = useNavigate()

  useEffect(() => {
    async function findActive() {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        toast.error('No active Sunday session found')
        navigate('/history', { replace: true })
      } else {
        setSessionId(data.id)
      }
      setLoading(false)
    }
    findActive()
  }, [navigate])

  if (loading) return <LoadingSpinner />
  if (sessionId) return <Navigate to={`/check-in/${sessionId}`} replace />
  
  return null
}
