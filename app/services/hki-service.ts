import { toast } from 'sonner';

// Tipe untuk filter yang aktif di tabel
interface ActiveFilters {
  search?: string | null;
  jenisId?: string | null;
  statusId?: string | null;
  year?: string | null;
  pengusulId?: string | null;
}

interface ExportParams {
  format: 'csv' | 'xlsx';
  filters: ActiveFilters;
}

/**
 * Memanggil API untuk mengekspor SEMUA data yang cocok dengan filter yang aktif.
 * @param params - Obyek berisi format dan semua filter yang aktif.
 */
export function downloadFilteredExport({ format, filters }: ExportParams): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('format', format);

      // Tambahkan semua filter yang aktif dari state tabel
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          queryParams.set(key, String(value));
        }
      }

      const url = `/api/hki/export?${queryParams.toString()}`;

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Gagal mengunduh file (HTTP ${response.status})` }));
        throw new Error(errorData.error);
      }

      // Logika untuk memproses dan men-trigger download file blob
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="(.+?)"/);
      const filename = filenameMatch ? filenameMatch[1] : `hki-export-${Date.now()}.${format}`;
      
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      resolve();
    } catch (error: any) {
      console.error('Filtered export error:', error);
      reject(error);
    }
  });
}