const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const { data, error } = await supabase.from('profiles').select('id, full_name, role').eq('email', 'olaniyiojedokun24@gmail.com').single();
    if (error) {
      console.error('Connection Error:', error.message);
    } else {
      console.log('✅ Connection Successful!');
      console.log('User Profile:', data);
    }
  } catch (e) {
    console.error('Catch Connection Error:', e.message);
  }
}

test();
