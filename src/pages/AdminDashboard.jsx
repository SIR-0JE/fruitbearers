import { useState, useEffect } from 'react'
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
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'member'),
      supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('session_date', today),
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
    supabase.from('profiles').select('id, full_name, email, campus, created_at').eq('role', 'member').order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setRecentMembers(data || []))
    supabase.from('attendance').select('user_id, checked_in_at, profiles(full_name)').eq('session_date', today).limit(10)
      .then(({ data }) => setTodayAttendance(data || []))
  }

  useEffect(() => {
    loadData()

    // 🔴 Real-time: update recent lists automatically
    const channel = supabase.channel('overview-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, loadData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance' }, loadData)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const copyLink = () => { navigator.clipboard?.writeText(magicLink); }

  return (
    <PageWrap title="Dashboard Overview" subtitle={`${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}>
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard icon="👥" label="Total Members" value={stats.members} sub="Active accounts" />
        <StatCard icon="✅" label="Today's Check-ins" value={stats.checkins} sub="Sunday service" color="#d4af37" />
        <StatCard icon="🎙️" label="Sermons" value={stats.sermons} sub="In media library" color="#5ac8fa" />
        <StatCard icon="🌿" label="Church" value="Bowen" sub="University campus" color="#a78bfa" />
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
// HOME PAGE TAB — Featured flier
// ════════════════════════════════════
function HomePageTab() {
  const [current, setCurrent]   = useState('')
  const [newUrl, setNewUrl]     = useState('')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  const LOCAL_FLIERS = [
    { label: 'Discovering Your Purpose — Part 3', path: '/sermons/discovering-your-purpose.jpg' },
    { label: 'Join Us This Sunday',               path: '/sermons/join-us-sunday.jpg'           },
    { label: 'Overcoming Your Background',        path: '/sermons/overcoming-your-background.jpg'},
  ]

  useEffect(() => {
    supabase.from('app_settings').select('value').eq('key', 'featured_flier_url').single()
      .then(({ data }) => data && setCurrent(data.value))
  }, [])

  const setFlier = async (url) => {
    setSaving(true)
    await supabase.from('app_settings').upsert({ key: 'featured_flier_url', value: url, updated_at: new Date().toISOString() })
    setCurrent(url)
    setSaved(true); setSaving(false)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <PageWrap title="Home Page" subtitle="Control what members see on their home screen">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Current flier preview */}
        <div>
          <p style={{ color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Currently Displayed</p>
          <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(44,95,45,0.3)', background: '#0d160d', marginBottom: '12px' }}>
            {current
              ? <img src={current} alt="" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
              : <div style={{ padding: '60px 20px', textAlign: 'center', color: '#333' }}>No flier selected</div>
            }
          </div>
          {saved && (
            <p style={{ color: '#2C5F2D', fontSize: '13px', fontWeight: 700 }}>✅ Flier updated — all members will see this now</p>
          )}
        </div>

        {/* Controls */}
        <div>
          {/* Pick flier */}
          <p style={{ color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Select Flier</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {LOCAL_FLIERS.map(f => (
              <button
                key={f.path}
                onClick={() => setFlier(f.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  background: current === f.path ? '#1a2e1a' : '#0d160d',
                  border: `1.5px solid ${current === f.path ? '#2C5F2D' : 'rgba(44,95,45,0.2)'}`,
                  borderRadius: '14px', padding: '12px 16px', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={f.path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ color: current === f.path ? '#fff' : '#aaa', fontSize: '13px', fontWeight: 600, flex: 1 }}>{f.label}</span>
                {current === f.path && <CheckCircle size={18} color="#2C5F2D" />}
              </button>
            ))}
          </div>

          {/* Custom URL */}
          <p style={{ color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Or Paste Image URL</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="https://your-site.com/flier.jpg"
              style={{ flex: 1, background: '#0d160d', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '12px', padding: '12px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
            />
            <button
              onClick={() => newUrl && setFlier(newUrl)}
              disabled={!newUrl || saving}
              style={{ padding: '12px 20px', borderRadius: '12px', background: '#2C5F2D', color: '#fff', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer', flexShrink: 0, opacity: !newUrl ? 0.5 : 1 }}
            >
              {saving ? '...' : 'Set'}
            </button>
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
  const [newSession, setNewSession] = useState({ name: 'Sunday Service', type: 'First Service' })
  const [activeSession, setActiveSession] = useState(null)

  const load = async () => {
    setLoading(true)
    const [ { data: m }, { data: a }, { data: s } ] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, attendance_streak').eq('role', 'member'),
      supabase.from('attendance').select('user_id, session_id').eq('service_date', date),
      supabase.from('attendance_sessions').select('*').eq('service_date', date)
    ])
    setMembers(m || [])
    setSessions(s || [])
    
    // If sessions exist, we can filter checkins. For now, show all for that day
    setCheckins((a || []).map(x => x.user_id))
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase.channel(`attendance-${date}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance', filter: `service_date=eq.${date}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_sessions' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [date])

  const createSession = async () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString()
    const qrValue = crypto.randomUUID()
    const { data, error } = await supabase.from('attendance_sessions').insert({
      session_name: newSession.name,
      service_date: date,
      service_type: newSession.type,
      qr_code_value: qrValue,
      pin: pin,
      expires_at: new Date(Date.now() + 6 * 3600000).toISOString() // 6 hours
    }).select().single()
    
    if (!error) {
      setActiveSession(data)
      setShowCreate(false)
      load()
    }
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
        {showCreate && (
           <>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }} />
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
               style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 201, background: '#0d160d', border: '1px solid rgba(44,95,45,0.3)', borderRadius: '20px', padding: '28px', width: 'min(400px, calc(100vw - 40px))' }}
             >
               <h3 style={{ color: '#fff', fontWeight: 700, margin: '0 0 20px' }}>Create Attendance Session</h3>
               
               <div style={{ marginBottom: '16px' }}>
                 <label style={{ display: 'block', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Service Type</label>
                 <select 
                   value={newSession.type}
                   onChange={e => setNewSession(p => ({ ...p, type: e.target.value }))}
                   style={{ width: '100%', background: '#070d07', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '10px', padding: '12px', color: '#fff', outline: 'none' }}
                 >
                   <option>First Service</option>
                   <option>Second Service</option>
                   <option>Midweek Service</option>
                   <option>Special Service</option>
                 </select>
               </div>

               <button 
                 onClick={createSession}
                 style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#2C5F2D', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
               >
                 Start Session
               </button>
             </motion.div>
           </>
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
  const [sermons, setSermons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', series: '', speaker: '', date: '', duration: '', thumbnail_url: '', audio_url: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    supabase.from('sermons').select('*').order('date', { ascending: false })
      .then(({ data }) => { setSermons(data || []); setLoading(false) })
  }

  useEffect(() => {
    load()

    // 🔴 Real-time: update media tab
    const channel = supabase.channel('admin-media-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sermons' }, load)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const saveSermon = async () => {
    setSaving(true)
    await supabase.from('sermons').insert({ ...form, audio_url: form.audio_url || '' })
    setSaving(false); setShowAdd(false)
    setForm({ title: '', series: '', speaker: '', date: '', duration: '', thumbnail_url: '', audio_url: '' })
    load()
  }

  const deleteSermon = async (id) => {
    if (!confirm('Delete this sermon?')) return
    await supabase.from('sermons').delete().eq('id', id)
    setSermons(prev => prev.filter(s => s.id !== id))
  }

  return (
    <PageWrap
      title="Media Library"
      subtitle={`${sermons.length} sermon${sermons.length !== 1 ? 's' : ''} uploaded`}
      action={
        <button
          onClick={() => setShowAdd(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '11px 20px', borderRadius: '12px', background: '#2C5F2D', color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer' }}
        >
          + Add Sermon
        </button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {sermons.map(s => (
          <div key={s.id} style={{ background: '#0d160d', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ width: '100%', aspectRatio: '16/9', background: '#111', overflow: 'hidden' }}>
              <img src={s.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ padding: '14px' }}>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 4px', lineHeight: 1.2 }}>{s.title}</p>
              <p style={{ color: '#555', fontSize: '12px', margin: '0 0 12px' }}>{s.series} · {s.date}</p>
              <button
                onClick={() => deleteSermon(s.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: '#2e1a1a', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add sermon modal */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 201, background: '#0d160d', border: '1px solid rgba(44,95,45,0.3)', borderRadius: '20px', padding: '28px', width: 'min(480px, calc(100vw - 40px))' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Add Sermon</h3>
                <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {[
                { key: 'title', label: 'Title', placeholder: 'Sermon title' },
                { key: 'series', label: 'Series', placeholder: 'e.g. Pathlighters Academy' },
                { key: 'speaker', label: 'Speaker', placeholder: 'Speaker name' },
                { key: 'date', label: 'Date', type: 'date' },
                { key: 'duration', label: 'Duration', placeholder: '53:00' },
                { key: 'thumbnail_url', label: 'Thumbnail URL', placeholder: 'https://...' },
                { key: 'audio_url', label: 'Audio URL (optional)', placeholder: 'https://...' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ width: '100%', background: '#070d07', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <button
                onClick={saveSermon}
                disabled={!form.title || saving}
                style={{ width: '100%', marginTop: '8px', padding: '13px', borderRadius: '12px', background: '#2C5F2D', color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', opacity: !form.title ? 0.5 : 1 }}
              >
                {saving ? 'Saving...' : 'Save Sermon'}
              </button>
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

// ════════════════════════════════════
// BIRTHDAY TAB
// ════════════════════════════════════
function BirthdayTab() {
  const [filter, setFilter] = useState('Today')
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])

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
          <div key={m.id} style={{ background: '#0d160d', border: '1px solid rgba(212,175,55,0.1)', borderRadius: '24px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#2C5F2D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
               <Gift size={24} color="#fff" />
             </div>
             <div style={{ flex: 1 }}>
               <p style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>{m.full_name}</p>
               <p style={{ color: '#555', fontSize: '12px', fontWeight: 600, margin: 0 }}>{new Date(m.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
             </div>
             <a href={`https://wa.me/${m.phone}?text=Happy%20Birthday%20${m.full_name}!%20🌿`} target="_blank" rel="noreferrer" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1a2e1a', color: '#2C5F2D', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(44,95,45,0.2)' }}>
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

