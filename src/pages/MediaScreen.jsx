import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAudio } from '../contexts/AudioContext'
import { Bookmark } from 'lucide-react'

const FILTERS = ['All', 'Categories', 'Bookmarks', 'Downloads']

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
  const [sermons, setSermons] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    // Initial load
    supabase.from('sermons').select('*').order('date', { ascending: false })
      .then(({ data }) => { setSermons(data || []); setLoading(false) })

    // 🔴 Real-time: when admin adds/deletes a sermon, users see it instantly
    const channel = supabase
      .channel('sermons-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sermons' }, () => {
        // Re-fetch on any change
        supabase.from('sermons').select('*').order('date', { ascending: false })
          .then(({ data }) => setSermons(data || []))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div style={{ background: '#0e0e0e', minHeight: '100%', paddingTop: '52px' }}>

      {/* ── FILTER PILLS (All, Categories, Bookmarks, Downloads) ── */}
      <div
        style={{
          display: 'flex', gap: '8px', padding: '0 16px 20px',
          overflowX: 'auto', position: 'sticky', top: 0,
          background: '#0e0e0e', zIndex: 10, paddingTop: '4px',
        }}
        className="no-scrollbar"
      >
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: '100px', flexShrink: 0,
              background: filter === f ? '#2a2a2a' : '#1a1a1a',
              border: `1px solid ${filter === f ? '#3a3a3a' : '#252525'}`,
              color: filter === f ? '#fff' : '#777',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── LATEST SERMONS (horizontal scroll, large cards - exact CCI) ── */}
      <div
        style={{ display: 'flex', gap: '14px', padding: '0 16px 28px', overflowX: 'auto', scrollSnapType: 'x mandatory' }}
        className="no-scrollbar"
      >
        {loading
          ? [1, 2].map(i => (
              <div key={i} style={{ minWidth: '280px', aspectRatio: '3/4', borderRadius: '20px', background: '#1a1a1a', flexShrink: 0 }} className="skeleton" />
            ))
          : sermons.length === 0
          ? (
            <div style={{ minWidth: '280px', aspectRatio: '3/4', borderRadius: '20px', background: '#1a1a1a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
              <img src="/logo.png" alt="" style={{ width: '60px', objectFit: 'contain', filter: 'brightness(0) invert(0.3)' }} />
              <p style={{ color: '#444', fontSize: '13px', fontWeight: 600 }}>No sermons yet</p>
            </div>
          )
          : sermons.map(s => (
            <div
              key={s.id}
              onClick={() => playSermon(s)}
              style={{
                minWidth: '280px', borderRadius: '20px', overflow: 'hidden',
                position: 'relative', flexShrink: 0, cursor: 'pointer',
                scrollSnapAlign: 'start',
                background: '#1a1a1a',
                aspectRatio: '3/4',
              }}
            >
              <img
                src={s.thumbnail_url}
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {/* Duration badge */}
              {s.duration && (
                <div style={{
                  position: 'absolute', top: '12px', right: '12px',
                  background: 'rgba(0,0,0,0.6)', borderRadius: '8px',
                  padding: '3px 8px', color: '#fff', fontSize: '11px', fontWeight: 600,
                }}>
                  {s.duration}
                </div>
              )}
              {/* Active playing indicator */}
              {currentSermon?.id === s.id && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#2C5F2D' }} />
              )}
            </div>
          ))
        }
      </div>

      {/* ── EXPLORE BY TOPIC ── */}
      <div style={{ padding: '0 16px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.2px' }}>Explore by Topic</h2>
          <button style={{ color: '#fff', fontSize: '13px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
        </div>
        <p style={{ color: '#666', fontSize: '12px', marginBottom: '16px' }}>Access popular sermons from this year</p>

        {/* 2-column grid of colored topic cards - exact CCI */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {TOPICS.map(t => (
            <button
              key={t.label}
              style={{
                height: '80px', borderRadius: '16px',
                background: t.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '16px', fontWeight: 700,
                border: 'none', cursor: 'pointer',
                letterSpacing: '-0.2px',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SERMON LIST (below topic grid) ── */}
      {sermons.length > 0 && (
        <div style={{ padding: '0 16px 40px' }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>All Sermons</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sermons.map(s => (
              <div
                key={s.id}
                onClick={() => playSermon(s)}
                style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}
              >
                <div style={{ width: '72px', height: '72px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#1a1a1a' }}>
                  <img src={s.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.title}
                  </p>
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
    </div>
  )
}
