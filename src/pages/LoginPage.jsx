import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Welcome back!')
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0e0e0e', padding: '0 20px' }}
    >
      {/* Top safe area + back */}
      <div className="pt-14 pb-8 flex items-center gap-4">
        <Link
          to="/"
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-10">
        <div className="w-14 h-14 rounded-2xl overflow-hidden mb-6" style={{ background: '#1a1a1a', padding: '8px' }}>
          <img src="/logo.png" alt="" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-white font-bold mb-2" style={{ fontSize: '28px', letterSpacing: '-0.5px' }}>
          Welcome back
        </h1>
        <p style={{ color: '#666', fontSize: '15px' }}>Log in to your Fruitbearers account</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        {/* Email */}
        <div>
          <label className="block mb-2" style={{ color: '#888', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            className="w-full outline-none text-white font-medium"
            style={{
              background: '#1a1a1a',
              border: '1.5px solid #2a2a2a',
              borderRadius: '16px',
              padding: '16px 18px',
              fontSize: '15px',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.target.style.borderColor = '#2C5F2D')}
            onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between mb-2">
            <label style={{ color: '#888', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Password
            </label>
            <button type="button" style={{ color: '#2C5F2D', fontSize: '12px', fontWeight: 700 }}>
              Forgot?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full outline-none text-white font-medium pr-14"
              style={{
                background: '#1a1a1a',
                border: '1.5px solid #2a2a2a',
                borderRadius: '16px',
                padding: '16px 18px',
                fontSize: '15px',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = '#2C5F2D')}
              onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{ color: '#555' }}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center w-full font-bold text-white mt-4"
          style={{
            background: loading ? '#1a3a1b' : 'linear-gradient(135deg, #2C5F2D 0%, #4a8c4b 100%)',
            borderRadius: '100px',
            height: '56px',
            fontSize: '16px',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(44,95,45,0.3)',
            transition: 'all 0.2s',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-auto text-center pb-12 pt-8">
        <p style={{ color: '#555', fontSize: '14px' }}>
          New here?{' '}
          <Link to="/signup" style={{ color: '#2C5F2D', fontWeight: 700 }}>
            Join the Family
          </Link>
        </p>
        {/* iOS home indicator */}
        <div className="flex justify-center mt-8">
          <div className="w-32 h-1 rounded-full" style={{ background: '#333' }} />
        </div>
      </div>
    </div>
  )
}
