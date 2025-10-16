// app/dashboard/data-pengajuan-fasilitasi/hki-client-page.tsx
'use client'

import React, { useState, useMemo, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { DataTable } from '@/components/hki/data-table'
import { HKIEntry, FormOptions } from '@/lib/types'
import { toast } from 'sonner'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useHkiRealtime } from '@/hooks/useHkiRealtime'

// Gunakan dynamic import untuk komponen berat (Modal) agar tidak membebani loading awal
const EditHKIModal = dynamic(() =>
  import('@/components/hki/edit-hki-modal').then((mod) => mod.EditHKIModal)
)
const CreateHKIModal = dynamic(() =>
  import('@/components/hki/create-hki-modal').then((mod) => mod.CreateHKIModal)
)
const ViewHKIModal = dynamic(() =>
  import('@/components/hki/view-hki-modal').then((mod) => mod.ViewHKIModal)
)

// --- Tipe dan Interface ---
interface HKIClientPageProps {
  formOptions: Readonly<FormOptions>
  error: string | null
}
type HkiQueryData = { data: HKIEntry[]; totalCount: number }
type ModalState =
  | { type: 'create' }
  | { type: 'edit'; hkiId: number }
  | { type: 'view'; entry: HKIEntry }
  | null

// --- Fungsi Helper & Komponen UI Statis ---
const fetchHkiData = async (
  searchParams: URLSearchParams
): Promise<HkiQueryData> => {
  const response = await fetch(`/api/hki?${searchParams.toString()}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Gagal mengambil data HKI')
  }
  return response.json()
}

const ServerErrorDisplay = ({
  errorMessage,
  onRetry,
}: {
  errorMessage: string
  onRetry: () => void
}) => (
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
    <Button onClick={onRetry}>
      <RefreshCw className="mr-2 h-4 w-4" />
      Coba Lagi
    </Button>
  </div>
)

const PageHeader = ({
  totalCount,
  pageSize,
  pageIndex,
}: {
  totalCount: number
  pageSize: number
  pageIndex: number
}) => {
  const start = totalCount > 0 ? pageIndex * pageSize + 1 : 0
  const end = Math.min((pageIndex + 1) * pageSize, totalCount)

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
        Manajemen Data Pengajuan Fasilitasi HKI
      </h1>
      {totalCount > 0 && (
        <p className="mt-2 text-muted-foreground">
          Menampilkan {start} - {end} dari total {totalCount} data.
        </p>
      )}
    </div>
  )
}

// --- Komponen Utama ---
export function HKIClientPage({
  formOptions,
  error: serverError,
}: HKIClientPageProps) {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const [modalState, setModalState] = useState<ModalState>(null)

  // Berlangganan update realtime dari Supabase
  useHkiRealtime()

  // Kunci query yang dinamis berdasarkan parameter URL, penting untuk caching yang benar
  const queryKey = useMemo(
    () => ['hkiData', searchParams.toString()],
    [searchParams]
  )

  const { data, error, isLoading, isFetching, refetch } =
    useQuery<HkiQueryData>({
      queryKey,
      queryFn: () => fetchHkiData(new URLSearchParams(searchParams.toString())),
      placeholderData: (previousData) => previousData, // Menjaga data lama terlihat saat fetching baru
      retry: 1, // Hanya coba lagi sekali jika gagal
    })

  const { data: hkiData = [], totalCount = 0 } = data || {}

  // Hook terpusat untuk semua logika mutasi data
  const useHkiMutations = () => {
    const onMutationError = (err: Error, message: string, context: any) => {
      // Jika mutasi gagal, kembalikan UI ke keadaan semula (rollback)
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast.error(`${message}: ${err.message}`)
    }

    const deleteMutation = useMutation({
      mutationFn: async (ids: number[]) => {
        const response = await fetch('/api/hki/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        })
        const result = await response.json()
        if (!response.ok)
          throw new Error(result.error || 'Gagal menghapus entri.')
        return result
      },
      // ✅ PERBAIKAN: onMutate sekarang menyimpan nama data yang akan dihapus
      onMutate: async (idsToDelete: number[]) => {
        await queryClient.cancelQueries({ queryKey })
        const previousData = queryClient.getQueryData<HkiQueryData>(queryKey)

        const deletedItems = previousData?.data.filter((item) =>
          idsToDelete.includes(item.id_hki)
        )
        const deletedNames = deletedItems?.map((item) => item.nama_hki)

        // Secara optimis hapus item dari UI
        queryClient.setQueryData<HkiQueryData>(queryKey, (old) =>
          old
            ? {
                ...old,
                data: old.data.filter(
                  (item) => !idsToDelete.includes(item.id_hki)
                ),
                totalCount: old.totalCount - idsToDelete.length,
              }
            : { data: [], totalCount: 0 }
        )
        return { previousData, deletedNames }
      },
      // ✅ PERBAIKAN: onSuccess sekarang menampilkan notifikasi yang lebih spesifik
      onSuccess: (data, _variables, context) => {
        if (context?.deletedNames && context.deletedNames.length === 1) {
          toast.success(`Data "${context.deletedNames[0]}" berhasil dihapus.`)
        } else if (context?.deletedNames && context.deletedNames.length > 1) {
          toast.success(
            `${context.deletedNames.length} entri berhasil dihapus.`
          )
        } else {
          toast.success(data.message || 'Entri berhasil dihapus!')
        }
      },
      onError: (err: Error, _vars, context) =>
        onMutationError(err, 'Gagal menghapus', context),
      onSettled: () => queryClient.invalidateQueries({ queryKey }),
    })

    const statusMutation = useMutation({
      mutationFn: async ({
        entryId,
        newStatusId,
      }: {
        entryId: number
        newStatusId: number
      }) => {
        const response = await fetch(`/api/hki/${entryId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statusId: newStatusId }),
        })
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: 'Gagal memperbarui status.' }))
          throw new Error(errorData.message)
        }
        return response.json()
      },
      onMutate: async ({ entryId, newStatusId }) => {
        await queryClient.cancelQueries({ queryKey })
        const previousData = queryClient.getQueryData<HkiQueryData>(queryKey)
        // Secara optimis perbarui status di UI
        queryClient.setQueryData<HkiQueryData>(queryKey, (old) => {
          if (!old) return { data: [], totalCount: 0 }
          return {
            ...old,
            data: old.data.map((entry) =>
              entry.id_hki === entryId
                ? {
                    ...entry,
                    status_hki:
                      formOptions.statusOptions.find(
                        (s) => s.id_status === newStatusId
                      ) || entry.status_hki,
                  }
                : entry
            ),
          }
        })
        return { previousData }
      },
      onSuccess: (data) =>
        toast.success(data.message || 'Status berhasil diperbarui!'),
      onError: (err: Error, _vars, context) =>
        onMutationError(err, 'Gagal memperbarui status', context),
      onSettled: () =>
        queryClient.invalidateQueries({ queryKey, exact: false }),
    })

    return { deleteMutation, statusMutation }
  }

  const { deleteMutation, statusMutation } = useHkiMutations()

  const handleStatusUpdate = useCallback(
    (entryId: number, newStatusId: number) => {
      statusMutation.mutate({ entryId, newStatusId })
    },
    [statusMutation]
  )

  const pagination = useMemo(
    () => ({
      pageIndex: Number(searchParams.get('page') ?? 1) - 1,
      pageSize: Number(searchParams.get('pageSize') ?? 50),
    }),
    [searchParams]
  )

  // Penanganan error jika data master gagal dimuat dari server
  if (serverError) {
    return (
      <ServerErrorDisplay
        errorMessage={serverError}
        onRetry={() => refetch()}
      />
    )
  }

  // Penanganan error saat fetching data HKI
  if (error) {
    return (
      <ServerErrorDisplay
        errorMessage={error.message}
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* --- UI FEEDBACK: PROGRESS BAR --- */}
      {isFetching && !isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 z-50">
          <div className="h-full bg-primary/50 animate-pulse w-full" />
        </div>
      )}

      <PageHeader
        totalCount={totalCount}
        pageSize={pagination.pageSize}
        pageIndex={pagination.pageIndex}
      />

      <DataTable
        data={hkiData}
        totalCount={totalCount}
        formOptions={formOptions}
        onEdit={(id) => setModalState({ type: 'edit', hkiId: id })}
        onOpenCreateModal={() => setModalState({ type: 'create' })}
        onViewDetails={(entry) => setModalState({ type: 'view', entry })}
        onStatusUpdate={handleStatusUpdate}
        onDelete={deleteMutation.mutate}
        isDeleting={deleteMutation.isPending}
        isLoading={isLoading}
      />

      {/* Gunakan Suspense untuk lazy loading modal agar tidak memperlambat render awal */}
      <Suspense fallback={null}>
        {modalState?.type === 'edit' && (
          <EditHKIModal
            key={`edit-${modalState.hkiId}`}
            isOpen={true}
            hkiId={modalState.hkiId}
            onClose={() => setModalState(null)}
            onSuccess={(item) => {
              setModalState(null)
              toast.success(`Data "${item.nama_hki}" berhasil diperbarui.`)
              queryClient.invalidateQueries({ queryKey })
            }}
            onError={(msg) => toast.error(msg)}
            formOptions={formOptions}
          />
        )}
        {modalState?.type === 'create' && (
          <CreateHKIModal
            isOpen={true}
            onClose={() => setModalState(null)}
            onSuccess={(item) => {
              setModalState(null)
              toast.success(`Data "${item.nama_hki}" berhasil dibuat.`)
              queryClient.invalidateQueries({ queryKey })
            }}
            onError={(msg) => toast.error(msg)}
            formOptions={formOptions}
          />
        )}
        {modalState?.type === 'view' && (
          <ViewHKIModal
            isOpen={true}
            onClose={() => setModalState(null)}
            entry={modalState.entry}
          />
        )}
      </Suspense>
    </div>
  )
}
