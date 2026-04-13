import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ChevronLeft, CheckCircle, Calendar, Flame, Trophy, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AttendanceHistory() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    async function fetchHistory() {
      // Fetch attendance records with session info
      const { data: aRecords } = await supabase
        .from('attendance_records')
        .select('*, attendance_sessions(service_date, service_type, service_name:session_name)')
        .eq('user_id', profile.id)
        .order('timestamp', { ascending: false })

      // Fetch topic attendance for this user (which topics they've learned + coaches)
      const { data: topicRecords } = await supabase
        .from('topic_attendance')
        .select('attendance_id, topics(title), coaches(name)')
        .eq('user_id', profile.id)

      // Build a map: attendance_id → topic + coach info
      const topicMap = new Map()
      topicRecords?.forEach(t => {
        topicMap.set(t.attendance_id, {
          topicTitle: t.topics?.title,
          coachName: t.coaches?.name,
        })
      })

      // Merge into records
      const merged = (aRecords || []).map(r => ({
        ...r,
        topicInfo: topicMap.get(r.id) || null,
      }))

      setRecords(merged)
      setLoading(false)
    }
    fetchHistory()
  }, [profile])

  // ── Stats ─────────────────────────────────────────
  const total = records.length

  const streak = (() => {
    if (records.length === 0) return profile?.attendance_streak || 0
    return profile?.attendance_streak || 0
  })()

  const lastRecord = records[0]
  const lastDate = lastRecord?.attendance_sessions?.service_date
  const lastLabel = lastDate
    ? new Date(lastDate + 'T12:00:00').toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })
    : '—'

  const cardStyle = (i) => ({
    background: '#141414',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '18px',
    padding: '16px 20px',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  })

  return (
    <div style={{ background: '#0e0e0e', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '60px 20px 24px' }}>
        <button
          onClick={() => navigate('/account')}
          style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ChevronLeft size={20} color="#fff" />
        </button>
        <div>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>My Attendance</h1>
          <p style={{ color: '#555', fontSize: '12px', margin: '2px 0 0', fontWeight: 600 }}>Your full check-in history</p>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* ── Stats Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { icon: <Trophy size={18} color="#d4af37" />, label: 'Total', value: total, color: '#d4af37' },
            { icon: <Flame size={18} color="#2C5F2D" />, label: 'Streak', value: `${streak}🔥`, color: '#2C5F2D' },
            { icon: <Calendar size={18} color="#5ac8fa" />, label: 'Last', value: lastLabel, color: '#5ac8fa' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>{stat.icon}</div>
              <p style={{ color: stat.color, fontSize: stat.label === 'Last' ? '12px' : '20px', fontWeight: 800, margin: '0 0 4px', lineHeight: 1 }}>{stat.value}</p>
              <p style={{ color: '#444', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Records List ── */}
        <p style={{ color: '#444', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
          Sunday Presence Log
        </p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '18px' }} />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: '#141414', border: '1px solid rgba(44,95,45,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={32} color="#2C5F2D" />
            </div>
            <p style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0 }}>No check-ins yet</p>
            <p style={{ color: '#444', fontSize: '13px', margin: 0, lineHeight: 1.5, maxWidth: '240px' }}>
              Your attendance records will appear here once you check in with a PIN or QR code.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {records.map((rec, i) => {
              const sDate = rec.attendance_sessions?.service_date
              const dateObj = sDate ? new Date(sDate + 'T12:00:00') : null
              const serviceType = rec.attendance_sessions?.service_type || 'Sunday Service'
              const topic = rec.topicInfo

              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={cardStyle(i)}
                >
                  {/* Left: number badge */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                    background: i === 0 ? 'rgba(44,95,45,0.25)' : '#1a1a1a',
                    border: `1px solid ${i === 0 ? 'rgba(44,95,45,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ color: i === 0 ? '#2C5F2D' : '#555', fontSize: '13px', fontWeight: 800 }}>
                      {total - i}
                    </span>
                  </div>

                  {/* Right: info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 2px' }}>
                          {dateObj
                            ? dateObj.toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                            : 'Unknown Date'}
                        </p>
                        <p style={{ color: '#555', fontSize: '11px', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {serviceType}
                        </p>
                      </div>
                      <CheckCircle size={16} color="#2C5F2D" style={{ flexShrink: 0, marginTop: '2px' }} />
                    </div>

                    {/* Topic info if available */}
                    {topic && (
                      <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(44,95,45,0.08)', borderRadius: '10px', border: '1px solid rgba(44,95,45,0.15)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <BookOpen size={13} color="#2C5F2D" style={{ flexShrink: 0, marginTop: '1px' }} />
                        <div>
                          <p style={{ color: '#fff', fontSize: '12px', fontWeight: 700, margin: '0 0 2px' }}>{topic.topicTitle}</p>
                          {topic.coachName && (
                            <p style={{ color: '#2C5F2D', fontSize: '11px', fontWeight: 600, margin: 0 }}>
                              Taught by {topic.coachName}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
