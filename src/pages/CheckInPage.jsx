import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function CheckInPage() {
  const { id: sessionId } = useParams()  // route is /check-in/:id
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [status, setStatus]   = useState('loading') // loading | success | already | error | invalid
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Redirect to login if not authenticated (preserving the check-in URL)
    if (!user) {
      navigate(`/login?redirect=/check-in/${sessionId}`, { replace: true })
      return
    }
    doCheckIn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sessionId])

  const doCheckIn = async () => {
    // Validate session exists and is active
    const { data: sess, error: sessErr } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessErr || !sess) {
      setStatus('invalid')
      return
    }
    // Check session is active (admin-controlled, timezone-safe)
    if (!sess.is_active) {
      setStatus('invalid')
      setSession(sess)
      return
    }

    setSession(sess)

    // Upsert attendance record (unique on user_id + session_id)
    const { error: insertErr, data } = await supabase
      .from('attendance_records')
      .upsert(
        { user_id: user.id, session_id: sessionId },
        { onConflict: 'user_id,session_id', ignoreDuplicates: false }
      )
      .select()

    if (insertErr) {
      if (insertErr.code === '23505') {
        setStatus('already')
      } else {
        console.error(insertErr)
        setStatus('error')
      }
      return
    }

    // ── Perfected Streak Logic ──
    const today = new Date().toISOString().split('T')[0]
    const lastCheckin = profile?.last_checkin
    let newStreak = profile?.attendance_streak || 0
    
    if (!lastCheckin) {
      newStreak = 1
    } else if (lastCheckin !== today) {
      const lDate = new Date(lastCheckin)
      const diffDays = Math.floor((new Date() - lDate) / (1000 * 60 * 60 * 24))
      if (diffDays <= 8) newStreak += 1
      else newStreak = 1
    }

    await supabase.from('profiles')
      .update({ attendance_streak: newStreak, last_checkin: today })
      .eq('id', user.id)

    setStatus('success')

    // Auto-redirect to history after 3 seconds
    setTimeout(() => navigate('/history', { replace: true }), 3500)
  }

  if (status === 'loading') return <LoadingSpinner />

  const dateLabel = session
    ? new Date(session.service_date + 'T12:00:00').toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  return (
    <div
      className="bg-gradient-radial"
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: '#fff' }}
    >
      <div className="glass animate-fade-up" style={{ maxWidth: 420, width: '100%', padding: '3rem 2.5rem', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', borderRadius: '1.75rem', border: '1px solid var(--border)' }}>

        {/* ── SUCCESS ────────────────────────────────────────────── */}
        {status === 'success' && (
          <>
            <div className="animate-pop" style={{ marginBottom: '1.75rem' }}>
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  background: 'rgba(44,95,45,0.08)',
                  border: '2px solid rgba(44,95,45,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  boxShadow: '0 8px 24px rgba(44,95,45,0.1)',
                }}
              >
                <CheckCircle2 size={48} color="var(--green)" strokeWidth={2} />
              </div>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.85rem', fontWeight: 800, color: 'var(--navy)', margin: '0 0 0.75rem' }}>
              Checked In! 🎉
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0 0 1.5rem', fontWeight: 600 }}>
              Welcome, <span style={{ color: 'var(--gold)' }}>{profile?.full_name}</span>
            </p>
            
            <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)', padding: '12px 20px', borderRadius: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '0 auto 2rem', width: 'fit-content' }}>
              <span style={{ fontSize: '18px' }}>🔥</span>
              <span style={{ color: '#d4af37', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {profile?.attendance_streak || 1} Fires Total
              </span>
            </div>
            <div
              style={{
                background: 'var(--beige)',
                border: '1px solid var(--border)',
                borderRadius: '0.85rem',
                padding: '1rem',
                fontSize: '0.8rem',
                color: 'var(--navy)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Clock size={16} color="var(--gold)" />
              Auto-redirect to summary…
            </div>
          </>
        )}

        {/* ── ALREADY CHECKED IN ─────────────────────────────────── */}
        {status === 'already' && (
          <>
            <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem' }}>👋</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 800, color: 'var(--navy)', margin: '0 0 0.75rem' }}>
              Record Found
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 2rem', fontWeight: 500 }}>
              You have already checked in for today's session, <strong style={{ color: 'var(--navy)' }}>{profile?.full_name}</strong>.
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate('/history')}
              style={{ width: '100%', padding: '1rem' }}
            >
              Go to My Activity <ChevronRight size={18} style={{ marginLeft: '4px' }} />
            </button>
          </>
        )}

        {/* ── INVALID SESSION ────────────────────────────────────── */}
        {status === 'invalid' && (
          <>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#fff1f0',
                border: '2px solid #ffa39e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <XCircle size={40} color="#ff4d4f" strokeWidth={2} />
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy)', margin: '0 0 0.75rem' }}>
              Session Closed
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 2.25rem', fontWeight: 500 }}>
              This attendance session is no longer active. Please request a new link from the administrator.
            </p>
            <button className="btn-ghost" onClick={() => navigate('/history')} style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', background: '#f8f9fa' }}>
              Back to My Activity
            </button>
          </>
        )}

        {/* ── GENERIC ERROR ─────────────────────────────────────── */}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⚠️</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy)', margin: '0 0 0.75rem' }}>
              System Error
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 2.25rem', fontWeight: 500 }}>
              We encountered a problem recording your attendance. Please try again.
            </p>
            <button className="btn-primary" onClick={doCheckIn} style={{ width: '100%', padding: '1rem' }}>
              Retry Check-in
            </button>
          </>
        )}

      </div>
    </div>
  )
}
