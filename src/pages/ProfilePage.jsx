import { useState, useEffect } from 'react'
import { User, Mail, Save, ArrowLeft, Home, Calendar, Phone, Camera, Loader2, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

/**
 * 🌿 Fruitbearers Premium Member Profile
 * Dark-themed, high-contrast, designed for mobile-first PWA.
 */
export default function ProfilePage() {
  const { user, profile, fetchProfile } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading]       = useState(false)
  const [uploading, setUploading]   = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    dob: profile?.dob || '',
    phone: profile?.phone || '',
    avatar_url: profile?.avatar_url || ''
  })

  // Sync state if profile loads late
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        dob: profile.dob || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || ''
      })
    }
  }, [profile])

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    
    // Use user.id as the source of truth for the ID
    const targetId = profile?.id || user?.id
    
    if (!targetId) {
      toast.error('Authentication Error: Please log in again.')
      return
    }

    setLoading(true)

    // UPSERT instead of UPDATE: This repairs the profile if the trigger failed
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: targetId,
        full_name: formData.full_name,
        dob: formData.dob || null,
        phone: formData.phone,
        avatar_url: formData.avatar_url,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (error) {
      console.error('Update profile error:', error)
      toast.error(`Update failed: ${error.message || error.code || 'Unspecified error'}`)
    } else {
      // Refresh the global profile state
      await fetchProfile(targetId)
      toast.success('Your information has been updated!')
      setTimeout(() => navigate('/home'), 1500)
    }
    setLoading(false)
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const targetId = profile?.id || user?.id
    if (!targetId) {
      toast.error('Please log in properly before uploading')
      return
    }

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${targetId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    try {
      // 1. Upload to storage
      const { error: uploadErr } = await supabase.storage
        .from('avatars') 
        .upload(filePath, file)

      if (uploadErr) throw uploadErr

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      toast.success('Profile picture ready!')
    } catch (err) {
      console.error(err)
      toast.error('Avatar upload failed. Check bucket permissions.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ background: '#0e0e0e', minHeight: '100vh', padding: '0 20px 40px', color: '#fff' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '60px 0 24px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
        >
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Member Profile</h1>
        <div style={{ width: '40px' }} /> {/* Spacer */}
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Avatar Section */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ position: 'relative', width: '110px', height: '110px', margin: '0 auto' }}>
              <div style={{ 
                width: '100%', height: '100%', borderRadius: '32px', 
                background: '#1a1a1a', border: '2px solid rgba(212,175,55,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.4)'
              }}>
                {uploading ? <Loader2 className="animate-spin" size={32} color="#d4af37" /> : 
                  formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={44} color="#d4af37" style={{ opacity: 0.5 }} />
                  )
                }
              </div>
              <label style={{ 
                position: 'absolute', bottom: '-4px', right: '-4px', 
                background: '#d4af37', color: '#000', padding: '8px', 
                borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(212,175,55,0.4)',
                transition: 'transform 0.1s active',
              }}
              className="active:scale-95"
              >
                <Camera size={18} />
                <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <p style={{ color: '#666', fontSize: '12px', marginTop: '16px', fontWeight: 600, letterSpacing: '0.02em' }}>
              Member ID: <span style={{ color: '#d4af37' }}>{profile?.member_code || 'F001'}</span>
            </p>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Input Groups */}
            <InputGroup label="Full Name" icon={<User size={18} />}>
              <input 
                name="full_name" type="text" className="profile-input" 
                value={formData.full_name} onChange={handleChange} required 
                placeholder="John Doe"
              />
            </InputGroup>

            <InputGroup label="Email ID" icon={<Mail size={18} />} readOnly>
              <input type="text" className="profile-input" value={profile?.email || user?.email || ''} readOnly style={{ opacity: 0.5 }} />
            </InputGroup>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <InputGroup label="Date of Birth" icon={<Calendar size={18} />}>
                <input 
                  name="dob" type="date" className="profile-input" 
                  value={formData.dob} onChange={handleChange} 
                />
              </InputGroup>
              <InputGroup label="Phone Number" icon={<Phone size={18} />}>
                <input 
                  name="phone" type="tel" className="profile-input" 
                  value={formData.phone} onChange={handleChange} placeholder="080 ..."
                />
              </InputGroup>
            </div>


          </div>

          <button 
            type="submit" 
            disabled={loading || uploading}
            style={{ 
              width: '100%', padding: '17px', borderRadius: '100px', 
              background: '#2C5F2D', color: '#fff', fontWeight: 700, fontSize: '15px',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', gap: '10px', marginTop: '12px',
              boxShadow: '0 4px 20px rgba(44,95,45,0.3)',
              opacity: (loading || uploading) ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> Save & Finish</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#444', marginTop: '32px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 800 }}>
          🌿 Fruitbearers Membership Record
        </p>
      </div>

      <style>{`
        .profile-input {
          width: 100%; 
          padding: 14px 16px 14px 48px; 
          border-radius: 16px; 
          border: 1px solid #2a2a2a; 
          background: #1a1a1a; 
          font-size: 14px; 
          font-weight: 500; 
          color: #fff;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .profile-input:focus { border-color: #2C5F2D; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}

function InputGroup({ label, icon, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '4px' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#555', display: 'flex', alignItems: 'center' }}>
          {icon}
        </div>
        {children}
      </div>
    </div>
  )
}
