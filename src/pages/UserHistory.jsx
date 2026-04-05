import { useEffect, useState } from 'react'
import { Calendar, Flame, Trophy, Clock, Church, QrCode, UserCircle, ArrowRight, ShieldAlert } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'

export default function UserHistory() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*, attendance_sessions(date)')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
      if (!error) setRecords(data || [])
      setLoading(false)
    }
    fetchHistory()
  }, [user])

  // Profile completion check
  const isProfileIncomplete = !profile?.dob || !profile?.wisdom_house || !profile?.avatar_url

  // ─── Stats ───────────────────────────────────────────────────────
  const totalSessions = records.length

  const streak = (() => {
    if (records.length === 0) return 0
    const dates = records
      .map(r => r.attendance_sessions?.date)
      .filter(Boolean)
      .map(d => new Date(d + 'T12:00:00'))
      .sort((a, b) => b - a)

    let count = 1
    for (let i = 0; i < dates.length - 1; i++) {
      const diff = (dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24)
      if (diff <= 8) count++
      else break
    }
    return count
  })()

  const lastDate = records[0]?.attendance_sessions?.date
  const lastLabel = lastDate
    ? new Date(lastDate + 'T12:00:00').toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })
    : '—'

  if (loading) return <LoadingSpinner />

  return (
    <div className="bg-gradient-radial" style={{ minHeight: '100vh', background: '#fff' }}>
      <Navbar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.25rem' }}>

        {/* ── Profile Alert ────────────────────────────────────── */}
        {isProfileIncomplete && (
          <div className="animate-fade-up" style={{ 
            background: 'var(--beige)', border: '1px solid var(--gold)', 
            padding: '1.25rem', borderRadius: '1.25rem', marginBottom: '2rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
            boxShadow: '0 8px 24px rgba(212,175,55,0.08)'
          }}>
            <div style={{ width: 48, height: 48, background: '#fff', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
              <UserCircle size={26} color="var(--gold)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--navy)' }}>Complete your record</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Please add your Wisdom House and Photo</p>
            </div>
            <Link to="/profile" style={{ 
              background: 'var(--navy)', color: '#fff', padding: '0.6rem 1rem', 
              borderRadius: '0.85rem', textDecoration: 'none', fontSize: '0.8rem', 
              fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' 
            }}>
              Go to Profile <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.25rem', fontWeight: 800, margin: 0, color: 'var(--navy)' }}>
              My Activity
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>
              Welcome back, <strong style={{ color: 'var(--navy)' }}>{profile?.full_name}</strong>.
            </p>
          </div>
          <Link to="/scan" className="btn-primary ripple" style={{ padding: '1rem 1.5rem', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(44,95,45,0.2)' }}>
            <QrCode size={20} /> <span>Scan Attendance</span>
          </Link>
        </div>

        {/* ── Stats Bar ─────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { icon: <Trophy size={20} color="var(--gold)" />, label: 'Sessions', value: totalSessions, color: 'var(--gold)' },
            { icon: <Flame size={20} color="var(--green)" />, label: 'Streak', value: `${streak} wk${streak !== 1 ? 's' : ''}`, color: 'var(--green)' },
            { icon: <Clock size={20} color="var(--navy)" />, label: 'Last Date', value: lastLabel, color: 'var(--navy)' },
          ].map(stat => (
            <div key={stat.label} className="glass" style={{ padding: '1.25rem 0.75rem', textAlign: 'center', borderRadius: '1.25rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>{stat.icon}</div>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: stat.color }}>{stat.value}</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Records List ──────────────────────────────────────── */}
        <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.75rem' }}>
            <Calendar size={18} color="var(--gold)" />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy)' }}>
              Sunday Presence Log
            </h2>
          </div>

          {records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <div style={{ width: 80, height: 80, borderRadius: '1.25rem', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid var(--border)' }}>
                <Church size={32} color="var(--gold)" />
              </div>
              <p style={{ color: 'var(--navy)', fontWeight: 800, marginBottom: '0.5rem', fontSize: '1rem' }}>No records found</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, maxWidth: '240px', margin: '0 auto' }}>
                Your check-ins will appear here once you scan the attendance QR code!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {records.map((rec, i) => {
                const date = rec.attendance_sessions?.date
                const dateObj = date ? new Date(date + 'T12:00:00') : null
                return (
                  <div key={rec.id} className="animate-fade-up" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '1rem', animationDelay: `${i * 0.05}s`, animationFillMode: 'both', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '0.85rem', background: i === 0 ? 'var(--gold)' : 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                      {totalSessions - i}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 750, fontSize: '0.95rem', color: 'var(--navy)' }}>
                        {dateObj ? dateObj.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown Session'}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 600 }}>
                        Checked in at {new Date(rec.timestamp).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {i === 0 && <span className="badge badge-green" style={{ flexShrink: 0, fontWeight: 700 }}>Latest</span>}
                    {i !== 0 && <span className="badge badge-navy" style={{ flexShrink: 0, opacity: 0.8 }}>✓</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Fruitbearers Attendance System · {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
