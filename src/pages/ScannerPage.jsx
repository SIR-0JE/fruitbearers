import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import jsQR from 'jsqr'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ChevronLeft, Zap, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

const PREF_KEY = 'fruitbearers_camera_pref'

export default function ScannerPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [phase, setPhase]           = useState('idle')
  const [scannedCode, setScannedCode] = useState(null)
  const [checkInResult, setCheckInResult] = useState(null)
  const [torchOn, setTorchOn]       = useState(false)
  const [pin, setPin]               = useState('')
  const [loading, setLoading]       = useState(false)

  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef    = useRef(null)

  useEffect(() => {
    const pref = localStorage.getItem(PREF_KEY)
    if (pref === 'always') setPhase('requesting')
  }, [])

  useEffect(() => {
    if (phase === 'requesting') startCamera()
  }, [phase])

  useEffect(() => {
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setPhase('scanning')
        requestAnimationFrame(scanLoop)
      }
    } catch (err) {
      setPhase(err.name === 'NotAllowedError' ? 'denied' : 'error')
    }
  }

  const scanLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
      if (code?.data) { handleQRCode(code.data); return }
    }
    rafRef.current = requestAnimationFrame(scanLoop)
  }, [])

  const handleQRCode = async (data) => {
    stopCamera()
    setScannedCode(data)
    verifyAndCheckIn(data, 'qr')
  }

  const handlePIN = (digit) => {
    if (pin.length < 4) setPin(p => p + digit)
  }

  const verifyAndCheckIn = async (codeValue, method) => {
    if (loading) return
    setLoading(true)

    const today = new Date().toISOString().split('T')[0]
    const query = supabase.from('attendance_sessions').select('*')
    
    if (method === 'qr') query.eq('qr_code_value', codeValue)
    else query.eq('pin', codeValue).eq('service_date', today)

    const { data: session, error: sErr } = await query.single()

    if (sErr || !session) {
      setPhase('success')
      setCheckInResult({ success: false, message: method === 'qr' ? 'Invalid QR Code' : `PIN "${codeValue}" not found for Today` })
      setLoading(false)
      return
    }

    // Check session is still active (timezone-safe, admin-controlled)
    if (!session.is_active) {
      setPhase('success')
      setCheckInResult({ success: false, message: 'This session is no longer active. Ask your coordinator for a new PIN.' })
      setLoading(false)
      return
    }

    if (profile?.id) {
      const { error } = await supabase.from('attendance_records').insert({ user_id: profile.id, session_id: session.id })
      if (!error) {
        let newStreak = profile.attendance_streak || 0
        if (!profile.last_checkin) newStreak = 1
        else if (profile.last_checkin !== today) {
          const diff = Math.floor((new Date() - new Date(profile.last_checkin)) / (1000*60*60*24))
          newStreak = diff <= 8 ? newStreak + 1 : 1
        }
        await supabase.from('profiles').update({ attendance_streak: newStreak, last_checkin: today }).eq('id', profile.id)
        setCheckInResult({ success: true, streak: newStreak })
      } else {
        setCheckInResult({ success: false, message: error.code === '23505' ? 'Already checked in' : error.message })
      }
    }
    setPhase('success')
    setLoading(false)
  }

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
  }

  const grantCamera = (pref) => {
    if (pref === 'always') localStorage.setItem(PREF_KEY, 'always')
    setPhase('requesting')
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <video ref={videoRef} playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: phase === 'scanning' ? 'block' : 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <AnimatePresence>
        {phase === 'scanning' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
              <button onClick={() => { stopCamera(); navigate(-1) }} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft color="#fff" /></button>
              <p style={{ color: '#fff', fontWeight: 700 }}>Scan QR Code</p>
              <div style={{ width: '40px' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '260px', height: '260px', border: '3px solid #2C5F2D', borderRadius: '24px', position: 'relative' }}>
                <motion.div animate={{ y: [0, 240, 0] }} transition={{ duration: 2.5, repeat: Infinity }} style={{ position: 'absolute', inset: '0 8px', height: '2px', background: '#2C5F2D' }} />
              </div>
            </div>
            <div style={{ padding: '24px', textAlign: 'center', background: 'linear-gradient(to top, #000, transparent)' }}>
              <button onClick={() => { stopCamera(); setPhase('pin') }} style={{ padding: '14px 28px', borderRadius: '100px', background: '#2C5F2D', color: '#fff', fontWeight: 700, border: 'none' }}>Use PIN instead</button>
            </div>
          </motion.div>
        )}

        {phase === 'pin' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: '#070d07', display: 'flex', flexDirection: 'column', padding: '24px', zIndex: 110 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 0 32px' }}>
              <button onClick={() => setPhase('idle')} style={{ color: '#555', background: 'transparent', border: 'none' }}><X size={28} /></button>
              <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 800 }}>Manual Check-in</h2>
              <div style={{ width: '28px' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '40px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ width: '56px', height: '56px', borderRadius: '16px', border: `2.5px solid ${pin.length > i ? '#2C5F2D' : '#1a2e1a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {pin.length > i ? <span style={{ color: '#fff', fontSize: '24px', fontWeight: 900 }}>*</span> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1a2e1a' }} />}
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%', maxWidth: '320px' }}>
                {[1,2,3,4,5,6,7,8,9].map(n => <button key={n} onClick={() => handlePIN(n.toString())} style={{ height: '62px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '22px', fontWeight: 700 }}>{n}</button>)}
                <button onClick={() => setPin('')} style={{ color: '#ff453a', fontWeight: 800 }}>RESET</button>
                <button onClick={() => handlePIN('0')} style={{ height: '62px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '22px', fontWeight: 700 }}>0</button>
                <button onClick={() => setPin(p => p.slice(0,-1))} style={{ color: '#fff', fontSize: '20px' }}>⌫</button>
              </div>
            </div>
            <div style={{ padding: '24px 0' }}>
              <button onClick={() => verifyAndCheckIn(pin, 'pin')} disabled={pin.length < 4 || loading} style={{ width: '100%', padding: '20px', borderRadius: '100px', background: pin.length === 4 ? '#2C5F2D' : 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 900, border: 'none' }}>{loading ? 'Verifying...' : 'Check In Now'}</button>
            </div>
          </motion.div>
        )}

        {phase === 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0e0e0e', padding: '32px', textAlign: 'center', zIndex: 120 }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#1a2e10', border: '2px solid #2C5F2D', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>✅</div>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700 }}>{checkInResult?.success ? 'Checked In! 🌿' : 'failed'}</h2>
            <p style={{ color: checkInResult?.success ? '#2C5F2D' : '#ff453a', margin: '12px 0 32px' }}>{checkInResult?.success ? `Streak: ${checkInResult.streak} Fires` : checkInResult?.message}</p>
            <button onClick={() => navigate('/home')} style={{ width: '100%', maxWidth: '280px', padding: '18px', borderRadius: '100px', background: '#2C5F2D', color: '#fff', fontWeight: 800 }}>Back to Home</button>
          </motion.div>
        )}

        {phase === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#1c1c1e', width: 'min(320px, 90%)', borderRadius: '20px', padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', background: '#2C5F2D', borderRadius: '16px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap color="#fff" /></div>
              <h3 style={{ color: '#fff', margin: '0 0 8px' }}>Camera Permission</h3>
              <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>Required to scan service QR codes.</p>
              <button onClick={() => grantCamera('always')} style={{ width: '100%', padding: '14px', background: '#2C5F2D', color: '#fff', borderRadius: '12px', border: 'none', marginBottom: '12px' }}>Allow Camera</button>
              <button onClick={() => setPhase('pin')} style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', color: '#2C5F2D', borderRadius: '12px', border: 'none' }}>Use PIN instead</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
