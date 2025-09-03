import { requireAdmin } from '@/lib/auth'
import { AdminLayout } from '@/components/layout/admin-layout'
import { HKIForm } from '@/components/forms/hki-form'
import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'

export const dynamic = "force-dynamic";

export default async function CreateHKIPage() {
  await requireAdmin()
  const supabase = createClient()

  // Ambil semua data untuk opsi dropdown secara bersamaan
  const [
    { data: jenisOptions, error: jenisError },
    { data: statusOptions, error: statusError },
    { data: tahunOptions, error: tahunError },
    { data: pengusulOptions, error: pengusulError },
  ] = await Promise.all([
    supabase.from('jenis_hki').select('*').order('nama', { ascending: true }),
    supabase.from('status_hki').select('*').order('nama', { ascending: true }),
    supabase.from('fasilitasi_tahun').select('*').order('tahun', { ascending: false }),
    supabase.from('pengusul').select('*').order('nama', { ascending: true }),
  ])

  // Jika ada error fatal, lempar ke halaman 404 / error page
  if (jenisError || statusError || tahunError || pengusulError) {
    console.error({ jenisError, statusError, tahunError, pengusulError })
    notFound()
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 2xl:p-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Buat Entri HKI Baru</h1>
          <p className="text-gray-600 mt-1">
            Isi formulir di bawah ini untuk menambahkan data HKI baru ke sistem.
          </p>
        </div>

        <HKIForm 
          mode="create"
          jenisOptions={jenisOptions ?? []}
          statusOptions={statusOptions ?? []}
          tahunOptions={tahunOptions ?? []}
          pengusulOptions={pengusulOptions ?? []}
        />
      </div>
    </AdminLayout>
  )
}
