import { createClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'
import path from 'path'

loadEnvConfig(process.cwd())

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.rpc('get_hki_report_summary', {
    p_year: null,
    p_status_id: null
  })
  
  if (error) {
    console.error('RPC Error:', error)
  } else {
    console.log('RPC Result:', JSON.stringify(data, null, 2))
  }
  
  // Test raw count
  const { count, error: err2 } = await supabase.from('hki').select('*', { count: 'exact', head: true })
  console.log('Raw HKI count:', count)
}

run()
