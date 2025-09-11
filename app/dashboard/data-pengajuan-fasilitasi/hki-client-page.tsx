// app/dashboard/data-pengajuan-fasilitasi/hki-client-page.tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/hki/data-table'
import { EditHKIModal } from '@/components/hki/edit-hki-modal'
import { CreateHKIModal } from '@/components/hki/create-hki-modal'
import { ViewHKIModal } from '@/components/hki/view-hki-modal'
import { HKIEntry, JenisHKI, StatusHKI } from '@/lib/types'
import { toast } from 'sonner'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ComboboxOption = { value: string; label: string };

// PERBAIKAN: Menyesuaikan tipe props agar sinkron dengan data dari server component
interface HKIClientPageProps {
  initialData: HKIEntry[]
  totalCount: number
  formOptions: Readonly<{
    jenisOptions: { id_jenis: number; nama_jenis: string }[] // Disesuaikan dengan data asli dari Supabase
    statusOptions: { id_status: number; nama_status: string }[] // Disesuaikan dengan data asli dari Supabase
    tahunOptions: number[] // PERBAIKAN: Tipe disamakan menjadi number[]
    pengusulOptions: ComboboxOption[]
    kelasOptions: ComboboxOption[]
  }>
  error: string | null; // WAJIB: Menambahkan prop error
}

// Komponen baru untuk menampilkan error dari server
const ServerErrorDisplay = ({ errorMessage }: { errorMessage: string }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-destructive bg-red-50 p-12 text-center dark:bg-red-950/30">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
      <AlertTriangle className="h-8 w-8 text-destructive" />
    </div>
    <h3 className="mt-4 text-2xl font-semibold tracking-tight text-destructive">
      Gagal Memuat Data
    </h3>
    <p className="mt-2 text-sm text-muted-foreground">
      Terjadi kesalahan saat berkomunikasi dengan server.
    </p>
    <code className="my-4 rounded bg-red-100 p-2 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
      {errorMessage}
    </code>
    <Button onClick={() => window.location.reload()}>
      <RefreshCw className="mr-2 h-4 w-4" />
      Coba Lagi
    </Button>
  </div>
);


export function HKIClientPage({ initialData, totalCount, formOptions, error }: HKIClientPageProps) {
  const router = useRouter()

  const [editingHkiId, setEditingHkiId] = useState<number | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [viewingEntry, setViewingEntry] = useState<HKIEntry | null>(null)

  // WAJIB: Jika prop error ada, tampilkan komponen error dan hentikan render sisanya
  if (error) {
    return <ServerErrorDisplay errorMessage={error} />
  }

  const handleEdit = (id: number) => {
    setEditingHkiId(id)
  }

  const handleViewDetails = (entry: HKIEntry) => {
    setViewingEntry(entry)
  }

  const handleCloseEditModal = () => {
    setEditingHkiId(null)
  }

  // Fungsi refresh data yang menampilkan notifikasi
  const refreshData = (message: string) => {
    toast.info('Memuat ulang data terbaru...', { duration: 1500 });
    router.refresh();
    toast.success(message, { duration: 3000 });
  }

  const handleEditSuccess = (updatedItem: HKIEntry) => {
    setEditingHkiId(null)
    refreshData(`Data HKI "${updatedItem.nama_hki}" berhasil diperbarui.`);
  }

  const handleCreateSuccess = (newItem: HKIEntry) => {
    setIsCreateModalOpen(false)
    refreshData(`Data HKI "${newItem.nama_hki}" berhasil ditambahkan.`);
  }

  const handleError = (message = 'Terjadi kesalahan') => {
    toast.error(message)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Manajemen Data Pengajuan Fasilitasi HKI
        </h1>
        <p className="mt-1 text-muted-foreground">
          Cari, filter, dan kelola semua data pengajuan fasilitasi HKI di sini.
        </p>
      </div>

      <DataTable
        data={initialData}
        totalCount={totalCount}
        formOptions={formOptions}
        onEdit={handleEdit}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onViewDetails={handleViewDetails}
      />

      {/* Edit Modal */}
      {/* Menggunakan key untuk me-reset state internal modal saat hkiId berubah */}
      <EditHKIModal
        key={`edit-${editingHkiId}`}
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

      {/* View Modal */}
      <ViewHKIModal
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        entry={viewingEntry}
      />
    </div>
  )
}