import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import * as tus from 'tus-js-client'
import {
  LayoutDashboard, Users, Calendar, Tv2, Image as ImageIcon,
  LogOut, Bell, Mail, CheckCircle, XCircle, Edit3, X,
  ChevronRight, TrendingUp, RefreshCw, Eye, Trash2,
  Heart, DollarSign, Upload, Copy, ExternalLink, QrCode, Plus, Search, Filter, 
  MessageCircle, PhoneOutgoing, Gift, Megaphone, Send, Landmark, BookOpen
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
  { id: 'themes',     icon: BookOpen,         label: 'Curriculum' },
  { id: 'socials',    icon: ExternalLink,     label: 'Socials'    },
]

// ── Simple Skeleton Component ──────────────────────────
const Skeleton = ({ count = 1, height = 20, width = '100%' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton" style={{ height, width: '100%', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }} />
    ))}
  </div>
)

export default function AdminDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [active, setActive] = useState('overview')
  const [bgUpload, setBgUpload] = useState({ active: false, progress: 0, text: '', filename: '', error: null, success: false })
  // ── Stats Fetching (React Query) ──
  const { data: stats = { members: 0, checkins: 0, sermons: 0, giving: 0 }, isLoading: loadingStats } = useSupabaseQuery(
    ['admin', 'stats'],
    async () => {
      const today = new Date().toISOString().split('T')[0]
      const [m, a, s] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('attendance_records').select('id', { count: 'exact', head: true }).gte('timestamp', today),
        supabase.from('sermons').select('id', { count: 'exact', head: true }),
      ])
      return { members: m.count || 0, checkins: a.count || 0, sermons: s.count || 0 }
    },
    { refetchInterval: 30000 } // Refetch every 30s
  )

  const queryClient = useQueryClient()

  // Prefetch critical data when dashboard loads
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    
    // Prefetch members — must return plain array to match useSupabaseQuery output
    queryClient.prefetchQuery({
      queryKey: ['admin', 'members'],
      queryFn: async () => {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
        return data || []
      }
    })

    // Prefetch attendance
    queryClient.prefetchQuery({
      queryKey: ['admin', 'attendance', today],
      queryFn: async () => {
        const { data: s } = await supabase.from('attendance_sessions').select('id').eq('service_date', today)
        const sessionIds = s?.map(x => x.id) || []
        return supabase.from('attendance_records').select('user_id, session_id').in('session_id', sessionIds)
      }
    })
  }, [queryClient])

  const handleSignOut = async () => { await signOut(); navigate('/admin-portal') }

  const startBackgroundUpload = async (form, audioFile, thumbFile) => {
    setBgUpload({ active: true, progress: 0, text: 'Initializing...', filename: audioFile.name, error: null, success: false })

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      setBgUpload(p => ({ ...p, text: 'Uploading thumbnail...' }))
      let thumbUrl = ''
      if (thumbFile) {
        const thumbExt = thumbFile.name.split('.').pop()
        const thumbPath = `thumbnails/${Date.now()}-${Math.random().toString(36).slice(2)}.${thumbExt}`
        const { error: tErr } = await supabase.storage.from('media').upload(thumbPath, thumbFile)
        if (tErr) throw tErr
        thumbUrl = supabase.storage.from('media').getPublicUrl(thumbPath).data.publicUrl
      }

      setBgUpload(p => ({ ...p, text: 'Starting audio upload...' }))
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const tusEndpoint = `${supabaseUrl}/storage/v1/upload/resumable`
      const audioExt = audioFile.name.split('.').pop()
      const audioPath = `sermons/${Date.now()}-${Math.random().toString(36).slice(2)}.${audioExt}`

      const upload = new tus.Upload(audioFile, {
        endpoint: tusEndpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          'x-upsert': 'true',
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: 'media',
          objectName: audioPath,
          contentType: audioFile.type || 'audio/mpeg',
          cacheControl: '3600',
        },
        chunkSize: 6 * 1024 * 1024,
        onError: (error) => {
          console.error("TUS Error:", error)
          setBgUpload(p => ({ ...p, error: 'Upload failed: ' + error.message }))
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(0)
          setBgUpload(p => ({ ...p, progress: Number(percentage), text: `Uploading chunks: ${percentage}%` }))
        },
        onSuccess: async () => {
          setBgUpload(p => ({ ...p, text: 'Finalizing database...', progress: 100 }))
          const audioUrl = supabase.storage.from('media').getPublicUrl(audioPath).data.publicUrl
          const { error: dbErr } = await supabase.from('sermons').insert({ ...form, thumbnail_url: thumbUrl, audio_url: audioUrl })
          
          if (dbErr) setBgUpload(p => ({ ...p, error: 'DB Save failed: ' + dbErr.message }))
          else {
            setBgUpload(p => ({ ...p, text: 'Upload Successful! 🎉', success: true }))
            setTimeout(() => setBgUpload({ active: false, progress: 0, text: '', filename: '', error: null, success: false }), 5000)
          }
        }
      })
      upload.findPreviousUploads().then((prev) => {
        if (prev.length) upload.resumeFromPreviousUpload(prev[0])
        upload.start()
      })
    } catch (e) {
      setBgUpload(p => ({ ...p, error: e.message }))
    }
  }

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
          {active === 'media'      && <MediaTab      key="md" onStartUpload={startBackgroundUpload} />}
          {active === 'birthday'   && <BirthdayTab   key="bd" />}
          {active === 'broadcast'  && <CommunicationTab key="bc" />}
          {active === 'giving'     && <GivingTab     key="gv" />}
          {active === 'themes'     && <ThemesTab     key="th" />}
          {active === 'socials'    && <SocialsTab    key="sc" />}
        </AnimatePresence>
      </main>

      {/* Global Background Uploader Tracking Widget */}
      <AnimatePresence>
        {bgUpload.active && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: '#0d160d', border: `1px solid ${bgUpload.error ? 'rgba(239,68,68,0.5)' : bgUpload.success ? 'rgba(44,95,45,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '16px', padding: '16px 20px', width: '340px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <div style={{ flex: 1, overflow: 'hidden' }}>
                 <p style={{ color: bgUpload.error ? '#ef4444' : bgUpload.success ? '#2C5F2D' : '#d4af37', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>
                   {bgUpload.error ? 'Upload Failed' : bgUpload.success ? 'Complete' : 'Background Upload'}
                 </p>
                 <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bgUpload.filename}</p>
               </div>
               {(bgUpload.error || bgUpload.success) && (
                 <button onClick={() => setBgUpload({ active: false })} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#555', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14}/></button>
               )}
             </div>

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
               <p style={{ color: '#aaa', fontSize: '12px', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', paddingRight: '8px' }}>{bgUpload.error || bgUpload.text}</p>
               {(!bgUpload.error && !bgUpload.success) && <p style={{ color: '#fff', fontSize: '12px', fontWeight: 700, margin: 0 }}>{bgUpload.progress}%</p>}
             </div>
             
             {(!bgUpload.error && !bgUpload.success) && (
               <div style={{ width: '100%', height: '6px', background: '#1a2e1a', borderRadius: '100px', overflow: 'hidden', marginTop: '4px' }}>
                 <div style={{ height: '100%', background: '#2C5F2D', width: `${bgUpload.progress}%`, transition: 'width 0.3s ease' }} />
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
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
  const { data: recentMembers = [], isLoading: loadingMembers } = useSupabaseQuery(
    ['admin', 'recent_members'],
    () => supabase.from('profiles').select('id, full_name, email, campus, created_at').order('created_at', { ascending: false }).limit(5)
  )

  const { data: todayAttendance = [], isLoading: loadingAttendance } = useSupabaseQuery(
    ['admin', 'today_attendance'],
    () => {
      const today = new Date().toISOString().split('T')[0]
      return supabase.from('attendance_records').select('user_id, timestamp, profiles(full_name)').gte('timestamp', today).order('timestamp', { ascending: false }).limit(10)
    }
  )

  const magicLink = `${window.location.origin}/admin-portal?u=FRUITBEARERS&p=INSIDEOUT`
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
          {loadingMembers ? <Skeleton count={5} height={40} /> : recentMembers.length === 0
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
          {loadingAttendance ? <Skeleton count={5} height={40} /> : todayAttendance.length === 0
            ? <p style={{ color: '#333', fontSize: '13px' }}>No check-ins recorded yet today</p>
            : todayAttendance.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <CheckCircle size={16} color="#2C5F2D" style={{ flexShrink: 0 }} />
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0 }}>
                  {a.profiles?.full_name || 'Unknown member'}
                </p>
                <span style={{ marginLeft: 'auto', color: '#444', fontSize: '11px', flexShrink: 0 }}>
                  {a.timestamp ? new Date(a.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
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

  // New States for Preview and CTA
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl]     = useState('')

  useEffect(() => {
    supabase.from('app_settings').select('value').eq('key', 'featured_flier_url').single()
      .then(({ data }) => data && setCurrent(data.value))
  }, [])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  // Optimize large phone pictures before uploading
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Cap width at 1200px to maintain quality while massively shrinking file size
        const scaleSize = img.width > 1200 ? 1200 / img.width : 1;
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg', lastModified: Date.now() }));
        }, 'image/jpeg', 0.8); // 80% quality JPEG
      };
    });
  }

  const confirmUpload = async () => {
    if (!selectedFile) return
    setUploading(true)

    try {
      // Compress the image before uploading to fix "slow/failing" issues on phones
      const optimizedFile = await compressImage(selectedFile)
      
      const path = `fliers/sunday-flier-${Date.now()}.jpg`

      const { error: upErr } = await supabase.storage.from('media').upload(path, optimizedFile, { upsert: true })
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)

      await supabase.from('app_settings').upsert({ key: 'featured_flier_url', value: publicUrl })
      setCurrent(publicUrl)
      setSaved(true)
      setSelectedFile(null)
      setPreviewUrl('')
      // clear the actual input so the same file could be chosen again
      if (fileInputRef.current) fileInputRef.current.value = ''
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
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
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />

          {!selectedFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', padding: '48px 24px', borderRadius: '20px', border: '2px dashed rgba(44,95,45,0.4)', background: '#070d07', color: '#2C5F2D', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
            >
              <span style={{ fontSize: '36px' }}>📤</span>
              Click to select flier
              <span style={{ color: '#555', fontSize: '12px', fontWeight: 500 }}>PNG or JPG · Compresses automatically</span>
            </button>
          ) : (
            <div style={{ background: '#070d07', border: '1px solid #2C5F2D', borderRadius: '20px', padding: '16px' }}>
              <div style={{ position: 'relative', width: '100%', background: '#000', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                <button 
                  onClick={() => { setSelectedFile(null); setPreviewUrl(''); if (fileInputRef.current) fileInputRef.current.value = '' }} 
                  disabled={uploading} 
                  style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={16} />
                </button>
              </div>
              <button 
                onClick={confirmUpload}
                disabled={uploading}
                style={{ width: '100%', background: '#2C5F2D', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 800, fontSize: '15px', cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
              >
                 {uploading ? '⏳ Optimizing & Uploading...' : 'Confirm & Publish Flier'}
              </button>
            </div>
          )}

          <div style={{ marginTop: '20px', padding: '16px', background: '#0d160d', borderRadius: '14px', border: '1px solid rgba(44,95,45,0.15)' }}>
            <p style={{ color: '#2C5F2D', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>How it works</p>
            <p style={{ color: '#555', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>Upload a new flier every Sunday. It replaces the previous one automatically. Members on the home screen will see the new image in real-time and can share it with friends.</p>
          </div>

          {/* Prayer Link Setting */}
          <PrayerLinkSetting />
        </div>
      </div>
    </PageWrap>
  )
}

// Sub-component so it has its own state lifecycle
function PrayerLinkSetting() {
  const [link, setLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('app_settings').select('value').eq('key', 'prayer_link').single()
      .then(({ data }) => { if (data?.value) setLink(data.value) })
  }, [])

  const save = async () => {
    setSaving(true)
    await supabase.from('app_settings').upsert({ key: 'prayer_link', value: link })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ marginTop: '20px', padding: '20px', background: '#0d160d', borderRadius: '14px', border: '1px solid rgba(44,95,45,0.15)' }}>
      <p style={{ color: '#2C5F2D', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>🤲 Prayer Request Link</p>
      <p style={{ color: '#555', fontSize: '12px', lineHeight: 1.5, margin: '0 0 14px' }}>When members tap "Ask for Prayer" on their home screen, they'll be sent to this link (e.g. a WhatsApp link, Google Form, or Typeform).</p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="url"
          value={link}
          onChange={e => setLink(e.target.value)}
          placeholder="https://wa.me/..."
          style={{ flex: 1, background: '#070d07', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
        />
        <button
          onClick={save}
          disabled={saving || !link.trim()}
          style={{ padding: '10px 18px', borderRadius: '10px', background: saved ? '#1a2e1a' : '#2C5F2D', border: 'none', color: saved ? '#2C5F2D' : '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}
        >
          {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Link'}
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════
// ATTENDANCE TAB
// ════════════════════════════════════
function AttendanceTab() {
  const queryClient = useQueryClient()
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0])
  const [emailTarget, setEmailTarget] = useState(null)
  
  const [showCreate, setShowCreate] = useState(false)
  const [newSession, setNewSession] = useState({ name: 'Attendance Session', type: 'Sunday Service', end_time: '' })
  const [activeSession, setActiveSession] = useState(null)
  const [isCreating, setIsCreating] = useState(false)

  // Curriculum attachment (optional)
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState('')

  // Fetch all modules with their parent theme name and topics (for dropdown)
  const { data: allModules = [] } = useSupabaseQuery(
    ['admin', 'modules_for_session'],
    () => supabase.from('modules').select('*, topics(*), themes(name)').order('order_number')
  )

  const { data: attendanceData = { members: [], checkins: [], sessions: [] }, isLoading: loading } = useSupabaseQuery(
    ['admin', 'attendance', date],
    async () => {
      const [ { data: m }, { data: s } ] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, attendance_streak').eq('role', 'member'),
        supabase.from('attendance_sessions').select('*').eq('service_date', date).order('created_at', { ascending: false })
      ])
      
      const sessionIds = s?.map(x => x.id) || []
      const { data: a } = await supabase.from('attendance_records').select('user_id, session_id').in('session_id', sessionIds)
      
      return {
        members: m || [],
        sessions: s || [],
        checkins: (a || []).map(x => x.user_id)
      }
    }
  )

  const { members = [], sessions = [], checkins = [] } = attendanceData

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
      is_active: true,
      topic_id: selectedTopicId || null,
    }).select().single()
    
    if (!error) {
      setActiveSession(data)
      setShowCreate(false)
      setSelectedModuleId('')
      setSelectedTopicId('')
      queryClient.invalidateQueries(['admin', 'attendance', date])
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

  const present = (members || []).filter(m => (checkins || []).includes(m.id))
  const missed  = (members || []).filter(m => !(checkins || []).includes(m.id))

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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <Skeleton count={10} height={40} />
          <Skeleton count={10} height={40} />
        </div>
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

                 {/* ── Curriculum Attachment (Optional) ── */}
                 <div style={{ borderTop: '1px solid rgba(44,95,45,0.1)', paddingTop: '16px' }}>
                   <p style={{ color: '#444', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>
                     📚 Attach Curriculum Topic <span style={{ color: '#333', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                   </p>

                   {/* Module dropdown */}
                   <div style={{ marginBottom: '12px' }}>
                     <label style={{ display: 'block', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Module</label>
                     <select
                       value={selectedModuleId}
                       onChange={e => { setSelectedModuleId(e.target.value); setSelectedTopicId('') }}
                       style={{ width: '100%', background: '#070d07', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '12px', padding: '12px 14px', color: selectedModuleId ? '#fff' : '#555', outline: 'none', fontSize: '14px', cursor: 'pointer' }}
                     >
                       <option value="">— No curriculum this session —</option>
                       {allModules.map(m => (
                         <option key={m.id} value={m.id}>
                           {m.themes?.name ? `${m.themes.name} → ` : ''}{m.title}
                         </option>
                       ))}
                     </select>
                   </div>

                   {/* Topic dropdown (only when module selected) */}
                   {selectedModuleId && (
                     <div style={{ marginBottom: '12px' }}>
                       <label style={{ display: 'block', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Topic</label>
                       <select
                         value={selectedTopicId}
                         onChange={e => setSelectedTopicId(e.target.value)}
                         style={{ width: '100%', background: '#070d07', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '12px', padding: '12px 14px', color: selectedTopicId ? '#fff' : '#555', outline: 'none', fontSize: '14px', cursor: 'pointer' }}
                       >
                         <option value="">— Select a topic —</option>
                         {(allModules.find(m => m.id === selectedModuleId)?.topics || []).map(t => (
                           <option key={t.id} value={t.id}>{t.title}</option>
                         ))}
                       </select>
                     </div>
                   )}

                   {/* Confirmation hint */}
                   {selectedTopicId && (() => {
                     const topicTitle = allModules.find(m => m.id === selectedModuleId)?.topics?.find(t => t.id === selectedTopicId)?.title
                     return topicTitle ? (
                       <p style={{ color: '#2C5F2D', fontSize: '12px', fontWeight: 600, background: 'rgba(44,95,45,0.08)', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '10px', padding: '10px 12px', margin: 0 }}>
                         ✅ Members who check in today will be asked who taught: <strong>"{topicTitle}"</strong>
                       </p>
                     ) : null
                   })()}
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
  const [search, setSearch]   = useState('')
  const [selectedMember, setSelectedMember] = useState(null)

  const { data: members = [], isLoading: loading } = useSupabaseQuery(
    ['admin', 'members'],
    () => supabase.from('profiles').select('*').order('created_at', { ascending: false })
  )

  const filtered = (members || []).filter(m => {
    const term = search.toLowerCase()
    const nameMatch = m.full_name?.toLowerCase().includes(term)
    const emailMatch = m.email?.toLowerCase().includes(term)
    const dobMatch = m.dob && new Date(m.dob).toLocaleString('default', { month: 'long' }).toLowerCase().includes(term)
    return nameMatch || emailMatch || dobMatch
  })

  // Role toggling is now handled inside UserProfileModal

  return (
    <PageWrap title="Members" subtitle={`${(members || []).filter(m => m.role === 'member').length} registered members`}>
      <div style={{ marginBottom: '16px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter by name, email, or birth month..."
          style={{ width: '100%', maxWidth: '400px', background: '#0d160d', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '12px', padding: '11px 16px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#0d160d', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(44,95,45,0.15)' }}>
              {['Member', 'Email', 'Date of Birth'].map(h => (
                <th key={h} style={{ padding: '14px 20px', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} style={{ padding: '20px' }}><Skeleton count={10} height={40} /></td></tr>
            ) : filtered.map(m => (
              <tr key={m.id} onClick={() => setSelectedMember(m)} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(44,95,45,0.1)'} onMouseOut={e => e.currentTarget.style.background='transparent'}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: m.avatar_url ? 'transparent' : '#1a2e1a', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {m.avatar_url ? <img src={m.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#2C5F2D', fontSize: '12px', fontWeight: 700 }}>{m.full_name?.charAt(0)}</span>}
                    </div>
                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{m.full_name}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 20px', color: '#666', fontSize: '13px' }}>{m.email}</td>
                <td style={{ padding: '14px 20px', color: '#888', fontSize: '13px' }}>{m.dob ? new Date(m.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedMember && <UserProfileModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
      </AnimatePresence>
    </PageWrap>
  )
}


// ════════════════════════════════════
// MEDIA TAB
// ════════════════════════════════════
function MediaTab({ onStartUpload }) {
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

    if (audioFile) {
      // 🚀 Pass off massive audio files into the background tracker instantly
      if (onStartUpload) onStartUpload(form, audioFile, thumbFile)
      setShowAdd(false)
      setForm({ title: '', series: '', speaker: '', date: new Date().toISOString().split('T')[0], duration: '' })
      setThumbFile(null); setAudioFile(null)
    } else {
      // Small/No-audio save
      setSaving(true)
      try {
        setProgress('Uploading thumbnail...')
        const thumbUrl = thumbFile ? await uploadFile(thumbFile, 'media', 'thumbnails') : ''
        setProgress('Saving...')
        await supabase.from('sermons').insert({ ...form, thumbnail_url: thumbUrl, audio_url: '' })
        setShowAdd(false)
        setForm({ title: '', series: '', speaker: '', date: new Date().toISOString().split('T')[0], duration: '' })
        setThumbFile(null); setAudioFile(null)
      } catch (e) {
        alert('Upload error: ' + e.message)
      }
      setSaving(false); setProgress('')
    }
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
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { if (!saving) setShowAdd(false) }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ position: 'relative', zIndex: 201, background: '#0d160d', border: '1px solid rgba(44,95,45,0.3)', borderRadius: '24px', padding: '28px', width: 'min(500px, 100%)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#fff', fontWeight: 800, margin: 0, fontSize: '18px' }}>Add Media</h3>
                <button onClick={() => { if (!saving) setShowAdd(false) }} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', width: '32px', height: '32px', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', padding: '7px' }}><X size={18} /></button>
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
          </div>
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
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [accounts, setAccounts] = useState([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [savingAccount, setSavingAccount] = useState(false)
  const [newAccount, setNewAccount] = useState({ account_name: '', account_no: '', bank_name: '', is_active: true })

  const loadLogs = () => {
    supabase.from('giving').select('*, profile:user_id(full_name)').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setLogs(data); setLoadingLogs(false) })
  }
  const loadAccounts = () => {
    supabase.from('giving_accounts').select('*').order('created_at')
      .then(({ data }) => { setAccounts(data || []); setLoadingAccounts(false) })
  }

  useEffect(() => { loadLogs(); loadAccounts() }, [])

  const addAccount = async () => {
    if (!newAccount.account_name || !newAccount.account_no || !newAccount.bank_name) {
      toast.error('Please fill in all three account fields')
      return
    }
    setSavingAccount(true)
    const { error } = await supabase.from('giving_accounts').insert({
      account_name: newAccount.account_name,
      account_no: newAccount.account_no,
      bank_name: newAccount.bank_name,
      is_active: true,
    })
    if (!error) {
      toast.success('Account added!')
      setNewAccount({ account_name: '', account_no: '', bank_name: '', is_active: true })
      loadAccounts()
    } else {
      toast.error('Error: ' + error.message)
    }
    setSavingAccount(false)
  }

  const deleteAccount = async (id) => {
    if (!confirm('Remove this account? This cannot be undone.')) return
    const { error } = await supabase.from('giving_accounts').delete().eq('id', id)
    if (!error) { toast.success('Account removed'); loadAccounts() }
    else toast.error('Delete failed: ' + error.message)
  }

  const fieldStyle = { width: '100%', background: '#070d07', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }

  return (
    <PageWrap title="Finance" subtitle="Manage church bank accounts and view giving logs">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>

        {/* ── Recent Giving Logs ── */}
        <div style={{ background: '#0d160d', borderRadius: '24px', border: '1px solid rgba(44,95,45,0.2)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(44,95,45,0.1)' }}>
            <h3 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Recent Online Giving</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Member', 'Amount', 'Category', 'Status'].map(h => (
                    <th key={h} style={{ padding: '16px 24px', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                  ))}
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
                {logs.length === 0 && !loadingLogs && (
                  <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#333' }}>No giving logs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Bank Account Manager ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Existing accounts */}
          <div style={{ background: '#0d160d', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(44,95,45,0.1)' }}>
              <p style={{ color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Active Bank Accounts</p>
            </div>
            {loadingAccounts ? (
              <div style={{ padding: '20px' }}><Skeleton count={3} height={56} /></div>
            ) : accounts.length === 0 ? (
              <p style={{ color: '#333', fontSize: '13px', padding: '20px', textAlign: 'center' }}>No accounts added yet</p>
            ) : (
              <div>
                {accounts.map(acc => (
                  <div key={acc.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.account_name}</p>
                      <p style={{ color: '#555', fontSize: '11px', margin: 0 }}>{acc.bank_name} · <strong style={{ color: '#d4af37' }}>{acc.account_no}</strong></p>
                    </div>
                    <button
                      onClick={() => deleteAccount(acc.id)}
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', padding: '7px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700 }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new account */}
          <div style={{ background: '#0d160d', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '20px', padding: '20px' }}>
            <p style={{ color: '#2C5F2D', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>+ Add Bank Account</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={labelStyle}>Account Name</label><input value={newAccount.account_name} onChange={e => setNewAccount(p => ({ ...p, account_name: e.target.value }))} placeholder="e.g. Fruitbearers Church" style={fieldStyle} /></div>
              <div><label style={labelStyle}>Account Number</label><input value={newAccount.account_no} onChange={e => setNewAccount(p => ({ ...p, account_no: e.target.value }))} placeholder="0000000000" style={fieldStyle} /></div>
              <div><label style={labelStyle}>Bank Name</label><input value={newAccount.bank_name} onChange={e => setNewAccount(p => ({ ...p, bank_name: e.target.value }))} placeholder="e.g. Access Bank" style={fieldStyle} /></div>
              <button
                onClick={addAccount}
                disabled={savingAccount}
                style={{ width: '100%', padding: '13px', borderRadius: '12px', background: '#2C5F2D', border: 'none', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: savingAccount ? 'not-allowed' : 'pointer', opacity: savingAccount ? 0.7 : 1, marginTop: '4px' }}
              >
                {savingAccount ? 'Saving...' : '+ Add Account'}
              </button>
            </div>
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
function UserProfileModal({ member: initialMember, onClose }) {
  const queryClient = useQueryClient()
  const [member, setMember] = useState(initialMember)

  const toggleRole = async () => {
    if (!confirm(`Are you sure you want to change ${member.full_name}'s role?`)) return
    const newRole = member.role === 'admin' ? 'member' : 'admin'
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', member.id)
    if (!error) {
      setMember(prev => ({ ...prev, role: newRole }))
      toast.success('Role updated')
    } else {
      toast.error('Failed to update role: ' + error.message)
    }
  }

  const handleDeleteUser = async () => {
    const confirmed = confirm(`CRITICAL: Are you sure you want to delete ${member.full_name}'s account? This will remove all their records. This cannot be undone.`)
    if (!confirmed) return

    try {
      // Delete the profile - RLS or DB trigger should handle cleanup
      const { error } = await supabase.from('profiles').delete().eq('id', member.id)
      if (error) throw error
      
      // Refresh the data!
      queryClient.invalidateQueries({ queryKey: ['admin', 'members'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })

      toast.success('Member profile deleted successfully')
      onClose()
    } catch (err) {
      toast.error('Failed to delete user: ' + err.message)
    }
  }

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
        <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
             onClick={toggleRole}
             style={{ padding: '6px 12px', borderRadius: '8px', background: member.role === 'admin' ? 'rgba(239,68,68,0.1)' : 'rgba(44,95,45,0.2)', border: `1px solid ${member.role === 'admin' ? 'rgba(239,68,68,0.3)' : 'rgba(44,95,45,0.3)'}`, color: member.role === 'admin' ? '#ef4444' : '#2C5F2D', fontSize: '11px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
          >
             {member.role === 'admin' ? 'Demote from Admin' : 'Make Admin'}
          </button>
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
           <DetailRow icon={<TrendingUp size={16} />} label="Attendance Streak" value={`🔥 ${member.attendance_streak || 0} consecutive Sundays`} />
        </div>

        <button 
           onClick={handleDeleteUser}
           style={{ width: '100%', marginTop: '20px', padding: '14px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
           onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.2)'}
           onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}
        >
           <Trash2 size={14} /> Delete Member Account
        </button>
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
      const list = (data || []).filter(m => {
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

// ════════════════════════════════════
// THEMES TAB (Curriculum Manager)
// ════════════════════════════════════
function ThemesTab() {
  const [themes, setThemes] = useState([])
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [showModModal, setShowModModal] = useState(false)
  const [showTopicModal, setShowTopicModal] = useState(false)
  const [showCoachModal, setShowCoachModal] = useState(false)

  // Forms
  const [themeForm, setThemeForm] = useState({ id: null, name: '' })
  const [modForm, setModForm] = useState({ id: null, theme_id: null, title: '', order_number: 0 })
  const [topicForm, setTopicForm] = useState({ id: null, module_id: null, title: '', order_number: 0 })
  const [coachForm, setCoachForm] = useState({ id: null, name: '' })

  // Expand toggles
  const [expandedTheme, setExpandedTheme] = useState(null)
  const [expandedMod, setExpandedMod] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data: qCoaches } = await supabase.from('coaches').select('*').order('name', { ascending: true })
    if (qCoaches) setCoaches(qCoaches)

    const { data: qThemes } = await supabase
      .from('themes')
      .select(`*, modules(*, topics(*))`)
      .order('created_at', { ascending: false })

    if (qThemes) {
      qThemes.forEach(t => {
        t.modules?.sort((a,b) => a.order_number - b.order_number)
        t.modules?.forEach(m => m.topics?.sort((a,b) => a.order_number - b.order_number))
      })
      setThemes(qThemes)
      // Auto-expand the first theme
      if (qThemes.length > 0 && !expandedTheme) setExpandedTheme(qThemes[0].id)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // --- Theme CRUD ---
  const saveTheme = async () => {
    if (!themeForm.name) return
    try {
      if (themeForm.id) {
        const { error } = await supabase.from('themes').update({ name: themeForm.name }).eq('id', themeForm.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('themes').insert({ name: themeForm.name })
        if (error) throw error
      }
      toast.success('Theme saved successfully! 🎉')
      setShowThemeModal(false)
      load()
    } catch (err) {
      toast.error('Failed to save theme: ' + err.message)
    }
  }
  const deleteTheme = async (id) => {
    if (!confirm('Delete this entire Theme and ALL its modules and topics?')) return
    try {
      const { error } = await supabase.from('themes').delete().eq('id', id)
      if (error) throw error
      toast.success('Theme deleted.')
      load()
    } catch (err) {
      toast.error('Delete failed: ' + err.message)
    }
  }

  // --- Module CRUD ---
  const saveModule = async () => {
    if (!modForm.title || !modForm.theme_id) return
    try {
      if (modForm.id) {
        const { error } = await supabase.from('modules').update({ title: modForm.title, order_number: modForm.order_number }).eq('id', modForm.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('modules').insert({ theme_id: modForm.theme_id, title: modForm.title, order_number: modForm.order_number })
        if (error) throw error
      }
      toast.success('Module saved! 📦')
      setShowModModal(false)
      load()
    } catch (err) {
      toast.error('Failed to save module: ' + err.message)
    }
  }
  const deleteModule = async (id) => {
    if (!confirm('Delete this module and ALL its topics?')) return
    try {
      const { error } = await supabase.from('modules').delete().eq('id', id)
      if (error) throw error
      toast.success('Module removed.')
      load()
    } catch (err) {
      toast.error('Delete failed: ' + err.message)
    }
  }

  // --- Topic CRUD ---
  const saveTopic = async () => {
    if (!topicForm.title || !topicForm.module_id) return
    try {
      if (topicForm.id) {
        const { error } = await supabase.from('topics').update({ title: topicForm.title, order_number: topicForm.order_number }).eq('id', topicForm.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('topics').insert({ module_id: topicForm.module_id, title: topicForm.title, order_number: topicForm.order_number })
        if (error) throw error
      }
      toast.success('Topic saved! 📚')
      setShowTopicModal(false)
      load()
    } catch (err) {
      toast.error('Failed to save topic: ' + err.message)
    }
  }

  // --- Coach CRUD ---
  const saveCoach = async () => {
    if (!coachForm.name) return
    try {
      if (coachForm.id) {
        const { error } = await supabase.from('coaches').update({ name: coachForm.name }).eq('id', coachForm.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('coaches').insert({ name: coachForm.name })
        if (error) throw error
      }
      toast.success(`Coach "${coachForm.name}" added! 👨‍🏫`)
      setCoachForm({ id: null, name: '' })
      load()
    } catch (err) {
      toast.error('Failed to save coach: ' + err.message)
    }
  }
  const deleteCoach = async (id) => {
    if (!confirm('Delete this coach completely?')) return
    try {
      const { error } = await supabase.from('coaches').delete().eq('id', id)
      if (error) throw error
      toast.success('Coach removed.')
      load()
    } catch (err) {
      toast.error('Delete failed: ' + err.message)
    }
  }
  const deleteTopic = async (id) => {
    if (!confirm('Delete this topic?')) return
    await supabase.from('topics').delete().eq('id', id)
    load()
  }

  // --- Builders ---
  const newModuleForTheme = (themeId) => {
    setModForm({ id: null, theme_id: themeId, title: '', order_number: 0 })
    setShowModModal(true)
  }
  const newTopicForModule = (moduleId) => {
    setTopicForm({ id: null, module_id: moduleId, title: '', order_number: 0 })
    setShowTopicModal(true)
  }

  const inputStyle = { width: '100%', background: '#070d07', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', color: '#555', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }

  return (
    <PageWrap 
      title="Curriculum" 
      subtitle="Manage Themes, Modules, and Topics"
      action={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowCoachModal(true)} style={{ padding: '10px 16px', borderRadius: '12px', background: 'transparent', color: '#888', fontWeight: 700, fontSize: '13px', border: '1px solid #333', cursor: 'pointer' }}>
            Manage Coaches
          </button>
          <button onClick={() => { setThemeForm({ id: null, name: '' }); setShowThemeModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 16px', borderRadius: '12px', background: '#2C5F2D', color: '#fff', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
            <Plus size={16} /> New Theme
          </button>
        </div>
      }
    >
      {/* ── COACHES PANEL (always visible) ── */}
      <div style={{ background: '#0d160d', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '20px', padding: '20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <p style={{ color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>👨‍🏫 Coaches</p>
          <p style={{ color: '#444', fontSize: '11px', margin: 0 }}>{coaches.length} coach{coaches.length !== 1 ? 'es' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <input
            value={coachForm.name}
            onChange={e => setCoachForm({ ...coachForm, name: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && saveCoach()}
            placeholder="Add a coach name..."
            style={{ flex: 1, background: '#070d07', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
          />
          <button onClick={saveCoach} style={{ padding: '10px 18px', borderRadius: '10px', background: '#2C5F2D', color: '#fff', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
            + Add Coach
          </button>
        </div>
        {coaches.length === 0 ? (
          <p style={{ color: '#333', fontSize: '13px', textAlign: 'center', padding: '8px' }}>No coaches added yet. Add your first one above! ☝️</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {coaches.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1a2e10', border: '1px solid rgba(44,95,45,0.25)', borderRadius: '100px', padding: '6px 12px 6px 10px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#2C5F2D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 800 }}>{c.name.charAt(0)}</span>
                </div>
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{c.name}</span>
                <button onClick={() => deleteCoach(c.id)} style={{ background: 'transparent', border: 'none', color: '#ef444488', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── THEMES LIST ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {themes.map(theme => (
          <div key={theme.id} style={{ background: '#080c08', border: '1px solid rgba(44,95,45,0.4)', borderRadius: '20px', overflow: 'hidden' }}>
            {/* THEME HEADER */}
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d160d', borderBottom: '1px solid rgba(44,95,45,0.1)' }}>
              <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpandedTheme(expandedTheme === theme.id ? null : theme.id)}>
                <p style={{ color: '#4ade80', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Theme</p>
                <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 800, margin: '0 0 6px' }}>{theme.name}</h2>
                <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>{theme.modules?.length || 0} Modules</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setThemeForm(theme); setShowThemeModal(true) }} style={{ padding: '8px 12px', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => deleteTheme(theme.id)} style={{ padding: '8px 12px', borderRadius: '8px', background: '#2e1a1a', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>

            {/* THEME BODY (MODULES) */}
            {expandedTheme === theme.id && (
              <div style={{ padding: '20px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ color: '#888', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Modules</h4>
                    <button onClick={() => newModuleForTheme(theme.id)} style={{ padding: '8px 14px', borderRadius: '8px', background: '#1a2e10', color: '#4ade80', fontSize: '12px', fontWeight: 700, border: '1px solid #2C5F2D', cursor: 'pointer' }}>+ Add Module</button>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   {theme.modules?.length === 0 ? <p style={{ color: '#555', fontSize: '13px' }}>No modules built yet.</p> : null}
                   
                   {theme.modules?.map(mod => (
                     <div key={mod.id} style={{ background: '#111', border: '1px solid #222', borderRadius: '16px', overflow: 'hidden' }}>
                        {/* MODULE HEADER */}
                        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#151515' }}>
                           <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpandedMod(expandedMod === mod.id ? null : mod.id)}>
                              <p style={{ color: '#d4af37', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Mod {mod.order_number}</p>
                              <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 4px' }}>{mod.title}</h4>
                           </div>
                           <div style={{ display: 'flex', gap: '8px' }}>
                             <button onClick={() => { setModForm(mod); setShowModModal(true) }} style={{ padding: '6px 10px', borderRadius: '6px', background: '#222', border: 'none', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                             <button onClick={() => deleteModule(mod.id)} style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}>Del</button>
                           </div>
                        </div>

                        {/* MODULE BODY (TOPICS) */}
                        {expandedMod === mod.id && (
                           <div style={{ padding: '16px 20px', borderTop: '1px solid #222' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                 <h5 style={{ color: '#666', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>Topics</h5>
                                 <button onClick={() => newTopicForModule(mod.id)} style={{ padding: '4px 10px', borderRadius: '6px', background: '#222', color: '#aaa', fontSize: '11px', fontWeight: 700, border: '1px solid #333', cursor: 'pointer' }}>+ Add Topic</button>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                 {mod.topics?.length === 0 ? <p style={{ color: '#444', fontSize: '12px', margin: 0 }}>No topics yet.</p> : null}
                                 {mod.topics?.map(topic => (
                                    <div key={topic.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#1a1a1a', borderRadius: '10px', border: '1px solid #252525' }}>
                                       <div>
                                         <p style={{ color: '#999', fontSize: '10px', fontWeight: 700, marginBottom: '2px' }}>Topic {topic.order_number}</p>
                                         <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>{topic.title}</p>
                                       </div>
                                       <div style={{ display: 'flex', gap: '6px' }}>
                                         <button onClick={() => { setTopicForm(topic); setShowTopicModal(true) }} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}><Edit3 size={14}/></button>
                                         <button onClick={() => deleteTopic(topic.id)} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14}/></button>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </div>
        ))}
        {themes.length === 0 && !loading && <p style={{ color: '#555', textAlign: 'center', marginTop: '40px' }}>No curriculum themes built yet.</p>}
      </div>

      {/* THEME MODAL */}
      <AnimatePresence>
        {showThemeModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowThemeModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ position: 'relative', width: '90%', maxWidth: '400px', background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #222' }}>
              <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 20px' }}>{themeForm.id ? 'Edit Theme' : 'New Theme'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div><label style={labelStyle}>Theme Name</label><input value={themeForm.name} onChange={e => setThemeForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} /></div>
                <button onClick={saveTheme} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#2C5F2D', color: '#fff', fontWeight: 700, border: 'none', marginTop: '8px', cursor: 'pointer' }}>Save Theme</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODULE MODAL */}
      <AnimatePresence>
        {showModModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ position: 'relative', width: '90%', maxWidth: '400px', background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #222' }}>
              <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 20px' }}>{modForm.id ? 'Edit Module' : 'New Module'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div><label style={labelStyle}>Title</label><input value={modForm.title} onChange={e => setModForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Order Number</label><input type="number" value={modForm.order_number} onChange={e => setModForm(p => ({ ...p, order_number: parseInt(e.target.value)||0 }))} style={inputStyle} /></div>
                <button onClick={saveModule} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#2C5F2D', color: '#fff', fontWeight: 700, border: 'none', marginTop: '8px', cursor: 'pointer' }}>Save Module</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOPIC MODAL */}
      <AnimatePresence>
        {showTopicModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTopicModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ position: 'relative', width: '90%', maxWidth: '400px', background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #222' }}>
              <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 20px' }}>{topicForm.id ? 'Edit Topic' : 'New Topic'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div><label style={labelStyle}>Topic Title</label><input value={topicForm.title} onChange={e => setTopicForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Order Number</label><input type="number" value={topicForm.order_number} onChange={e => setTopicForm(p => ({ ...p, order_number: parseInt(e.target.value)||0 }))} style={inputStyle} /></div>
                <button onClick={saveTopic} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#2C5F2D', color: '#fff', fontWeight: 700, border: 'none', marginTop: '8px', cursor: 'pointer' }}>Save Topic</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COACH MODAL */}
      <AnimatePresence>
         {showCoachModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCoachModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ position: 'relative', width: '90%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto', background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #222' }}>
               <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 20px' }}>Global Coaches</h3>
               
               <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <input value={coachForm.name} onChange={e => setCoachForm({ ...coachForm, name: e.target.value })} placeholder="New coach name..." style={{ flex: 1, ...inputStyle }} />
                  <button onClick={saveCoach} style={{ padding: '0 16px', borderRadius: '10px', background: '#2C5F2D', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Add</button>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {coaches.map(c => (
                     <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
                        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>{c.name}</p>
                        <button onClick={() => deleteCoach(c.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '4px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                     </div>
                  ))}
                  {coaches.length === 0 && <p style={{ color: '#555', fontSize: '13px', textAlign: 'center' }}>No coaches added.</p>}
               </div>
            </motion.div>
          </div>
         )}
      </AnimatePresence>
    </PageWrap>
  )
}

// ════════════════════════════════════
// SOCIALS TAB
// ════════════════════════════════════
const SOCIAL_PLATFORMS = [
  { id: 'YouTube',   emoji: '▶️',  hint: 'YouTube channel or Live link' },
  { id: 'Instagram', emoji: '📸',  hint: 'Instagram page link' },
  { id: 'Facebook',  emoji: '👥',  hint: 'Facebook page or group link' },
  { id: 'WhatsApp',  emoji: '💬',  hint: 'WhatsApp group or chat link' },
  { id: 'TikTok',    emoji: '🎵',  hint: 'TikTok page link' },
  { id: 'Twitter',   emoji: '🐦',  hint: 'Twitter / X profile link' },
  { id: 'Telegram',  emoji: '✈️',  hint: 'Telegram group or channel link' },
  { id: 'Website',   emoji: '🌐',  hint: 'Main website or streaming link' },
]

function SocialsTab() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(() => {
    const init = {}
    SOCIAL_PLATFORMS.forEach(p => { init[p.id] = { url: '', is_active: false } })
    return init
  })
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  // Prayer link state
  const [prayerLink, setPrayerLink] = useState('')
  const [savingPrayer, setSavingPrayer] = useState(false)
  const [prayerSaved, setPrayerSaved] = useState(false)

  useEffect(() => {
    supabase.from('church_socials').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        setForm(prev => {
          const next = { ...prev }
          data.forEach(s => { next[s.platform] = { url: s.url || '', is_active: s.is_active || false } })
          return next
        })
      }
      setLoaded(true)
    })
    // Load prayer link
    supabase.from('app_settings').select('value').eq('key', 'prayer_link').single()
      .then(({ data }) => { if (data?.value) setPrayerLink(data.value) })
  }, [])

  const savePrayerLink = async () => {
    setSavingPrayer(true)
    await supabase.from('app_settings').upsert({ key: 'prayer_link', value: prayerLink })
    setSavingPrayer(false)
    setPrayerSaved(true)
    setTimeout(() => setPrayerSaved(false), 3000)
  }

  const handleUpdate = (platform, field, value) => {
    setForm(prev => ({ ...prev, [platform]: { ...prev[platform], [field]: value } }))
  }

  const saveSocials = async () => {
    setSaving(true)
    try {
      const updates = SOCIAL_PLATFORMS.map(p => ({
        platform: p.id,
        url: form[p.id]?.url || '',
        is_active: form[p.id]?.is_active || false,
        order_number: SOCIAL_PLATFORMS.findIndex(x => x.id === p.id),
      }))
      const { error } = await supabase.from('church_socials').upsert(updates, { onConflict: 'platform' })
      if (error) throw error
      queryClient.invalidateQueries(['admin', 'socials'])
      queryClient.invalidateQueries(['church_socials'])
      toast.success('Socials updated! Members will see active links in the app. 🎉')
    } catch (err) {
      toast.error('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageWrap
      title="Church Socials"
      subtitle="Set links for each platform — only active ones with a URL show in the member app"
      action={
        <button
          onClick={saveSocials}
          disabled={saving || !loaded}
          style={{ padding: '10px 24px', borderRadius: '12px', background: '#2C5F2D', border: 'none', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {saving ? 'Saving...' : '💾 Save Settings'}
        </button>
      }
    >
      {!loaded ? (
        <Skeleton count={8} height={100} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {SOCIAL_PLATFORMS.map(platform => {
            const val = form[platform.id]
            const hasUrl = !!val?.url?.trim()
            return (
              <div key={platform.id} style={{ background: '#0d160d', border: `1px solid ${val?.is_active && hasUrl ? 'rgba(44,95,45,0.5)' : 'rgba(44,95,45,0.15)'}`, borderRadius: '16px', padding: '20px', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>{platform.emoji}</span>
                    <p style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: 0 }}>{platform.id}</p>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <span style={{ color: val?.is_active ? '#2C5F2D' : '#444', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                      {val?.is_active ? 'Active' : 'Off'}
                    </span>
                    <div
                      onClick={() => handleUpdate(platform.id, 'is_active', !val?.is_active)}
                      style={{ width: '36px', height: '20px', borderRadius: '10px', background: val?.is_active ? '#2C5F2D' : '#333', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}
                    >
                      <div style={{ position: 'absolute', top: '2px', left: val?.is_active ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </div>
                  </label>
                </div>
                <input
                  type="url"
                  placeholder={platform.hint}
                  value={val?.url || ''}
                  onChange={e => handleUpdate(platform.id, 'url', e.target.value)}
                  style={{ width: '100%', background: '#070d07', border: '1px solid rgba(44,95,45,0.15)', borderRadius: '10px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
                {val?.is_active && !hasUrl && (
                  <p style={{ color: '#d4af37', fontSize: '11px', marginTop: '6px', margin: '6px 0 0' }}>⚠️ Add a URL to make this visible to members</p>
                )}
                {val?.is_active && hasUrl && (
                  <p style={{ color: '#2C5F2D', fontSize: '11px', marginTop: '6px', margin: '6px 0 0' }}>✅ Showing in member app</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── ASK FOR PRAYER LINK ── */}
      <div style={{ marginTop: '32px', background: '#0d160d', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '20px', padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(44,95,45,0.12)', border: '1px solid rgba(44,95,45,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '22px' }}>🤲</span>
          </div>
          <div>
            <p style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 3px' }}>Ask for Prayer</p>
            <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>When members tap the "Ask for Prayer" card on their home screen, they are sent to this link</p>
          </div>
        </div>
        <p style={{ color: '#444', fontSize: '12px', lineHeight: 1.5, marginBottom: '14px' }}>
          This can be a WhatsApp link (<code style={{ color: '#2C5F2D', background: 'rgba(44,95,45,0.1)', padding: '1px 6px', borderRadius: '4px' }}>https://wa.me/234...</code>),
          a Google Form, Typeform, or any URL you want.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="url"
            value={prayerLink}
            onChange={e => setPrayerLink(e.target.value)}
            placeholder="https://wa.me/2348000000000"
            style={{ flex: 1, background: '#070d07', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '10px', padding: '12px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
          />
          <button
            onClick={savePrayerLink}
            disabled={savingPrayer || !prayerLink.trim()}
            style={{ padding: '12px 20px', borderRadius: '10px', background: prayerSaved ? '#1a2e1a' : '#2C5F2D', border: 'none', color: prayerSaved ? '#2C5F2D' : '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', transition: 'all 0.2s' }}
          >
            {savingPrayer ? 'Saving...' : prayerSaved ? '✅ Saved!' : 'Save Link'}
          </button>
        </div>
        {prayerLink && (
          <p style={{ color: '#2C5F2D', fontSize: '11px', marginTop: '10px', margin: '10px 0 0' }}>✅ Prayer card is active — members will be directed to this link</p>
        )}
      </div>
    </PageWrap>
  )
}

