// app/hki/hki-client.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/hki/data-table'
import { EditHKIModal } from '@/components/hki/edit-hki-modal'
// ✅ 1. Impor Modal Baru
import { CreateHKIModal } from '@/components/hki/create-hki-modal' 
import { HKIEntry, JenisHKI, StatusHKI, Pengusul } from '@/lib/types'
import { toast } from 'sonner'

interface HKIClientPageProps {
  initialData: HKIEntry[]
  totalCount: number
  formOptions: Readonly<{
    jenisOptions: JenisHKI[]
    statusOptions: StatusHKI[]
    tahunOptions: { tahun: number }[]
    pengusulOptions: Pengusul[]
  }>
}

export function HKIClientPage({ initialData, totalCount, formOptions }: HKIClientPageProps) {
  const router = useRouter()
  
  // State untuk Edit Modal (Sudah ada)
  const [editingHkiId, setEditingHkiId] = useState<number | null>(null)
  
  // ✅ 2. Tambahkan State untuk Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  const [data, setData] = useState<HKIEntry[]>(initialData)

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const handleEdit = (id: number) => {
    setEditingHkiId(id)
  }

  const handleCloseModal = () => {
    setEditingHkiId(null)
  }
  
  // ✅ 3. Handler Sukses Edit (Sudah ada, sedikit modifikasi)
  const handleEditSuccess = (updatedItem: HKIEntry) => {
    setEditingHkiId(null)

    // Optimistic update
    setData((prev) =>
      prev.map((item) => (item.id_hki === updatedItem.id_hki ? updatedItem : item))
    )

    // Tidak perlu refresh manual jika kita optimis, tapi kita refresh saja agar konsisten
    router.refresh() 
    toast.success('Data berhasil diperbarui!')
  }

  // ✅ 4. Handler Sukses Create (BARU)
  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false) // Tutup modal create
    router.refresh() // Ambil data baru dari server (termasuk entri baru)
    toast.success('Data berhasil dibuat!')
  }

  const handleError = (message = 'Terjadi kesalahan') => {
    toast.error(message)
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
        // ✅ 5. Kirim prop baru untuk membuka modal create
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Edit Modal (Sudah Ada) */}
      <EditHKIModal
        isOpen={!!editingHkiId}
        hkiId={editingHkiId}
        onClose={handleCloseModal}
        onSuccess={handleEditSuccess} // Gunakan handler edit
        onError={handleError}
        formOptions={formOptions}
      />
      
      {/* ✅ 6. Tambahkan Create Modal baru ke dalam DOM */}
      <CreateHKIModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess} // Gunakan handler create
        onError={handleError}
        formOptions={formOptions}
      />
    </div>
  )
}