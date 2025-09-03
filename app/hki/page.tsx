import { requireAdmin } from '@/lib/auth'
import { AdminLayout } from '@/components/layout/admin-layout'
import { DataTable } from '@/components/hki/data-table'
import { createClient } from '@/lib/supabase-server'

interface SearchParams {
  search?: string
  page?: string
}

export const dynamic = "force-dynamic";

export default async function HKIPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await requireAdmin()
  
  const supabase = createClient()
  
  const search = searchParams.search?.trim() || ''
  const page = parseInt(searchParams.page || '1', 10)
  const pageSize = 10

  let query = supabase
    .from('hki_entries')
    .select(`
      *,
      pemohon ( id, nama, alamat ),
      jenis_hki ( id, nama ),
      status_hki ( id, nama ),
      fasilitasi_tahun ( id, tahun ),
      pengusul ( id, nama )
    `, { count: 'exact' })

  if (search) {
    query = query.or(
      `nama_hki.ilike.%${search}%,pemohon.nama.ilike.%${search}%`
    )
  }

  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const [
    { data: hkiEntries, count, error },
    { data: jenisOptions },
    { data: statusOptions },
    { data: tahunOptions },
    { data: pengusulOptions },
  ] = await Promise.all([
    query,
    supabase.from('jenis_hki').select('*').order('nama'),
    supabase.from('status_hki').select('*').order('nama'),
    supabase.from('fasilitasi_tahun').select('*').order('tahun', { ascending: false }),
    supabase.from('pengusul').select('*').order('nama'),
  ])

  if (error) {
    console.error('Error fetching data:', error)
  }

  return (
    <AdminLayout>
      <DataTable
        data={hkiEntries ?? []}
        totalCount={count ?? 0}
        currentPage={page}
        pageSize={pageSize}
        formOptions={{
          jenisOptions: jenisOptions ?? [],
          statusOptions: statusOptions ?? [],
          tahunOptions: tahunOptions ?? [],
          pengusulOptions: pengusulOptions ?? [],
        }}
      />
    </AdminLayout>
  )
}
