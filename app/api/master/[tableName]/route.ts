// app/api/master/[tableName]/route.ts
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const { tableName: resource } = await params
  
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

    const { data, error } = await supabase
      .from(mappedTable)
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Error menambah data master:', error)
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Nama Jenis HKI / Nomor Kelas sudah terdaftar.' }, { status: 409 })
      }
      return NextResponse.json({ message: 'Gagal menambahkan data: ' + error.message }, { status: 400 })
    }

    revalidatePath('/dashboard/data-master')
    revalidatePath('/dashboard/data-pengajuan-fasilitasi')
    revalidatePath('/dashboard/hki/create')

    return NextResponse.json(
      { message: 'Data berhasil ditambahkan', data },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ message: 'Terjadi kesalahan internal server' }, { status: 500 })
  }
}
