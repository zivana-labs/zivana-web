// Local-dev helper: generate a magic link WITHOUT relying on email delivery.
// Reads .env.local, uses the service-role key, prints ONLY the action link.
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2].trim()
  }
  return out
}

const env = loadEnv(path.join(__dirname, '.env.local'))
const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2]
const redirectTo = process.argv[3] || 'http://localhost:3001/auth/callback?next=/contribute/dashboard'

if (!url || !serviceKey) { console.error('missing url/service key in .env.local'); process.exit(1) }
if (!email) { console.error('usage: node scripts_gen_link.js <email> [redirectTo]'); process.exit(1) }

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

;(async () => {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })
  if (error) { console.error('ERROR:', error.message); process.exit(1) }
  console.log('\nOPEN THIS LINK IN YOUR BROWSER:\n')
  console.log(data.properties.action_link)
  console.log('')
})().catch(e => { console.error('FATAL', e.message); process.exit(1) })
