// Run this once to seed 3 real sermon records into Supabase
// Usage: node scripts/seed-sermons.mjs

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ldkgcoykwomwkdlkepti.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxka2djb3lrd29td2tkbGtlcHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjU5NDIsImV4cCI6MjA5MDQ0MTk0Mn0.g3V2_bL4DN7j6UY_3pTdUnbJEu5wC9BYp7EH3dJG394'
)

// NOTE: thumbnail_url uses relative paths served by Vite from /public/sermons/
// In production, you'd upload these to Supabase Storage and use the public URL.
// For the local PWA demo, the /sermons/ folder paths work perfectly.

const sermons = [
  {
    title: 'Discovering Your Purpose — Part 3',
    series: 'Pathlighters Academy',
    speaker: 'Fruit Bearers, Bowen University',
    date: '2026-04-04',
    duration: '53:00',
    thumbnail_url: '/sermons/discovering-your-purpose.jpg',
    audio_url: null,
    views: 0,
  },
  {
    title: 'Join Us This Sunday',
    series: 'Sunday Service',
    speaker: 'Fruit Bearers, Bowen University',
    date: '2026-02-28',
    duration: '48:00',
    thumbnail_url: '/sermons/join-us-sunday.jpg',
    audio_url: null,
    views: 0,
  },
  {
    title: 'Overcoming Your Background',
    series: 'Pathlighters Academy',
    speaker: 'Fruit Bearers, Bowen University',
    date: '2026-03-15',
    duration: '61:00',
    thumbnail_url: '/sermons/overcoming-your-background.jpg',
    audio_url: null,
    views: 0,
  },
]

async function seed() {
  console.log('Seeding sermons...')

  const { data, error } = await supabase
    .from('sermons')
    .upsert(sermons, { onConflict: 'title' })
    .select()

  if (error) {
    console.error('❌ Error:', error.message)
    console.error('Details:', error.details)
    process.exit(1)
  }

  console.log(`✅ Inserted ${data.length} sermons:`)
  data.forEach(s => console.log(`   • [${s.id}] ${s.title}`))
}

seed()
