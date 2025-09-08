// app/hki/hki-client.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/hki/data-table'
import { EditHKIModal } from '@/components/hki/edit-hki-modal'
import { HKIEntry, JenisHKI, StatusHKI, Pengusul } from '@/lib/types'
import { toast } from 'sonner'

interface HKIClientPageProps {
  initialData: HKIEntry[]
  totalCount: number
  formOptions: {
    jenisOptions: JenisHKI[]
    statusOptions: StatusHKI[]
    tahunOptions: { tahun: number }[]
    pengusulOptions: Pengusul[]
  }
}

export function HKIClientPage({ initialData, totalCount, formOptions }: HKIClientPageProps) {
  const router = useRouter()
  const [editingHkiId, setEditingHkiId] = useState<number | null>(null)
  const [data, setData] = useState(initialData) // cache local data

  const handleEdit = (id: number) => {
    setEditingHkiId(id)
  }

  const handleCloseModal = () => {
    setEditingHkiId(null)
  }

  const handleSuccess = (updatedItem?: HKIEntry) => {
    setEditingHkiId(null)

    // update lokal tanpa reload full page
    if (updatedItem) {
      setData((prev) => prev.map((item) => (item.id_hki === updatedItem.id_hki ? updatedItem : item)))
    } else {
      // fallback, reload tabel
      router.refresh()
    }

    toast.success('Data berhasil diperbarui!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Manajemen Data Pengajuan HKI
        </h1>
        <p className="mt-1 text-muted-foreground">
          Cari, filter, dan kelola semua data pengajuan HKI di sini.
        </p>
      </div>

      <DataTable
        data={data}
        totalCount={totalCount}
        formOptions={formOptions}
        onEdit={handleEdit}
      />

      <EditHKIModal
        isOpen={!!editingHkiId}
        hkiId={editingHkiId}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        formOptions={formOptions}
      />
    </div>
  )
}
