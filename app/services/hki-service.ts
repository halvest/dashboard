// app/services/hki-service.ts
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

function triggerBrowserDownload(blob: Blob, filename: string) {
  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(blobUrl)
}

export async function downloadFilteredExport({
  format,
  filters,
}: ExportParams): Promise<void> {
  try {
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
      throw new Error(errorData.error || 'Terjadi kesalahan pada server.')
    }

    const blob = await response.blob()
    const disposition = response.headers.get('Content-Disposition') || ''
    let filename = `hki-export-${new Date().toISOString().split('T')[0]}.${format}`
    const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition)
    if (match && match[1]) {
      filename = match[1].replace(/['"]/g, '')
    }

    triggerBrowserDownload(blob, filename)
  } catch (error) {
    console.error('Kesalahan pada layanan ekspor:', error)
    throw error
  }
}