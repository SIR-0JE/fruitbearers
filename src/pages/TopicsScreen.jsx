import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, CheckCircle, Circle, ChevronDown, Lock } from 'lucide-react'

export default function TopicsScreen() {
  const { profile } = useAuth()
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedTheme, setExpandedTheme] = useState(null)
  const [expandedMod, setExpandedMod] = useState(null)
  
  useEffect(() => {
    async function fetchCurriculum() {
      if (!profile?.id) return

      // Fetch all themes -> modules -> topics
      const { data: qThemes } = await supabase
        .from('themes')
        .select(`*, modules(*, topics(*))`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      // Fetch user's completed topics with Coach names
      const { data: completed } = await supabase
        .from('topic_attendance')
        .select(`topic_id, coaches(name)`)
        .eq('user_id', profile.id)

      const completedMap = new Map()
      completed?.forEach(c => {
        completedMap.set(c.topic_id, c.coaches?.name || 'Unknown Coach')
      })

      if (qThemes) {
        qThemes.forEach(t => {
          let tTotal = 0
          let tDone = 0

          t.modules?.sort((a,b) => a.order_number - b.order_number)
          t.modules?.forEach(m => {
            let mTotal = 0
            let mDone = 0
            
            m.topics?.sort((a,b) => a.order_number - b.order_number)
            m.topics?.forEach(topic => {
               topic.isCompleted = completedMap.has(topic.id)
               topic.completedBy = completedMap.get(topic.id)
               mTotal++
               tTotal++
               if (topic.isCompleted) {
                 mDone++
                 tDone++
               }
            })
            m.totalTopics = mTotal
            m.completedTopics = mDone
            m.progress = mTotal === 0 ? 0 : Math.round((mDone / mTotal) * 100)
            m.isLocked = false 
          })

          // Calculate locked states sequentially
          for (let i = 0; i < (t.modules?.length || 0); i++) {
             if (i === 0) {
               t.modules[0].isLocked = false
             } else {
               t.modules[i].isLocked = t.modules[i-1].progress < 100
             }
          }

          t.totalTopics = tTotal
          t.completedTopics = tDone
          t.progress = tTotal === 0 ? 0 : Math.round((tDone / tTotal) * 100)
        })

        setThemes(qThemes)
        if (qThemes.length > 0) setExpandedTheme(qThemes[0].id)
      }
      setLoading(false)
    }

    fetchCurriculum()
  }, [profile])


  if (loading) {
     return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
           <p style={{ color: '#888', fontSize: '14px', fontWeight: 700 }}>Loading Curriculum...</p>
        </div>
     )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: '100px' }}>
      
      {/* HEADER */}
      <div style={{ padding: '40px 24px 20px', background: 'linear-gradient(135deg, #0f1a0f 0%, #0a0a0a 100%)', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '16px' }}>
         <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#1a2e10', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #2C5F2D' }}>
            <BookOpen size={24} color="#4ade80" />
         </div>
         <div>
            <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Academy
            </h1>
            <p style={{ color: '#888', fontSize: '14px', margin: 0, fontWeight: 500 }}>
              Master your journey
            </p>
         </div>
      </div>

      {/* THEMES STACK */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
         {themes.map(theme => {
             const isThemeExpanded = expandedTheme === theme.id;
             return (
               <div key={theme.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Theme Header Toggle */}
                  <div 
                    onClick={() => setExpandedTheme(isThemeExpanded ? null : theme.id)}
                    style={{ 
                        background: '#111', borderRadius: '20px', border: `1px solid ${isThemeExpanded ? '#2C5F2D' : '#222'}`, 
                        overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s ease' 
                    }}
                  >
                     <div style={{ padding: '24px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${theme.progress}%`, background: 'linear-gradient(90deg, rgba(44,95,45,0.05) 0%, rgba(44,95,45,0.15) 100%)', zIndex: 0, transition: 'width 1s ease-out' }} />
                        
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                           <p style={{ color: '#d4af37', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Course Theme</p>
                           <div style={{ transform: isThemeExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                              <ChevronDown size={20} color="#555" />
                           </div>
                        </div>

                        <h2 style={{ position: 'relative', zIndex: 1, color: '#fff', fontSize: '22px', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>{theme.name}</h2>
                        
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <div style={{ flex: 1, height: '6px', background: '#1a1a1a', borderRadius: '3px', overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${theme.progress}%` }} transition={{ duration: 1, ease: "easeOut" }} style={{ height: '100%', background: '#4ade80', borderRadius: '3px' }} />
                           </div>
                           <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: 800 }}>{theme.progress}%</span>
                        </div>
                     </div>
                  </div>

                  {/* Modules Dropdown (Only if Theme is expanded) */}
                  <AnimatePresence>
                     {isThemeExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '12px' }}
                        >
                           {theme.modules?.map((mod, idx) => {
                              const isModExpanded = expandedMod === mod.id;
                              return (
                                <div key={mod.id} style={{ background: '#0a0a0a', borderRadius: '16px', border: '1px solid #1a1a1a', overflow: 'hidden', opacity: mod.isLocked ? 0.6 : 1 }}>
                                   <div 
                                      onClick={() => !mod.isLocked && setExpandedMod(isModExpanded ? null : mod.id)}
                                      style={{ padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center', cursor: mod.isLocked ? 'not-allowed' : 'pointer' }}
                                   >
                                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: mod.progress === 100 ? '#1a2e10' : '#111', border: `1px solid ${mod.progress === 100 ? '#2C5F2D' : '#222'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                         {mod.isLocked ? <Lock size={16} color="#444" /> : (mod.progress === 100 ? <CheckCircle size={16} color="#4ade80" /> : <span style={{ color: '#666', fontSize: '12px', fontWeight: 800 }}>{idx + 1}</span>)}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                         <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: '0 0 2px' }}>{mod.title}</h4>
                                         <p style={{ color: '#555', fontSize: '11px', margin: 0, fontWeight: 600 }}>
                                            {mod.isLocked ? 'Locked' : `${mod.progress}% Complete`}
                                         </p>
                                      </div>
                                      {!mod.isLocked && (
                                        <div style={{ transform: isModExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                                          <ChevronDown size={18} color="#444" />
                                        </div>
                                      )}
                                   </div>

                                   {/* Topics Dropdown (Only if Module is expanded) */}
                                   <AnimatePresence>
                                      {isModExpanded && !mod.isLocked && (
                                         <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                            <div style={{ padding: '0 20px 20px 68px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                               {mod.topics?.map((topic) => (
                                                  <div key={topic.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                     <div style={{ marginTop: '3px' }}>
                                                        {topic.isCompleted ? <CheckCircle size={15} color="#4ade80" /> : <Circle size={15} color="#222" />}
                                                     </div>
                                                     <div>
                                                        <p style={{ color: topic.isCompleted ? '#fff' : '#888', fontSize: '14px', fontWeight: 600, margin: '0 0 2px' }}>
                                                           {topic.title}
                                                        </p>
                                                        {topic.isCompleted && (
                                                           <p style={{ color: '#2C5F2D', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>
                                                              Taught by: {topic.completedBy}
                                                           </p>
                                                        )}
                                                     </div>
                                                  </div>
                                               ))}
                                               {mod.topics?.length === 0 && <p style={{ color: '#333', fontSize: '12px' }}>No topics available.</p>}
                                            </div>
                                         </motion.div>
                                      )}
                                   </AnimatePresence>
                                </div>
                              )
                           })}
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
             )
         })}

         {themes.length === 0 && !loading && (
             <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <BookOpen size={48} color="#222" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ color: '#888', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No Academy Curriculum</h3>
                <p style={{ color: '#555', fontSize: '14px' }}>Please check back later.</p>
             </div>
         )}
      </div>

    </div>
  )
}
