import { useState, useEffect } from 'react'
import { Wallet, Copy, CreditCard, Info } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export default function GivingScreen() {
  const [category, setCategory] = useState('Offering')
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  const activeAccount = accounts.find(a => a.category === category) || accounts[0]

  useEffect(() => {
    async function loadAccounts() {
      const { data } = await supabase.from('giving_accounts').select('*').eq('is_active', true)
      if (data) setAccounts(data)
      setLoading(false)
    }
    loadAccounts()
  }, [])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Account number copied!')
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
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#666', letterSpacing: '0.1em' }}>
            {category} Account
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }} className="skeleton" />
            <div style={{ height: '24px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', width: '60%' }} className="skeleton" />
          </div>
        ) : activeAccount ? (
          <>
            <div style={{ marginBottom: '28px' }}>
              <p style={{ color: '#444', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Account Number</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{activeAccount.account_no}</h2>
                <button
                  onClick={() => copyToClipboard(activeAccount.account_no)}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ color: '#444', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Bank Name</p>
                <p style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{activeAccount.bank_name}</p>
              </div>
              <div>
                <p style={{ color: '#444', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Account Name</p>
                <p style={{ fontSize: '15px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeAccount.account_name}</p>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ color: '#444', fontSize: '14px', fontWeight: 600 }}>No account set up for {category} yet.</p>
            <p style={{ color: '#333', fontSize: '12px', marginTop: '4px' }}>Please contact the church administrator.</p>
          </div>
        )}
      </div>

      {/* How to Give Instructions */}
      <div style={{ background: '#141414', border: '1px solid rgba(44,95,45,0.2)', borderRadius: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Info size={18} color="#2C5F2D" />
          <p style={{ color: '#2C5F2D', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>How to Give</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { step: '1', text: 'Select your giving category above (Offering, Tithe, Seeds, etc.)' },
            { step: '2', text: 'Copy the account number and open your bank app' },
            { step: '3', text: 'Make a transfer to the account shown above' },
            { step: '4', text: 'Use your name as the payment reference so we can identify your gift 🌿' },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(44,95,45,0.15)', border: '1px solid rgba(44,95,45,0.3)', color: '#2C5F2D', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {step}
              </div>
              <p style={{ color: '#888', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
