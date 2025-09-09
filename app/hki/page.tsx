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

  // --- Query Params (Ini sudah benar) ---
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

  // --- STRATEGI QUERY BARU ---
  
  // --- LANGKAH 1: PANGGIL RPC UNTUK SEMUA LOGIKA FILTER & COUNT ---
  // Kita kirim parameter ke fungsi SQL yang baru saja Anda buat.
  const rpcParams = {
    p_search_text: search || null, // Kirim null jika string kosong agar diabaikan oleh SQL
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

  // RPC mengembalikan array { result_id, result_count }
  // Kita ekstrak semua ID yang cocok
  const filteredIds = filterResult?.map((r: any) => r.result_id) ?? []
  
  // Ambil total_count dari baris PERTAMA (semua baris punya nilai count yg sama)
  const totalCount = filterResult?.[0]?.result_count ?? 0

  
  // --- LANGKAH 2: AMBIL DATA LENGKAP (SELECT ALIAS) HANYA UNTUK ID YANG COCOK ---
  // Kita buat query JS baru yang bersih. 
  // Dia TIDAK punya filter .or() atau .eq(), hanya .in()
  const querySelectString = `
    id_hki, nama_hki, jenis_produk, tahun_fasilitasi, sertifikat_pdf, keterangan, created_at,
    pemohon ( id_pemohon, nama_pemohon, alamat ),
    jenis:jenis_hki ( id_jenis:id_jenis_hki, nama_jenis:nama_jenis_hki ), 
    status_hki ( id_status, nama_status ),
    pengusul ( id_pengusul, nama_pengusul:nama_opd )
  `

  let query = supabase
    .from('hki')
    .select(querySelectString)
    .in('id_hki', filteredIds) // HANYA ambil ID yang cocok dari RPC
    .order(sortBy, { ascending: sortOrder }) // .order() sekarang 100% AMAN karena tidak ada konflik .or()
    .range((page - 1) * pageSize, page * pageSize - 1) // Paginasi data yang sudah disortir

    
  // --- Jalankan Query Paralel (Query utama diganti, sisanya sama) ---
  const [hkiRes, jenisRes, statusRes, tahunRes, pengusulRes] = await Promise.all([
    // PENTING: Jika tidak ada ID yang cocok, JANGAN jalankan query. Kembalikan array kosong.
    filteredIds.length > 0 ? query : Promise.resolve({ data: [], error: null }),
    
    // Query dropdown tetap sama
    supabase.from('jenis_hki').select('id_jenis:id_jenis_hki, nama_jenis:nama_jenis_hki').order('nama_jenis_hki'),
    supabase.from('status_hki').select('*').order('nama_status'),
    supabase.rpc('get_distinct_hki_years'), // (Pastikan fungsi ini juga sudah Anda buat)
    supabase.from('pengusul').select('id_pengusul, nama_pengusul:nama_opd').order('nama_opd'),
  ])

  if (hkiRes.error) {
     console.error('Error fetching HKI list (Post-RPC):', hkiRes.error)
  }

  const tahunOptions = tahunRes.data ?? []

  return (
    <HKIClientPage
      initialData={hkiRes.data ?? []}
      totalCount={totalCount} // ✅ PENTING: Gunakan totalCount dari hasil RPC
      formOptions={{
        jenisOptions: jenisRes.data ?? [],
        statusOptions: statusRes.data ?? [],
        tahunOptions: tahunOptions, 
        pengusulOptions: pengusulRes.data ?? [],
      }}
    />
  )
}