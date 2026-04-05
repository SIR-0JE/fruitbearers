import { Link, useNavigate } from 'react-router-dom'
import { LogOut, LayoutDashboard, History, Church } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  return (
    <nav
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '0.75rem',
              background: 'var(--green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(44,95,45,0.15)',
            }}
          >
            <Church size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: 'var(--navy)', fontFamily: "'Playfair Display', serif", lineHeight: 1.1 }}>
              Fruitbearers
            </p>
            <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Attendance
            </p>
          </div>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {profile?.role === 'admin' && (
            <Link to="/admin" className="btn-ghost" style={{ textDecoration: 'none', fontWeight: 600 }}>
              <LayoutDashboard size={16} color="var(--navy)" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          {profile && (
            <Link to="/history" className="btn-ghost" style={{ textDecoration: 'none', fontWeight: 600 }}>
              <History size={16} color="var(--navy)" />
              <span className="hidden sm:inline">My Activity</span>
            </Link>
          )}
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginLeft: '0.5rem' }}>
              <Link 
                to="/profile"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#fff',
                  border: '2px solid #fff',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  flexShrink: 0,
                  textDecoration: 'none',
                  transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                title="Edit Profile"
              >
                {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </Link>
              <button className="btn-ghost" onClick={handleSignOut} style={{ padding: '0.55rem 1rem', background: '#f8f9fa', borderColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
