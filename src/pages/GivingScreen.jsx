import { useState, useEffect } from 'react'
import { Wallet, Copy, CreditCard, Info } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export default function GivingScreen() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('giving_accounts').select('*').eq('is_active', true).order('created_at')
      .then(({ data }) => { if (data) setAccounts(data); setLoading(false) })
  }, [])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Account number copied! 📋')
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

      {/* Account Cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2].map(i => (
            <div key={i} style={{ height: '180px', borderRadius: '32px', background: 'rgba(255,255,255,0.04)' }} className="skeleton" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div style={{ background: '#1a1a1a', borderRadius: '32px', padding: '48px 32px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>🏦</p>
          <p style={{ color: '#666', fontSize: '15px', fontWeight: 600, margin: '0 0 6px' }}>No accounts set up yet</p>
          <p style={{ color: '#333', fontSize: '13px', margin: 0 }}>The church administrator will add bank details soon.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {accounts.map(account => (
            <div
              key={account.id}
              style={{
                background: '#1a1a1a',
                borderRadius: '32px',
                padding: '32px',
                border: '1px solid rgba(255,255,255,0.05)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Decorative circle */}
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(44,95,45,0.06)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#2C5F2D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CreditCard size={20} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#555', letterSpacing: '0.12em' }}>
                  Church Account
                </span>
              </div>

              {/* Account Number */}
              <div style={{ marginBottom: '24px' }}>
                <p style={{ color: '#444', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.08em' }}>
                  Account Number
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <h2 style={{ fontSize: '30px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {account.account_no}
                  </h2>
                  <button
                    onClick={() => copyToClipboard(account.account_no)}
                    style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: 'rgba(44,95,45,0.15)', border: '1px solid rgba(44,95,45,0.2)',
                      color: '#2C5F2D', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s',
                    }}
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>

              {/* Bank + Account Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <p style={{ color: '#444', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Bank</p>
                  <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{account.bank_name}</p>
                </div>
                <div>
                  <p style={{ color: '#444', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Account Name</p>
                  <p style={{ fontSize: '14px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {account.account_name}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How to Give */}
      <div style={{ background: '#141414', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Info size={18} color="#2C5F2D" />
          <p style={{ color: '#2C5F2D', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>How to Give</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { step: '1', text: 'Tap the copy icon next to the account number' },
            { step: '2', text: 'Open your bank app and make a transfer to the account shown' },
            { step: '3', text: 'Use your full name as the payment reference so we can identify your gift 🌿' },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(44,95,45,0.15)', border: '1px solid rgba(44,95,45,0.3)', color: '#2C5F2D', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {step}
              </div>
              <p style={{ color: '#888', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
