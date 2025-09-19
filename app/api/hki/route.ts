// app/api/hki/route.ts
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { Database } from '@/lib/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const HKI_TABLE = 'hki'
const PEMOHON_TABLE = 'pemohon'
const HKI_BUCKET = 'sertifikat-hki'

// --- PERBAIKAN 1: Memperbaiki kesalahan sintaksis ---
const ALIASED_SELECT_QUERY = `
  id_hki, nama_hki, jenis_produk, tahun_fasilitasi, sertifikat_pdf, keterangan, created_at,
  pemohon ( id_pemohon, nama_pemohon, alamat ),
  jenis:jenis_hki ( id_jenis_hki, nama_jenis_hki ), 
  status_hki ( id_status, nama_status ),
  pengusul ( id_pengusul, nama_opd ),
  kelas:kelas_hki ( id_kelas, nama_kelas, tipe )
`

/**
 * Helper untuk mencari atau membuat pemohon baru.
 */
async function getPemohonId(
  supabase: SupabaseClient<Database>,
  nama: string,
  alamat: string | null
): Promise<number> {
  const trimmedNama = nama.trim()
  if (!trimmedNama) {
    throw new Error('Nama pemohon tidak boleh kosong.')
  }

  const { data: existingPemohon, error: findError } = await supabase
    .from(PEMOHON_TABLE)
    .select('id_pemohon')
    .eq('nama_pemohon', trimmedNama)
    .limit(1)
    .single()

  if (findError && findError.code !== 'PGRST116') {
    console.error('Error saat mencari pemohon:', findError)
    throw new Error(`Gagal memeriksa data pemohon: ${findError.message}`)
  }

  if (existingPemohon) {
    return existingPemohon.id_pemohon
  }

  const { data: newPemohon, error: insertError } = await supabase
    .from(PEMOHON_TABLE)
    .insert({ nama_pemohon: trimmedNama, alamat: alamat })
    .select('id_pemohon')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error(`Nama pemohon "${trimmedNama}" sudah terdaftar.`)
    }
    console.error('Error saat membuat pemohon baru:', insertError)
    throw new Error(`Gagal menyimpan data pemohon baru: ${insertError.message}`)
  }

  if (!newPemohon) {
    throw new Error('Gagal mendapatkan ID pemohon setelah proses insert.')
  }
  return newPemohon.id_pemohon
}

/**
 * Helper terpusat untuk otentikasi dan otorisasi admin.
 */
async function authorizeAdmin(supabase: SupabaseClient<Database>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { user: null, error: NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 }) };
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || profile?.role !== 'admin') {
        return { user: null, error: NextResponse.json({ success: false, message: 'Akses ditolak. Tindakan ini memerlukan hak admin.' }, { status: 403 }) };
    }

    return { user, error: null };
}


/**
 * POST: Membuat entri HKI baru.
 */
export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  let newHkiId: number | null = null
  let filePath: string | null = null

  try {
    // --- PERBAIKAN 2: Menggunakan helper otorisasi terpusat ---
    const { user, error: authError } = await authorizeAdmin(supabase);
    if (authError) return authError;

    const formData = await request.formData()
    const getVal = (key: string) => formData.get(key) as string | null

    const namaPemohon = getVal('nama_pemohon')
    if (!namaPemohon) {
      return NextResponse.json({ success: false, message: 'Nama pemohon wajib diisi.' }, { status: 400 })
    }
    const alamatPemohon = getVal('alamat')
    const pemohonId = await getPemohonId(supabase, namaPemohon, alamatPemohon)

    const idKelas = getVal('id_kelas')
    const tahunFasilitasi = getVal('tahun_fasilitasi')
    const idJenisHki = getVal('id_jenis_hki')
    const idStatus = getVal('id_status')
    const idPengusul = getVal('id_pengusul')
    
    const requiredFields = {
        'Nama HKI': getVal('nama_hki'),
        'Jenis HKI': idJenisHki,
        'Status': idStatus,
        'Pengusul': idPengusul,
        'Tahun Fasilitasi': tahunFasilitasi,
    }

    for (const [fieldName, value] of Object.entries(requiredFields)) {
        if (!value) {
            return NextResponse.json({ success: false, message: `${fieldName} wajib diisi.` }, { status: 400 });
        }
    }

    const hkiRecord: Database['public']['Tables']['hki']['Insert'] = {
      nama_hki: String(getVal('nama_hki')).trim(),
      jenis_produk: getVal('jenis_produk') || null,
      tahun_fasilitasi: Number(tahunFasilitasi),
      keterangan: getVal('keterangan') || null,
      id_jenis_hki: Number(idJenisHki),
      id_status: Number(idStatus),
      id_pengusul: Number(idPengusul),
      id_pemohon: pemohonId,
      sertifikat_pdf: null,
      id_kelas: idKelas ? Number(idKelas) : null,
    }

    const { data: newHki, error: insertError } = await supabase
      .from(HKI_TABLE)
      .insert(hkiRecord)
      .select('id_hki')
      .single()

    if (insertError) {
      console.error('Error saat insert HKI:', insertError)
      const message = insertError.code === '23505'
        ? `Gagal menyimpan: Nama HKI "${hkiRecord.nama_hki}" sudah ada.`
        : `Database error: ${insertError.message}`
      return NextResponse.json({ success: false, message }, { status: 409 })
    }

    if (!newHki) {
      throw new Error('Gagal mendapatkan ID HKI baru setelah insert.')
    }
    newHkiId = newHki.id_hki

    const file = formData.get('file') as File | null
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop() || 'pdf'
      filePath = `public/${user.id}-${uuidv4()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from(HKI_BUCKET).upload(filePath, file)
      if (uploadError) {
        throw new Error(`Upload file gagal: ${uploadError.message}`)
      }

      const { error: updateFileError } = await supabase
        .from(HKI_TABLE)
        .update({ sertifikat_pdf: filePath })
        .eq('id_hki', newHkiId)

      if (updateFileError) {
        throw new Error(`Gagal memperbarui path file di database: ${updateFileError.message}`)
      }
    }

    const { data: finalData, error: finalFetchError } = await supabase
      .from(HKI_TABLE)
      .select(ALIASED_SELECT_QUERY)
      .eq('id_hki', newHkiId)
      .single()

    if (finalFetchError) {
      throw new Error('Gagal mengambil data baru setelah dibuat.')
    }

    return NextResponse.json({ success: true, data: finalData }, { status: 201 })

  } catch (err: unknown) { // --- PERBAIKAN 3: Menggunakan 'unknown' dan rollback logic ---
    console.error(`[API POST HKI Error]:`, err)
    
    // Rollback logic jika terjadi error di tengah proses
    if (newHkiId) {
      console.log(`Menjalankan rollback untuk HKI ID: ${newHkiId}`)
      await supabase.from(HKI_TABLE).delete().eq('id_hki', newHkiId)
    }
    if (filePath) {
      console.log(`Menjalankan rollback untuk file: ${filePath}`)
      await supabase.storage.from(HKI_BUCKET).remove([filePath])
    }

    const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga.'
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}