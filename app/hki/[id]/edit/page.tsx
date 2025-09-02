import { requireAdmin } from '@/lib/auth'
import { AdminLayout } from '@/components/layout/admin-layout'
import { HKIForm } from '@/components/forms/hki-form'
import { createClient } from '@/lib/supabase-server'
import { HKIEntry } from '@/lib/types'
import { notFound } from 'next/navigation'

export default async function EditHKIPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  await requireAdmin()
  
  const supabase = createClient()
  
  const { data: entry, error } = await supabase
    .from('hki_entries')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !entry) {
    notFound()
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit HKI Entry</h1>
          <p className="text-gray-600 mt-2">
            Update the information for "{entry.nama_hki}"
          </p>
        </div>

        <HKIForm mode="edit" initialData={entry as HKIEntry} />
      </div>
    </AdminLayout>
  )
}