import { motion } from 'framer-motion'
import { useAudio } from '../contexts/AudioContext'
import { ChevronDown, Rewind, FastForward, SkipBack, SkipForward } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'

export default function SermonPlayer() {
  const { 
    currentSermon, isPlaying, togglePlay, seekTo, progress, duration, 
    showFullPlayer, setShowFullPlayer, playbackRate, changeRate,
    resumeAvailable, setResumeAvailable
  } = useAudio()

  if (!currentSermon) return null

  const fmt = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec < 10 ? '0' : ''}${sec}`
  }

  const pct = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <AnimatePresence>
      {showFullPlayer && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={{
            position: 'fixed', inset: 0, background: '#0e0e0e', zIndex: 300,
            display: 'flex', flexDirection: 'column', padding: '0',
          }}
        >
          {/* Background artwork blur */}
          {currentSermon.thumbnail_url && (
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
              <img
                src={currentSermon.thumbnail_url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px) brightness(0.3) saturate(0.5)', transform: 'scale(1.1)' }}
              />
            </div>
          )}

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: '52px 24px 32px' }}>
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
              <button
                onClick={() => setShowFullPlayer(false)}
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronDown size={24} color="#fff" />
              </button>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>Now Playing</p>
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, margin: '3px 0 0' }}>{currentSermon.series || 'Sermon'}</p>
              </div>
              <button 
                onClick={() => {
                   const rates = [1.0, 1.5, 2.0]
                   const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length]
                   changeRate(next)
                }}
                style={{ width: '40px', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
              >
                {playbackRate}x
              </button>
            </div>

            {/* Artwork */}
            <div style={{
              width: '100%', aspectRatio: '1/1', borderRadius: '24px', overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)', marginBottom: '36px',
              background: '#1a1a1a', flexShrink: 0,
            }}>
              {currentSermon.thumbnail_url ? (
                <img src={currentSermon.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2C5F2D' }}>
                   <img src="/logo.png" alt="" style={{ width: '60%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                </div>
              )}
            </div>

            {/* Title & actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentSermon.title}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>{currentSermon.speaker || 'Fruitbearers Church'}</p>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                </button>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '8px' }}>
              <div
                style={{ height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px', cursor: 'pointer', position: 'relative' }}
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const pct = (e.clientX - rect.left) / rect.width
                  seekTo(pct * duration)
                }}
              >
                <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: '4px', position: 'relative' }}>
                  <div style={{ position: 'absolute', right: '-6px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '12px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px rgba(0,0,0,0.4)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600 }}>{fmt(progress)}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600 }}>{fmt(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><SkipBack size={28} /></button>
              <button onClick={() => seekTo(Math.max(0, progress - 15))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}><Rewind size={28} /></button>
              <button onClick={togglePlay} style={{ width: '74px', height: '74px', borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                {isPlaying ? <svg width="28" height="28" viewBox="0 0 24 24" fill="#111"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg> : <svg width="28" height="28" viewBox="0 0 24 24" fill="#111"><polygon points="6,3 20,12 6,21"/></svg>}
              </button>
              <button onClick={() => seekTo(Math.min(duration, progress + 15))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}><FastForward size={28} /></button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><SkipForward size={28} /></button>
            </div>

            {/* Resume Toast */}
            {resumeAvailable && (
               <div style={{ position: 'absolute', bottom: '150px', left: '24px', right: '24px' }}>
                 <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.1)' }}>
                   <p style={{ color: '#fff', fontSize: '12px', margin: 0 }}>Resuming from <strong>{fmt(resumeAvailable)}</strong></p>
                   <button onClick={() => { seekTo(0); setResumeAvailable(null) }} style={{ color: '#fff', fontSize: '12px', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}>Start over</button>
                 </motion.div>
               </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
