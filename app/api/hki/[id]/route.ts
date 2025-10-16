// app/api/hki/[id]/route.ts
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/utils/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { Database } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

// --- KONSTANTA ---
const HKI_TABLE = 'hki'
const PEMOHON_TABLE = 'pemohon'
const HKI_BUCKET = 'sertifikat-hki'

// --- SKEMA VALIDASI ---
const idSchema = z.coerce.number().int().positive('ID tidak valid.')

const hkiUpdateSchema = z.object({
  // ✅ PERBAIKAN: Validasi .min(3, ...) diubah menjadi .min(1, ...)
  nama_hki: z.string().min(1, 'Nama HKI wajib diisi.'),
  nama_pemohon: z.string().min(3, 'Nama pemohon minimal 3 karakter.'),
  alamat: z.string().optional().nullable(),
  jenis_produk: z.string().optional().nullable(),
  tahun_fasilitasi: z.coerce.number().int(),
  keterangan: z.string().optional().nullable(),
  id_jenis_hki: z.coerce.number(),
  id_status: z.coerce.number(),
  id_pengusul: z.coerce.number(),
  id_kelas: z.coerce.number().optional().nullable(),
})

// --- HELPER TERPUSAT ---
function apiError(message: string, status: number, errors?: object) {
  return NextResponse.json({ message, errors }, { status })
}

class AuthError extends Error {
  constructor(message = 'Akses ditolak.') {
    super(message)
    this.name = 'AuthError'
  }
}

async function authorizeAdmin(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new AuthError('Anda tidak terautentikasi.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new AuthError('Hanya admin yang dapat melakukan aksi ini.')
  }
  return user
}

// --- API HANDLERS ---

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const hkiId = idSchema.parse(params.id)
    await authorizeAdmin(supabase)

    const { data, error } = await supabase
      .from(HKI_TABLE)
      .select(
        `*, pemohon(*), jenis:jenis_hki(*), status_hki(*), pengusul(*), kelas:kelas_hki(*)`
      )
      .eq('id_hki', hkiId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return apiError(`Data HKI dengan ID ${hkiId} tidak ditemukan.`, 404)
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return apiError('Input tidak valid.', 400, err.flatten().fieldErrors)
    if (err instanceof AuthError) return apiError(err.message, 403)

    console.error('[API GET HKI by ID Error]:', err)
    return apiError(`Terjadi kesalahan pada server: ${err.message}`, 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const hkiId = idSchema.parse(params.id)
    const user = await authorizeAdmin(supabase)

    const formData = await request.formData()
    const rawData = Object.fromEntries(formData.entries())

    const { nama_pemohon, alamat, ...hkiFields } =
      hkiUpdateSchema.parse(rawData)

    const { data: currentHki, error: findError } = await supabase
      .from(HKI_TABLE)
      .select('sertifikat_pdf')
      .eq('id_hki', hkiId)
      .single()

    if (findError)
      return apiError(`HKI dengan ID ${hkiId} tidak ditemukan.`, 404)

    let newFilePath: string | null = null
    let finalFilePath = currentHki.sertifikat_pdf
    const oldFilePath = currentHki.sertifikat_pdf

    const file = formData.get('file') as File | null
    const shouldDeleteFile = formData.get('delete_sertifikat') === 'true'

    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop() || 'pdf'
      newFilePath = `public/${user.id}-${uuidv4()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from(HKI_BUCKET)
        .upload(newFilePath, file)
      if (uploadError)
        throw new Error(`Upload file gagal: ${uploadError.message}`)
      finalFilePath = newFilePath
    } else if (shouldDeleteFile && oldFilePath) {
      finalFilePath = null
    }

    const { data: pemohonData, error: pemohonError } = await supabase
      .from(PEMOHON_TABLE)
      .upsert(
        { nama_pemohon, alamat },
        { onConflict: 'nama_pemohon', ignoreDuplicates: false }
      )
      .select('id_pemohon')
      .single()

    if (pemohonError)
      throw new Error(`Gagal memproses data pemohon: ${pemohonError.message}`)
    if (!pemohonData)
      throw new Error('Tidak dapat menemukan atau membuat data pemohon.')

    const hkiUpdatePayload = {
      ...hkiFields,
      id_pemohon: pemohonData.id_pemohon,
      sertifikat_pdf: finalFilePath,
    }

    const { error: hkiUpdateError } = await supabase
      .from(HKI_TABLE)
      .update(hkiUpdatePayload)
      .eq('id_hki', hkiId)

    if (hkiUpdateError) {
      if (newFilePath)
        await supabase.storage.from(HKI_BUCKET).remove([newFilePath])
      throw new Error(`Gagal memperbarui data HKI: ${hkiUpdateError.message}`)
    }

    if (oldFilePath && oldFilePath !== finalFilePath) {
      const { error: removeError } = await supabase.storage
        .from(HKI_BUCKET)
        .remove([oldFilePath])
      if (removeError)
        console.error(
          `Gagal menghapus file lama (${oldFilePath}):`,
          removeError.message
        )
    }

    const { data: finalData, error: finalFetchError } = await supabase
      .from(HKI_TABLE)
      .select(
        `*, pemohon(*), jenis:jenis_hki(*), status_hki(*), pengusul(*), kelas:kelas_hki(*)`
      )
      .eq('id_hki', hkiId)
      .single()

    if (finalFetchError)
      throw new Error('Gagal mengambil data yang baru diperbarui.')

    return NextResponse.json({ success: true, data: finalData })
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return apiError('Data tidak valid.', 400, err.flatten().fieldErrors)
    if (err instanceof AuthError) return apiError(err.message, 403)

    console.error(`[API PATCH HKI Final Error]: ${err.message}`)
    return apiError(`Terjadi kesalahan: ${err.message}`, 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const hkiId = idSchema.parse(params.id)
    await authorizeAdmin(supabase)

    const { data: hkiData, error: findError } = await supabase
      .from(HKI_TABLE)
      .select('sertifikat_pdf')
      .eq('id_hki', hkiId)
      .single()

    if (findError)
      return apiError(`Data HKI dengan ID ${hkiId} tidak ditemukan.`, 404)

    if (hkiData.sertifikat_pdf) {
      const { error: storageError } = await supabase.storage
        .from(HKI_BUCKET)
        .remove([hkiData.sertifikat_pdf])
      if (storageError)
        throw new Error(`Gagal hapus file di storage: ${storageError.message}`)
    }

    const { error: deleteError } = await supabase
      .from(HKI_TABLE)
      .delete()
      .eq('id_hki', hkiId)
    if (deleteError)
      throw new Error(`Gagal menghapus data HKI: ${deleteError.message}`)

    return NextResponse.json({
      success: true,
      message: 'Data HKI berhasil dihapus.',
    })
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return apiError('Input tidak valid.', 400, err.flatten().fieldErrors)
    if (err instanceof AuthError) return apiError(err.message, 403)

    console.error(`[API DELETE HKI Error]: ${err.message}`)
    return apiError(`Terjadi kesalahan pada server: ${err.message}`, 500)
  }
}
