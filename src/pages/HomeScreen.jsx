import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useAudio } from '../contexts/AudioContext'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { AnimatePresence, motion } from 'framer-motion'
import { Share2, Bell, Eye, Calendar, Play, ChevronRight } from 'lucide-react'
import SocialsModal from '../components/SocialsModal'

export default function HomeScreen() {
  const { profile } = useAuth()
  const { playSermon } = useAudio()
  const navigate = useNavigate()

  // Modal states
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showSocials, setShowSocials] = useState(false)

  // PIN Entry state
  const [showPinInput, setShowPinInput] = useState(false)
  const [pin, setPin] = useState('')
  const [checkingPin, setCheckingPin] = useState(false)
  const [checkInError, setCheckInError] = useState(null)

  // Coach selection state (shown after successful PIN check-in if session has a topic)
  const [showCoachPicker, setShowCoachPicker] = useState(false)
  const [sessionTopicId, setSessionTopicId] = useState(null)
  const [sessionTopicTitle, setSessionTopicTitle] = useState('')
  const [attendanceRecordId, setAttendanceRecordId] = useState(null)
  const [coachList, setCoachList] = useState([])
  const [selectedCoach, setSelectedCoach] = useState(null)
  const [submittingCoach, setSubmittingCoach] = useState(false)

  // Success state
  const [checkedInSuccess, setCheckedInSuccess] = useState(false)
  const [sessionInfo, setSessionInfo] = useState(null)
  const [streak, setStreak] = useState(0)

  const firstName = useMemo(() => profile?.full_name
    ? profile.full_name.trim().split(' ')[0]
    : 'Friend', [profile])

  const today = new Date().toISOString().split('T')[0]

  // ── DATA FETCHING ──────────────────────────────────────

  // 1. Featured flier
  const { data: featuredFlier, isLoading: loadingFlier } = useSupabaseQuery(
    ['app_settings', 'featured_flier_url'],
    () => supabase.from('app_settings').select('value').eq('key', 'featured_flier_url').single(),
    { select: data => data?.value }
  )

  // 2. Latest sermon
  const { data: latestSermon } = useSupabaseQuery(
    ['sermons', 'latest'],
    () => supabase.from('sermons').select('*').order('date', { ascending: false }).limit(1),
    { select: data => data?.[0] }
  )

  // 3. Socials
  const { data: socials } = useSupabaseQuery(
    ['church_socials'],
    () => supabase.from('church_socials').select('*').eq('is_active', true).order('order_number')
  )

  // 4. Check if already checked-in today
  const { data: todayAttendance, refetch: refetchAttendance } = useSupabaseQuery(
    ['attendance_records', 'today', profile?.id],
    () => supabase.from('attendance_records').select('*, attendance_sessions(*)').eq('user_id', profile?.id).gte('timestamp', today).limit(1),
    {
      enabled: !!profile?.id,
      select: data => data?.[0]
    }
  )

  // 5. Active confession (announcement/declaration from admin Broadcast tab)
  const { data: confession } = useSupabaseQuery(
    ['confessions', 'active'],
    () => supabase.from('confessions').select('*').gte('end_date', today).order('created_at', { ascending: false }).limit(1),
    { select: data => data?.[0] }
  )

  // 6. Prayer request link (set by admin in Home Page tab)
  const { data: prayerLink } = useSupabaseQuery(
    ['app_settings', 'prayer_link'],
    () => supabase.from('app_settings').select('value').eq('key', 'prayer_link').single(),
    { select: data => data?.value }
  )

  const checkedInToday = !!todayAttendance || checkedInSuccess

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('checked_in') === 'true') {
      setShowCheckIn(true)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  // ── CHECK-IN HANDLERS ─────────────────────────────────

  const handleCheckInWithPin = async (code) => {
    if (!profile?.id || checkingPin) return
    setCheckingPin(true)
    setCheckInError(null)

    const today = new Date().toISOString().split('T')[0]

    // 1. Find active session for this PIN today
    const { data: sessions, error: sErr } = await supabase
      .from('attendance_sessions')
      .select('*, topics(title)')
      .eq('pin', code)
      .eq('service_date', today)
      .limit(1)

    if (sErr || !sessions?.length) {
      setCheckInError('Invalid PIN or no active session today')
      setCheckingPin(false)
      return
    }

    const targetSession = sessions[0]

    // 2. Check expiry
    if (new Date(targetSession.expires_at) < new Date()) {
      setCheckInError('This session has expired')
      setCheckingPin(false)
      return
    }

    // 3. Record attendance
    const { data: aData, error: aErr } = await supabase
      .from('attendance_records')
      .insert({ user_id: profile.id, session_id: targetSession.id })
      .select().single()

    if (aErr) {
      if (aErr.code === '23505') setCheckInError('Already checked in for this session!')
      else setCheckInError('Check-in failed. Try again.')
      setCheckingPin(false)
      return
    }

    // 4. Streak logic
    const lastCheckin = profile.last_checkin
    let newStreak = profile.attendance_streak || 0
    if (!lastCheckin) {
      newStreak = 1
    } else if (lastCheckin !== today) {
      const diffDays = Math.floor((new Date() - new Date(lastCheckin)) / (1000 * 60 * 60 * 24))
      newStreak = diffDays <= 8 ? newStreak + 1 : 1
    }
    await supabase.from('profiles').update({ attendance_streak: newStreak, last_checkin: today }).eq('id', profile.id)

    setStreak(newStreak)
    setSessionInfo(targetSession)
    setAttendanceRecordId(aData.id)
    setCheckingPin(false)
    setShowPinInput(false)
    refetchAttendance()

    // 5. If session has a topic → show coach picker, else show success
    if (targetSession.topic_id) {
      const { data: coachData } = await supabase
        .from('coaches')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      setSessionTopicId(targetSession.topic_id)
      setSessionTopicTitle(targetSession.topics?.title || 'Today\'s Lesson')
      setCoachList(coachData || [])
      setShowCoachPicker(true)
    } else {
      setCheckedInSuccess(true)
    }
  }

  const handleSubmitCoach = async () => {
    if (!selectedCoach || !sessionTopicId || !attendanceRecordId) return
    setSubmittingCoach(true)
    const { error } = await supabase.from('topic_attendance').insert({
      user_id: profile.id,
      topic_id: sessionTopicId,
      coach_id: selectedCoach,
      attendance_id: attendanceRecordId,
      session_id: sessionInfo.id,
    })
    setSubmittingCoach(false)
    if (!error) {
      setShowCoachPicker(false)
      setCheckedInSuccess(true)
    } else {
      alert('Could not save your coach selection. Please try again.')
    }
  }

  const shareFlier = async () => {
    if (!featuredFlier) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fruitbearers Church — Join Us This Sunday! 🌿',
          text: 'Come worship with us this Sunday! 🙌',
          url: featuredFlier,
        })
      } catch (_) {}
    } else {
      navigator.clipboard?.writeText(featuredFlier)
      alert('Flier link copied to clipboard!')
    }
  }

  return (
    <div style={{ background: '#0e0e0e', minHeight: '100%', paddingTop: '52px' }}>

      {/* ── TOP BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#2C5F2D', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.1)' }}>
            <img src="/logo.png" alt="" style={{ width: '28px', height: '28px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>Welcome back</p>
            <p style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '2px 0 0', lineHeight: 1, letterSpacing: '-0.2px' }}>{firstName} 👋</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowCheckIn(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: checkedInToday ? '#1a2e10' : '#1e1a00', border: `1px solid ${checkedInToday ? '#2C5F2D' : '#2a2500'}`, borderRadius: '100px', padding: '7px 13px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <span style={{ fontSize: '16px' }}>{checkedInToday ? '✅' : '🔥'}</span>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{profile?.attendance_streak || 0}</span>
          </button>
          <div style={{ position: 'relative' }}>
            <button style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Bell size={18} color="#ccc" />
            </button>
            <div style={{ position: 'absolute', top: '7px', right: '7px', width: '7px', height: '7px', borderRadius: '50%', background: '#2C5F2D', border: '2px solid #0e0e0e' }} />
          </div>
        </div>
      </div>

      {/* Complete Profile Reminder */}
      {(!profile?.dob || !profile?.wisdom_house) && (
        <div style={{ padding: '0 16px 16px' }}>
          <div onClick={() => navigate('/profile')} style={{ background: 'linear-gradient(135deg, #2C5F2D 0%, #1a3a1c 100%)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(44,95,45,0.2)' }}>
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

      {/* ── QUICK ACTIONS ── */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 16px 20px', overflowX: 'auto' }} className="no-scrollbar">
        <PillButton icon="✓" label="Check-in" onClick={() => setShowCheckIn(true)} active={checkedInToday} />
        <PillButton icon="🌐" label="Join Online" onClick={() => setShowSocials(true)} />
        <PillButton icon="📍" label="Campus Info" />
      </div>

      {/* ── FEATURED FLIER ── */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ borderRadius: '20px', overflow: 'hidden', position: 'relative', background: '#1a1a1a', border: '1px solid #252525' }}>
          {loadingFlier ? (
            <div style={{ aspectRatio: '1/1', background: '#1a1a1a' }} className="skeleton" />
          ) : featuredFlier ? (
            <img src={featuredFlier} alt="This Sunday" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
          ) : (
            <div style={{ aspectRatio: '1/1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0d1f0e 0%, #1a2e10 100%)', gap: '16px', padding: '32px' }}>
              <img src="/logo.png" alt="" style={{ width: '52px', objectFit: 'contain', opacity: 0.2 }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#333', fontSize: '14px', fontWeight: 700, margin: '0 0 6px' }}>No flier this week yet</p>
                <p style={{ color: '#2a2a2a', fontSize: '12px', margin: 0 }}>Come back closer to Sunday service!</p>
              </div>
            </div>
          )}
        </div>
        {featuredFlier && (
          <button onClick={shareFlier} style={{ width: '100%', marginTop: '10px', padding: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '100px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Share2 size={16} /> Share flier! Invite a friend
          </button>
        )}
      </div>

      {/* ── ACTION CARDS ── */}
      <div style={{ display: 'flex', gap: '10px', padding: '16px 16px 24px', overflowX: 'auto' }} className="no-scrollbar">
        <ActionCard
          icon="🤲"
          title="Ask for prayer"
          sub="We would love to pray with you"
          onClick={prayerLink ? () => window.open(prayerLink, '_blank') : undefined}
        />
      </div>

      {/* ── LATEST SERMON ── */}
      <div style={{ padding: '0 16px 24px' }}>
        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px', margin: '0 0 14px' }}>Latest Sermon</h2>
        {latestSermon ? (
          <div onClick={() => playSermon(latestSermon)} style={{ borderRadius: '18px', overflow: 'hidden', background: '#1a1a1a', border: '1px solid #252525', cursor: 'pointer' }}>
            <div style={{ position: 'relative' }}>
              <img src={latestSermon.thumbnail_url} alt="" style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '220px' }} />
              {latestSermon.duration && (
                <div style={{ position: 'absolute', bottom: '8px', right: '10px', background: 'rgba(0,0,0,0.75)', borderRadius: '6px', padding: '2px 8px', color: '#fff', fontSize: '12px', fontWeight: 600 }}>
                  {latestSermon.duration}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: '#111' }}>
                <img src={latestSermon.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{latestSermon.title}</p>
                <p style={{ color: '#666', fontSize: '11px', margin: '2px 0 0' }}>{latestSermon.series || 'Fruitbearers'}</p>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, background: '#2C5F2D', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(44,95,45,0.4)' }}>
                <Play size={16} fill="white" color="white" style={{ marginLeft: '2px' }} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ height: '220px', borderRadius: '18px', background: '#1a1a1a' }} className="skeleton" />
        )}
      </div>

      {/* ── CONFESSION / DECLARATION CARD ── */}
      {confession && (
        <div style={{ padding: '0 16px 48px' }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #252525', borderRadius: '18px', padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(44,95,45,0.12)', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '100px', padding: '4px 10px', marginBottom: '10px' }}>
                <Eye size={12} color="#2C5F2D" />
                <span style={{ color: '#2C5F2D', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Declaration</span>
              </div>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>{confession.title}</p>
              <p style={{ color: '#aaa', fontSize: '13px', lineHeight: 1.6, marginBottom: '12px' }}>{confession.body}</p>
              {(confession.start_date || confession.end_date) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={12} color="#555" />
                  <span style={{ color: '#555', fontSize: '11px' }}>
                    {confession.start_date && new Date(confession.start_date + 'T12:00:00').toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                    {confession.end_date && ` – ${new Date(confession.end_date + 'T12:00:00').toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </span>
                </div>
              )}
            </div>
            {confession.image_url && (
              <div style={{ width: '68px', height: '68px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#111' }}>
                <img src={confession.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CHECK-IN BOTTOM SHEET ── */}
      <AnimatePresence>
        {showCheckIn && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCheckIn(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201, background: '#161616', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', padding: '12px 24px 48px' }}
            >
              <div style={{ width: '36px', height: '4px', borderRadius: '4px', background: '#2a2a2a', margin: '8px auto 24px' }} />

              {/* ── COACH PICKER (after check-in when session has a topic) ── */}
              {showCoachPicker ? (
                <div style={{ paddingBottom: '16px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '32px' }}>✅</span>
                  </div>
                  <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '4px', textAlign: 'center' }}>Checked in!</h3>
                  <p style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', marginBottom: '4px' }}>
                    Now, who taught today's session?
                  </p>
                  <p style={{ color: '#d4af37', fontSize: '12px', fontWeight: 700, textAlign: 'center', marginBottom: '24px', letterSpacing: '0.02em' }}>
                    "{sessionTopicTitle}"
                  </p>

                  <div style={{ maxHeight: '35vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }} className="no-scrollbar">
                    {coachList.map(c => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCoach(c.id)}
                        style={{ padding: '16px', borderRadius: '14px', cursor: 'pointer', background: selectedCoach === c.id ? '#1a2e10' : '#1a1a1a', border: `1.5px solid ${selectedCoach === c.id ? '#2C5F2D' : '#2a2a2a'}`, display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.15s' }}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: selectedCoach === c.id ? '#2C5F2D' : '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>
                          {c.name.charAt(0)}
                        </div>
                        <p style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: 0 }}>{c.name}</p>
                      </div>
                    ))}
                    {coachList.length === 0 && (
                      <p style={{ color: '#444', fontSize: '13px', textAlign: 'center' }}>No coaches listed yet.</p>
                    )}
                  </div>

                  <AnimatePresence>
                    {selectedCoach && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        onClick={handleSubmitCoach}
                        disabled={submittingCoach}
                        style={{ width: '100%', padding: '16px', borderRadius: '100px', background: '#2C5F2D', color: '#fff', fontWeight: 800, fontSize: '15px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(44,95,45,0.35)' }}
                      >
                        {submittingCoach ? 'Saving...' : 'Complete Check-in ✅'}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

              ) : checkedInToday ? (
                /* ── SUCCESS STATE ── */
                <div style={{ textAlign: 'center', paddingBottom: '16px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#1a2e10', border: '2px solid #2C5F2D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <span style={{ fontSize: '32px' }}>✅</span>
                  </div>
                  <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Check-in complete! ✨</h3>
                  <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '8px' }}>
                    {sessionInfo?.service_type || todayAttendance?.attendance_sessions?.service_type || 'Sunday Service'}
                  </p>
                  <p style={{ color: '#2C5F2D', fontSize: '13px', fontWeight: 700, marginBottom: '24px' }}>
                    🔥 {streak || profile?.attendance_streak || 0} Sunday Streak
                  </p>
                  <button onClick={() => setShowCheckIn(false)} style={{ width: '100%', padding: '16px', borderRadius: '100px', background: '#1a1a1a', color: '#fff', fontWeight: 700, fontSize: '15px', border: '1px solid #2a2a2a', cursor: 'pointer' }}>
                    Done
                  </button>
                </div>

              ) : showPinInput ? (
                /* ── PIN INPUT ── */
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <button onClick={() => setShowPinInput(false)} style={{ color: '#555', background: 'none', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Back</button>
                    <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0 }}>Enter Code</h3>
                    <div style={{ width: '32px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <input
                      autoFocus
                      type="number"
                      maxLength={4}
                      value={pin}
                      placeholder="0000"
                      onChange={e => setPin(e.target.value.slice(0, 4))}
                      style={{ width: '140px', letterSpacing: '12px', textAlign: 'center', fontSize: '28px', fontWeight: 900, background: '#070d07', border: '2px solid #2C5F2D', borderRadius: '14px', padding: '14px', color: '#fff', outline: 'none', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)' }}
                    />
                    <button
                      onClick={() => handleCheckInWithPin(pin)}
                      disabled={pin.length !== 4 || checkingPin}
                      style={{ width: '100%', padding: '14px', borderRadius: '100px', background: pin.length === 4 ? '#2C5F2D' : '#1a1a1a', color: pin.length === 4 ? '#fff' : '#555', fontWeight: 800, fontSize: '15px', border: 'none', cursor: pin.length === 4 ? 'pointer' : 'not-allowed', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: pin.length === 4 ? '0 4px 15px rgba(44,95,45,0.3)' : 'none' }}
                    >
                      {checkingPin ? 'Verifying...' : 'Confirm Check-in'}
                    </button>
                  </div>
                  {checkInError && <p style={{ color: '#ef4444', fontSize: '12px', textAlign: 'center', marginBottom: '16px' }}>{checkInError}</p>}
                  <p style={{ color: '#444', fontSize: '12px', textAlign: 'center', marginBottom: '24px' }}>Ask the production team for today's PIN</p>
                </>

              ) : (
                /* ── INITIAL OPTIONS ── */
                <>
                  <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, textAlign: 'center', marginBottom: '6px' }}>Sunday Check-in 🔥</h3>
                  <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', marginBottom: '28px' }}>Mark your attendance for today's service</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                      onClick={() => { setShowCheckIn(false); navigate('/scan') }}
                      style={{ padding: '17px', borderRadius: '100px', background: 'linear-gradient(135deg, #2C5F2D, #4a8c4b)', color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(44,95,45,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      📷 Scan QR Code
                    </button>
                    <button
                      onClick={() => setShowPinInput(true)}
                      style={{ padding: '17px', borderRadius: '100px', background: 'transparent', color: '#ddd', fontWeight: 700, fontSize: '15px', border: '1.5px solid #2a2a2a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      🔢 Enter Code Manually
                    </button>
                  </div>
                  <p style={{ color: '#444', fontSize: '11px', textAlign: 'center', marginTop: '20px' }}>
                    Current streak: 🔥 {profile?.attendance_streak || 0} Sunday{profile?.attendance_streak !== 1 ? 's' : ''}
                  </p>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SocialsModal isOpen={showSocials} onClose={() => setShowSocials(false)} socials={socials} />
    </div>
  )
}

// ── Reusable sub-components ──

function PillButton({ icon, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '7px', background: active ? '#1a2e10' : '#1c1c1c', border: `1px solid ${active ? '#2C5F2D' : '#2a2a2a'}`, borderRadius: '100px', padding: '9px 16px', whiteSpace: 'nowrap', color: active ? '#4ade80' : '#ddd', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
    >
      <span style={{ fontSize: '14px' }}>{icon}</span>
      {label}
    </button>
  )
}

function ActionCard({ icon, title, sub, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ minWidth: '130px', background: '#1a1a1a', borderRadius: '18px', padding: '16px 14px', border: '1px solid #252525', flexShrink: 0, cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ fontSize: '22px', marginBottom: '10px' }}>{icon}</div>
      <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, marginBottom: '4px', lineHeight: 1.2 }}>{title}</p>
      <p style={{ color: '#555', fontSize: '11px', lineHeight: 1.3 }}>{sub}</p>
    </div>
  )
}
