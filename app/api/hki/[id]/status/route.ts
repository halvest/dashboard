// app/api/hki/[id]/status/route.ts
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const hkiId = parseInt(params.id, 10)
  if (isNaN(hkiId)) {
    return NextResponse.json(
      { success: false, message: 'ID HKI tidak valid.' },
      { status: 400 }
    )
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya admin yang dapat melakukan tindakan ini.' },
        { status: 403 }
      )
    }

    const { statusId } = await request.json()
    if (typeof statusId !== 'number') {
      return NextResponse.json(
        { success: false, message: 'ID Status tidak valid atau tidak ditemukan.' },
        { status: 400 }
      )
    }

    const { data: updatedData, error } = await supabase
      .from('hki')
      .update({
        id_status: statusId,
        updated_at: new Date().toISOString(),
      })
      .eq('id_hki', hkiId)
      .select('id_hki, status_hki(nama_status)')
      .single()

    if (error) {
      console.error('Gagal update status inline:', error)
      if (error.code === 'PGRST116') { // Kode error untuk "no rows returned"
        return NextResponse.json(
          { success: false, message: `Data HKI dengan ID ${hkiId} tidak ditemukan.` },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { success: false, message: 'Terjadi kesalahan pada database.' },
        { status: 500 }
      )
    }

    if (!updatedData || !updatedData.status_hki) {
        return NextResponse.json(
            { success: false, message: 'Gagal mendapatkan data terbaru setelah pembaruan.' },
            { status: 500 }
        );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Status berhasil diperbarui ke "${updatedData.status_hki.nama_status}"`,
        data: updatedData,
      },
      { status: 200 }
    )
  } catch (err: unknown) { 
    console.error('Error di API update status:', err)
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan internal.'
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}