// app/api/hki/[id]/signed-url/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const HKI_BUCKET = 'sertifikat-hki'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params
  const supabase = await createClient()
  const id = parseInt(rawId, 10)
  const { searchParams } = request.nextUrl
  const disposition = searchParams.get('disposition') // 'inline' or 'attachment'

  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    const { data: hkiEntry, error: fetchError } = await supabase
      .from('hki')
      .select('sertifikat_pdf, pemohon(nama_pemohon)')
      .eq('id_hki', id)
      .single()

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Gagal mengambil data HKI' },
        { status: 500 }
      )
    }

    if (!hkiEntry || !hkiEntry.sertifikat_pdf) {
      return NextResponse.json(
        { error: 'Sertifikat tidak tersedia untuk entri ini' },
        { status: 404 }
      )
    }

    const applicantName = hkiEntry.pemohon?.nama_pemohon || 'Tanpa_Nama'
    const sanitizedName = applicantName
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/ /g, '_')
    const newFilename = `Sertifikat-${sanitizedName}.pdf`

    // ✅ FIX: Logika diubah. Default adalah 'inline'. Hanya 'attachment' yang akan memaksa unduh.
    const options =
      disposition === 'attachment'
        ? { download: newFilename } // Paksa unduh dengan nama kustom
        : { download: false } // Biarkan browser menampilkannya (inline)

    const { data, error: urlError } = await supabase.storage
      .from(HKI_BUCKET)
      .createSignedUrl(hkiEntry.sertifikat_pdf, 300, options) // 5 menit

    if (urlError) {
      console.error('Supabase signed URL error:', urlError)
      return NextResponse.json(
        { error: 'Gagal membuat URL aman' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      fileName: newFilename, // fileName tetap dikirim untuk digunakan jika perlu
    })
  } catch (error: any) {
    console.error('Unexpected error in signed-url route:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    )
  }
}
