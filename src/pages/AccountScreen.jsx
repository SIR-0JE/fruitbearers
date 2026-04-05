import { useAuth } from '../contexts/AuthContext'
import { 
  Bell, Settings, Lock, Headphones, Info, 
  Star, MessageSquare, Share2, LogOut, Edit3, 
  MapPin, ShieldCheck, UserCircle, CreditCard,
  History, Download, BookMarked, Monitor
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'

export default function AccountScreen() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      navigate('/login')
    } catch (e) {
      toast.error('Failed to sign out')
    }
  }

  const getInitials = (name) => {
    if (!name) return 'F'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="animate-fade-in px-4 pt-8 pb-12 overflow-y-auto no-scrollbar">
      {/* --- PROFILE HEADER --- */}
      <div className="flex flex-col items-center mb-12 text-center group cursor-pointer active:scale-95 transition-transform" onClick={() => navigate('/profile')}>
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[var(--gold)]/20 to-[var(--gold)]/5 flex items-center justify-center border-2 border-white/5 shadow-2xl relative">
            <span className="text-[var(--gold)] text-3xl font-black tracking-widest">{getInitials(profile?.full_name)}</span>
            <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white/5 border border-white/10 backdrop-blur shadow-sm flex items-center justify-center text-white/60">
              <Edit3 size={14} />
            </div>
          </div>
        </div>
        <h2 className="text-white text-2xl font-bold font-serif italic mb-1 uppercase tracking-tight">{profile?.full_name || 'Member'}</h2>
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4 decoration-white/20 underline underline-offset-4 decoration-2">{profile?.email}</p>
        
        <div className="flex items-center gap-2">
          <div className="bg-[#1a1a1a] border border-white/5 rounded-full px-5 py-2 flex items-center gap-2 shadow-inner active:bg-white/5 transition-all">
            <MapPin size={12} className="text-[var(--gold)]" />
            <span className="text-white text-[10px] font-black uppercase tracking-widest leading-none">{profile?.campus || 'Lagos'}</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-2 flex items-center gap-2 shadow-inner active:bg-emerald-500/5 transition-all">
            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest leading-none underline decoration-emerald-800 decoration-2 underline-offset-4">Member: {profile?.member_code || '0000'}</span>
          </div>
        </div>
      </div>

      {/* --- ACCOUNT SECTIONS --- */}
      <div className="flex flex-col gap-10">
        
        {/* Settings Section */}
        <section>
          <h3 className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mb-6 px-4 shadow-sm">Account Settings</h3>
          <div className="bg-[#1a1a1a] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl transition-shadow hover:shadow-gold/5 active:scale-[0.99] transition-transform">
            <AccountRow icon={<Bell size={18} />} color="bg-blue-500" label="Notifications" />
            <AccountRow icon={<Settings size={18} />} color="bg-emerald-500" label="Preferences" />
            <AccountRow icon={<Lock size={18} />} color="bg-orange-500" label="Change Password" />
            <AccountRow icon={<Monitor size={18} />} color="bg-purple-500" label="Media Settings" />
            <AccountRow icon={<Headphones size={18} />} color="bg-pink-500" label="Help & Support" border={false} />
          </div>
        </section>

        {/* Resources Section */}
        <section>
          <h3 className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mb-6 px-4 shadow-sm">Resources</h3>
          <div className="bg-[#1a1a1a] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl transition-shadow hover:shadow-green/5 active:scale-[0.99] transition-transform">
            <AccountRow icon={<Star size={18} />} color="bg-yellow-500" label="Rate in App Store" />
            <AccountRow icon={<Info size={18} />} color="bg-blue-600" label="App Version" badge="v2.4.0" />
            <AccountRow icon={<MessageSquare size={18} />} color="bg-emerald-600" label="App Feedback" />
            <AccountRow icon={<Share2 size={18} />} color="bg-indigo-600" label="Share Testimony" border={false} />
          </div>
        </section>

        {/* Sign Out */}
        <button 
          onClick={handleSignOut}
          className="w-full py-5 rounded-[2rem] bg-white/5 text-red-500 font-bold text-sm flex items-center justify-center gap-3 active:bg-white/10 transition-all border border-red-500/10 shadow-lg shadow-red-500/5 group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Sign out
        </button>

        <p className="text-center text-white/10 text-[10px] font-black uppercase tracking-widest shadow-inner mt-4 opacity-70">
          Fruitbearers Church PWA © 2026 <br/> 🌿 🤍 🕊️
        </p>
      </div>
    </div>
  )
}

function AccountRow({ icon, color, label, badge, border = true }) {
  return (
    <div className={clsx(
      "flex items-center justify-between p-5 active:bg-white/5 transition-all cursor-pointer group shadow-sm",
      border && "border-b border-white/5"
    )}>
      <div className="flex items-center gap-4">
        <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xl transition-shadow group-hover:shadow-2xl", color)}>
          {icon}
        </div>
        <span className="text-white/80 font-bold text-sm tracking-tight uppercase leading-none underline decoration-transparent group-hover:decoration-white/20 transition-all underline-offset-4 transition-all">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {badge && <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest shadow-inner">{badge}</span>}
        <ChevronRight size={16} className="text-white/10 group-hover:text-white/60 transition-all group-hover:translate-x-1" />
      </div>
    </div>
  )
}

function ChevronRight({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  )
}
