import { requireAdmin } from '@/lib/auth'
import { AdminLayout } from '@/components/layout/admin-layout'
import { HKIForm } from '@/components/forms/hki-form'

export default async function CreateHKIPage() {
  await requireAdmin()

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New HKI Entry</h1>
          <p className="text-gray-600 mt-2">
            Add a new intellectual property rights entry to the system
          </p>
        </div>

        <HKIForm mode="create" />
      </div>
    </AdminLayout>
  )
}