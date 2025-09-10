'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/hki/data-table'
import { EditHKIModal } from '@/components/hki/edit-hki-modal'
import { CreateHKIModal } from '@/components/hki/create-hki-modal' 
import { ViewHKIModal } from '@/components/hki/view-hki-modal' 
import { HKIEntry, JenisHKI, StatusHKI, Pengusul, KelasHKI } from '@/lib/types'
import { toast } from 'sonner'

type ComboboxOption = { value: string; label: string };

interface HKIClientPageProps {
  initialData: HKIEntry[]
  totalCount: number
  formOptions: Readonly<{
    jenisOptions: JenisHKI[]
    statusOptions: StatusHKI[]
    tahunOptions: { tahun: number }[]
    pengusulOptions: ComboboxOption[] 
    kelasOptions: ComboboxOption[]    
  }>
}

export function HKIClientPage({ initialData, totalCount, formOptions }: HKIClientPageProps) {
  const router = useRouter()
  
  const [editingHkiId, setEditingHkiId] = useState<number | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [viewingEntry, setViewingEntry] = useState<HKIEntry | null>(null)
  
  const handleEdit = (id: number) => {
    setEditingHkiId(id)
  }
  
  const handleViewDetails = (entry: HKIEntry) => {
    setViewingEntry(entry)
  }

  const handleCloseEditModal = () => {
    setEditingHkiId(null)
  }
  
  const handleEditSuccess = (updatedItem: HKIEntry) => {
    setEditingHkiId(null)
    router.refresh() 
  }

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false) 
    router.refresh() 
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
        data={initialData}
        totalCount={totalCount}
        formOptions={formOptions}
        onEdit={handleEdit}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onViewDetails={handleViewDetails} // 
      />

      {/* Edit Modal */}
      <EditHKIModal
        isOpen={!!editingHkiId}
        hkiId={editingHkiId}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
        onError={handleError}
        formOptions={formOptions}
      />
      
      {/* Create Modal */}
      <CreateHKIModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess} 
        onError={handleError}
        formOptions={formOptions} 
      />

      <ViewHKIModal
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        entry={viewingEntry}
      />
    </div>
  )
}