import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ldkgcoykwomwkdlkepti.supabase.co'
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxka2djb3lrd29td2tkbGtlcHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjU5NDIsImV4cCI6MjA5MDQ0MTk0Mn0.g3V2_bL4DN7j6UY_3pTdUnbJEu5wC9BYp7EH3dJG394'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

async function testSignup() {
  const email = `test_${Date.now()}@example.com`
  console.log('--- Testing Signup with email:', email)
  
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: 'Password123!',
    options: {
      data: { full_name: 'Testy Testerson' }
    }
  })
  
  if (error) {
    console.error('❌ Signup Error:', error.message)
    console.error('Status:', error.status)
    console.error('Full Error:', JSON.stringify(error, null, 2))
  } else {
    console.log('✅ Signup successful!')
    console.log('User ID:', data?.user?.id)
  }
}

testSignup()
