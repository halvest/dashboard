import { createClient } from '@/utils/supabase/server'
import { HKIClientPage } from './hki-client-page'
import { cookies } from 'next/headers'
import { HKIEntry, JenisHKI, StatusHKI } from '@/lib/types'

export const dynamic = 'force-dynamic'

type SelectOption = {
  value: string
  label: string
}

// PERBAIKAN FINAL: Tipe ini sekarang 100% cocok dengan data asli dari Supabase
type FormOptions = {
  jenisOptions: JenisHKI[]
  statusOptions: StatusHKI[]
  tahunOptions: { tahun_fasilitasi: number }[]
  pengusulOptions: SelectOption[]
  kelasOptions: SelectOption[]
}

const getSearchParam = (param: string | string[] | undefined): string => {
  return typeof param === 'string' ? param.trim() : ''
}

export default async function HKIPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // ... (Logika parameter Anda sudah benar)
    const search = getSearchParam(searchParams.search)
    const page = Math.max(1, parseInt(getSearchParam(searchParams.page) || '1', 10))
    const pageSize = parseInt(getSearchParam(searchParams.pageSize) || '50', 10)
    const jenisId = getSearchParam(searchParams.jenisId)
    const statusId = getSearchParam(searchParams.statusId)
    const year = getSearchParam(searchParams.year)
    const pengusulId = getSearchParam(searchParams.pengusulId)

    const allowedSortFields = ['created_at', 'nama_hki', 'tahun_fasilitasi']
    const sortBy = allowedSortFields.includes(getSearchParam(searchParams.sortBy)) ? getSearchParam(searchParams.sortBy) : 'created_at'
    const sortOrder = searchParams.sortOrder === 'asc'
    const offset = (page - 1) * pageSize
    
    const isAnyFilterActive = !!(search || jenisId || statusId || year || pengusulId)

    let dataToRender: HKIEntry[] = []
    let totalCount = 0

    const querySelectString = `
      id_hki, nama_hki, jenis_produk, tahun_fasilitasi, sertifikat_pdf, keterangan, created_at,
      pemohon ( id_pemohon, nama_pemohon, alamat ),
      jenis:jenis_hki ( id_jenis_hki, nama_jenis_hki ), 
      status_hki ( id_status, nama_status ),
      pengusul ( id_pengusul, nama_opd ),
      kelas:kelas_hki ( id_kelas, nama_kelas, tipe )
    `
    
    if (isAnyFilterActive) {
      const { data: filterResult, error: rpcError } = await supabase.rpc(
        'search_hki_ids_with_count',
        {
          p_search_text: search,
          p_jenis_id: jenisId ? Number(jenisId) : null,
          p_status_id: statusId ? Number(statusId) : null,
          p_year: year ? Number(year) : null,
          p_pengusul_id: pengusulId ? Number(pengusulId) : null,
        } as any
      )
      if (rpcError) throw new Error(`Gagal mencari data (RPC): ${JSON.stringify(rpcError)}`)
      
      const filteredIds = filterResult?.map((r: { result_id: number }) => r.result_id) ?? []
      totalCount = filterResult?.[0]?.result_count ?? 0

      if (filteredIds.length > 0) {
        const { data, error } = await supabase.from('hki')
          .select(querySelectString)
          .in('id_hki', filteredIds)
          .order(sortBy, { ascending: sortOrder })
          .range(offset, offset + pageSize - 1)
        
        if (error) throw new Error(`Gagal memuat data HKI terfilter: ${JSON.stringify(error)}`)
        dataToRender = data as HKIEntry[]
      }
    } else {
      const { data, count, error } = await supabase.from('hki')
        .select(querySelectString, { count: 'exact' })
        .order(sortBy, { ascending: sortOrder })
        .range(offset, offset + pageSize - 1)

      if (error) throw new Error(`Gagal memuat data HKI: ${JSON.stringify(error)}`)
      dataToRender = data as HKIEntry[]
      totalCount = count ?? 0
    }

    const [jenisRes, statusRes, tahunRes, pengusulRes, kelasRes] =
      await Promise.all([
        supabase.from('jenis_hki').select('id_jenis_hki, nama_jenis_hki').order('nama_jenis_hki'),
        supabase.from('status_hki').select('id_status, nama_status').order('id_status'),
        supabase.rpc('get_distinct_hki_years'),
        supabase.from('pengusul').select('id_pengusul, nama_opd').order('nama_opd'),
        supabase.from('kelas_hki').select('id_kelas, nama_kelas, tipe').order('id_kelas'),
      ])

    if (jenisRes.error) throw new Error(`Gagal memuat Jenis HKI: ${JSON.stringify(jenisRes.error)}`);
    if (statusRes.error) throw new Error(`Gagal memuat Status HKI: ${JSON.stringify(statusRes.error)}`);
    if (tahunRes.error) throw new Error(`Gagal memuat Tahun (RPC): ${JSON.stringify(tahunRes.error)}`);
    if (pengusulRes.error) throw new Error(`Gagal memuat Pengusul: ${JSON.stringify(pengusulRes.error)}`);
    if (kelasRes.error) throw new Error(`Gagal memuat Kelas HKI: ${JSON.stringify(kelasRes.error)}`);

    const formOptions: FormOptions = {
      jenisOptions: jenisRes.data ?? [],
      statusOptions: statusRes.data ?? [],
      // PERBAIKAN FINAL: Pastikan cast sesuai dengan tipe FormOptions
      tahunOptions: (tahunRes.data as { tahun_fasilitasi: number }[] | null) ?? [],
      pengusulOptions: (pengusulRes.data || []).map((p) => ({ value: String(p.id_pengusul), label: p.nama_opd })),
      kelasOptions: (kelasRes.data || []).map((k) => ({ value: String(k.id_kelas), label: `${k.id_kelas} – ${k.nama_kelas} (${k.tipe})` })),
    }

    return (
      <HKIClientPage
        initialData={dataToRender}
        totalCount={totalCount}
        formOptions={formOptions}
        isFiltered={isAnyFilterActive}
        error={null}
      />
    )
  } catch (error) {
    console.error('Terjadi kesalahan fatal pada halaman HKI:', error)
    return (
      <HKIClientPage
        initialData={[]}
        totalCount={0}
        formOptions={{ jenisOptions: [], statusOptions: [], tahunOptions: [], pengusulOptions: [], kelasOptions: [] }}
        isFiltered={false}
        error={ error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.' }
      />
    )
  }
}