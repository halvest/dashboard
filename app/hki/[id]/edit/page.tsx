import { requireAdmin } from '@/lib/auth'
import { AdminLayout } from '@/components/layout/admin-layout'
import { HKIForm } from '@/components/forms/hki-form'
import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'

export const dynamic = "force-dynamic";

export default async function EditHKIPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  await requireAdmin()
  const supabase = createClient()
  
  const [
    { data: entry, error },
    { data: jenisOptions },
    { data: statusOptions },
    { data: tahunOptions },
    { data: pengusulOptions }
  ] = await Promise.all([
    supabase.from('hki_entries').select(`
      *, 
      pemohon(*), 
      jenis_hki(*), 
      status_hki(*), 
      fasilitasi_tahun(*), 
      pengusul(*)
    `).eq('id', params.id).single(),
    supabase.from('jenis_hki').select('*'),
    supabase.from('status_hki').select('*'),
    supabase.from('fasilitasi_tahun').select('*').order('tahun', { ascending: false }),
    supabase.from('pengusul').select('*')
  ])

  if (error || !entry) {
    notFound()
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 2xl:p-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Entri HKI</h1>
          <p className="text-gray-600 mt-1">
            Perbarui informasi untuk "{entry.nama_hki}"
          </p>
        </div>

        <HKIForm 
          mode="edit" 
          initialData={entry}
          jenisOptions={jenisOptions || []}
          statusOptions={statusOptions || []}
          tahunOptions={tahunOptions || []}
          pengusulOptions={pengusulOptions || []}
        />
      </div>
    </AdminLayout>
  )
}
