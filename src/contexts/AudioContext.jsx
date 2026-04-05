import { createContext, useContext, useState, useRef, useEffect } from 'react'
import { Howl } from 'howler'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const AudioContext = createContext(null)

export function AudioProvider({ children }) {
  const [currentSermon, setCurrentSermon] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showFullPlayer, setShowFullPlayer] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [resumeAvailable, setResumeAvailable] = useState(null)
  const howlerRef = useRef(null)
  
  // profile moved to useEffect if needed, or method calls

  const playSermon = async (sermon) => {
    if (currentSermon?.id === sermon.id) {
      togglePlay()
      setShowFullPlayer(true)
      return
    }

    if (howlerRef.current) howlerRef.current.unload()
    const { data: { session } } = await supabase.auth.getSession()
    const { data: prof } = session?.user ? await supabase.from('profiles').select('id, full_name, email').eq('id', session.user.id).single() : { data: null }
    
    // Check for existing progress
    let startPos = 0
    if (prof?.id) {
       const { data } = await supabase.from('sermon_progress')
         .select('last_position').eq('user_id', prof.id).eq('sermon_id', sermon.id).single()
       if (data?.last_position > 5) {
         startPos = data.last_position
         setResumeAvailable(startPos)
       }
    }

    const sound = new Howl({
      src: [sermon.audio_url],
      html5: true,
      rate: playbackRate,
      onplay: () => setIsPlaying(true),
      onpause: () => {
         setIsPlaying(false)
         saveProgress(sermon.id, sound.seek())
      },
      onend: () => {
         setIsPlaying(false)
         saveProgress(sermon.id, 0, true)
      },
      onload: () => setDuration(sound.duration()),
    })

    sound.play()
    if (startPos > 0) sound.seek(startPos)
    
    howlerRef.current = sound
    setCurrentSermon(sermon)
    setIsPlaying(true)
    setShowFullPlayer(true)
    
    // Auto-clear resume toast after 5s
    setTimeout(() => setResumeAvailable(null), 5000)
  }

  const saveProgress = async (sermonId, pos, completed = false) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) return
    await supabase.from('sermon_progress').upsert({
      user_id: session.user.id,
      sermon_id: sermonId,
      last_position: Math.floor(pos),
      completed: completed,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,sermon_id' })
  }

  const changeRate = (newRate) => {
    setPlaybackRate(newRate)
    if (howlerRef.current) howlerRef.current.rate(newRate)
  }

  const togglePlay = () => {
    if (!howlerRef.current) return
    if (isPlaying) {
      howlerRef.current.pause()
    } else {
      howlerRef.current.play()
    }
  }

  const seekTo = (seconds) => {
    if (!howlerRef.current) return
    howlerRef.current.seek(seconds)
    setProgress(seconds)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (howlerRef.current && isPlaying) {
        setProgress(howlerRef.current.seek())
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isPlaying])

  return (
    <AudioContext.Provider value={{
      currentSermon,
      isPlaying,
      showFullPlayer,
      progress,
      duration,
      playbackRate,
      resumeAvailable,
      playSermon,
      togglePlay,
      seekTo,
      changeRate,
      setShowFullPlayer,
      setCurrentSermon,
      setResumeAvailable
    }}>
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = () => useContext(AudioContext)
