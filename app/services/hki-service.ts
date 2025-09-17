import { toast } from 'sonner';

/** Tipe untuk filter yang aktif di tabel */
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
 * Helper function untuk memicu unduhan file di browser dari blob.
 * @param blob - Data file dalam bentuk Blob.
 * @param filename - Nama file yang akan diunduh.
 */
function triggerBrowserDownload(blob: Blob, filename: string) {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  
  link.click();

  // Cleanup DOM dan memori setelah di-klik
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

/**
 * Mengunduh data HKI yang telah difilter dengan menampilkan notifikasi loading, sukses, atau error.
 * @param params - Obyek berisi format dan semua filter yang aktif.
 */
export async function downloadFilteredExport({ format, filters }: ExportParams): Promise<void> {
  const promise = async (): Promise<void> => {
    // 1. Membuat query string dari filter yang ada
    const queryParams = new URLSearchParams({ format });
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        queryParams.set(key, String(value));
      }
    }

    const url = `/api/hki/export?${queryParams.toString()}`;

    // 2. Memanggil API untuk mendapatkan file
    const response = await fetch(url);

    if (!response.ok) {
      // Jika respons gagal, coba baca pesan error dari JSON
      const errorData = await response.json().catch(() => ({
        // Fallback jika body error bukan JSON
        error: `Gagal mengunduh file. Server merespons dengan status ${response.status}.`,
      }));
      // Lemparkan error agar ditangkap oleh toast.promise
      throw new Error(errorData.error || 'Terjadi kesalahan yang tidak diketahui.');
    }
    
    // 3. Memproses blob dan nama file dari header
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const filenameMatch = disposition.match(/filename="(.+?)"/);
    const fallbackFilename = `hki-export-${new Date().toISOString().split('T')[0]}.${format}`;
    const filename = filenameMatch ? filenameMatch[1] : fallbackFilename;
    
    // 4. Memicu unduhan di browser
    triggerBrowserDownload(blob, filename);
  };

  // Menggunakan toast.promise untuk memberikan feedback UX otomatis
  toast.promise(promise(), {
    loading: 'Sedang mempersiapkan file unduhan...',
    success: 'File berhasil diunduh! 🚀',
    error: (err: any) => err.message || 'Gagal mengunduh file.',
  });
}