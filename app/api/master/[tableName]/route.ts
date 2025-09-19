// app/api/master/[tableName]/route.ts
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

// Definisikan tipe TableName dari Supabase types
type TableName = keyof Database['public']['Tables']

const TABLE_SAFELIST: TableName[] = ['jenis_hki', 'kelas_hki', 'pengusul']

/**
 * Helper terpusat untuk otentikasi dan otorisasi admin.
 */
async function authorizeAdmin(supabase: SupabaseClient<Database>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { user: null, error: NextResponse.json({ message: 'Tidak terautentikasi' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return { user: null, error: NextResponse.json({ message: 'Akses ditolak. Tindakan ini memerlukan hak admin.' }, { status: 403 }) }
  }

  return { user, error: null }
}

/**
 * POST: Membuat item data master baru
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tableName: string } }
) {
  const { tableName } = params
  if (!TABLE_SAFELIST.includes(tableName as TableName)) {
    return NextResponse.json({ message: 'Tabel tidak valid atau tidak diizinkan.' }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const { error: authError } = await authorizeAdmin(supabase)
    if (authError) return authError

    const body = await request.json()

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ message: 'Request body tidak boleh kosong.' }, { status: 400 })
    }

    // Validasi duplikat ID khusus untuk tabel 'kelas_hki'
    if (tableName === 'kelas_hki' && body.id_kelas) {
      // --- PERBAIKAN: Destructuring 'count' dengan benar ---
      const { count, error: countError } = await supabase
        .from('kelas_hki')
        .select('id_kelas', { count: 'exact', head: true })
        .eq('id_kelas', body.id_kelas)
      
      if (countError) {
        throw new Error(`Gagal memeriksa duplikasi: ${countError.message}`);
      }
      
      if (count && count > 0) {
        return NextResponse.json(
          { message: `ID Kelas ${body.id_kelas} sudah digunakan.` },
          { status: 409 } // 409 Conflict
        )
      }
    }

    // Insert data baru
    const { data, error } = await supabase
      .from(tableName as TableName)
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Error membuat data master:', error)
      if (error.code === '23505') { // unique_violation
        return NextResponse.json(
          { message: 'Data dengan nama atau ID tersebut sudah ada.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Data berhasil dibuat', data },
      { status: 201 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga.'
    console.error('Error di API Master POST:', message)
    return NextResponse.json({ message }, { status: 500 })
  }
}