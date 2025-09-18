'use client'

import React, { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable } from '@/components/hki/data-table'
import { EditHKIModal } from '@/components/hki/edit-hki-modal'
import { CreateHKIModal } from '@/components/hki/create-hki-modal'
import { ViewHKIModal } from '@/components/hki/view-hki-modal'
import { HKIEntry, JenisHKI, StatusHKI } from '@/lib/types'
import { toast } from 'sonner'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ComboboxOption = { value: string; label: string }

// PERBAIKAN FINAL: Menyelaraskan `tahunOptions` dengan `page.tsx`
interface HKIClientPageProps {
  initialData: HKIEntry[]
  totalCount: number
  formOptions: Readonly<{
    jenisOptions: JenisHKI[]
    statusOptions: StatusHKI[]
    tahunOptions: { tahun_fasilitasi: number }[]
    pengusulOptions: ComboboxOption[]
    kelasOptions: ComboboxOption[]
  }>
  isFiltered: boolean
  error: string | null
}

const ServerErrorDisplay = ({ errorMessage }: { errorMessage: string }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-destructive bg-red-50 p-12 text-center dark:bg-red-950/30">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
      <AlertTriangle className="h-8 w-8 text-destructive" />
    </div>
    <h3 className="mt-4 text-2xl font-semibold tracking-tight text-destructive">Gagal Memuat Data</h3>
    <p className="mt-2 text-sm text-muted-foreground">Terjadi kesalahan saat berkomunikasi dengan server.</p>
    <code className="my-4 rounded bg-red-100 p-2 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">{errorMessage}</code>
    <Button onClick={() => window.location.reload()}><RefreshCw className="mr-2 h-4 w-4" />Coba Lagi</Button>
  </div>
)

export function HKIClientPage({
  initialData,
  totalCount,
  formOptions,
  isFiltered,
  error,
}: HKIClientPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const isCreateModalOpen = searchParams.get('create') === 'true'
  const editingHkiId = useMemo(() => {
    const id = searchParams.get('edit');
    return id ? Number(id) : null;
  }, [searchParams])
  const viewingEntryId = useMemo(() => {
    const id = searchParams.get('view');
    return id ? Number(id) : null;
  }, [searchParams])

  const viewingEntry = useMemo(() => {
    if (!viewingEntryId) return null;
    return initialData.find((item) => item.id_hki === viewingEntryId) || null;
  }, [viewingEntryId, initialData])

  // PERBAIKAN FINAL: Transformasi data yang benar untuk komponen modal
  const modalFormOptions = useMemo(() => ({
      ...formOptions,
      // Mengubah format agar sesuai dengan yang diharapkan oleh modal (`{ id_jenis, nama_jenis }`)
      jenisOptions: formOptions.jenisOptions.map((j) => ({
        id_jenis: j.id_jenis_hki,
        nama_jenis: j.nama_jenis_hki,
      })),
      // Mengubah format agar sesuai dengan yang diharapkan oleh modal (`{ id_status, nama_status }`)
      statusOptions: formOptions.statusOptions.map((s) => ({
        id_status: s.id_status,
        nama_status: s.nama_status,
      })),
      // Opsi lain diteruskan apa adanya karena sudah dalam format { value, label }
  }), [formOptions]);

  const updateQueryString = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleOpenCreateModal = () => updateQueryString({ create: 'true', edit: null, view: null });
  const handleEdit = (id: number) => updateQueryString({ edit: String(id), create: null, view: null });
  const handleViewDetails = (entry: HKIEntry) => updateQueryString({ view: String(entry.id_hki), create: null, edit: null });
  const handleCloseModals = () => updateQueryString({ create: null, edit: null, view: null });

  if (error) {
    return <ServerErrorDisplay errorMessage={error} />
  }

  const refreshData = (message: string) => {
    toast.info('Memuat ulang data terbaru...', { duration: 1500 })
    router.refresh()
    toast.success(message, { duration: 3000 })
  }

  const handleEditSuccess = (updatedItem: HKIEntry) => {
    handleCloseModals()
    refreshData(`Data HKI "${updatedItem.nama_hki}" berhasil diperbarui.`)
  }

  const handleCreateSuccess = (newItem: HKIEntry) => {
    handleCloseModals()
    refreshData(`Data HKI "${newItem.nama_hki}" berhasil ditambahkan.`)
  }

  const handleError = (message = 'Terjadi kesalahan') => {
    toast.error(message)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Manajemen Data Pengajuan Fasilitasi HKI</h1>
        <p className="mt-1 text-muted-foreground">Cari, filter, dan kelola semua data pengajuan fasilitasi HKI di sini.</p>
      </div>

      <DataTable
        data={initialData}
        totalCount={totalCount}
        formOptions={formOptions}
        onEdit={handleEdit}
        onOpenCreateModal={handleOpenCreateModal}
        onViewDetails={handleViewDetails}
        isFiltered={isFiltered}
      />
      
      <EditHKIModal key={`edit-${editingHkiId}`} isOpen={!!editingHkiId} hkiId={editingHkiId} onClose={handleCloseModals} onSuccess={handleEditSuccess} onError={handleError} formOptions={modalFormOptions} />
      <CreateHKIModal isOpen={isCreateModalOpen} onClose={handleCloseModals} onSuccess={handleCreateSuccess} onError={handleError} formOptions={modalFormOptions} />
      
      <ViewHKIModal isOpen={!!viewingEntry} onClose={handleCloseModals} entry={viewingEntry} />
    </div>
  )
}