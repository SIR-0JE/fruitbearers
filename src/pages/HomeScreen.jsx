import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useAudio } from '../contexts/AudioContext'
import { AnimatePresence, motion } from 'framer-motion'
import { Share2, Bell, Eye, Calendar, Play, ChevronRight } from 'lucide-react'

export default function HomeScreen() {
  const { profile } = useAuth()
  const { playSermon } = useAudio()
  const navigate = useNavigate()

  const [featuredFlier, setFeaturedFlier] = useState(null)
  const [latestSermon, setLatestSermon]   = useState(null)
  const [confession, setConfession]       = useState(null)
  const [streak, setStreak]               = useState(0)
  const [showCheckIn, setShowCheckIn]     = useState(false)
  const [checkedInToday, setCheckedInToday] = useState(false)
  const [sessionInfo, setSessionInfo] = useState(null)
  
  // PIN Entry state
  const [showPinInput, setShowPinInput] = useState(false)
  const [pin, setPin] = useState('')
  const [checkingPin, setCheckingPin] = useState(false)
  const [checkInError, setCheckInError] = useState(null)

  // Derive first name from full_name
  const firstName = profile?.full_name
    ? profile.full_name.trim().split(' ')[0]
    : 'Friend'

  // Get day boundary for "this Sunday" check
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      // 1. Featured flier (admin-controlled)
      const { data: setting } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'featured_flier_url')
        .single()
      if (setting) setFeaturedFlier(setting.value)

      // 2. Latest sermon
      const { data: sermons } = await supabase
        .from('sermons')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
      if (sermons?.length) setLatestSermon(sermons[0])

      // 3. Streak from profile
      if (profile?.attendance_streak) setStreak(profile.attendance_streak)

      // 4. Check if already checked-in today
      if (profile?.id) {
        const { data: todayRec } = await supabase
          .from('attendance')
          .select('*, session:session_id(*)')
          .eq('user_id', profile.id)
          .eq('service_date', today)
          .limit(1)
        
        if (todayRec?.length) {
          setCheckedInToday(true)
          setSessionInfo(todayRec[0].session || { service_type: todayRec[0].service_type })
        }
      }
    }
    load()
    // ... realtime subscriptions keep existing logic ...

    // 🔴 Real-time: featured flier changes by admin → instant update for all users
    const flierChannel = supabase
      .channel('home-flier-live')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings', filter: 'key=eq.featured_flier_url' },
        (payload) => {
          if (payload.new?.value) setFeaturedFlier(payload.new.value)
        }
      )
      .subscribe()

    // 🔴 Real-time: new sermon posted by admin → home screen updates
    const sermonChannel = supabase
      .channel('home-sermon-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sermons' },
        () => {
          supabase.from('sermons').select('*').order('date', { ascending: false }).limit(1)
            .then(({ data }) => { if (data?.length) setLatestSermon(data[0]) })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(flierChannel)
      supabase.removeChannel(sermonChannel)
    }
  }, [profile])


  const handleCheckInWithPin = async (code) => {
    if (!profile?.id || checkingPin) return
    setCheckingPin(true)
    setCheckInError(null)

    // 1. Check for session with this PIN active today
    const { data: session, error: sErr } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('pin', code)
      .eq('service_date', today)
      .limit(1)
    
    if (sErr || !session?.length) {
      setCheckInError('Invalid PIN or session not active')
      setCheckingPin(false)
      return
    }

    const targetSession = session[0]

    // 2. Record attendance
    const { error: aErr } = await supabase
      .from('attendance')
      .insert({
        user_id: profile.id,
        session_id: targetSession.id,
        service_date: targetSession.service_date,
        service_type: targetSession.service_type,
        method: 'code'
      })

    if (aErr) {
      if (aErr.code === '23505') setCheckInError('Already checked in!')
      else setCheckInError('Check-in failed. Try again.')
      setCheckingPin(false)
      return
    }

    // 3. Success logic
    const newStreak = streak + 1
    await supabase.from('profiles').update({ attendance_streak: newStreak, last_checkin: today }).eq('id', profile.id)
    
    setStreak(newStreak)
    setSessionInfo(targetSession)
    setCheckedInToday(true)
    setCheckingPin(false)
    setShowPinInput(false)
  }

  const handleManualCheckInPlaceholder = async () => {
    // Falls back to generic manual if needed, but PIN is better
    setShowPinInput(true)
  }

  const shareFlier = async () => {
    if (navigator.share && featuredFlier) {
      try {
        await navigator.share({ title: 'Fruitbearers Church', text: 'Join us this Sunday! 🌿', url: window.location.origin })
      } catch (_) {}
    } else {
      navigator.clipboard?.writeText(window.location.origin)
    }
  }

  return (
    <div style={{ background: '#0e0e0e', minHeight: '100%', paddingTop: '52px' }}>

      {/* ═══════════════════════════════════════════════
          TOP BAR
          Left:  [green circle logo] + [user first name]
          Right: [🔥 streak counter] + [🔔 bell]
          ═══════════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 16px' }}>

        {/* Left: Logo + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: '#2C5F2D', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.1)',
          }}>
            <img src="/logo.png" alt=""
              style={{ width: '28px', height: '28px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>
              Welcome back
            </p>
            <p style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '2px 0 0', lineHeight: 1, letterSpacing: '-0.2px' }}>
              {firstName} 👋
            </p>
          </div>
        </div>

        {/* Right: Streak fire + Bell */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Fire = attendance streak / check-in */}
          <button
            onClick={() => setShowCheckIn(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: checkedInToday ? '#1a2e10' : '#1e1a00',
              border: `1px solid ${checkedInToday ? '#2C5F2D' : '#2a2500'}`,
              borderRadius: '100px', padding: '7px 13px',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '16px' }}>{checkedInToday ? '✅' : '🔥'}</span>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{streak}</span>
          </button>

          {/* Bell with notification dot */}
          <div style={{ position: 'relative' }}>
            <button style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: '#1a1a1a', border: '1px solid #2a2a2a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Bell size={18} color="#ccc" />
            </button>
            <div style={{
              position: 'absolute', top: '7px', right: '7px',
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#2C5F2D', border: '2px solid #0e0e0e',
            }} />
          </div>
        </div>
      </div>

      {/* Complete Profile Reminder (for new users) */}
      {(!profile?.dob || !profile?.wisdom_house) && (
        <div style={{ padding: '0 16px 16px' }}>
          <div
            onClick={() => navigate('/profile')}
            style={{
              background: 'linear-gradient(135deg, #2C5F2D 0%, #1a3a1c 100%)',
              borderRadius: '16px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '14px',
              cursor: 'pointer', boxShadow: '0 8px 24px rgba(44,95,45,0.2)',
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '24px' }}>✨</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: '0 0 2px' }}>Complete your profile!</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: 0 }}>Tell us more about you to get the best experience</p>
            </div>
            <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          QUICK ACTION PILLS
          ═══════════════════════════════════════════════ */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 16px 20px', overflowX: 'auto' }} className="no-scrollbar">
        <PillButton icon="✓" label="Check-in" onClick={() => setShowCheckIn(true)} active={checkedInToday} />
        <PillButton icon="🌐" label="Join Online" />
        <PillButton icon="📍" label="Campus Info" />
      </div>

      {/* ═══════════════════════════════════════════════
          FEATURED FLIER (admin-controlled)
          ═══════════════════════════════════════════════ */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ borderRadius: '20px', overflow: 'hidden', position: 'relative', background: '#1a1a1a', border: '1px solid #252525' }}>
          {featuredFlier ? (
            <img src={featuredFlier} alt="This Sunday" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
          ) : (
            // Placeholder when no flier is set by admin
            <div style={{
              aspectRatio: '1/1', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #0d1f0e 0%, #1a3a1c 100%)',
              gap: '12px'
            }}>
              <img src="/logo.png" alt="" style={{ width: '60px', objectFit: 'contain', filter: 'brightness(0) invert(0.5)' }} />
              <p style={{ color: '#333', fontSize: '13px', fontWeight: 600 }}>Featured flier coming soon</p>
            </div>
          )}
        </div>

        {/* Share flier button */}
        <button
          onClick={shareFlier}
          style={{
            width: '100%', marginTop: '10px', padding: '14px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '100px', color: '#fff', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          <Share2 size={16} /> Share flier! Invite a friend
        </button>
      </div>

      {/* ═══════════════════════════════════════════════
          3 ACTION CARDS (Join a MAP, Ask for prayer, Counselling)
          ═══════════════════════════════════════════════ */}
      <div style={{ display: 'flex', gap: '10px', padding: '16px 16px 24px', overflowX: 'auto' }} className="no-scrollbar">
        <ActionCard icon="🙏" title="Join a MAP" sub="Meet and pray with others" />
        <ActionCard icon="🤲" title="Ask for prayer" sub="We would love to pray with you" />
        <ActionCard icon="💬" title="Counselling" sub="Ask questions, and get support" />
      </div>

      {/* ═══════════════════════════════════════════════
          LATEST SERMON
          ═══════════════════════════════════════════════ */}
      <div style={{ padding: '0 16px 24px' }}>
        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px', marginBottom: '14px', margin: '0 0 14px' }}>
          Latest Sermon
        </h2>

        {latestSermon ? (
          <div
            onClick={() => playSermon(latestSermon)}
            style={{ borderRadius: '18px', overflow: 'hidden', background: '#1a1a1a', border: '1px solid #252525', cursor: 'pointer' }}
          >
            {/* Thumbnail */}
            <div style={{ position: 'relative' }}>
              <img src={latestSermon.thumbnail_url} alt="" style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '220px' }} />
              {latestSermon.duration && (
                <div style={{
                  position: 'absolute', bottom: '8px', right: '10px',
                  background: 'rgba(0,0,0,0.75)', borderRadius: '6px',
                  padding: '2px 8px', color: '#fff', fontSize: '12px', fontWeight: 600,
                }}>
                  {latestSermon.duration}
                </div>
              )}
            </div>

            {/* Info row - exact CCI layout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: '#111' }}>
                <img src={latestSermon.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {latestSermon.title}
                </p>
                <p style={{ color: '#666', fontSize: '11px', margin: '2px 0 0' }}>
                  {latestSermon.series || 'Fruitbearers'}
                </p>
              </div>
              {/* Green play circle (Fruitbearers primary) */}
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                background: '#2C5F2D', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(44,95,45,0.4)',
              }}>
                <Play size={16} fill="white" color="white" style={{ marginLeft: '2px' }} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ height: '220px', borderRadius: '18px', background: '#1a1a1a' }} className="skeleton" />
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          CONFESSION CARD
          ═══════════════════════════════════════════════ */}
      {confession && (
        <div style={{ padding: '0 16px 48px' }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #252525', borderRadius: '18px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#252525', borderRadius: '100px', padding: '4px 10px', marginBottom: '10px' }}>
                <Eye size={12} color="#777" />
                <span style={{ color: '#777', fontSize: '11px', fontWeight: 600 }}>{confession.views || 450}</span>
              </div>
              <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Confession</p>
              <p style={{ color: '#aaa', fontSize: '13px', lineHeight: 1.5, marginBottom: '10px' }}>
                {confession.body || 'I declare, that in this month of March...'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={12} color="#555" />
                <span style={{ color: '#555', fontSize: '11px' }}>Mar 22 – Mar 24, 2026</span>
              </div>
            </div>
            {confession.image_url && (
              <div style={{ width: '68px', height: '68px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#111' }}>
                <img src={confession.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          CHECK-IN BOTTOM SHEET
          ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCheckIn && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCheckIn(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
                background: '#161616', borderTopLeftRadius: '28px', borderTopRightRadius: '28px',
                padding: '12px 24px 48px',
              }}
            >
              {/* Handle bar */}
              <div style={{ width: '36px', height: '4px', borderRadius: '4px', background: '#2a2a2a', margin: '8px auto 24px' }} />

              {checkedInToday ? (
                // Already checked in - SUCCESS STATE
                <div style={{ textAlign: 'center', paddingBottom: '16px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#1a2e10', border: '2px solid #2C5F2D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <span style={{ fontSize: '32px' }}>✅</span>
                  </div>
                  <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Checked in! ✨</h3>
                  <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '8px' }}>
                    {sessionInfo?.service_type || 'Sunday Service'}
                  </p>
                  <p style={{ color: '#2C5F2D', fontSize: '13px', fontWeight: 700, marginBottom: '24px' }}>
                    🔥 {streak} Sunday Streak
                  </p>
                  <button
                    onClick={() => setShowCheckIn(false)}
                    style={{ width: '100%', padding: '16px', borderRadius: '100px', background: '#1a1a1a', color: '#fff', fontWeight: 700, fontSize: '15px', border: '1px solid #2a2a2a', cursor: 'pointer' }}
                  >
                    Done
                  </button>
                </div>
              ) : showPinInput ? (
                // PIN Input State
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <button onClick={() => setShowPinInput(false)} style={{ color: '#555', background: 'none', border: 'none', fontSize: '14px', fontWeight: 600 }}>Back</button>
                    <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0 }}>Enter Code</h3>
                    <div style={{ width: '32px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '12px' }}>
                    <input 
                      autoFocus
                      type="number"
                      maxLength={4}
                      value={pin}
                      placeholder="0000"
                      onChange={e => {
                        const val = e.target.value.slice(0, 4)
                        setPin(val)
                        if (val.length === 4) handleCheckInWithPin(val)
                      }}
                      style={{ width: '120px', letterSpacing: '10px', textAlign: 'center', fontSize: '24px', fontWeight: 800, background: '#070d07', border: '2px solid #2a2a2a', borderRadius: '12px', padding: '12px', color: '#fff', outline: 'none' }}
                    />
                  </div>
                  {checkInError && <p style={{ color: '#ef4444', fontSize: '12px', textAlign: 'center', marginBottom: '16px' }}>{checkInError}</p>}
                  <p style={{ color: '#444', fontSize: '12px', textAlign: 'center', marginBottom: '24px' }}>Ask the production team for today's PIN</p>
                </>
              ) : (
                // Initial Check-in options
                <>
                  <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, textAlign: 'center', marginBottom: '6px' }}>
                    Sunday Check-in 🔥
                  </h3>
                  <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', marginBottom: '28px' }}>
                    Mark your attendance for today's service
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                      onClick={() => { setShowCheckIn(false); navigate('/scan') }}
                      style={{
                        padding: '17px', borderRadius: '100px',
                        background: 'linear-gradient(135deg, #2C5F2D, #4a8c4b)',
                        color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(44,95,45,0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      }}
                    >
                      📷 Scan QR Code
                    </button>
                    <button
                      onClick={handleManualCheckInPlaceholder}
                      style={{
                        padding: '17px', borderRadius: '100px',
                        background: 'transparent', color: '#ddd',
                        fontWeight: 700, fontSize: '15px',
                        border: '1.5px solid #2a2a2a', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      }}
                    >
                      🔢 Enter Code Manually
                    </button>
                  </div>
                  <p style={{ color: '#444', fontSize: '11px', textAlign: 'center', marginTop: '20px' }}>
                    Current streak: 🔥 {streak} Sunday{streak !== 1 ? 's' : ''}
                  </p>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Reusable sub-components ──

function PillButton({ icon, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '7px',
        background: active ? '#1a2e10' : '#1c1c1c',
        border: `1px solid ${active ? '#2C5F2D' : '#2a2a2a'}`,
        borderRadius: '100px', padding: '9px 16px', whiteSpace: 'nowrap',
        color: active ? '#4ade80' : '#ddd', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        flexShrink: 0, transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: '14px' }}>{icon}</span>
      {label}
    </button>
  )
}

function ActionCard({ icon, title, sub }) {
  return (
    <div style={{
      minWidth: '130px', background: '#1a1a1a', borderRadius: '18px',
      padding: '16px 14px', border: '1px solid #252525', flexShrink: 0,
    }}>
      <div style={{ fontSize: '22px', marginBottom: '10px' }}>{icon}</div>
      <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, marginBottom: '4px', lineHeight: 1.2 }}>{title}</p>
      <p style={{ color: '#555', fontSize: '11px', lineHeight: 1.3 }}>{sub}</p>
    </div>
  )
}
