// app/api/master/[tableName]/[id]/route.ts
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types' // <-- Tambahkan impor ini

// Definisikan tipe TableName dari Supabase types
type TableName = keyof Database['public']['Tables']

const TABLE_SAFELIST: TableName[] = ['jenis_hki', 'kelas_hki', 'pengusul']

const ID_COLUMN_MAP: Record<string, string> = {
  jenis_hki: 'id_jenis_hki',
  kelas_hki: 'id_kelas',
  pengusul: 'id_pengusul',
}

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
 * PATCH: Memperbarui item data master
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { tableName: string; id: string } }
) {
  const { tableName, id } = params
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
    const idColumn = ID_COLUMN_MAP[tableName]

    // Hapus ID dari body untuk mencegah pembaruan Primary Key
    if (body[idColumn]) {
      delete body[idColumn]
    }

    // Gunakan type assertion saat memanggil .from()
    const { data, error } = await supabase
      .from(tableName as TableName)
      .update(body)
      .eq(idColumn, id)
      .select()
      .single()

    if (error) {
      console.error('Error memperbarui data master:', error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Data berhasil diperbarui', data },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
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
    const idColumn = ID_COLUMN_MAP[tableName]

    // Gunakan type assertion saat memanggil .from()
    const { error } = await supabase
      .from(tableName as TableName)
      .delete()
      .eq(idColumn, id)

    if (error) {
      console.error('Error menghapus data master:', error)
      // Tangani error foreign key constraint
      if (error.code === '23503') {
        return NextResponse.json(
          {
            message:
              'Data tidak dapat dihapus karena masih digunakan oleh entri HKI.',
          },
          { status: 409 }
        )
      }
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Data berhasil dihapus' },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
