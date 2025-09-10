// app/hki/page.tsx
import { createClient } from '@/utils/supabase/server'
import { HKIClientPage } from './hki-client-page'
import { cookies } from 'next/headers' 

export const dynamic = 'force-dynamic'

export default async function HKIPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {

  const cookieStore = cookies()
  const supabase = createClient(cookieStore) 

  const search = typeof searchParams.search === 'string' ? searchParams.search.trim() : ''
  const page = typeof searchParams.page === 'string' ? Math.max(1, parseInt(searchParams.page, 10)) : 1
  const pageSize = typeof searchParams.pageSize === 'string' ? parseInt(searchParams.pageSize, 10) : 10
  const jenisId = typeof searchParams.jenisId === 'string' ? searchParams.jenisId : ''
  const statusId = typeof searchParams.statusId === 'string' ? searchParams.statusId : ''
  const year = typeof searchParams.year === 'string' ? searchParams.year : ''
  const pengusulId = typeof searchParams.pengusulId === 'string' ? searchParams.pengusulId : ''
  const allowedSortFields = ['created_at', 'nama_hki', 'tahun_fasilitasi']
  const sortBy =
    typeof searchParams.sortBy === 'string' && allowedSortFields.includes(searchParams.sortBy)
      ? searchParams.sortBy
      : 'created_at'
  const sortOrder = searchParams.sortOrder === 'asc'

  const rpcParams = {
    p_search_text: search || null,
    p_jenis_id: jenisId ? Number(jenisId) : null,
    p_status_id: statusId ? Number(statusId) : null,
    p_year: year ? Number(year) : null,
    p_pengusul_id: pengusulId ? Number(pengusulId) : null
  }
  const { data: filterResult, error: rpcError } = await supabase
    .rpc('search_hki_ids_with_count', rpcParams)
  if (rpcError) {
    console.error('Fatal Error saat memanggil RPC Filter:', rpcError)
  }
  const filteredIds = filterResult?.map((r: any) => r.result_id) ?? []
  const totalCount = filterResult?.[0]?.result_count ?? 0

  const querySelectString = `
    id_hki, nama_hki, jenis_produk, tahun_fasilitasi, sertifikat_pdf, keterangan, created_at,
    pemohon ( id_pemohon, nama_pemohon, alamat ),
    jenis:jenis_hki ( id_jenis:id_jenis_hki, nama_jenis:nama_jenis_hki ), 
    status_hki ( id_status, nama_status ),
    pengusul ( id_pengusul, nama_pengusul:nama_opd ),
    kelas:kelas_hki ( id_kelas, nama_kelas, tipe )
  `

  let query = supabase
    .from('hki')
    .select(querySelectString)
    .in('id_hki', filteredIds)
    .order(sortBy, { ascending: sortOrder })
    .range((page - 1) * pageSize, page * pageSize - 1) 

  const [hkiRes, jenisRes, statusRes, tahunRes, pengusulRes, kelasRes] = await Promise.all([
    filteredIds.length > 0 ? query : Promise.resolve({ data: [], error: null }),
    supabase.from('jenis_hki').select('id_jenis:id_jenis_hki, nama_jenis:nama_jenis_hki').order('nama_jenis_hki'),
    supabase.from('status_hki').select('*').order('nama_status'),
    supabase.rpc('get_distinct_hki_years'),
    supabase.from('pengusul').select('id_pengusul, nama_pengusul:nama_opd').order('nama_opd'),
    supabase.from('kelas_hki').select('id_kelas, nama_kelas, tipe').order('id_kelas'),
  ])

  if (hkiRes.error) {
     console.error('Error fetching HKI list (Post-RPC):', hkiRes.error)
  }

  const pengusulOptions = (pengusulRes.data || []).map(p => ({
    value: String(p.id_pengusul),
    label: p.nama_pengusul, 
  }));

  const kelasOptions = (kelasRes.data || []).map(k => ({
    value: String(k.id_kelas),
    label: `${k.id_kelas} – ${k.nama_kelas} (${k.tipe})`, 
  }));

  const tahunOptions = tahunRes.data ?? []

  return (
    <HKIClientPage
      initialData={hkiRes.data ?? []}
      totalCount={totalCount}
      formOptions={{
        jenisOptions: jenisRes.data ?? [],
        statusOptions: statusRes.data ?? [],
        tahunOptions: tahunOptions, 
        pengusulOptions: pengusulOptions, 
        kelasOptions: kelasOptions,       
      }}
    />
  )
}