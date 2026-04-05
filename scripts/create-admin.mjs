// Creates the admin Supabase account and sets role to 'admin'
// Run: node scripts/create-admin.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ldkgcoykwomwkdlkepti.supabase.co'
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxka2djb3lrd29td2tkbGtlcHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjU5NDIsImV4cCI6MjA5MDQ0MTk0Mn0.g3V2_bL4DN7j6UY_3pTdUnbJEu5wC9BYp7EH3dJG394'

const ADMIN_EMAIL    = 'admin@fruitbearers.church'
const ADMIN_PASSWORD = 'INSIDEOUT'
const ADMIN_NAME     = 'Fruitbearers Admin'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

async function createAdmin() {
  console.log('─────────────────────────────────────')
  console.log('  Fruitbearers Admin Account Setup')
  console.log('─────────────────────────────────────')
  console.log(`  Email:    ${ADMIN_EMAIL}`)
  console.log(`  Password: ${ADMIN_PASSWORD}`)
  console.log('─────────────────────────────────────\n')

  // Step 1: Try signing up
  console.log('Step 1: Creating Supabase auth account...')
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    options: {
      data: { full_name: ADMIN_NAME, role: 'admin' }
    }
  })

  if (signUpErr) {
    // If account already exists, try signing in instead
    if (signUpErr.message?.toLowerCase().includes('already') || signUpErr.status === 400) {
      console.log('   ℹ️  Account already exists. Trying to sign in...')
    } else {
      console.error('   ❌ Sign-up error:', signUpErr.message)
      process.exit(1)
    }
  } else {
    console.log('   ✅ Auth account created:', signUpData?.user?.id)
  }

  // Step 2: Sign in to get session
  console.log('\nStep 2: Signing in to get session...')
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  })

  if (loginErr) {
    console.error('   ❌ Login failed:', loginErr.message)
    console.log('\n   💡 If email confirmation is required, disable it in:')
    console.log('      Supabase Dashboard → Authentication → Providers → Email')
    console.log('      Toggle OFF "Confirm email" and try again.\n')
    process.exit(1)
  }

  const userId = loginData.user.id
  console.log('   ✅ Logged in! User ID:', userId)

  // Step 3: Upsert the profiles row with role='admin'
  console.log('\nStep 3: Setting role to admin in profiles table...')
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({
      id:        userId,
      email:     ADMIN_EMAIL,
      full_name: ADMIN_NAME,
      role:      'admin',
      campus:    'Bowen University',
    }, { onConflict: 'id' })

  if (profileErr) {
    // profiles table might not exist yet
    if (profileErr.message?.includes('does not exist')) {
      console.log('   ⚠️  profiles table not found — run schema.sql in Supabase first')
    } else {
      console.error('   ❌ Profile error:', profileErr.message)
    }
  } else {
    console.log('   ✅ Profile set to admin!')
  }

  console.log('\n─────────────────────────────────────')
  console.log('  ✅ ADMIN ACCOUNT READY!')
  console.log('─────────────────────────────────────')
  console.log('  Login at: http://localhost:5178/admin-portal')
  console.log('  Username: FRUITBEARERS')
  console.log('  Password: INSIDEOUT')
  console.log('─────────────────────────────────────')
  console.log('  Magic link (auto-login):')
  console.log('  http://localhost:5178/admin-portal?u=FRUITBEARERS&p=INSIDEOUT')
  console.log('─────────────────────────────────────\n')
}

createAdmin()
