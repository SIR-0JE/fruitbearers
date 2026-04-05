import { useState, useEffect } from 'react'
import { Wallet, Copy, Globe, CreditCard, X, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { AnimatePresence, motion } from 'framer-motion'

export default function GivingScreen() {
  const { profile } = useAuth()
  const [category, setCategory] = useState('Offering')
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Paystack Modal State
  const [showPaystack, setShowPaystack] = useState(false)
  const [amount, setAmount] = useState('')
  const [giving, setGiving] = useState(false)

  const activeAccount = accounts.find(a => a.category === category) || accounts[0]

  useEffect(() => {
    async function loadAccounts() {
      const { data } = await supabase.from('giving_accounts').select('*').eq('is_active', true)
      if (data) setAccounts(data)
      setLoading(false)
    }
    loadAccounts()
    
    // Load Paystack Script
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.body.appendChild(script)
    return () => document.body.removeChild(script)
  }, [])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Account number copied!')
  }

  const handlePaystack = () => {
    if (!amount || isNaN(amount) || amount < 100) {
      toast.error('Minimum amount is ₦100')
      return
    }

    setGiving(true)
    const handler = window.PaystackPop.setup({
      key: 'pk_test_yoursecretkey', // Should be VITE_PAYSTACK_PUBLIC_KEY in .env
      email: profile?.email || 'guest@fruitbearers.church',
      amount: amount * 100, // into kobo
      currency: 'NGN',
      callback: async (response) => {
        // Record success in Supabase
        await supabase.from('giving').insert({
          user_id: profile?.id,
          amount: amount,
          category: category,
          paystack_reference: response.reference,
          status: 'success'
        })
        toast.success(`₦${amount} received! Thank you for giving.`)
        setShowPaystack(false)
        setAmount('')
        setGiving(false)
      },
      onClose: () => {
        setGiving(false)
        toast('Trust you can complete your seeds later! 🌿')
      }
    })
    handler.openIframe()
  }

  return (
    <div style={{ background: '#0e0e0e', minHeight: '100vh', padding: '0 20px 80px', color: '#fff' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '62px 0 28px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Giving</h1>
        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Wallet size={22} color="#888" />
        </div>
      </div>

      {/* Category Toggle */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '24px' }} className="no-scrollbar">
        {['Offering', 'Tithe', 'Seeds', 'Building', 'Missions'].map(cat => (
          <button 
            key={cat} onClick={() => setCategory(cat)}
            style={{ 
              padding: '10px 20px', borderRadius: '100px', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 700,
              background: category === cat ? 'rgba(255,255,255,0.1)' : '#1a1a1a', 
              color: category === cat ? '#fff' : '#444', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Bank Details Card */}
      <div style={{ background: '#1a1a1a', borderRadius: '32px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#2C5F2D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={20} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#666', letterSpacing: '0.1em' }}>Local Giving</span>
        </div>

        {loading ? <Loader2 className="animate-spin" color="#2C5F2D" /> : (
          <>
            <div style={{ marginBottom: '28px' }}>
              <p style={{ color: '#444', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Account Number</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{activeAccount?.account_no || '---'}</h2>
                <button onClick={() => activeAccount && copyToClipboard(activeAccount.account_no)} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ color: '#444', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Bank Name</p>
                <p style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{activeAccount?.bank_name || '---'}</p>
              </div>
              <div>
                <p style={{ color: '#444', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Account Name</p>
                <p style={{ fontSize: '15px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeAccount?.account_name || 'Fruitbearers Church'}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Give Online CTA */}
      <button 
        onClick={() => setShowPaystack(true)}
        style={{ 
          width: '100%', padding: '24px', borderRadius: '32px', border: 'none',
          background: 'linear-gradient(135deg, #FF4B2B, #FF416C)', color: '#fff', 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
          boxShadow: '0 12px 32px rgba(255,75,43,0.25)' 
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, textTransform: 'uppercase' }}>Give Online</h4>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 700 }}>CARD • TRANSFER • USSD</p>
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Globe size={22} />
        </div>
      </button>

      {/* STYLES */}
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Paystack Modal */}
      <AnimatePresence>
        {showPaystack && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPaystack(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, backdropFilter: 'blur(10px)' }} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#161616', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '32px 24px 62px', zIndex: 301 }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                 <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Online Giving</h3>
                 <button onClick={() => setShowPaystack(false)} style={{ background: 'none', border: 'none', color: '#555' }}><X size={24} /></button>
               </div>
               
               <p style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>Enter the amount you would like to give for <strong>{category}</strong>:</p>
               
               <div style={{ position: 'relative', marginBottom: '32px' }}>
                 <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '28px', fontWeight: 800, color: '#2C5F2D' }}>₦</span>
                 <input 
                   type="number" autoFocus value={amount} onChange={e => setAmount(e.target.value)}
                   placeholder="0"
                   style={{ width: '100%', padding: '24px 24px 24px 54px', background: '#0d0d0d', border: '2px solid #2a2a2a', borderRadius: '18px', fontSize: '32px', fontWeight: 800, color: '#fff', outline: 'none' }}
                 />
               </div>

               <button 
                 disabled={giving} onClick={handlePaystack}
                 style={{ width: '100%', padding: '20px', borderRadius: '100px', background: '#2C5F2D', border: 'none', color: '#fff', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
               >
                 {giving ? <Loader2 className="animate-spin" /> : 'Pay Securely'}
               </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
