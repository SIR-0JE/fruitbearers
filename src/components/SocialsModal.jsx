import { motion, AnimatePresence } from 'framer-motion'
import { X, Youtube, Instagram, Facebook, Globe, MessageCircle, Send } from 'lucide-react'
import { FaTiktok, FaTwitter, FaWhatsapp, FaTelegramPlane } from 'react-icons/fa'

const PLATFORM_ICONS = {
  YouTube: { icon: Youtube, color: '#FF0000', label: 'Watch' },
  Instagram: { icon: Instagram, color: '#E4405F', label: 'Follow' },
  Facebook: { icon: Facebook, color: '#1877F2', label: 'Connect' },
  TikTok: { icon: FaTiktok, color: '#000000', label: 'Watch' },
  Twitter: { icon: FaTwitter, color: '#1DA1F2', label: 'Follow' },
  WhatsApp: { icon: FaWhatsapp, color: '#25D366', label: 'Join' },
  Telegram: { icon: FaTelegramPlane, color: '#0088cc', label: 'Join' },
  Website: { icon: Globe, color: '#2C5F2D', label: 'Visit' },
}

export default function SocialsModal({ isOpen, onClose, socials = [] }) {
  const activeSocials = socials.filter(s => s.is_active && s.url)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
            {/* Handle */}
            <div style={{ width: '40px', height: '4px', background: '#333', borderRadius: '2px', margin: '0 auto 20px' }} />

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {activeSocials.length > 0 ? (
                activeSocials.sort((a, b) => (a.order_number || 0) - (b.order_number || 0)).map(social => {
                  const config = PLATFORM_ICONS[social.platform] || { icon: Globe, color: '#fff', label: 'Open' }
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
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
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
                          color: config.color,
                        }}
                      >
                        <Icon size={28} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: '0 0 2px' }}>{social.platform}</p>
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
