import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

// CCI Onboarding: full-bleed photo bg, white bottom card rounded top,
// logo icon top-left, big bold title, subtitle, primary + secondary buttons, dot indicators
export default function LandingPage() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Full-bleed background photo */}
      <motion.img
        src="/worship-bg.jpg"
        alt=""
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: 'easeOut' }}
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      {/* Gradient overlay - subtle, like CCI (dark only at very bottom) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50" />

      {/* Bottom Card - exact CCI structure */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 120, delay: 0.6 }}
        className="absolute bottom-0 left-0 right-0 z-20"
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '28px 24px 20px',
        }}
      >
        {/* Logo icon top-left of card - CCI has their infinity logo here */}
        <div className="mb-5">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
            style={{ border: '2px solid rgba(44,95,45,0.15)', background: '#fff' }}
          >
            <img src="/logo.png" alt="Fruitbearers" className="w-9 h-9 object-contain" />
          </div>
        </div>

        {/* Heading - same weight/size as CCI */}
        <h1
          className="mb-2"
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#111',
            lineHeight: 1.25,
            letterSpacing: '-0.3px',
          }}
        >
          Celebrating endless life in Christ
        </h1>

        {/* Subtitle */}
        <p
          className="mb-6"
          style={{
            fontSize: '14px',
            color: '#888',
            lineHeight: 1.5,
            fontWeight: 400,
          }}
        >
          Stay connected, engage, and grow with your family in Christ.
        </p>

        {/* Primary button - CCI is red-to-pink gradient pill */}
        <Link
          to="/signup"
          className="flex items-center justify-center w-full mb-3 font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, #2C5F2D 0%, #4a8c4b 100%)',
            borderRadius: '100px',
            height: '52px',
            fontSize: '16px',
            letterSpacing: '0.1px',
            boxShadow: '0 4px 20px rgba(44,95,45,0.35)',
          }}
        >
          Join The Family
        </Link>

        {/* Secondary button - white with colored text */}
        <Link
          to="/login"
          className="flex items-center justify-center w-full font-bold"
          style={{
            background: '#fff',
            border: '1.5px solid #e8e8e8',
            borderRadius: '100px',
            height: '52px',
            fontSize: '16px',
            color: '#2C5F2D',
            letterSpacing: '0.1px',
          }}
        >
          Log In
        </Link>

        {/* Terms */}
        <p
          className="text-center mt-4"
          style={{ fontSize: '11px', color: '#aaa', lineHeight: 1.4 }}
        >
          By continuing, you agree to Fruitbearers Church's{' '}
          <span style={{ textDecoration: 'underline' }}>Term of Use.</span>
        </p>

        {/* Page dots - exactly like CCI (3 dots, first is active/bigger) */}
        <div className="flex items-center justify-center gap-2 mt-5 pb-2">
          <div
            style={{
              width: '20px',
              height: '6px',
              borderRadius: '100px',
              background: '#2C5F2D',
            }}
          />
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '100px',
              background: '#ccc',
            }}
          />
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '100px',
              background: '#ccc',
            }}
          />
        </div>

        {/* iOS home indicator */}
        <div className="flex justify-center mt-3">
          <div className="w-32 h-1 bg-black/15 rounded-full" />
        </div>
      </motion.div>
    </div>
  )
}
