import { NavLink, useLocation } from 'react-router-dom'
import { Home, Tv2, Wallet, User, BookOpen } from 'lucide-react'
import { useAudio } from '../contexts/AudioContext'
import { motion, AnimatePresence } from 'framer-motion'
import SermonPlayer from '../pages/SermonPlayer'

// Pages that should NOT show the app shell (bottom nav / mobile layout)
const AUTH_PAGES = ['/', '/login', '/signup', '/unauthorized', '/admin-portal', '/admin', '/dashboard']


export default function Layout({ children }) {
  const location = useLocation()
  const isAuth = AUTH_PAGES.includes(location.pathname)

  if (isAuth) return <>{children}</>

  return (
    <div style={{ background: '#0e0e0e', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Main scrollable content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: '80px',
          WebkitOverflowScrolling: 'touch',
        }}
        className="no-scrollbar"
      >
        {children}
      </main>

      {/* Full-screen Sermon Player (renders on top when active) */}
      <SermonPlayer />

      {/* Mini Audio Player (sits above bottom nav like CCI) */}
      <MiniPlayer />

      {/* Bottom Navigation - exact CCI 4-tab layout */}
      <BottomNav />
    </div>
  )
}

// ── MINI PLAYER (exact CCI style: thumbnail left, title+subtitle, play button, X) ──
function MiniPlayer() {
  const { currentSermon, isPlaying, togglePlay, setCurrentSermon, setShowFullPlayer, progress, duration } = useAudio()

  if (!currentSermon) return null

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '64px', // sits just above bottom nav
        left: '12px',
        right: '12px',
        zIndex: 80,
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#1c1c1c',
        border: '1px solid #2a2a2a',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.6)',
      }}
    >
      {/* Progress bar at very top */}
      <div style={{ height: '2px', background: '#2a2a2a' }}>
        <div style={{ height: '100%', width: `${progressPct}%`, background: '#2C5F2D', transition: 'width 1s linear' }} />
      </div>

      <div
        style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: '12px', cursor: 'pointer' }}
        onClick={() => setShowFullPlayer(true)}
      >
        {/* Thumbnail */}
        <div style={{ width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: '#2a2a2a' }}>
          {currentSermon.thumbnail_url ? (
            <img src={currentSermon.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#2C5F2D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.png" alt="" style={{ width: '28px', height: '28px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            </div>
          )}
        </div>

        {/* Title + duration + date */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentSermon.title}
          </p>
          <p style={{ color: '#666', fontSize: '11px', margin: 0, marginTop: '2px' }}>
            {currentSermon.duration || '00:00'} • {currentSermon.date || ''}
          </p>
        </div>

        {/* Play/Pause button */}
        <button
          onClick={e => { e.stopPropagation(); togglePlay() }}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
          }}
        >
          {isPlaying ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
          )}
        </button>

        {/* X close */}
        <button
          onClick={e => { e.stopPropagation(); setCurrentSermon(null) }}
          style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#555', flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  )
}

// ── BOTTOM NAV (exact CCI 5-tab: Home, Media, Giving, Lessons, Account) ──
function BottomNav() {
  const tabs = [
    { to: '/home',    icon: Home,     label: 'Home'    },
    { to: '/media',   icon: Tv2,      label: 'Media'   },
    { to: '/giving',  icon: Wallet,   label: 'Giving'  },
    { to: '/topics',  icon: BookOpen, label: 'Academy' },
    { to: '/account', icon: User,     label: 'Account' },
  ]

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: '64px',
        background: '#111',
        borderTop: '1px solid #222',
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} style={{ flex: 1 }}>
          {({ isActive }) => (
            <div
              style={{
                height: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '3px',
                color: isActive ? '#2C5F2D' : '#555',
                transition: 'color 0.15s',
              }}
            >
              {/* CCI uses a filled icon container for active */}
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(44,95,45,0.12)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: isActive ? 700 : 500, letterSpacing: '0.02em' }}>
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
