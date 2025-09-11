// app/services/hki-service.ts
import { toast } from 'sonner';

// Tipe untuk parameter fungsi download
interface ExportParams {
  format: 'csv' | 'xlsx';
  filter: 'year' | 'pengusul' | 'status';
  value: string | number;
  fields?: string[]; // Opsional
}

/**
 * Memanggil API ekspor dan menangani proses unduhan file di browser.
 * Fungsi ini mengembalikan Promise yang bisa digunakan dengan toast.promise.
 * @param params - Obyek berisi format, filter, dan value untuk ekspor.
 */
export function downloadExport(params: ExportParams): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Bangun URL dengan query parameters
      const queryParams = new URLSearchParams();
      queryParams.set('format', params.format);
      queryParams.set('filter', params.filter);
      queryParams.set('value', String(params.value));
      if (params.fields && params.fields.length > 0) {
        queryParams.set('fields', params.fields.join(','));
      }
      const url = `/api/hki/export?${queryParams.toString()}`;

      // 2. Panggil API
      const response = await fetch(url);
      if (!response.ok) {
        // Jika gagal, coba baca pesan error dari JSON body
        const errorData = await response.json().catch(() => ({ error: `Gagal mengunduh file (HTTP ${response.status})` }));
        throw new Error(errorData.error);
      }

      // 3. Proses file blob untuk diunduh
      const blob = await response.blob();
      
      // Ambil nama file dari header Content-Disposition
      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="(.+?)"/);
      const filename = filenameMatch ? filenameMatch[1] : `hki-export-${Date.now()}.${params.format}`;

      // 4. Buat URL sementara dan trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // 5. Bersihkan setelah selesai
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      resolve(); // Berhasil
    } catch (error: any) {
      console.error('Export download error:', error);
      reject(error); // Gagal
    }
  });
}