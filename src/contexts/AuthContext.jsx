import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch profile — retries once on failure (handles RLS timing issues)
  const fetchProfile = async (userId, retryCount = 0) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      // Retry once after 800ms (sometimes RLS or DB propagation is slow)
      if (retryCount < 2) {
        await new Promise(r => setTimeout(r, 800))
        return fetchProfile(userId, retryCount + 1)
      }
      console.warn('Could not load profile for user:', userId, error?.message)
      return null
    }

    setProfile(data)
    return data
  }

  useEffect(() => {
    let settled = false
    let subscription = null

    const finish = () => {
      if (!settled) {
        settled = true
        setLoading(false)
      }
    }

    // Safety timeout — never block UI more than 6 seconds
    const timeout = setTimeout(finish, 6000)

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        }
        finish()

        const { data } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          setUser(newSession?.user ?? null)
          if (newSession?.user) {
            await fetchProfile(newSession.user.id)
          } else {
            setProfile(null)
          }
          finish()
        })
        subscription = data.subscription
      } catch (err) {
        console.error('Auth init error:', err)
        finish()
      }
    }

    init()

    return () => {
      clearTimeout(timeout)
      subscription?.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
