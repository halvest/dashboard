// app/api/master/[tableName]/[id]/route.ts
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

// Definisikan tipe TableName dari Supabase types
type TableName = keyof Database['public']['Tables']

const TABLE_SAFELIST: TableName[] = ['jenis_hki', 'kelas_hki', 'pengusul']

const ID_COLUMN_MAP: Record<string, string> = {
  jenis_hki: 'id_jenis_hki',
  kelas_hki: 'id_kelas',
  pengusul: 'id_pengusul',
}

/**
 * Helper terpusat untuk otentikasi dan otorisasi admin.
 */
async function authorizeAdmin(supabase: SupabaseClient<Database>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ message: 'Tidak terautentikasi' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return { error: NextResponse.json({ message: 'Akses ditolak. Tindakan ini memerlukan hak admin.' }, { status: 403 }) }
  }

  return { user, error: null }
}

/**
 * PATCH: Memperbarui item data master
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { tableName: string; id: string } }
) {
  const { tableName, id } = params
  if (!TABLE_SAFELIST.includes(tableName as TableName)) {
    return NextResponse.json({ message: 'Tabel tidak valid atau tidak diizinkan.' }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // --- PERBAIKAN 1: Menggunakan helper otorisasi ---
    const { error: authError } = await authorizeAdmin(supabase)
    if (authError) return authError

    const body = await request.json()
    
    // --- PERBAIKAN 2: Validasi body dan ID ---
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ message: 'Request body tidak boleh kosong.' }, { status: 400 })
    }
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
        return NextResponse.json({ message: 'ID tidak valid.' }, { status: 400 });
    }

    const idColumn = ID_COLUMN_MAP[tableName]

    // Hapus ID dari body untuk mencegah pembaruan Primary Key
    if (body[idColumn]) {
      delete body[idColumn]
    }

    const { data, error } = await supabase
      .from(tableName as TableName)
      .update(body)
      .eq(idColumn, numericId)
      .select()
      .single()

    if (error) {
      console.error('Error memperbarui data master:', error)
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ message: 'Data dengan nama/nilai tersebut sudah ada.' }, { status: 409 });
      }
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ message: 'Data yang akan diupdate tidak ditemukan.' }, { status: 404 });
      }
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: 'Data berhasil diperbarui', data },
      { status: 200 }
    )
  } catch (err: unknown) { // --- PERBAIKAN 3: Type-safe catch block ---
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga.'
    console.error('Error di API Master PATCH:', message);
    return NextResponse.json({ message }, { status: 500 })
  }
}

/**
 * DELETE: Menghapus item data master
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tableName: string; id: string } }
) {
  const { tableName, id } = params
  if (!TABLE_SAFELIST.includes(tableName as TableName)) {
    return NextResponse.json({ message: 'Tabel tidak valid atau tidak diizinkan.' }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // --- PERBAIKAN 1: Menggunakan helper otorisasi ---
    const { error: authError } = await authorizeAdmin(supabase)
    if (authError) return authError
    
    // --- PERBAIKAN 2: Validasi ID ---
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
        return NextResponse.json({ message: 'ID tidak valid.' }, { status: 400 });
    }

    const idColumn = ID_COLUMN_MAP[tableName]

    const { error } = await supabase
      .from(tableName as TableName)
      .delete()
      .eq(idColumn, numericId)

    if (error) {
      console.error('Error menghapus data master:', error)
      if (error.code === '23503') { // Foreign key constraint
        return NextResponse.json(
          { message: 'Data tidak dapat dihapus karena masih digunakan oleh entri HKI.' },
          { status: 409 } // 409 Conflict
        )
      }
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: 'Data berhasil dihapus' },
      { status: 200 }
    )
  } catch (err: unknown) { // --- PERBAIKAN 3: Type-safe catch block ---
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga.'
    console.error('Error di API Master DELETE:', message);
    return NextResponse.json({ message }, { status: 500 })
  }
}