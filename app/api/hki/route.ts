// app/api/hki/route.ts
import { createClient } from '@/utils/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { Database } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

// --- KONSTANTA ---
const HKI_TABLE = 'hki'
const HKI_BUCKET = 'sertifikat-hki'
const PEMOHON_TABLE = 'pemohon'

// --- SKEMA VALIDASI ZOD ---
const getParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.string().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  jenisId: z.coerce.number().optional(),
  statusId: z.coerce.number().optional(),
  year: z.coerce.number().optional(),
  pengusulId: z.coerce.number().optional(),
})

const hkiCreateSchema = z.object({
  nama_hki: z.string().min(1, 'Nama HKI wajib diisi.'),
  nama_pemohon: z.string().min(3, 'Nama pemohon minimal 3 karakter.'),
  alamat: z.string().optional().nullable(),
  jenis_produk: z.string().optional().nullable(),
  tahun_fasilitasi: z.coerce.number().int('Tahun harus angka.'),
  keterangan: z.string().optional().nullable(),
  id_jenis_hki: z.coerce.number({
    invalid_type_error: 'Jenis HKI wajib diisi.',
  }),
  id_status: z.coerce.number({ invalid_type_error: 'Status wajib diisi.' }),
  id_pengusul: z.coerce.number({ invalid_type_error: 'Pengusul wajib diisi.' }),
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
export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    await authorizeAdmin(supabase)
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const params = getParamsSchema.parse(searchParams)

    let query = supabase
      .from(HKI_TABLE)
      .select(
        `*, pemohon(*), jenis:jenis_hki(*), status_hki(*), pengusul(*), kelas:kelas_hki(*)`,
        { count: 'exact' }
      )

    if (params.search) {
      const { data: pemohonData, error: pemohonError } = await supabase
        .from('pemohon')
        .select('id_pemohon')
        .ilike('nama_pemohon', `%${params.search}%`)

      if (pemohonError)
        throw new Error(`Gagal mencari pemohon: ${pemohonError.message}`)

      const pemohonIds = pemohonData?.map((p) => p.id_pemohon) || []

      let orFilter = `nama_hki.ilike.%${params.search}%,jenis_produk.ilike.%${params.search}%`
      if (pemohonIds.length > 0) {
        orFilter += `,id_pemohon.in.(${pemohonIds.join(',')})`
      }

      query = query.or(orFilter)
    }

    if (params.jenisId) query = query.eq('id_jenis_hki', params.jenisId)
    if (params.statusId) query = query.eq('id_status', params.statusId)
    if (params.year) query = query.eq('tahun_fasilitasi', params.year)
    if (params.pengusulId) query = query.eq('id_pengusul', params.pengusulId)

    const from = (params.page - 1) * params.pageSize
    query = query
      .order(params.sortBy, { ascending: params.sortOrder === 'asc' })
      .range(from, from + params.pageSize - 1)

    const { data, error, count } = await query
    if (error) throw error

    const response = NextResponse.json({
      data: data || [],
      totalCount: count ?? 0,
    })
    return response
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return apiError(
        'Parameter query tidak valid.',
        400,
        err.flatten().fieldErrors
      )
    if (err instanceof AuthError) return apiError(err.message, 403)

    console.error('[API GET HKI Error]:', err)
    return apiError(`Gagal mengambil data: ${err.message}`, 500)
  }
}

async function getPemohonId(
  supabase: ReturnType<typeof createClient>,
  nama: string,
  alamat: string | null
): Promise<number> {
  const trimmedNama = nama.trim()
  if (!trimmedNama) throw new Error('Nama pemohon tidak boleh kosong.')
  const { data: existingPemohon, error: findError } = await supabase
    .from(PEMOHON_TABLE)
    .select('id_pemohon')
    .eq('nama_pemohon', trimmedNama)
    .limit(1)
    .single()
  if (findError && findError.code !== 'PGRST116') {
    throw new Error('Gagal memeriksa data pemohon: ' + findError.message)
  }
  if (existingPemohon) return existingPemohon.id_pemohon
  const { data: newPemohon, error: insertError } = await supabase
    .from(PEMOHON_TABLE)
    .insert({ nama_pemohon: trimmedNama, alamat: alamat })
    .select('id_pemohon')
    .single()
  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error(`Nama pemohon "${trimmedNama}" sudah terdaftar.`)
    }
    throw new Error('Gagal menyimpan data pemohon baru: ' + insertError.message)
  }
  if (!newPemohon)
    throw new Error('Gagal membuat atau menemukan pemohon setelah insert.')
  return newPemohon.id_pemohon
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const user = await authorizeAdmin(supabase)
    const formData = await request.formData()
    const rawData = Object.fromEntries(formData.entries())
    const validatedData = hkiCreateSchema.parse(rawData)
    const { nama_pemohon, alamat, ...hkiFields } = validatedData

    const pemohonId = await getPemohonId(supabase, nama_pemohon, alamat || null)

    const hkiRecord = { ...hkiFields, id_pemohon: pemohonId }
    const { data: newHki, error: insertError } = await supabase
      .from(HKI_TABLE)
      .insert(hkiRecord)
      .select('id_hki')
      .single()

    if (insertError)
      throw new Error(`Gagal menyimpan data HKI: ${insertError.message}`)

    const file = formData.get('file') as File | null
    if (file && file.size > 0) {
      const filePath = `public/${user.id}-${uuidv4()}.${file.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage
        .from(HKI_BUCKET)
        .upload(filePath, file)

      if (uploadError) {
        await supabase.from(HKI_TABLE).delete().eq('id_hki', newHki.id_hki)
        throw new Error(`Upload file gagal: ${uploadError.message}`)
      }

      const { error: updateError } = await supabase
        .from(HKI_TABLE)
        .update({ sertifikat_pdf: filePath })
        .eq('id_hki', newHki.id_hki)

      if (updateError) {
        await supabase.storage.from(HKI_BUCKET).remove([filePath])
        await supabase.from(HKI_TABLE).delete().eq('id_hki', newHki.id_hki)
        throw new Error(
          `Gagal menautkan file sertifikat: ${updateError.message}`
        )
      }
    }

    const { data: finalData, error: finalFetchError } = await supabase
      .from(HKI_TABLE)
      .select(
        `*, pemohon(*), jenis:jenis_hki(*), status_hki(*), pengusul(*), kelas:kelas_hki(*)`
      )
      .eq('id_hki', newHki.id_hki)
      .single()

    if (finalFetchError)
      throw new Error('Gagal mengambil data yang baru dibuat.')

    return NextResponse.json(
      { success: true, data: finalData },
      { status: 201 }
    )
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return apiError(
        'Data yang dikirim tidak valid.',
        400,
        err.flatten().fieldErrors
      )
    if (err instanceof AuthError) return apiError(err.message, 403)

    console.error(`[API POST HKI Error]: ${err.message}`)
    return apiError(`Terjadi kesalahan tak terduga: ${err.message}`, 500)
  }
}
