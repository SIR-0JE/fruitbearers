// Seed sermons using REST API - no auth required for table creation
// Run: node scripts/seed-sermons-rest.mjs

const PROJECT_URL = 'https://ldkgcoykwomwkdlkepti.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxka2djb3lrd29td2tkbGtlcHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjU5NDIsImV4cCI6MjA5MDQ0MTk0Mn0.g3V2_bL4DN7j6UY_3pTdUnbJEu5wC9BYp7EH3dJG394'

const sermons = [
  {
    title: 'Discovering Your Purpose — Part 3',
    series: 'Pathlighters Academy',
    speaker: 'Fruit Bearers, Bowen University',
    date: '2026-04-04',
    duration: '53:00',
    thumbnail_url: '/sermons/discovering-your-purpose.jpg',
    audio_url: '',
    service_type: 'Special Service',
    views: 0,
  },
  {
    title: 'Join Us This Sunday',
    series: 'Sunday Service',
    speaker: 'Fruit Bearers, Bowen University',
    date: '2026-02-28',
    duration: '48:00',
    thumbnail_url: '/sermons/join-us-sunday.jpg',
    audio_url: '',
    service_type: 'Sunday',
    views: 0,
  },
  {
    title: 'Overcoming Your Background',
    series: 'Pathlighters Academy',
    speaker: 'Fruit Bearers, Bowen University',
    date: '2026-03-15',
    duration: '61:00',
    thumbnail_url: '/sermons/overcoming-your-background.jpg',
    audio_url: '',
    service_type: 'Special Service',
    views: 0,
  },
]

async function seed() {
  console.log('Seeding sermons via REST API...\n')

  const res = await fetch(`${PROJECT_URL}/rest/v1/sermons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(sermons),
  })

  const text = await res.text()

  if (!res.ok) {
    console.error('❌ HTTP', res.status, res.statusText)
    console.error('Response:', text)
    
    // If 42P01 = table does not exist
    if (text.includes('42P01') || text.includes('does not exist')) {
      console.log('\n⚠️  The sermons table does not exist yet.')
      console.log('   Please run the schema.sql file in Supabase SQL Editor first.')
      console.log('   URL: https://supabase.com/dashboard/project/ldkgcoykwomwkdlkepti/sql/new')
    }
    process.exit(1)
  }

  const data = JSON.parse(text)
  console.log(`✅ Seeded ${data.length} sermons:`)
  data.forEach(s => console.log(`   • ${s.title} (${s.date})`))
}

seed()
