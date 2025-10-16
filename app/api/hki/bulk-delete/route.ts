// app/api/hki/bulk-delete/route.ts
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const HKI_TABLE = 'hki'
const HKI_BUCKET = 'sertifikat-hki'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // 1. Validasi Sesi dan Peran Admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin yang dapat menghapus data.' },
        { status: 403 }
      )
    }

    // 2. Validasi Input
    const { ids } = await request.json()
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Daftar ID tidak valid atau kosong.' },
        { status: 400 }
      )
    }

    // 3. Ambil path file yang akan dihapus dari storage
    const { data: entriesToDelete, error: fetchError } = await supabase
      .from(HKI_TABLE)
      .select('sertifikat_pdf')
      .in('id_hki', ids)

    if (fetchError) {
      console.error('Supabase fetch error (bulk-delete):', fetchError)
      return NextResponse.json(
        { error: 'Gagal mengambil data HKI untuk dihapus.' },
        { status: 500 }
      )
    }

    // 4. Hapus entri dari tabel database
    const { error: deleteError } = await supabase
      .from(HKI_TABLE)
      .delete()
      .in('id_hki', ids) 

    if (deleteError) {
      console.error('Supabase delete error (bulk-delete):', deleteError)
      return NextResponse.json(
        { error: 'Gagal menghapus entri HKI dari database.' },
        { status: 500 }
      )
    }

    // 5. Hapus file terkait dari storage jika ada
    if (entriesToDelete && entriesToDelete.length > 0) {
      const filePaths = entriesToDelete
        .map((e) => e.sertifikat_pdf)
        .filter(Boolean) as string[]
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(HKI_BUCKET)
          .remove(filePaths)
        if (storageError) {
          console.warn(
            'Gagal menghapus beberapa file dari storage:',
            storageError
          )
        }
      }
    }

    return NextResponse.json(
      {
        message: `${ids.length} entri berhasil dihapus.`,
        deletedIds: ids,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Unexpected bulk delete error:', error)
    if (error.name === 'SyntaxError') {
      return NextResponse.json(
        { error: 'Request body tidak valid (bukan JSON).' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    )
  }
}
