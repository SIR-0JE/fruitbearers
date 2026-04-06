import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAudio } from '../contexts/AudioContext'
import { Bookmark, X, Play } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

const FILTERS = ['All', 'Sermons', 'Photos']

const TOPICS = [
  { label: 'New Life',  bg: 'linear-gradient(135deg, #1a7a4a 0%, #2C5F2D 100%)' },
  { label: 'Grace',     bg: 'linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)' },
  { label: 'Hope',      bg: 'linear-gradient(135deg, #2980b9 0%, #1a5276 100%)' },
  { label: 'The Cross', bg: 'linear-gradient(135deg, #1a7a4a 0%, #148a6c 100%)' },
  { label: 'Faith',     bg: 'linear-gradient(135deg, #7d3c98 0%, #5b2c6f 100%)' },
  { label: 'Family',    bg: 'linear-gradient(135deg, #e67e22 0%, #ca6f1e 100%)' },
]

export default function MediaScreen() {
  const { playSermon, currentSermon, isPlaying } = useAudio()
  const [sermons, setSermons]         = useState([])
  const [photos, setPhotos]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('All')
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null)

  useEffect(() => {
    const load = () => {
      Promise.all([
        supabase.from('sermons').select('*').order('date', { ascending: false }),
        supabase.from('media_gallery').select('*').order('created_at', { ascending: false }),
      ]).then(([{ data: s }, { data: p }]) => {
        setSermons(s || [])
        setPhotos(p || [])
        setLoading(false)
      })
    }

    load()

    // 🔴 Real-time: when admin adds/deletes a sermon or photo, users see it instantly
    const channel = supabase
      .channel('media-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sermons' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media_gallery' }, load)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const showSermons = filter === 'All' || filter === 'Sermons'
  const showPhotos  = filter === 'All' || filter === 'Photos'

  return (
    <div style={{ background: '#0e0e0e', minHeight: '100%', paddingTop: '52px' }}>

      {/* ── FILTER PILLS ── */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 16px 20px', overflowX: 'auto', position: 'sticky', top: 0, background: '#0e0e0e', zIndex: 10, paddingTop: '4px' }} className="no-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: '100px', flexShrink: 0,
              background: filter === f ? '#2C5F2D' : '#1a1a1a',
              border: `1px solid ${filter === f ? '#2C5F2D' : '#252525'}`,
              color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── SERMON CARDS (horizontal scroll) ── */}
      {showSermons && sermons.length > 0 && (
        <>
          <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Sermons</p>
          </div>
          <div style={{ display: 'flex', gap: '14px', padding: '0 16px 28px', overflowX: 'auto', scrollSnapType: 'x mandatory' }} className="no-scrollbar">
            {loading
              ? [1, 2].map(i => <div key={i} style={{ minWidth: '280px', aspectRatio: '3/4', borderRadius: '20px', background: '#1a1a1a', flexShrink: 0 }} className="skeleton" />)
              : sermons.map(s => (
                  <div
                    key={s.id}
                    onClick={() => playSermon(s)}
                    style={{ minWidth: '280px', borderRadius: '20px', overflow: 'hidden', position: 'relative', flexShrink: 0, cursor: 'pointer', scrollSnapAlign: 'start', background: '#1a1a1a', aspectRatio: '3/4' }}
                  >
                    <img src={s.thumbnail_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    {/* Play overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                    <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px' }}>
                      <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 4px', lineHeight: 1.3 }}>{s.title}</p>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: 0 }}>{s.speaker || s.series} · {s.duration}</p>
                    </div>
                    {/* Green play button */}
                    <div style={{ position: 'absolute', top: '12px', right: '12px', width: '36px', height: '36px', borderRadius: '50%', background: currentSermon?.id === s.id ? '#2C5F2D' : 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={14} fill="white" color="white" style={{ marginLeft: '2px' }} />
                    </div>
                    {s.duration && (
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '3px 8px', color: '#fff', fontSize: '11px', fontWeight: 600 }}>
                        {s.duration}
                      </div>
                    )}
                    {currentSermon?.id === s.id && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#2C5F2D' }} />
                    )}
                  </div>
                ))
            }
          </div>
        </>
      )}

      {/* ── PHOTOS GALLERY ── */}
      {showPhotos && photos.length > 0 && (
        <div style={{ padding: '0 16px 28px' }}>
          <p style={{ color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px', margin: '0 0 14px' }}>Photo Gallery</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
            {photos.map(p => (
              <div
                key={p.id}
                onClick={() => setFullscreenPhoto(p)}
                style={{ aspectRatio: '1/1', overflow: 'hidden', borderRadius: '6px', cursor: 'pointer', background: '#1a1a1a' }}
              >
                <img src={p.image_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EXPLORE BY TOPIC (only on All or Sermons view) ── */}
      {showSermons && (
        <div style={{ padding: '0 16px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.2px' }}>Explore by Topic</h2>
          </div>
          <p style={{ color: '#666', fontSize: '12px', marginBottom: '16px' }}>Access popular sermons from this year</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {TOPICS.map(t => (
              <button key={t.label} style={{ height: '80px', borderRadius: '16px', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px', fontWeight: 700, border: 'none', cursor: 'pointer', letterSpacing: '-0.2px' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── ALL SERMONS LIST ── */}
      {showSermons && sermons.length > 0 && (
        <div style={{ padding: '0 16px 40px' }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>All Sermons</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sermons.map(s => (
              <div key={s.id} onClick={() => playSermon(s)} style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#1a1a1a' }}>
                  <img src={s.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                  <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>{s.series || 'Single'} · {s.duration}</p>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
                  <Bookmark size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {!loading && sermons.length === 0 && photos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 32px', color: '#333' }}>
          <p style={{ fontSize: '48px' }}>🎙️</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#444', marginTop: '12px' }}>No media yet</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>Check back after Sunday service!</p>
        </div>
      )}

      {/* ── FULLSCREEN PHOTO VIEWER ── */}
      <AnimatePresence>
        {fullscreenPhoto && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setFullscreenPhoto(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <button
                onClick={() => setFullscreenPhoto(null)}
                style={{ position: 'absolute', top: '20px', right: '20px', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
              <motion.img
                initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                src={fullscreenPhoto.image_url}
                alt={fullscreenPhoto.title}
                style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px' }}
              />
              {fullscreenPhoto.title && (
                <p style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{fullscreenPhoto.title}</p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
