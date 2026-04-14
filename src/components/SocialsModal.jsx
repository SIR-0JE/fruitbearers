import { motion, AnimatePresence } from 'framer-motion'
import { X, Globe } from 'lucide-react'

// ── Inline brand SVGs (lucide-react has no social brand icons) ──────────────

const YouTubeIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF0000">
    <path d="M23 7s-.3-2-1.2-2.7c-1.1-1.2-2.4-1.2-3-1.3C16.4 3 12 3 12 3s-4.4 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.2.7 11.4v2.1c0 2.2.3 4.4.3 4.4s.3 2 1.2 2.7c1.1 1.2 2.6 1.1 3.3 1.2C7.3 22 12 22 12 22s4.4 0 6.8-.3c.6-.1 1.9-.1 3-1.3.9-.7 1.2-2.7 1.2-2.7s.3-2.2.3-4.4v-2.1C23.3 9.2 23 7 23 7zm-13.5 9V8.5l8 3.8-8 3.7z" />
  </svg>
)

const InstagramIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F58529" />
        <stop offset="50%" stopColor="#DD2A7B" />
        <stop offset="100%" stopColor="#8134AF" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#igGrad)" />
    <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="2" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
  </svg>
)

const FacebookIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12C24 5.4 18.6 0 12 0S0 5.4 0 12c0 6 4.4 10.9 10.1 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.8v8.4C19.6 22.9 24 18 24 12z" />
  </svg>
)

const WhatsAppIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 2.1.5 4.1 1.5 5.9L0 24l6.3-1.5C8.1 23.5 10 24 12 24c6.6 0 12-5.4 12-12S18.6 0 12 0zm6.5 16.9c-.3.8-1.5 1.5-2.1 1.6-.5.1-1.2.1-1.9-.1-.4-.2-1-.4-1.7-.7-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.2.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.5.5c-.1.1-.2.3-.1.5.4.6.9 1.3 1.5 1.8.7.6 1.4 1 1.9 1.2.2.1.4 0 .5-.1l.8-1c.2-.2.4-.3.6-.2l2 .9c.2.1.4.2.4.5v.8z" />
  </svg>
)

const TwitterXIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.3 5.7L13.1 11l6.4 8.3h-4.5l-3.7-4.9L6.5 19.3H3.7l5.6-5.6L3 5.7h4.6l3.5 4.5 4.9-4.5h2.3zm-1 .9h-1.4L7.1 18.4h1.4l9-11.8z" />
  </svg>
)

const TikTokIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.6 3.3A4.5 4.5 0 0 1 15.1 0h-3v15.9c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5 1.1-2.5 2.5-2.5c.3 0 .5 0 .7.1v-3.1c-.2 0-.5-.1-.7-.1-3 0-5.5 2.5-5.5 5.5S6.6 21.3 9.6 21.3s5.5-2.5 5.5-5.5V8.1c1.2.9 2.7 1.4 4.2 1.4V6.4c-.8 0-1.5-.2-2.8-.7l3.1-.4z" />
  </svg>
)

const TelegramIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#0088cc">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.9 8.2-2 9.4c-.1.7-.6.9-1.1.5l-3-2.3-1.5 1.4c-.2.2-.3.3-.6.3l.2-3.1 5.3-4.8c.2-.2 0-.3-.3-.1l-6.5 4.1-2.8-.9c-.6-.2-.6-.6.2-1l10.9-4.2c.7-.3 1.4.2 1.2 1.7z" />
  </svg>
)

const GlobeIcon = ({ size = 28 }) => (
  <Globe size={size} />
)

// ── Platform config ──────────────────────────────────────────────────────────

const PLATFORM_ICONS = {
  YouTube:   { icon: YouTubeIcon,   color: '#FF0000', label: 'Watch' },
  Instagram: { icon: InstagramIcon, color: '#E4405F', label: 'Follow' },
  Facebook:  { icon: FacebookIcon,  color: '#1877F2', label: 'Connect' },
  WhatsApp:  { icon: WhatsAppIcon,  color: '#25D366', label: 'Join' },
  Twitter:   { icon: TwitterXIcon,  color: '#000000', label: 'Follow' },
  TikTok:    { icon: TikTokIcon,    color: '#000000', label: 'Watch' },
  Telegram:  { icon: TelegramIcon,  color: '#0088cc', label: 'Join' },
  Website:   { icon: GlobeIcon,     color: '#2C5F2D', label: 'Visit' },
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SocialsModal({ isOpen, onClose, socials = [] }) {
  const activeSocials = socials.filter(s => s.is_active && s.url)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#161616',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '20px 20px 40px',
              zIndex: 1001,
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            {/* Drag handle */}
            <div style={{ width: '40px', height: '4px', background: '#333', borderRadius: '2px', margin: '0 auto 20px' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>Join Us Online</h2>
                <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>Connect with us on any of our platforms</p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Platform grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {activeSocials.length > 0 ? (
                activeSocials
                  .sort((a, b) => (a.order_number || 0) - (b.order_number || 0))
                  .map(social => {
                    const config = PLATFORM_ICONS[social.platform] || { icon: GlobeIcon, color: '#fff', label: 'Open' }
                    const Icon = config.icon

                    return (
                      <a
                        key={social.platform}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#1e1e1e',
                          borderRadius: '20px',
                          padding: '24px 16px',
                          textDecoration: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '12px',
                          border: '1px solid rgba(255,255,255,0.05)',
                          transition: 'transform 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        <div
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: `${config.color}22`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon size={28} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: '0 0 2px' }}>
                            {social.platform}
                          </p>
                          <p style={{ color: config.color, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                            {config.label}
                          </p>
                        </div>
                      </a>
                    )
                  })
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: '0 0 8px' }}>Our online links are coming soon.</p>
                  <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>Check back later!</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
