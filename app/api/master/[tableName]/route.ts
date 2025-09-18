// app/api/master/[tableName]/route.ts
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types' // <-- Tambahkan impor ini

// Definisikan tipe TableName dari Supabase types
type TableName = keyof Database['public']['Tables']

const TABLE_SAFELIST: TableName[] = ['jenis_hki', 'kelas_hki', 'pengusul']

/**
 * Admin Guard Helper
 */
async function isAdmin(supabase: any): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}

/**
 * POST: Membuat item data master baru
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tableName: string } }
) {
  const { tableName } = params
  // Lakukan type assertion di sini untuk pengecekan
  if (!TABLE_SAFELIST.includes(tableName as TableName)) {
    return NextResponse.json({ message: 'Tabel tidak valid' }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
  }

  try {
    const body = await request.json()

    // Validasi sederhana untuk mencegah duplikat ID di kelas_hki
    if (tableName === 'kelas_hki' && body.id_kelas) {
      const { data: existing } = await supabase
        .from('kelas_hki')
        .select('id_kelas')
        .eq('id_kelas', body.id_kelas)
        .single()
      if (existing) {
        return NextResponse.json(
          { message: `ID Kelas ${body.id_kelas} sudah digunakan.` },
          { status: 409 }
        )
      }
    }

    // Gunakan type assertion saat memanggil .from()
    const { data, error } = await supabase
      .from(tableName as TableName)
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Error membuat data master:', error)
      // Tangani error spesifik jika ada, misalnya duplikasi
      if (error.code === '23505') {
        // unique_violation
        return NextResponse.json(
          { message: 'Data dengan nama/ID tersebut sudah ada.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Data berhasil dibuat', data },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
