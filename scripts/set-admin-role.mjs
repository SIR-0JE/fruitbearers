// Quick-fix: Set admin@fruitbearers.church role to admin in profiles
// Run: node scripts/set-admin-role.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ldkgcoykwomwkdlkepti.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxka2djb3lrd29td2tkbGtlcHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjU5NDIsImV4cCI6MjA5MDQ0MTk0Mn0.g3V2_bL4DN7j6UY_3pTdUnbJEu5wC9BYp7EH3dJG394'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

async function run() {
  // Sign in as admin
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@fruitbearers.church',
    password: 'INSIDEOUT',
  })

  if (error) {
    console.error('❌ Could not sign in:', error.message)
    if (error.message.includes('Email not confirmed')) {
      console.log('\n🔧 Fix: Go to Supabase Dashboard and disable email confirmation:')
      console.log('   https://supabase.com/dashboard/project/ldkgcoykwomwkdlkepti/auth/providers')
      console.log('   → Email provider → Toggle OFF "Confirm email"')
      console.log('   Then run this script again.\n')
    }
    process.exit(1)
  }

  const uid = data.user.id
  console.log('✅ Signed in. User ID:', uid)

  // Try minimal upsert (just the required fields)
  const { error: e2 } = await supabase
    .from('profiles')
    .upsert({ id: uid, full_name: 'Fruitbearers Admin', email: 'admin@fruitbearers.church', role: 'admin' }, { onConflict: 'id' })

  if (e2) {
    console.log('⚠️  Could not update profile table:', e2.message)
    console.log('\n💡 The profiles table schema needs to be created first.')
    console.log('   Run schema.sql in Supabase SQL Editor:')
    console.log('   https://supabase.com/dashboard/project/ldkgcoykwomwkdlkepti/sql/new\n')
    
    // Final check: can we log into the admin portal?
    console.log('─────────────────────────────────────────────────────')
    console.log('AUTH LOGIN WORKS — you can log into /admin-portal now!')
    console.log('But the dashboard data needs the DB schema to be set up.')
    console.log('─────────────────────────────────────────────────────')
  } else {
    console.log('✅ Profile role set to admin!')
    console.log('\n🎉 All done! Go to:')
    console.log('   http://localhost:5178/admin-portal')
    console.log('   Username: FRUITBEARERS')
    console.log('   Password: INSIDEOUT')
  }
}

run()
