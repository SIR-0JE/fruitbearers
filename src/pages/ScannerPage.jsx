import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import jsQR from 'jsqr'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ChevronLeft, Zap, RotateCcw, X } from 'lucide-react'

// LocalStorage key for camera permission preference
const PREF_KEY = 'fruitbearers_camera_pref'

// ─── STATES ───────────────────────────────────────────────
// 'idle'        → show permission dialog
// 'requesting'  → getUserMedia in progress
// 'scanning'    → camera live, scanning loop running
// 'denied'      → user chose Don't Allow or browser denied
// 'success'     → QR scanned & check-in recorded
// 'error'       → unexpected error
// ──────────────────────────────────────────────────────────

export default function ScannerPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [phase, setPhase]           = useState('idle')   // see states above
  const [scannedCode, setScannedCode] = useState(null)
  const [checkInResult, setCheckInResult] = useState(null)
  const [torchOn, setTorchOn]       = useState(false)
  const [savedPref, setSavedPref]   = useState(null)     // 'always'|'once'|'deny'|null

  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef    = useRef(null)

  // Read stored preference on mount
  useEffect(() => {
    const pref = localStorage.getItem(PREF_KEY)
    setSavedPref(pref)
    // Auto-open camera if they previously chose "always"
    if (pref === 'always') {
      setPhase('requesting')
    }
  }, [])

  // Start camera when phase becomes 'requesting'
  useEffect(() => {
    if (phase === 'requesting') startCamera()
  }, [phase])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera()
  }, [])

  // ── Start camera stream ──────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // rear camera preferred
          width:  { ideal: 1280 },
          height: { ideal: 720  },
        },
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
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPhase('denied')
      } else {
        console.error('Camera error:', err)
        setPhase('error')
      }
    }
  }

  // ── QR scan loop (runs every frame) ─────────────────────
  const scanLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video  = videoRef.current
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d', { willReadFrequently: true })

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width  = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })
      if (code?.data) {
        handleQRCode(code.data)
        return // stop loop
      }
    }
    rafRef.current = requestAnimationFrame(scanLoop)
  }, [])

  // ── Handle a detected QR code ────────────────────────────
  const handleQRCode = async (data) => {
    stopCamera()
    setScannedCode(data)

    // 1. Validate session
    const { data: session, error: sErr } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('qr_code_value', data)
      .single()

    if (sErr || !session) {
      setPhase('success')
      setCheckInResult({ success: false, message: 'Invalid QR Code' })
      return
    }

    // 2. Check expiry
    if (new Date(session.expires_at) < new Date()) {
      setPhase('success')
      setCheckInResult({ success: false, message: 'This session has expired' })
      return
    }

    setPhase('success')

    // 3. Record attendance
    if (profile?.id) {
      const today = new Date().toISOString().split('T')[0]
      const { error } = await supabase
        .from('attendance')
        .insert({ 
          user_id: profile.id, 
          session_id: session.id,
          service_date: session.service_date,
          service_type: session.service_type,
          method: 'qr' 
        })

      if (!error) {
        // Increment streak
        const newStreak = (profile.attendance_streak || 0) + 1
        await supabase.from('profiles')
          .update({ attendance_streak: newStreak, last_checkin: today })
          .eq('id', profile.id)
        setCheckInResult({ success: true, streak: newStreak, session })
      } else {
        if (error.code === '23505') {
          setCheckInResult({ success: false, message: 'Already checked in for this session' })
        } else {
          setCheckInResult({ success: false, message: error.message })
        }
      }
    }
  }

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const toggleTorch = async () => {
    if (!streamRef.current) return
    const track = streamRef.current.getVideoTracks()[0]
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] })
      setTorchOn(t => !t)
    } catch (_) {}
  }

  // ── Grant camera with preference ─────────────────────────
  const grantCamera = (pref) => {
    if (pref === 'always') localStorage.setItem(PREF_KEY, 'always')
    else if (pref === 'once') localStorage.removeItem(PREF_KEY) // don't persist
    setSavedPref(pref)
    setPhase('requesting')
  }

  const denyCamera = () => {
    localStorage.setItem(PREF_KEY, 'deny')
    setPhase('denied')
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* ── CAMERA FEED (live behind everything) ── */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          display: phase === 'scanning' ? 'block' : 'none',
        }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── SCANNER UI OVERLAY (when scanning) ── */}
      <AnimatePresence>
        {phase === 'scanning' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}
          >
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
              <button
                onClick={() => { stopCamera(); navigate(-1) }}
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <ChevronLeft size={22} color="#fff" />
              </button>
              <p style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: 0 }}>Scan QR Code</p>
              <button
                onClick={toggleTorch}
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: torchOn ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.15)', border: `1px solid ${torchOn ? '#d4af37' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Zap size={18} color={torchOn ? '#d4af37' : '#fff'} />
              </button>
            </div>

            {/* Viewfinder cutout */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Dark overlay with viewfinder hole using box-shadow trick */}
              <div style={{ position: 'relative', width: '260px', height: '260px' }}>
                {/* Corner brackets - exact CCI scanner style */}
                {[
                  { top: 0,    left: 0,    borderTop: true,  borderLeft: true  },
                  { top: 0,    right: 0,   borderTop: true,  borderRight: true },
                  { bottom: 0, left: 0,    borderBottom: true, borderLeft: true },
                  { bottom: 0, right: 0,   borderBottom: true, borderRight: true },
                ].map((pos, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: '36px', height: '36px',
                      ...pos,
                      borderStyle: 'solid',
                      borderColor: '#2C5F2D',
                      borderWidth: 0,
                      borderTopWidth:    pos.borderTop    ? '3px' : 0,
                      borderBottomWidth: pos.borderBottom ? '3px' : 0,
                      borderLeftWidth:   pos.borderLeft   ? '3px' : 0,
                      borderRightWidth:  pos.borderRight  ? '3px' : 0,
                      borderRadius: pos.borderTop && pos.borderLeft ? '8px 0 0 0' :
                                    pos.borderTop && pos.borderRight ? '0 8px 0 0' :
                                    pos.borderBottom && pos.borderLeft ? '0 0 0 8px' : '0 0 8px 0',
                    }}
                  />
                ))}
                {/* Scanning line animation */}
                <motion.div
                  animate={{ y: [0, 240, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  style={{ position: 'absolute', left: '8px', right: '8px', height: '2px', background: 'linear-gradient(90deg, transparent, #2C5F2D, transparent)', borderRadius: '2px' }}
                />
              </div>
            </div>

            {/* Bottom hint */}
            <div style={{ padding: '24px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 500, margin: '0 0 16px' }}>
                Point your camera at the Sunday service QR code
              </p>
              <button
                onClick={() => { stopCamera(); navigate(-1) }}
                style={{ padding: '12px 28px', borderRadius: '100px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          NATIVE-STYLE PERMISSION DIALOG (phase === 'idle')
          Mimics iOS camera permission popup exactly
          ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase === 'idle' && (
          <>
            {/* Semi-transparent blur backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            />

            {/* Dialog card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              style={{
                position: 'fixed',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 101,
                width: 'min(320px, calc(100vw - 48px))',
                borderRadius: '20px',
                overflow: 'hidden',
                background: 'rgba(44, 44, 48, 0.96)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}
            >
              {/* Top section: icon + title + message */}
              <div style={{ padding: '24px 24px 20px', textAlign: 'center' }}>
                {/* Camera icon circle (green = Fruitbearers brand) */}
                <div style={{
                  width: '64px', height: '64px', borderRadius: '18px',
                  background: '#2C5F2D',
                  margin: '0 auto 14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(44,95,45,0.4)',
                }}>
                  {/* Camera SVG */}
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>

                {/* App name */}
                <p style={{ color: '#fff', fontSize: '17px', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.2px' }}>
                  "Fruitbearers" Would Like to Access Your Camera
                </p>

                {/* Reason */}
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
                  The camera is used to scan QR codes at Sunday service for automatic attendance check-in.
                </p>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0' }} />

              {/* Option buttons — exact iOS style (full-width divider-separated) */}
              <div>
                {/* Option 1: Allow Every Time */}
                <button
                  onClick={() => grantCamera('always')}
                  style={optionStyle(false)}
                >
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#5ac8fa' }}>
                    Allow Every Time
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                    Camera opens automatically when scanning
                  </span>
                </button>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

                {/* Option 2: Allow Once */}
                <button
                  onClick={() => grantCamera('once')}
                  style={optionStyle(false)}
                >
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#5ac8fa' }}>
                    Allow Once
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                    You'll be asked again next time
                  </span>
                </button>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

                {/* Option 3: Don't Allow */}
                <button
                  onClick={denyCamera}
                  style={optionStyle(true)}
                >
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#ff453a' }}>
                    Don't Allow
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════════════════════
          REQUESTING phase
          ════════════════════ */}
      {phase === 'requesting' && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', gap: '16px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: '40px', height: '40px', border: '3px solid #2a2a2a', borderTopColor: '#2C5F2D', borderRadius: '50%' }}
          />
          <p style={{ color: '#555', fontSize: '14px', fontWeight: 600 }}>Starting camera...</p>
        </div>
      )}

      {/* ════════════════════
          DENIED state
          ════════════════════ */}
      {phase === 'denied' && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0e0e0e', padding: '32px', gap: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '8px' }}>📷</div>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Camera Access Denied</h2>
          <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
            To scan QR codes, please enable camera access in your browser or device settings.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '280px', marginTop: '8px' }}>
            <button
              onClick={() => { localStorage.removeItem(PREF_KEY); setPhase('idle') }}
              style={{ padding: '16px', borderRadius: '100px', background: '#2C5F2D', color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer' }}
            >
              Try Again
            </button>
            <button
              onClick={() => navigate(-1)}
              style={{ padding: '16px', borderRadius: '100px', background: 'transparent', color: '#888', fontWeight: 600, fontSize: '15px', border: '1.5px solid #2a2a2a', cursor: 'pointer' }}
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════
          SUCCESS state
          ════════════════════ */}
      <AnimatePresence>
        {phase === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0e0e0e', padding: '32px', gap: '16px', textAlign: 'center' }}
          >
            {/* Animated checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
              style={{ width: '88px', height: '88px', borderRadius: '50%', background: '#1a2e10', border: '2px solid #2C5F2D', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: '40px' }}
              >
                ✅
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.3px' }}>
                Checked In! 🌿
              </h2>
              {checkInResult?.success && (
                <p style={{ color: '#2C5F2D', fontSize: '15px', fontWeight: 600, margin: '0 0 6px' }}>
                  🔥 Streak: {checkInResult.streak} Sunday{checkInResult.streak !== 1 ? 's' : ''} in a row
                </p>
              )}
              {scannedCode && (
                <p style={{ color: '#444', fontSize: '11px', margin: '8px 0 0', fontFamily: 'monospace' }}>
                  Code: {scannedCode}
                </p>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ width: '100%', maxWidth: '280px' }}>
              <button
                onClick={() => navigate('/home')}
                style={{ width: '100%', padding: '17px', borderRadius: '100px', background: 'linear-gradient(135deg, #2C5F2D, #4a8c4b)', color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(44,95,45,0.35)' }}
              >
                Back to Home
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════
          ERROR state
          ════════════════════ */}
      {phase === 'error' && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0e0e0e', padding: '32px', gap: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Camera Error</h2>
          <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>Something went wrong starting the camera. Check your device settings.</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: '12px', padding: '14px 32px', borderRadius: '100px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
            Go Back
          </button>
        </div>
      )}
    </div>
  )
}

// ── Shared style for iOS-style option buttons ──────────────
const optionStyle = (isDanger) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  padding: isDanger ? '16px 24px' : '14px 24px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  gap: '2px',
  transition: 'background 0.1s',
  WebkitTapHighlightColor: 'rgba(255,255,255,0.08)',
})
