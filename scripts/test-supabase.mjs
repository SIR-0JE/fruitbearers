import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ldkgcoykwomwkdlkepti.supabase.co'
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxka2djb3lrd29td2tkbGtlcHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjU5NDIsImV4cCI6MjA5MDQ0MTk0Mn0.g3V2_bL4DN7j6UY_3pTdUnbJEu5wC9BYp7EH3dJG394'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

async function checkDatabase() {
  console.log('--- Testing Supabase Connection ---')
  const { data, error } = await supabase.from('profiles').select('id').limit(1)
  
  if (error) {
    console.error('❌ Error selecting from profiles:', error.message)
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
        console.error('💡 The profiles table seems missing. You need to run the schema.sql in Supabase.')
    }
  } else {
    console.log('✅ Connection to profiles table successful!')
    console.log('Found profiles count:', data?.length)
  }
}

checkDatabase()
