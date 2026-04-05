import https from 'https'

const VITE_SUPABASE_URL = 'https://ldkgcoykwomwkdlkepti.supabase.co'

https.get(VITE_SUPABASE_URL, (res) => {
  console.log('Status code:', res.statusCode)
  res.on('data', (d) => {
    // console.log(d.toString().slice(0, 100))
  })
}).on('error', (e) => {
  console.error('Fetch error:', e.message)
})
