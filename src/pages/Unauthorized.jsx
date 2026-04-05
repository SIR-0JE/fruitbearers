import { Link } from 'react-router-dom'
import { ShieldX, ArrowLeft } from 'lucide-react'

export default function Unauthorized() {
  return (
    <div
      className="bg-gradient-radial"
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
    >
      <div className="glass animate-fade-up" style={{ maxWidth: 420, width: '100%', padding: '3rem 2rem', textAlign: 'center' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <ShieldX size={32} color="#f87171" />
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: '0 0 0.75rem' }}>
          Access Denied
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 2rem' }}>
          You don't have permission to view this page. Admin access is required.
        </p>
        <Link to="/history" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
          <ArrowLeft size={16} />
          Go to My Attendance
        </Link>
      </div>
    </div>
  )
}
