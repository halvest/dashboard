// app/hki/page.tsx
import { createClient } from '@/lib/supabase-server'
import { HKIClientPage } from './hki-client'

export const dynamic = 'force-dynamic'

export default async function HKIPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createClient()

  // --- Query Params ---
  const search = typeof searchParams.search === 'string' ? searchParams.search.trim() : ''
  const page = typeof searchParams.page === 'string' ? Math.max(1, parseInt(searchParams.page, 10)) : 1
  const pageSize = typeof searchParams.pageSize === 'string' ? parseInt(searchParams.pageSize, 10) : 10

  const jenisId = typeof searchParams.jenisId === 'string' ? searchParams.jenisId : ''
  const statusId = typeof searchParams.statusId === 'string' ? searchParams.statusId : ''
  const year = typeof searchParams.year === 'string' ? searchParams.year : ''

  // Whitelist kolom yang bisa dipakai untuk sort
  const allowedSortFields = ['created_at', 'nama_hki', 'tahun_fasilitasi']
  const sortBy =
    typeof searchParams.sortBy === 'string' && allowedSortFields.includes(searchParams.sortBy)
      ? searchParams.sortBy
      : 'created_at'
  const sortOrder = searchParams.sortOrder === 'asc' ? true : false

  // --- Query HKI ---
  let query = supabase
    .from('hki')
    .select(
      `
      id_hki, nama_hki, jenis_produk, tahun_fasilitasi, sertifikat_pdf, keterangan, created_at,
      pemohon ( id_pemohon, nama_pemohon, alamat ),
      jenis_hki ( id_jenis_hki, nama_jenis_hki ),
      status_hki ( id_status, nama_status ),
      pengusul ( id_pengusul, nama_opd )
    `,
      { count: 'exact' }
    )

  // Search hanya di kolom utama
  if (search) {
    query = query.ilike('nama_hki', `%${search}%`)
  }

  // Filter dropdown
  if (jenisId) query = query.eq('id_jenis_hki', jenisId)
  if (statusId) query = query.eq('id_status', statusId)
  if (year) query = query.eq('tahun_fasilitasi', year)

  // Sorting & pagination
  query = query.order(sortBy, { ascending: sortOrder }).range((page - 1) * pageSize, page * pageSize - 1)

  // --- Jalankan Query Paralel ---
  const [hkiRes, jenisRes, statusRes, tahunRes, pengusulRes] = await Promise.all([
    query,
    supabase.from('jenis_hki').select('*').order('nama_jenis_hki'),
    supabase.from('status_hki').select('*').order('nama_status'),
    supabase.from('hki').select('tahun_fasilitasi', { distinct: true }).order('tahun_fasilitasi', { ascending: false }),
    supabase.from('pengusul').select('*').order('nama_opd'),
  ])

  if (hkiRes.error) {
    console.error('Error fetching HKI list:', hkiRes.error)
  }

  const tahunOptions =
    tahunRes.data
      ?.map((item) => item.tahun_fasilitasi)
      .filter(Boolean)
      .sort((a, b) => b! - a!)
      .map((tahun) => ({ tahun })) ?? []

  return (
    <HKIClientPage
      initialData={hkiRes.data ?? []}
      totalCount={hkiRes.count ?? 0}
      formOptions={{
        jenisOptions: jenisRes.data ?? [],
        statusOptions: statusRes.data ?? [],
        tahunOptions,
        pengusulOptions: pengusulRes.data ?? [],
      }}
    />
  )
}
