import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'

// Admin credential constants (stored in env, mapped to Supabase auth)
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'FRUITBEARERS'
const ADMIN_EMAIL    = import.meta.env.VITE_ADMIN_EMAIL    || 'admin@fruitbearers.church'
const ADMIN_SECRET   = import.meta.env.VITE_ADMIN_SECRET   || 'INSIDEOUT'

export default function AdminPortalLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Auto-fill credentials if URL contains ?auto=1 or ?u=...&p=...
  useEffect(() => {
    const autoU = searchParams.get('u') || searchParams.get('user')
    const autoP = searchParams.get('p') || searchParams.get('pass')
    const auto  = searchParams.get('auto')

    if (autoU) setUsername(autoU.toUpperCase())
    if (autoP) setPassword(autoP)

    // If ?auto=1, attempt login immediately
    if (auto === '1' || (autoU && autoP)) {
      const u = autoU?.toUpperCase() || ''
      const p = autoP || ''
      if (u === ADMIN_USERNAME && p === ADMIN_SECRET) {
        attemptLogin(ADMIN_EMAIL, p)
      }
    }
  }, [])

  const attemptLogin = async (email, pass) => {
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (err) {
      if (err.message?.toLowerCase().includes('email not confirmed')) {
        setError('Email not confirmed. Go to Supabase → Authentication → Providers → Email → turn OFF "Confirm email", then try again.')
      } else if (err.message?.toLowerCase().includes('invalid login')) {
        setError('Wrong credentials. Make sure you ran the DB setup SQL in Supabase first.')
      } else {
        setError(err.message)
      }
      setLoading(false)
    } else {
      navigate('/admin', { replace: true })
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()

    // Validate custom username/password → map to Supabase email
    if (username.trim().toUpperCase() !== ADMIN_USERNAME) {
      setError('Invalid admin username.')
      return
    }
    if (password !== ADMIN_SECRET) {
      setError('Invalid admin password.')
      return
    }

    await attemptLogin(ADMIN_EMAIL, password)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0f0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Background subtle pattern */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `radial-gradient(circle at 20% 20%, rgba(44,95,45,0.15) 0%, transparent 50%),
                          radial-gradient(circle at 80% 80%, rgba(212,175,55,0.08) 0%, transparent 50%)`,
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}
      >
        {/* Logo + heading */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 16 }}
            style={{
              width: '72px', height: '72px', borderRadius: '22px',
              background: '#2C5F2D', margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(44,95,45,0.4)',
              border: '1.5px solid rgba(255,255,255,0.1)',
            }}
          >
            <img src="/logo.png" alt="Fruitbearers" style={{ width: '52px', height: '52px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </motion.div>

          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Fruitbearers Admin
          </h1>
          <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>
            Secure portal · Authorised access only
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: '#111811',
          border: '1px solid rgba(44,95,45,0.25)',
          borderRadius: '24px', padding: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <ShieldCheck size={16} color="#2C5F2D" />
            <span style={{ color: '#2C5F2D', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Administrator Login
            </span>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '12px', padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px',
              }}
            >
              <AlertCircle size={15} color="#ef4444" />
              <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: 500 }}>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Admin Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toUpperCase())}
                placeholder="FRUITBEARERS"
                autoCapitalize="characters"
                autoComplete="username"
                required
                style={{
                  width: '100%', background: '#0e130e', border: '1.5px solid #1e2e1e',
                  borderRadius: '14px', padding: '14px 16px', color: '#fff',
                  fontSize: '16px', fontWeight: 700, outline: 'none',
                  fontFamily: 'inherit', letterSpacing: '0.08em', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#2C5F2D'}
                onBlur={e => e.target.style.borderColor = '#1e2e1e'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  style={{
                    width: '100%', background: '#0e130e', border: '1.5px solid #1e2e1e',
                    borderRadius: '14px', padding: '14px 50px 14px 16px', color: '#fff',
                    fontSize: '16px', fontWeight: 600, outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2C5F2D'}
                  onBlur={e => e.target.style.borderColor = '#1e2e1e'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: '4px' }}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '16px',
                background: loading ? '#1a3a1b' : 'linear-gradient(135deg, #2C5F2D 0%, #3d7a3e 100%)',
                color: '#fff', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em',
                border: 'none', borderRadius: '14px', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(44,95,45,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s',
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                  />
                  Authenticating...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Access Dashboard
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <p style={{ color: '#333', fontSize: '11px', lineHeight: 1.5 }}>
            🌿 Fruitbearers Church — Bowen University<br />
            <span style={{ color: '#2a2a2a' }}>We Flourish From Inside Out</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
