import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Calendar, Tv2, Image as ImageIcon,
  LogOut, Bell, Mail, CheckCircle, XCircle, Edit3, X,
  ChevronRight, TrendingUp, RefreshCw, Eye, Trash2,
  Heart, DollarSign, Upload, Copy, ExternalLink, QrCode, Plus, Search, Filter, 
  MessageCircle, PhoneOutgoing, Gift, Megaphone, Send, Landmark
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

const NAV = [
  { id: 'overview',   icon: LayoutDashboard, label: 'Overview'    },
  { id: 'home',       icon: ImageIcon,        label: 'Home Page'  },
  { id: 'attendance', icon: Calendar,         label: 'Attendance' },
  { id: 'members',    icon: Users,            label: 'Members'    },
  { id: 'media',      icon: Tv2,              label: 'Media'      },
  { id: 'birthday',   icon: Gift,             label: 'Birthdays'  },
  { id: 'broadcast',  icon: Megaphone,        label: 'Broadcast'  },
  { id: 'giving',     icon: DollarSign,       label: 'Giving'     },
]

export default function AdminDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [active, setActive] = useState('overview')
  const [stats, setStats] = useState({ members: 0, checkins: 0, sermons: 0, giving: 0 })

  useEffect(() => {
    loadStats()

    // 🔴 Real-time: update stats when members, attendance, or sermons change
    const channel = supabase.channel('admin-stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sermons' }, loadStats)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const loadStats = async () => {
    const today = new Date().toISOString().split('T')[0]
    const [m, a, s] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('attendance_records').select('id', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('sermons').select('id', { count: 'exact', head: true }),
    ])
    setStats({ members: m.count || 0, checkins: a.count || 0, sermons: s.count || 0 })
  }

  const handleSignOut = async () => { await signOut(); navigate('/admin-portal') }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070d07', fontFamily: "'DM Sans', sans-serif", color: '#fff' }}>

      {/* ══════════════════════════════
          SIDEBAR
          ══════════════════════════════ */}
      <aside style={{
        width: '240px', flexShrink: 0,
        background: '#0d160d',
        borderRight: '1px solid rgba(44,95,45,0.2)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(44,95,45,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#2C5F2D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src="/logo.png" alt="" style={{ width: '28px', height: '28px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            </div>
            <div>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: 800, margin: 0, letterSpacing: '-0.2px' }}>Fruitbearers</p>
              <p style={{ color: '#2C5F2D', fontSize: '10px', fontWeight: 700, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV.map(({ id, icon: Icon, label }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '11px',
                  padding: '10px 14px', borderRadius: '12px', width: '100%',
                  background: isActive ? 'rgba(44,95,45,0.2)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(44,95,45,0.35)' : 'transparent'}`,
                  color: isActive ? '#fff' : '#555',
                  fontSize: '14px', fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={16} color={isActive ? '#2C5F2D' : '#444'} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Admin profile + sign out */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(44,95,45,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1a2e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#2C5F2D', fontWeight: 800, fontSize: '14px' }}>
                {profile?.full_name?.charAt(0) || 'A'}
              </span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: '12px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name || 'Admin'}
              </p>
              <p style={{ color: '#2C5F2D', fontSize: '10px', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Administrator</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: '10px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
              color: '#ef4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════
          MAIN CONTENT
          ══════════════════════════════ */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
        <AnimatePresence mode="wait">
          {active === 'overview'   && <OverviewTab   key="ov" stats={stats} />}
          {active === 'home'       && <HomePageTab   key="hp" />}
          {active === 'attendance' && <AttendanceTab key="at" />}
          {active === 'members'    && <MembersTab    key="mb" />}
          {active === 'media'      && <MediaTab      key="md" />}
          {active === 'birthday'   && <BirthdayTab   key="bd" />}
          {active === 'broadcast'  && <CommunicationTab key="bc" />}
          {active === 'giving'     && <GivingTab     key="gv" />}
        </AnimatePresence>
      </main>
    </div>
  )
}

// ── Shared page wrapper ───────────────────────────────
function PageWrap({ title, subtitle, action, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.5px' }}>{title}</h1>
          {subtitle && <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  )
}

// ── Stat card ────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = '#2C5F2D' }) {
  return (
    <div style={{
      background: '#0d160d', border: '1px solid rgba(44,95,45,0.2)',
      borderRadius: '16px', padding: '20px 24px',
      display: 'flex', alignItems: 'flex-start', gap: '16px',
    }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: '22px' }}>{icon}</span>
      </div>
      <div>
        <p style={{ color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>{label}</p>
        <p style={{ color: '#fff', fontSize: '28px', fontWeight: 800, margin: '0 0 2px', letterSpacing: '-1px', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ color: color, fontSize: '11px', fontWeight: 600, margin: 0 }}>{sub}</p>}
      </div>
    </div>
  )
}

// ════════════════════════════════════
// OVERVIEW TAB
// ════════════════════════════════════
function OverviewTab({ stats }) {
  const [recentMembers, setRecentMembers] = useState([])
  const [todayAttendance, setTodayAttendance] = useState([])
  const magicLink = `${window.location.origin}/admin-portal?u=FRUITBEARERS&p=INSIDEOUT`

  const loadData = () => {
    const today = new Date().toISOString().split('T')[0]
    supabase.from('profiles').select('id, full_name, email, campus, created_at').order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setRecentMembers(data || []))
    // Add sorting so the newest checkins rise to the top
    supabase.from('attendance_records').select('user_id, created_at, profiles(full_name)').gte('created_at', today).order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setTodayAttendance(data || []))
  }

  useEffect(() => {
    loadData()

    // 🔴 Real-time: Listen to ALL events (*) so 'upserted' profiles also show up instantly
    const channel = supabase.channel('overview-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, loadData)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const copyLink = () => { navigator.clipboard?.writeText(magicLink); }

  return (
    <PageWrap title="Dashboard Overview" subtitle={`${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}>
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard icon="👥" label="Total Members" value={stats.members} sub="Active accounts" />
        <StatCard icon="🎙️" label="Sermons" value={stats.sermons} sub="In media library" color="#5ac8fa" />
      </div>

      {/* Admin Magic Link */}
      <div style={{ background: '#0d160d', border: '1px solid rgba(44,95,45,0.25)', borderRadius: '16px', padding: '20px 24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ color: '#2C5F2D', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>🔗 Admin Magic Link</p>
            <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0, wordBreak: 'break-all' }}>{magicLink}</p>
            <p style={{ color: '#444', fontSize: '11px', margin: '4px 0 0' }}>Share this link to auto-login to the admin panel</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={copyLink}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', background: '#1a2e1a', border: '1px solid rgba(44,95,45,0.3)', color: '#2C5F2D', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
            >
              <Copy size={14} /> Copy
            </button>
            <a
              href={magicLink}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', background: '#2C5F2D', border: 'none', color: '#fff', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}
            >
              <ExternalLink size={14} /> Open
            </a>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Members */}
        <div style={{ background: '#0d160d', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '16px', padding: '20px' }}>
          <p style={{ color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>Recent Members</p>
          {recentMembers.length === 0
            ? <p style={{ color: '#333', fontSize: '13px' }}>No members yet</p>
            : recentMembers.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a2e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#2C5F2D', fontSize: '12px', fontWeight: 700 }}>{m.full_name?.charAt(0)}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.full_name}</p>
                  <p style={{ color: '#444', fontSize: '11px', margin: 0 }}>{m.campus || 'No campus'}</p>
                </div>
              </div>
            ))
          }
        </div>

        {/* Today's check-ins */}
        <div style={{ background: '#0d160d', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '16px', padding: '20px' }}>
          <p style={{ color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>Today's Check-ins</p>
          {todayAttendance.length === 0
            ? <p style={{ color: '#333', fontSize: '13px' }}>No check-ins recorded yet today</p>
            : todayAttendance.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <CheckCircle size={16} color="#2C5F2D" style={{ flexShrink: 0 }} />
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0 }}>
                  {a.profiles?.full_name || 'Unknown member'}
                </p>
                <span style={{ marginLeft: 'auto', color: '#444', fontSize: '11px', flexShrink: 0 }}>
                  {new Date(a.checked_in_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          }
        </div>
      </div>
    </PageWrap>
  )
}

// ════════════════════════════════════
// HOME PAGE TAB — Flier Upload
// ════════════════════════════════════
function HomePageTab() {
  const [current, setCurrent]     = useState('')
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved]         = useState(false)
  const fileInputRef              = useRef(null)

  useEffect(() => {
    supabase.from('app_settings').select('value').eq('key', 'featured_flier_url').single()
      .then(({ data }) => data && setCurrent(data.value))
  }, [])

  const uploadFlier = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const ext  = file.name.split('.').pop()
    const path = `fliers/sunday-flier-${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage.from('media').upload(path, file, { upsert: true })
    if (upErr) { alert('Upload failed: ' + upErr.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)

    await supabase.from('app_settings').upsert({ key: 'featured_flier_url', value: publicUrl })
    setCurrent(publicUrl)
    setSaved(true); setUploading(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <PageWrap title="Home Page" subtitle="Upload a flier — members see it instantly on their home screen">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>

        {/* Live Preview */}
        <div>
          <p style={{ color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Live on Member Home Screen</p>
          <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(44,95,45,0.3)', background: '#0d160d', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {current
              ? <img src={current} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ textAlign: 'center', padding: '32px' }}>
                  <p style={{ fontSize: '40px', marginBottom: '12px' }}>🖼️</p>
                  <p style={{ color: '#555', fontSize: '13px', fontWeight: 600 }}>No flier uploaded yet</p>
                  <p style={{ color: '#333', fontSize: '12px', marginTop: '6px' }}>Members will see a placeholder until you upload one</p>
                </div>
            }
          </div>
          {saved && <p style={{ color: '#2C5F2D', fontSize: '13px', fontWeight: 700, marginTop: '12px' }}>✅ Flier live — all members see it now!</p>}
        </div>

        {/* Upload Controls */}
        <div>
          <p style={{ color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Upload This Week's Flier</p>

          {/* Hidden real file input */}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadFlier} />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ width: '100%', padding: '48px 24px', borderRadius: '20px', border: '2px dashed rgba(44,95,45,0.4)', background: '#070d07', color: '#2C5F2D', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
          >
            <span style={{ fontSize: '36px' }}>{uploading ? '⏳' : '📤'}</span>
            {uploading ? 'Uploading...' : 'Click to upload flier'}
            <span style={{ color: '#555', fontSize: '12px', fontWeight: 500 }}>PNG or JPG · Replaces current flier immediately</span>
          </button>

          <div style={{ marginTop: '20px', padding: '16px', background: '#0d160d', borderRadius: '14px', border: '1px solid rgba(44,95,45,0.15)' }}>
            <p style={{ color: '#2C5F2D', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>How it works</p>
            <p style={{ color: '#555', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>Upload a new flier every Sunday. It replaces the previous one automatically. Members on the home screen will see the new image in real-time and can share it with friends.</p>
          </div>
        </div>
      </div>
    </PageWrap>
  )
}

// ════════════════════════════════════
// ATTENDANCE TAB
// ════════════════════════════════════
function AttendanceTab() {
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0])
  const [members, setMembers]   = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading]   = useState(true)
  const [emailTarget, setEmailTarget] = useState(null)
  
  // New session state
  const [sessions, setSessions] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newSession, setNewSession] = useState({ name: 'Sunday Service', type: 'First Service', end_time: '' })
  const [activeSession, setActiveSession] = useState(null)
  const [isCreating, setIsCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    const [ { data: m }, { data: a }, { data: s } ] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, attendance_streak').eq('role', 'member'),
      // ✅ FIXED: reading from attendance_records (same table users write to)
      supabase.from('attendance_records').select('user_id, session_id').in(
        'session_id',
        (await supabase.from('attendance_sessions').select('id').eq('service_date', date)).data?.map(s => s.id) || []
      ),
      supabase.from('attendance_sessions').select('*').eq('service_date', date).order('created_at', { ascending: false })
    ])
    setMembers(m || [])
    setSessions(s || [])
    setCheckins((a || []).map(x => x.user_id))
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase.channel(`attendance-${date}`)
      // ✅ FIXED: listening to attendance_records
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_sessions' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [date])

  const createSession = async () => {
    if (!newSession.end_time) {
      alert('Please set an end time for the session.')
      return
    }

    setIsCreating(true)
    const pin = Math.floor(1000 + Math.random() * 9000).toString()
    const qrValue = crypto.randomUUID()
    
    // Combine date + end_time
    const expiresAt = new Date(`${date}T${newSession.end_time}`).toISOString()

    const { data, error } = await supabase.from('attendance_sessions').insert({
      session_name: newSession.name,
      service_date: date,
      service_type: newSession.type,
      qr_code_value: qrValue,
      pin: pin,
      expires_at: expiresAt,
      is_active: true
    }).select().single()
    
    if (!error) {
      setActiveSession(data)
      setShowCreate(false)
      load()
    } else {
      console.error(error)
      alert('Error creating session: ' + error.message)
    }
    setIsCreating(false)
  }

  const downloadQR = () => {
    const svg = document.getElementById('session-qr-svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = 1000
      canvas.height = 1000
      ctx.fillStyle = 'white'
      ctx.fillRect(0,0,1000,1000)
      ctx.drawImage(img, 100, 100, 800, 800)
      
      // Add text info
      ctx.fillStyle = 'black'
      ctx.font = 'bold 40px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`FRUITBEARERS - ${activeSession?.service_type || 'Service'}`, 500, 940)
      ctx.fillText(`PIN: ${activeSession?.pin}`, 500, 80)

      const pngUrl = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.href = pngUrl
      downloadLink.download = `attendance-qr-${activeSession?.service_type}-${date}.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const present = members.filter(m => checkins.includes(m.id))
  const missed  = members.filter(m => !checkins.includes(m.id))

  return (
    <PageWrap 
      title="Attendance" 
      subtitle="Track Sunday service attendance and reach out to absent members"
      action={
        <button 
          onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', background: '#2C5F2D', border: 'none', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
        >
          <Plus size={16} /> New Session
        </button>
      }
    >
      {/* Sessions list */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '20px' }} className="no-scrollbar">
        {sessions.map(s => (
          <div 
            key={s.id} 
            onClick={() => setActiveSession(s)}
            style={{ 
              minWidth: '200px', background: activeSession?.id === s.id ? '#1a2e1a' : '#0d160d', 
              border: `1px solid ${activeSession?.id === s.id ? '#2C5F2D' : 'rgba(44,95,45,0.2)'}`, 
              borderRadius: '16px', padding: '16px', cursor: 'pointer'
            }}
          >
            <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 4px' }}>{s.service_type}</p>
            <p style={{ color: '#555', fontSize: '11px', margin: '0 0 12px' }}>Code: <strong style={{ color: '#d4af37' }}>{s.pin}</strong></p>
            <div style={{ background: '#070d07', borderRadius: '8px', padding: '8px', display: 'flex', justifyContent: 'center' }}>
              <QRCodeSVG value={s.qr_code_value} size={80} bgColor="#070d07" fgColor="#fff" />
            </div>
          </div>
        ))}
      </div>

      {/* Date + summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap', marginTop: '10px' }}>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ background: '#0d160d', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '12px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
        />
        {!loading && (
          <>
            <div style={{ background: '#1a2e1a', border: '1px solid rgba(44,95,45,0.3)', borderRadius: '12px', padding: '10px 18px' }}>
              <span style={{ color: '#2C5F2D', fontWeight: 800 }}>{present.length}</span>
              <span style={{ color: '#555', fontSize: '13px', marginLeft: '6px' }}>present</span>
            </div>
            <div style={{ background: '#2e1a1a', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '10px 18px' }}>
              <span style={{ color: '#ef4444', fontWeight: 800 }}>{missed.length}</span>
              <span style={{ color: '#555', fontSize: '13px', marginLeft: '6px' }}>missed</span>
            </div>
          </>
        )}
      </div>

      {/* Tables container */}
      {loading ? (
        <p style={{ color: '#444' }}>Loading...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Present */}
          <div style={{ background: '#0d160d', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(44,95,45,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} color="#2C5F2D" />
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: 0 }}>Checked In ({present.length})</p>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {present.map(m => <MemberRow key={m.id} member={m} isPresent />)}
              {present.length === 0 && <p style={{ color: '#333', fontSize: '13px', padding: '20px' }}>No check-ins yet</p>}
            </div>
          </div>

          {/* Missed */}
          <div style={{ background: '#0d160d', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={16} color="#ef4444" />
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: 0 }}>Missed ({missed.length})</p>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {missed.map(m => (
                <MemberRow key={m.id} member={m} isPresent={false}
                  action={
                    <button
                      onClick={() => setEmailTarget(m)}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', background: '#2e1a1a', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                    >
                      <Mail size={11} /> Email
                    </button>
                  }
                />
              ))}
              {missed.length === 0 && <p style={{ color: '#333', fontSize: '13px', padding: '20px' }}>Everyone attended! 🎉</p>}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {emailTarget && <EmailModal member={emailTarget} date={date} onClose={() => setEmailTarget(null)} />}
        
        {/* CREATE SESSION MODAL */}
        {showCreate && (
           <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} />
             <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
               style={{ position: 'relative', zIndex: 201, background: '#0d160d', border: '1px solid rgba(44,95,45,0.3)', borderRadius: '24px', padding: '32px', width: 'min(440px, 100%)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
             >
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: 0 }}>Start New Session</h3>
                <button onClick={() => setShowCreate(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#555', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><X size={18} /></button>
               </div>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <div>
                   <label style={{ display: 'block', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Service Type</label>
                   <select 
                     value={newSession.type}
                     onChange={e => setNewSession(p => ({ ...p, type: e.target.value }))}
                     style={{ width: '100%', background: '#070d07', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '12px', padding: '14px', color: '#fff', outline: 'none', fontSize: '15px' }}
                   >
                     <option>First Service</option>
                     <option>Second Service</option>
                     <option>Midweek Service</option>
                     <option>Special Service</option>
                   </select>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Date</label>
                      <input 
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        style={{ width: '100%', background: '#070d07', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '12px', padding: '14px', color: '#fff', outline: 'none', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>End Time</label>
                      <input 
                        type="time"
                        value={newSession.end_time}
                        onChange={e => setNewSession(p => ({ ...p, end_time: e.target.value }))}
                        style={{ width: '100%', background: '#070d07', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '12px', padding: '14px', color: '#fff', outline: 'none', fontSize: '14px' }}
                        required
                      />
                    </div>
                 </div>

                 <p style={{ color: '#444', fontSize: '12px', margin: 0, fontStyle: 'italic' }}>
                   The QR code and PIN will automatically expire at the set end time.
                 </p>

                 <button 
                   onClick={createSession}
                   disabled={isCreating}
                   style={{ width: '100%', padding: '16px', borderRadius: '14px', background: isCreating ? '#1a2e1a' : 'linear-gradient(135deg, #2C5F2D 0%, #4a8c4b 100%)', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '15px', marginTop: '8px', boxShadow: '0 10px 20px rgba(44,95,45,0.2)' }}
                 >
                   {isCreating ? 'Creating...' : 'Start Session'}
                 </button>
               </div>
             </motion.div>
           </div>
        )}

        {/* ACTIVE SESSION / QR DISPLAY MODAL */}
        {activeSession && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveSession(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
               style={{ position: 'relative', zIndex: 301, width: 'min(440px, 100%)', textAlign: 'center' }}
             >
               <div style={{ background: '#fff', borderRadius: '32px', padding: '40px', color: '#000', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                 <p style={{ color: '#2C5F2D', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>Active Attendance</p>
                 <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 4px', color: '#0d160d' }}>{activeSession.service_type}</h2>
                 <p style={{ color: '#888', fontSize: '14px', marginBottom: '32px' }}>Members can scan this code to check in</p>
                 
                 <div style={{ background: '#f8faf8', border: '1px solid #eee', borderRadius: '24px', padding: '30px', marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
                   <QRCodeSVG id="session-qr-svg" value={`${window.location.origin}/check-in/${activeSession.id}`} size={240} level="H" bgColor="#f8faf8" fgColor="#0d160d" includeMargin />
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                   <div style={{ background: '#f8faf8', padding: '16px', borderRadius: '16px', border: '1px solid #eee' }}>
                     <p style={{ fontSize: '10px', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>4-Digit PIN</p>
                     <p style={{ fontSize: '28px', color: '#2C5F2D', fontWeight: 900, margin: 0, letterSpacing: '8px' }}>{activeSession.pin}</p>
                   </div>
                   <div style={{ background: '#f8faf8', padding: '16px', borderRadius: '16px', border: '1px solid #eee' }}>
                     <p style={{ fontSize: '10px', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Expires At</p>
                     <p style={{ fontSize: '20px', color: '#0d160d', fontWeight: 800, margin: '6px 0 0' }}>
                       {new Date(activeSession.expires_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                     </p>
                   </div>
                 </div>

                 <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={downloadQR}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderRadius: '16px', background: '#0d160d', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                    >
                      <Upload size={18} /> Download
                    </button>
                    <button
                      onClick={() => setActiveSession(null)}
                      style={{ flex: 1, padding: '16px', borderRadius: '16px', background: '#eee', color: '#555', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Close
                    </button>
                 </div>
               </div>
               <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '24px' }}>Session remains active until the end time or until manual deletion.</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrap>
  )
}

function MemberRow({ member, isPresent, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: isPresent ? '#1a2e1a' : '#2e1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: isPresent ? '#2C5F2D' : '#ef4444', fontSize: '13px', fontWeight: 700 }}>{member.full_name?.charAt(0)}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.full_name}</p>
        <p style={{ color: '#444', fontSize: '11px', margin: 0 }}>🔥 {member.attendance_streak || 0} streak</p>
      </div>
      {action}
    </div>
  )
}

// ════════════════════════════════════
// MEMBERS TAB
// ════════════════════════════════════
function MembersTab() {
  const [members, setMembers] = useState([])
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)

  const loadMembers = () => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setMembers(data || []); setLoading(false) })
  }

  useEffect(() => {
    loadMembers()

    // 🔴 Real-time: update member list when someone signs up
    const channel = supabase.channel('members-table-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, loadMembers)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const filtered = members.filter(m =>
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.campus?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleRole = async (m) => {
    const newRole = m.role === 'admin' ? 'member' : 'admin'
    await supabase.from('profiles').update({ role: newRole }).eq('id', m.id)
    setMembers(prev => prev.map(p => p.id === m.id ? { ...p, role: newRole } : p))
  }

  return (
    <PageWrap title="Members" subtitle={`${members.filter(m => m.role === 'member').length} registered members`}>
      <div style={{ marginBottom: '16px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or campus..."
          style={{ width: '100%', maxWidth: '400px', background: '#0d160d', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '12px', padding: '11px 16px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#0d160d', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(44,95,45,0.15)' }}>
              {['Member', 'Email', 'Campus', 'Streak', 'Role', 'Actions'].map(h => (
                <th key={h} style={{ padding: '14px 20px', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#444' }}>Loading...</td></tr>
            ) : filtered.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a2e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#2C5F2D', fontSize: '12px', fontWeight: 700 }}>{m.full_name?.charAt(0)}</span>
                    </div>
                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{m.full_name}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 20px', color: '#666', fontSize: '13px' }}>{m.email}</td>
                <td style={{ padding: '14px 20px', color: '#888', fontSize: '13px' }}>{m.campus || '—'}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ color: '#d4af37', fontSize: '13px', fontWeight: 700 }}>🔥 {m.attendance_streak || 0}</span>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700,
                    background: m.role === 'admin' ? 'rgba(44,95,45,0.2)' : 'rgba(255,255,255,0.05)',
                    color: m.role === 'admin' ? '#2C5F2D' : '#555',
                    border: `1px solid ${m.role === 'admin' ? 'rgba(44,95,45,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  }}>{m.role}</span>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <button
                    onClick={() => toggleRole(m)}
                    style={{ padding: '5px 12px', borderRadius: '8px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {m.role === 'admin' ? 'Make Member' : 'Make Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrap>
  )
}

// ════════════════════════════════════
// MEDIA TAB
// ════════════════════════════════════
function MediaTab() {
  const [sermons, setSermons]   = useState([])
  const [photos, setPhotos]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [mediaType, setMediaType] = useState('sermon') // 'sermon' | 'photo'
  const [form, setForm]         = useState({ title: '', series: '', speaker: '', date: new Date().toISOString().split('T')[0], duration: '' })
  const [thumbFile, setThumbFile]   = useState(null)
  const [audioFile, setAudioFile]   = useState(null)
  const [photoFiles, setPhotoFiles] = useState([])
  const [saving, setSaving]     = useState(false)
  const [progress, setProgress] = useState('')

  const thumbRef  = useRef(null)
  const audioRef  = useRef(null)
  const photoRef  = useRef(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      supabase.from('sermons').select('*').order('date', { ascending: false }),
      supabase.from('media_gallery').select('*').order('created_at', { ascending: false })
    ]).then(([{ data: s }, { data: p }]) => {
      setSermons(s || [])
      setPhotos(p || [])
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
    const channel = supabase.channel('admin-media-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sermons' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media_gallery' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  // Upload a file to Supabase Storage and return its public URL
  const uploadFile = async (file, bucket, folder) => {
    const ext  = file.name.split('.').pop()
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) throw error
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  const saveSermon = async () => {
    if (!form.title) return
    setSaving(true)
    try {
      setProgress('Uploading thumbnail...')
      const thumbUrl = thumbFile ? await uploadFile(thumbFile, 'media', 'thumbnails') : ''
      setProgress('Uploading audio...')
      const audioUrl = audioFile ? await uploadFile(audioFile, 'media', 'sermons') : ''
      setProgress('Saving...')
      await supabase.from('sermons').insert({ ...form, thumbnail_url: thumbUrl, audio_url: audioUrl })
      setShowAdd(false)
      setForm({ title: '', series: '', speaker: '', date: new Date().toISOString().split('T')[0], duration: '' })
      setThumbFile(null); setAudioFile(null)
      load()
    } catch (e) {
      alert('Upload error: ' + e.message)
    }
    setSaving(false); setProgress('')
  }

  const savePhotos = async () => {
    if (!photoFiles.length) return
    setSaving(true)
    try {
      for (let i = 0; i < photoFiles.length; i++) {
        setProgress(`Uploading photo ${i + 1} of ${photoFiles.length}...`)
        const url = await uploadFile(photoFiles[i], 'media', 'gallery')
        await supabase.from('media_gallery').insert({
          title: form.title || 'Church Photo',
          image_url: url,
          date: form.date,
        })
      }
      setShowAdd(false)
      setPhotoFiles([])
      setForm({ title: '', series: '', speaker: '', date: new Date().toISOString().split('T')[0], duration: '' })
      load()
    } catch (e) {
      alert('Upload error: ' + e.message)
    }
    setSaving(false); setProgress('')
  }

  const deleteSermon = async (id) => {
    if (!confirm('Delete this sermon?')) return
    await supabase.from('sermons').delete().eq('id', id)
    setSermons(prev => prev.filter(s => s.id !== id))
  }

  const deletePhoto = async (id) => {
    if (!confirm('Delete this photo?')) return
    await supabase.from('media_gallery').delete().eq('id', id)
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  const inputStyle = { width: '100%', background: '#070d07', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }

  return (
    <PageWrap
      title="Media Library"
      subtitle={`${sermons.length} sermon${sermons.length !== 1 ? 's' : ''} · ${photos.length} photo${photos.length !== 1 ? 's' : ''}`}
      action={
        <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '11px 20px', borderRadius: '12px', background: '#2C5F2D', color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer' }}>
          + Add Media
        </button>
      }
    >
      {/* Sermons Grid */}
      {sermons.length > 0 && (
        <>
          <p style={{ color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Sermons</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {sermons.map(s => (
              <div key={s.id} style={{ background: '#0d160d', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ width: '100%', aspectRatio: '16/9', background: '#111' }}>
                  <img src={s.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '14px' }}>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 4px' }}>{s.title}</p>
                  <p style={{ color: '#555', fontSize: '12px', margin: '0 0 12px' }}>{s.series} · {s.date}</p>
                  <button onClick={() => deleteSermon(s.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: '#2e1a1a', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Photos Grid */}
      {photos.length > 0 && (
        <>
          <p style={{ color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Photo Gallery</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {photos.map(p => (
              <div key={p.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1/1' }}>
                <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => deletePhoto(p.id)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '8px', padding: '4px 8px', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && sermons.length === 0 && photos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 40px', color: '#333' }}>
          <p style={{ fontSize: '48px' }}>🎙️</p>
          <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '12px' }}>No media uploaded yet</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>Click "+ Add Media" to upload your first sermon or photo</p>
        </div>
      )}

      {/* Add Media Modal */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { if (!saving) setShowAdd(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200 }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 201, background: '#0d160d', border: '1px solid rgba(44,95,45,0.3)', borderRadius: '24px', padding: '28px', width: 'min(500px, calc(100vw - 40px))', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#fff', fontWeight: 800, margin: 0, fontSize: '18px' }}>Add Media</h3>
                <button onClick={() => { if (!saving) setShowAdd(false) }} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              {/* Type Selector */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#070d07', padding: '4px', borderRadius: '12px' }}>
                {['sermon', 'photo'].map(t => (
                  <button key={t} onClick={() => setMediaType(t)}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', background: mediaType === t ? '#2C5F2D' : 'transparent', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '14px', textTransform: 'capitalize' }}
                  >
                    {t === 'sermon' ? '🎙️ Audio Sermon' : '📸 Photos'}
                  </button>
                ))}
              </div>

              {mediaType === 'sermon' ? (
                <>
                  {[{ key: 'title', label: 'Sermon Title *', ph: 'e.g. Walking in Faith' }, { key: 'series', label: 'Series', ph: 'e.g. Pathlighters Academy' }, { key: 'speaker', label: 'Speaker', ph: 'Speaker name' }, { key: 'duration', label: 'Duration', ph: '52:00' }].map(f => (
                    <div key={f.key} style={{ marginBottom: '14px' }}>
                      <label style={labelStyle}>{f.label}</label>
                      <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph} style={inputStyle} />
                    </div>
                  ))}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Date</label>
                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
                  </div>

                  {/* Thumbnail upload */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Thumbnail Image *</label>
                    <input ref={thumbRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setThumbFile(e.target.files?.[0])} />
                    <button onClick={() => thumbRef.current?.click()} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px dashed rgba(44,95,45,0.3)', background: '#070d07', color: thumbFile ? '#2C5F2D' : '#555', fontWeight: 600, cursor: 'pointer' }}>
                      {thumbFile ? `✅ ${thumbFile.name}` : '📷 Choose thumbnail image'}
                    </button>
                  </div>

                  {/* Audio upload */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>Audio File (MP3 / M4A)</label>
                    <input ref={audioRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => setAudioFile(e.target.files?.[0])} />
                    <button onClick={() => audioRef.current?.click()} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px dashed rgba(44,95,45,0.3)', background: '#070d07', color: audioFile ? '#2C5F2D' : '#555', fontWeight: 600, cursor: 'pointer' }}>
                      {audioFile ? `✅ ${audioFile.name}` : '🎵 Choose audio file'}
                    </button>
                  </div>

                  {progress && <p style={{ color: '#2C5F2D', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>{progress}</p>}
                  <button onClick={saveSermon} disabled={!form.title || saving || !thumbFile} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: form.title && thumbFile ? '#2C5F2D' : '#1a2e1a', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', opacity: (!form.title || !thumbFile) ? 0.5 : 1 }}>
                    {saving ? progress || 'Uploading...' : 'Save Sermon'}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Caption / Title (optional)</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Sunday Highlights June 2025" style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>Date</label>
                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
                  </div>

                  {/* Photo picker */}
                  <input ref={photoRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => setPhotoFiles(Array.from(e.target.files))} />
                  <button onClick={() => photoRef.current?.click()} style={{ width: '100%', padding: '40px 24px', borderRadius: '16px', border: '2px dashed rgba(44,95,45,0.3)', background: '#070d07', color: photoFiles.length ? '#2C5F2D' : '#555', fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '32px' }}>{photoFiles.length ? '✅' : '📸'}</span>
                    {photoFiles.length ? `${photoFiles.length} photo${photoFiles.length > 1 ? 's' : ''} selected` : 'Click to choose photos'}
                    <span style={{ fontSize: '12px', color: '#444' }}>You can select multiple at once</span>
                  </button>

                  {/* Preview thumbnails */}
                  {photoFiles.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
                      {photoFiles.map((f, i) => (
                        <div key={i} style={{ aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', background: '#111' }}>
                          <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {progress && <p style={{ color: '#2C5F2D', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>{progress}</p>}
                  <button onClick={savePhotos} disabled={!photoFiles.length || saving} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: photoFiles.length ? '#2C5F2D' : '#1a2e1a', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', opacity: !photoFiles.length ? 0.5 : 1 }}>
                    {saving ? progress || 'Uploading...' : `Upload ${photoFiles.length || ''} Photo${photoFiles.length !== 1 ? 's' : ''}`}
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageWrap>
  )
}

// ════════════════════════════════════
// GIVING TAB (Finance)
// ════════════════════════════════════
function GivingTab() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('giving').select('*, profile:user_id(full_name)').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setLogs(data); setLoading(false) })
  }, [])

  return (
    <PageWrap title="Finance" subtitle="Manage church donations and account numbers">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
        <div style={{ background: '#0d160d', borderRadius: '24px', border: '1px solid rgba(44,95,45,0.2)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(44,95,45,0.1)' }}>
            <h3 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Recent Online Giving</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                 <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '16px 24px', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Member</th>
                    <th style={{ padding: '16px 24px', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ padding: '16px 24px', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Category</th>
                    <th style={{ padding: '16px 24px', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Status</th>
                 </tr>
               </thead>
               <tbody>
                  {logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '16px 24px', color: '#fff', fontSize: '13px', fontWeight: 600 }}>{log.profile?.full_name || 'Anonymous'}</td>
                      <td style={{ padding: '16px 24px', color: '#2C5F2D', fontSize: '13px', fontWeight: 800 }}>₦{log.amount?.toLocaleString()}</td>
                      <td style={{ padding: '16px 24px', color: '#fff', fontSize: '13px' }}>{log.category}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '100px', background: '#1a2e1a', color: '#2C5F2D', fontSize: '10px', fontWeight: 800 }}>{log.status}</span>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && !loading && <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#333' }}>No giving logs found.</td></tr>}
               </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           <div style={{ background: '#1a2e1a', border: '1px solid rgba(44,95,45,0.3)', borderRadius: '24px', padding: '24px' }}>
             <Landmark size={32} color="#2C5F2D" style={{ marginBottom: '16px' }} />
             <h4 style={{ color: '#fff', fontWeight: 700, margin: '0 0 8px' }}>Manage Accounts</h4>
             <p style={{ color: '#aaa', fontSize: '12px', lineHeight: 1.5, margin: '0 0 20px' }}>Bank details added here will appear in the member app instantly.</p>
             <button style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#2C5F2D', border: 'none', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Edit Account Details</button>
           </div>
        </div>
      </div>
    </PageWrap>
  )
}

// ── Email Draft Modal ──────────────────────────────────
function EmailModal({ member, date, onClose }) {
  const firstName = member.full_name?.split(' ')[0] || 'Friend'
  const body = `Hi ${firstName},\n\nWe noticed you weren't with us at the Fruitbearers Church service on ${date}. We missed your beautiful presence!\n\nWe want you to know that you are deeply loved and valued in this family. Whatever reason kept you away — we're here for you.\n\nWe'd love to see you this coming Sunday! 🌿\n\nWith love,\nFruitbearers Leadership Team`
  const subject = `We missed you at Fruitbearers on ${date} 🌿`

  const openMail = () => window.open(`mailto:${member.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, backdropFilter: 'blur(4px)' }} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 301, background: '#0d160d', border: '1px solid rgba(44,95,45,0.3)', borderRadius: '20px', padding: '28px', width: 'min(440px, calc(100vw - 40px))' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>✉️ Draft Email to {member.full_name}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ background: '#070d07', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <p style={{ color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>To</p>
          <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: '0 0 12px' }}>{member.full_name} &lt;{member.email}&gt;</p>
          <p style={{ color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Subject</p>
          <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: '0 0 12px' }}>{subject}</p>
          <p style={{ color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Message</p>
          <p style={{ color: '#aaa', fontSize: '13px', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{body}</p>
        </div>
        <button
          onClick={openMail}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#2C5F2D', color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(44,95,45,0.3)' }}
        >
          <Mail size={16} /> Open in Email App
        </button>
      </motion.div>
    </>
  )
}

// ── User Profile Detail Modal ────────────────────────────
function UserProfileModal({ member, onClose }) {
  const downloadAvatar = async () => {
    if (!member.avatar_url) return;
    try {
      // Use Supabase client to bypass browser CORS restrictions securely
      const path = member.avatar_url.split('/avatars/')[1];
      if (!path) throw new Error('Invalid path format');

      const { data, error } = await supabase.storage.from('avatars').download(path);
      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${member.full_name?.replace(/ /g, '_') || 'Member'}_Avatar.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Could not download image securely. Please try right-clicking and saving the image.');
      console.error(e);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ position: 'relative', zIndex: 401, background: '#0d160d', border: '1px solid rgba(44,95,45,0.3)', borderRadius: '24px', padding: '32px', width: 'min(400px, 100%)', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.8)' }}
      >
        <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#555', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '36px', background: '#1a1a1a', border: '2px solid rgba(212,175,55,0.3)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
               {member.avatar_url ? <img src={member.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={40} color="#555" />}
            </div>
            {member.avatar_url && (
              <button 
                onClick={downloadAvatar} 
                title="Download Photo"
                style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '40px', height: '40px', borderRadius: '50%', background: '#2C5F2D', color: '#fff', border: '3px solid #0d160d', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}
              >
                 <Upload size={18} style={{ transform: 'rotate(180deg)' }} />
              </button>
            )}
          </div>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: '0 0 4px', textAlign: 'center' }}>{member.full_name}</h2>
          <p style={{ color: member.role === 'admin' ? '#2C5F2D' : '#d4af37', fontSize: '11px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            {member.role || 'Member'}
          </p>
        </div>

        <div style={{ background: '#070d07', borderRadius: '16px', padding: '24px', display: 'grid', gap: '20px' }}>
           <DetailRow icon={<Mail size={16} />} label="Email Address" value={member.email} />
           <DetailRow icon={<PhoneOutgoing size={16} />} label="Phone Number" value={member.phone || 'Not provided'} />
           <DetailRow icon={<Calendar size={16} />} label="Date of Birth" value={member.dob ? new Date(member.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not provided'} />
           <DetailRow icon={<Heart size={16} />} label="Wisdom House" value={member.wisdom_house || 'Not assigned'} />
           <DetailRow icon={<TrendingUp size={16} />} label="Attendance Streak" value={`🔥 ${member.attendance_streak || 0} consecutive Sundays`} />
        </div>
      </motion.div>
    </div>
  )
}

function DetailRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ color: '#555', background: '#111', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div>
        <p style={{ color: '#666', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>{label}</p>
        <p style={{ color: '#eee', fontSize: '13px', fontWeight: 600, margin: 0 }}>{value}</p>
      </div>
    </div>
  )
}

// ════════════════════════════════════
// BIRTHDAY TAB
// ════════════════════════════════════
function BirthdayTab() {
  const [filter, setFilter] = useState('Today')
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('role', 'member')
    if (data) {
      const today = new Date()
      const list = data.filter(m => {
        if (!m.dob) return false
        const d = new Date(m.dob)
        if (filter === 'Today') {
          return d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
        }
        if (filter === 'This Month') {
          return d.getMonth() === today.getMonth()
        }
        return true
      })
      setMembers(list)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  return (
    <PageWrap title="Birthdays" subtitle="Celebrate your members on their special day"
      action={
        <div style={{ display: 'flex', background: '#070d07', borderRadius: '12px', padding: '4px' }}>
          {['Today', 'This Month', 'All'].map(f => (
             <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 16px', borderRadius: '10px', background: filter === f ? '#2C5F2D' : 'transparent', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>{f}</button>
          ))}
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {members.map(m => (
          <div key={m.id} onClick={() => setSelectedMember(m)} style={{ background: '#0d160d', border: '1px solid rgba(212,175,55,0.1)', borderRadius: '24px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
             <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: m.avatar_url ? 'transparent' : '#2C5F2D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
               {m.avatar_url ? <img src={m.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Gift size={24} color="#fff" />}
             </div>
             <div style={{ flex: 1 }}>
               <p style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>{m.full_name}</p>
               <p style={{ color: '#555', fontSize: '12px', fontWeight: 600, margin: 0 }}>{new Date(m.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
             </div>
             <a href={`https://wa.me/${m.phone}?text=Happy%20Birthday%20${m.full_name}!%20🌿`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1a2e1a', color: '#2C5F2D', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(44,95,45,0.2)' }}>
               <MessageCircle size={18} />
             </a>
          </div>
        ))}
        {members.length === 0 && !loading && (
           <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0' }}>
             <p style={{ color: '#333', fontSize: '14px' }}>No birthdays for this filter. 🌿</p>
           </div>
        )}
      </div>

      <AnimatePresence>
        {selectedMember && <UserProfileModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
      </AnimatePresence>
    </PageWrap>
  )
}

// ════════════════════════════════════
// COMMUNICATION TAB
// ════════════════════════════════════
function CommunicationTab() {
  const [msg, setMsg] = useState({ title: '', body: '', type: 'Announcement' })
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!msg.title || !msg.body) return toast.error('Fill all fields')
    setLoading(true)
    const { error } = await supabase.from('confessions').insert({
       title: msg.title,
       body: msg.body,
       start_date: new Date().toISOString().split('T')[0],
       end_date: new Date(Date.now() + 7 * 24 * 3600000).toISOString().split('T')[0],
    })
    if (!error) {
       toast.success('Announcement posted to home screen!')
       setMsg({ title: '', body: '', type: 'Announcement' })
    }
    setLoading(false)
  }

  return (
    <PageWrap title="Broadcast" subtitle="Send messages and announcements to the entire church">
      <div style={{ maxWidth: '600px', background: '#0d160d', border: '1px solid rgba(44,95,45,0.15)', borderRadius: '24px', padding: '32px' }}>
        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 24px' }}>Post Global Announcement</h3>
        <div style={{ display: 'grid', gap: '20px' }}>
           <div>
             <label style={{ display: 'block', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Title</label>
             <input value={msg.title} onChange={e => setMsg(p => ({ ...p, title: e.target.value }))} placeholder="Theme of the Month..." style={{ width: '100%', background: '#070d07', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '12px', padding: '14px', color: '#fff', outline: 'none' }} />
           </div>
           <div>
             <label style={{ display: 'block', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Message Body</label>
             <textarea value={msg.body} onChange={e => setMsg(p => ({ ...p, body: e.target.value }))} rows={5} placeholder="Type your message here..." style={{ width: '100%', background: '#070d07', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '12px', padding: '14px', color: '#fff', outline: 'none', fontFamily: 'inherit', resize: 'none' }} />
           </div>
           <button onClick={send} disabled={loading} style={{ padding: '16px', borderRadius: '12px', background: '#2C5F2D', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
             <Send size={18} /> {loading ? 'Posting...' : 'Post Announcement'}
           </button>
        </div>
      </div>
    </PageWrap>
  )
}

