// app/api/master/[tableName]/[id]/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/database.types'

type TableName = keyof Database['public']['Tables']

const RESOURCE_MAP: Record<string, TableName> = {
  'jenis-hki': 'jenis_hki',
  'kelas-hki': 'kelas_hki',
  'jenis_hki': 'jenis_hki',
  'kelas_hki': 'kelas_hki',
  'pengusul': 'pengusul',
}

const ID_COLUMN_MAP: Record<TableName, string> = {
  jenis_hki: 'id_jenis_hki',
  kelas_hki: 'id_kelas',
  pengusul: 'id_pengusul',
  hki: 'id_hki',
  pemohon: 'id_pemohon',
  profiles: 'id',
  status_hki: 'id_status'
}

async function isAdmin(supabase: any): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role === 'admin'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string; id: string }> }
) {
  const { tableName: resource, id } = await params
  
  const mappedTable = RESOURCE_MAP[resource]
  if (!mappedTable) {
    return NextResponse.json({ message: 'Resource tidak valid' }, { status: 404 })
  }

  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const idColumn = ID_COLUMN_MAP[mappedTable]

    if (body[idColumn]) {
      delete body[idColumn]
    }

    const { data, error } = await supabase
      .from(mappedTable)
      .update(body)
      .eq(idColumn, id)
      .select()
      .single()

    if (error) {
      console.error('Error memperbarui data master:', error)
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Nama Jenis HKI / Nomor Kelas sudah terdaftar.' }, { status: 409 })
      }
      return NextResponse.json({ message: 'Gagal memperbarui data: ' + error.message }, { status: 400 })
    }

    revalidatePath('/dashboard/data-master')
    revalidatePath('/dashboard/data-pengajuan-fasilitasi')
    revalidatePath('/dashboard/hki/create')

    return NextResponse.json(
      { message: 'Data berhasil diperbarui', data },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json({ message: 'Terjadi kesalahan internal server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string; id: string }> }
) {
  const { tableName: resource, id } = await params
  
  const mappedTable = RESOURCE_MAP[resource]
  if (!mappedTable) {
    return NextResponse.json({ message: 'Resource tidak valid' }, { status: 404 })
  }

  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
  }

  try {
    const idColumn = ID_COLUMN_MAP[mappedTable]

    const { error } = await supabase
      .from(mappedTable)
      .delete()
      .eq(idColumn, id)

    if (error) {
      console.error('Error menghapus data master:', error)
      if (error.code === '23503') {
        return NextResponse.json(
          {
            message: 'Data tidak dapat dihapus karena masih digunakan pada data pengajuan HKI. Silakan gunakan fitur Nonaktifkan.',
          },
          { status: 409 }
        )
      }
      return NextResponse.json({ message: 'Gagal menghapus data: ' + error.message }, { status: 400 })
    }

    revalidatePath('/dashboard/data-master')
    revalidatePath('/dashboard/data-pengajuan-fasilitasi')
    revalidatePath('/dashboard/hki/create')

    return NextResponse.json(
      { message: 'Data berhasil dihapus permanen' },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json({ message: 'Terjadi kesalahan internal server' }, { status: 500 })
  }
}
