import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // pakai service role key (jangan anon key) supaya selalu bisa query
)

export async function GET() {
  try {
    // Query dummy ke tabel hki
    const { data, error } = await supabase.from('hki').select('id_hki').limit(1)

    if (error) {
      return NextResponse.json({ ok: false, error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: 'Supabase project aktif ✅',
      data,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, err }, { status: 500 })
  }
}
