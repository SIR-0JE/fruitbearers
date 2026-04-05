import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('[Supabase Init] URL:', rawUrl)
// console.log('[Supabase Init] Key present:', !!rawKey)

// Detect placeholder / unconfigured values
const isConfigured =
  rawUrl &&
  rawKey &&
  rawUrl !== 'your_supabase_project_url' &&
  rawKey !== 'your_supabase_anon_key' &&
  rawUrl.startsWith('https://')

if (!isConfigured) {
  console.warn(
    '%c⚠ Supabase not configured',
    'color: orange; font-weight: bold',
    '\nAdd VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  )
}

const supabaseUrl = isConfigured ? rawUrl : 'https://placeholder.supabase.co'
const supabaseKey = isConfigured ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    // Explicit error wrapper for "Failed to Fetch"
    fetch: async (...args) => {
      try {
        const res = await fetch(...args)
        return res
      } catch (err) {
        console.error('🔴 CRITICAL: Supabase API unreachable.', {
          url: args[0],
          message: err.message,
          stack: err.stack,
          tip: 'Check if your Supabase project is PAUSED or if your network is blocking the request.'
        })
        throw err
      }
    }
  },
  db: {
    schema: 'public',
  }
})

export const isSupabaseConfigured = isConfigured

// Auto-test on load
if (isConfigured) {
  supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1)
    .then(({ error }) => {
      if (error) console.error('[Supabase Test] Connection Error:', error.message)
      else console.log('[Supabase Test] ✅ Connection successful!')
    })
    .catch(e => console.error('[Supabase Test] Fetch failed:', e))
}
