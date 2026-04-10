import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, CheckCircle, ChevronDown, ChevronUp, Lock } from 'lucide-react'

export default function LessonsScreen() {
  const { profile } = useAuth()
  const [academyInfo, setAcademyInfo] = useState(null)
  const [modules, setModules] = useState([])
  const [attendanceMap, setAttendanceMap] = useState({}) // { lesson_id: boolean }
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState({}) // { module_id: boolean }

  useEffect(() => {
    async function load() {
      if (!profile?.id) return

      // 1. Fetch the academy
      const { data: academy } = await supabase
        .from('academies')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single()
      
      if (academy) setAcademyInfo(academy)

      // 2. Fetch modules with their nested lessons
      const { data: mods } = await supabase
        .from('modules')
        .select(`*, lessons(*)`)
        .order('order_number', { ascending: true })

      // 3. Fetch user's attendance records for lessons
      const { data: attendance } = await supabase
        .from('lesson_attendance')
        .select('lesson_id')
        .eq('user_id', profile.id)

      const attnMap = {}
      attendance?.forEach(a => { attnMap[a.lesson_id] = true })
      setAttendanceMap(attnMap)

      if (mods) {
        // Sort lessons inside modules
        mods.forEach(m => m.lessons?.sort((a,b) => a.order_number - b.order_number))
        setModules(mods)

        // Expand the first module by default
        if (mods.length > 0) {
          setExpandedModules({ [mods[0].id]: true })
        }
      }
      setLoading(false)
    }
    load()
  }, [profile])

  const toggleModule = (modId) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }))
  }

  // --- Dynamic Calculations ---
  let totalLessons = 0
  let attendedLessons = 0

  modules.forEach(m => {
    if (m.lessons) {
      totalLessons += m.lessons.length
      m.lessons.forEach(l => {
        if (attendanceMap[l.id]) attendedLessons++
      })
    }
  })

  const progressPercentage = totalLessons > 0 ? Math.round((attendedLessons / totalLessons) * 100) : 0

  if (loading) {
    return (
      <div style={{ background: '#0e0e0e', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <p style={{ fontSize: '14px', color: '#555' }}>Loading Academy...</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#0e0e0e', minHeight: '100%', paddingTop: '52px', paddingBottom: '90px' }}>
      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '14px', background: '#1a2e10', border: '1.5px solid #2C5F2D', marginBottom: '16px' }}>
          <BookOpen size={24} color="#4ade80" />
        </div>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          {academyInfo?.name || 'Pathlighters Academy'}
        </h1>
        <p style={{ color: '#aaa', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
          {academyInfo?.description || 'Your learning journey to becoming a fully equipped disciple.'}
        </p>
      </div>

      {/* Progress Card */}
      <div style={{ padding: '0 20px', marginBottom: '32px' }}>
        <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div>
              <p style={{ color: '#777', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Overall Progress</p>
              <p style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: 0 }}>{attendedLessons} of {totalLessons} lessons</p>
            </div>
            <p style={{ color: '#4ade80', fontSize: '24px', fontWeight: 900, margin: 0 }}>{progressPercentage}%</p>
          </div>
          
          <div style={{ height: '8px', background: '#222', borderRadius: '100px', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #2C5F2D, #4ade80)', borderRadius: '100px' }}
            />
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {modules.map((mod, index) => {
          const modTotal = mod.lessons?.length || 0
          const modAttended = mod.lessons?.filter(l => attendanceMap[l.id]).length || 0
          const isExpanded = expandedModules[mod.id]
          const isComplete = modTotal > 0 && modAttended === modTotal

          return (
            <div key={mod.id} style={{ background: '#111', borderRadius: '20px', border: `1px solid ${isExpanded ? '#333' : '#222'}`, overflow: 'hidden', transition: 'all 0.3s' }}>
              
              {/* Module Header */}
              <div 
                onClick={() => toggleModule(mod.id)}
                style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? '#151515' : 'transparent' }}
              >
                <div style={{ flex: 1, paddingRight: '16px' }}>
                  <p style={{ color: isComplete ? '#4ade80' : '#d4af37', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                    Module {index + 1}
                  </p>
                  <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, margin: '0 0 4px' }}>{mod.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '40px', height: '4px', background: '#222', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${modTotal > 0 ? (modAttended/modTotal)*100 : 0}%`, height: '100%', background: isComplete ? '#4ade80' : '#d4af37' }} />
                    </div>
                    <span style={{ color: '#777', fontSize: '11px', fontWeight: 600 }}>{modAttended}/{modTotal} completed</span>
                  </div>
                </div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {/* Lessons List Dropdown */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '0 12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {mod.lessons?.length === 0 && (
                        <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No lessons assigned yet</p>
                      )}
                      
                      {mod.lessons?.map((lesson, lIndex) => {
                        const attended = attendanceMap[lesson.id]
                        return (
                          <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', padding: '14px', background: attended ? '#121f10' : '#1a1a1a', borderRadius: '14px', border: `1px solid ${attended ? 'rgba(44,95,45,0.4)' : '#252525'}` }}>
                            
                            {/* Icon */}
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: attended ? '#2C5F2D' : '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: '14px' }}>
                              {attended ? <CheckCircle size={18} color="#fff" /> : <Lock size={16} color="#555" />}
                            </div>

                            {/* Details */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ color: attended ? '#fff' : '#aaa', fontSize: '14px', fontWeight: 700, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {lesson.title}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {lesson.coach_avatar_url ? (
                                  <img src={lesson.coach_avatar_url} alt="" style={{ width: '12px', height: '12px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '6px', color: '#fff', fontWeight: 800 }}>{lesson.coach_name?.charAt(0) || 'C'}</span>
                                  </div>
                                )}
                                <span style={{ color: '#666', fontSize: '11px', fontWeight: 600 }}>{lesson.coach_name || 'TBA'}</span>
                              </div>
                            </div>

                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
            </div>
          )
        })}

        {modules.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <BookOpen size={48} color="#333" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Curriculum Coming Soon</p>
            <p style={{ color: '#777', fontSize: '14px', lineHeight: 1.5 }}>Our leadership team is currently preparing the next season of academy modules.</p>
          </div>
        )}
      </div>

    </div>
  )
}
