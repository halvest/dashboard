// app/api/master/[tableName]/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

type TableName = keyof Database['public']['Tables']

const TABLE_SAFELIST: TableName[] = ['jenis_hki', 'kelas_hki', 'pengusul']

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const { tableName } = await params
  if (!TABLE_SAFELIST.includes(tableName as TableName)) {
    return NextResponse.json({ message: 'Tabel tidak valid' }, { status: 400 })
  }

  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
  }

  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from(tableName as TableName)
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Error menambah data master:', error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Data berhasil ditambahkan', data },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
