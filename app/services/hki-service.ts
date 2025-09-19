// app/services/hki-service.ts
import { toast } from 'sonner'

interface ActiveFilters {
  search?: string | null
  jenisId?: string | null
  statusId?: string | null
  year?: string | null
  pengusulId?: string | null
}

interface ExportParams {
  format: 'csv' | 'xlsx'
  filters: ActiveFilters
}

/**
 * Helper function untuk memicu unduhan file di browser dari blob.
 * @param blob - Data file dalam bentuk Blob.
 * @param filename - Nama file yang akan diunduh.
 */
function triggerBrowserDownload(blob: Blob, filename: string) {
  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = blobUrl
  link.setAttribute('download', filename)
  document.body.appendChild(link)

  link.click()
  link.remove()
  window.URL.revokeObjectURL(blobUrl)
}

/**
 * Mengunduh data HKI yang telah difilter dengan menampilkan notifikasi loading, sukses, atau error.
 * @param params - Obyek berisi format dan semua filter yang aktif.
 */
export async function downloadFilteredExport({
  format,
  filters,
}: ExportParams): Promise<void> {
  const promise = async (): Promise<void> => {
    const queryParams = new URLSearchParams({ format })
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        queryParams.set(key, String(value))
      }
    }

    const url = `/api/hki/export?${queryParams.toString()}`
    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `Gagal mengunduh file. Server merespons dengan status ${response.status}.`,
      }))
      throw new Error(
        errorData.error || 'Terjadi kesalahan yang tidak diketahui.'
      )
    }
    const blob = await response.blob()
    const disposition = response.headers.get('Content-Disposition') || ''
    const filenameMatch = disposition.match(/filename="(.+?)"/)
    const fallbackFilename = `hki-export-${new Date().toISOString().split('T')[0]}.${format}`
    const filename = filenameMatch ? filenameMatch[1] : fallbackFilename
    triggerBrowserDownload(blob, filename)
  }

  toast.promise(promise(), {
    loading: 'Sedang mempersiapkan file unduhan...',
    success: 'File berhasil diunduh! Proses dimulai di browser Anda.',
    error: (err: any) => err.message || 'Gagal mengunduh file.',
  })
}
