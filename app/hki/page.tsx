import { requireAdmin } from '@/lib/auth'
import { AdminLayout } from '@/components/layout/admin-layout'
import { DataTable } from '@/components/hki/data-table'
import { createClient } from '@/lib/supabase-server'
import { HKIEntry } from '@/lib/types'

interface SearchParams {
  search?: string
  jenis?: string
  status?: string
  year?: string
  page?: string
}

export default async function HKIPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await requireAdmin()
  
  const supabase = createClient()
  
  // Parse search parameters
  const search = searchParams.search || ''
  const jenisFilter = searchParams.jenis || ''
  const statusFilter = searchParams.status || ''
  const yearFilter = searchParams.year || ''
  const page = parseInt(searchParams.page || '1')
  const pageSize = 10

  // Build query
  let query = supabase
    .from('hki_entries')
    .select('*', { count: 'exact' })

  // Apply filters
  if (search) {
    query = query.or(`nama_hki.ilike.%${search}%,nama_pemohon.ilike.%${search}%`)
  }
  
  if (jenisFilter) {
    query = query.eq('jenis_hki', jenisFilter)
  }
  
  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }
  
  if (yearFilter) {
    query = query.eq('fasilitasi_tahun', parseInt(yearFilter))
  }

  // Apply pagination and ordering
  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching HKI entries:', error)
    return <div>Error loading data</div>
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Data HKI</h1>
          <p className="text-gray-600 mt-2">
            Manage intellectual property rights entries
          </p>
        </div>

        <DataTable
          data={data as HKIEntry[] || []}
          totalCount={count || 0}
          currentPage={page}
          pageSize={pageSize}
        />
      </div>
    </AdminLayout>
  )
}