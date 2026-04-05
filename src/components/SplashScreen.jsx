import { motion } from 'framer-motion'

// CCI Splash: solid green bg, centered white logo, nothing else
export default function SplashScreen() {
  return (
    <div
      style={{ background: '#2C5F2D' }}
      className="fixed inset-0 flex flex-col items-center justify-center z-[9999]"
    >
      {/* Centered logo - white version, exactly like CCI infinity logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-28 h-28"
      >
        <img
          src="/logo.png"
          alt="Fruitbearers"
          className="w-full h-full object-contain brightness-0 invert"
        />
      </motion.div>

      {/* iOS-style home indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
    </div>
  )
}
