// components/hki/export-modal.tsx
'use client'

/* =================================================================================================
* KOMPONEN MODAL EKSPOR DATA (VERSI OPTIMAL)
* =================================================================================================
* Tujuan: Menyediakan antarmuka yang jelas, intuitif, dan bebas hambatan untuk mengekspor data.
*
* Fitur & Optimalisasi Utama:
* 1. UX Konfirmasi Filter: Menampilkan semua filter yang sedang aktif secara visual menggunakan
* Badge, memberi pengguna keyakinan penuh atas data yang akan diekspor.
* 2. Seleksi Kolom Efisien: Mengelompokkan kolom secara logis dan menambahkan tombol preset
* (Pilih Umum, Pilih Semua, Hapus Semua) untuk mempercepat alur kerja.
* 3. Layout Flexbox Stabil: Mencegah 'layout shift' dengan struktur header, content (scrollable),
* dan footer yang kokoh, memberikan pengalaman yang profesional.
* 4. Umpan Balik Jelas: Menggunakan `toast.promise` untuk notifikasi loading, success, dan error
* yang otomatis saat proses ekspor berjalan.
* 5. Kode Bersih & Modular: Memecah UI menjadi sub-komponen yang di-memoized untuk performa
* dan keterbacaan kode.
* =================================================================================================*/

/* ======================== IMPORTS: REACT & LIBS ======================== */
import React, { useState, useCallback, useEffect, useMemo, memo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, FilterX, ListChecks, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { HKIEntry, JenisHKI, StatusHKI } from '@/lib/types' // Impor tipe

/* ======================== KONFIGURASI KOLOM & TIPE ======================== */
interface ColumnConfig {
  id: keyof HKIEntry | string; // Mengizinkan string untuk relasi
  label: string;
  group: 'Info HKI' | 'Detail Pemohon' | 'Data Administrasi';
}

const ALL_COLUMNS: readonly ColumnConfig[] = [
  { id: 'nama_hki', label: 'Nama HKI', group: 'Info HKI' },
  { id: 'jenis_produk', label: 'Jenis Produk', group: 'Info HKI' },
  { id: 'jenis', label: 'Jenis HKI', group: 'Info HKI' },
  { id: 'kelas', label: 'Kelas HKI', group: 'Info HKI' },
  { id: 'nama_pemohon', label: 'Nama Pemohon', group: 'Detail Pemohon' },
  { id: 'alamat', label: 'Alamat Pemohon', group: 'Detail Pemohon' },
  { id: 'pengusul', label: 'Pengusul (OPD)', group: 'Data Administrasi' },
  { id: 'status_hki', label: 'Status', group: 'Data Administrasi' },
  { id: 'tahun_fasilitasi', label: 'Tahun Fasilitasi', group: 'Data Administrasi' },
  { id: 'keterangan', label: 'Keterangan', group: 'Data Administrasi' },
  { id: 'sertifikat_pdf', label: 'Link Sertifikat', group: 'Data Administrasi' },
  { id: 'created_at', label: 'Tanggal Dibuat', group: 'Data Administrasi' },
];

const DEFAULT_COLUMNS = ['nama_hki', 'nama_pemohon', 'jenis', 'pengusul', 'status_hki', 'tahun_fasilitasi'];

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  // Menerima formOptions untuk bisa menerjemahkan ID filter menjadi label
  filters: Record<string, string>
  formOptions: {
    jenisOptions: JenisHKI[];
    statusOptions: StatusHKI[];
    pengusulOptions: { value: string; label: string }[];
  }
}

/* ======================== SUB-KOMPONEN TAMPILAN FILTER AKTIF ======================== */
const ActiveFiltersDisplay = memo(({ filters, formOptions }: Pick<ExportModalProps, 'filters' | 'formOptions'>) => {
  const activeFilters = useMemo(() => {
    const getLabel = (type: 'jenis' | 'status' | 'pengusul', id: string) => {
      if (type === 'jenis') return formOptions.jenisOptions.find(o => o.id_jenis.toString() === id)?.nama_jenis;
      if (type === 'status') return formOptions.statusOptions.find(o => o.id_status.toString() === id)?.nama_status;
      if (type === 'pengusul') return formOptions.pengusulOptions.find(o => o.value === id)?.label;
      return id;
    };
    
    return Object.entries(filters)
      .map(([key, value]) => {
        if (!value) return null;
        if (key === 'search') return { label: 'Pencarian', value: `"${value}"`};
        if (key === 'jenisId') return { label: 'Jenis HKI', value: getLabel('jenis', value)};
        if (key === 'statusId') return { label: 'Status', value: getLabel('status', value)};
        if (key === 'year') return { label: 'Tahun', value: value };
        if (key === 'pengusulId') return { label: 'Pengusul', value: getLabel('pengusul', value)};
        return null;
      })
      .filter(Boolean) as { label: string; value: string }[];
  }, [filters, formOptions]);

  if (activeFilters.length === 0) return null;

  return (
    <div className="space-y-2 rounded-md border bg-muted/50 p-3">
      <h4 className="text-sm font-semibold text-foreground">Filter Aktif:</h4>
      <div className="flex flex-wrap gap-2">
        {activeFilters.map(filter => (
          <Badge key={filter.label} variant="secondary" className="font-normal">
            <span className="text-muted-foreground mr-1.5">{filter.label}:</span>
            <span className="font-medium text-foreground">{filter.value}</span>
          </Badge>
        ))}
      </div>
    </div>
  )
});
ActiveFiltersDisplay.displayName = 'ActiveFiltersDisplay';

/* ======================== MAIN COMPONENT ======================== */
export function ExportModal({ isOpen, onClose, filters, formOptions }: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState('csv');
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set(DEFAULT_COLUMNS));

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setSelectedColumns(new Set(DEFAULT_COLUMNS));
      setIsExporting(false);
      setFormat('csv');
    }
  }, [isOpen]);

  const handleToggleColumn = useCallback((columnId: string) => {
    setSelectedColumns(prev => {
      const next = new Set(prev);
      next.has(columnId) ? next.delete(columnId) : next.add(columnId);
      return next;
    });
  }, []);

  const handleSelectPreset = useCallback((preset: 'default' | 'all' | 'none') => {
    if (preset === 'default') setSelectedColumns(new Set(DEFAULT_COLUMNS));
    else if (preset === 'all') setSelectedColumns(new Set(ALL_COLUMNS.map(c => c.id)));
    else setSelectedColumns(new Set());
  }, []);
  
  const groupedColumns = useMemo(() => 
    Object.groupBy(ALL_COLUMNS, ({ group }) => group) as Record<string, ColumnConfig[]>
  , []);

  const handleExport = useCallback(async () => {
    if (selectedColumns.size === 0) {
      toast.error("Pilih setidaknya satu kolom untuk diekspor.");
      return;
    }
    
    setIsExporting(true);

    const exportPromise = () => new Promise(async (resolve, reject) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value);
      }
      params.set('format', format);
      params.set('columns', Array.from(selectedColumns).join(','));

      const res = await fetch(`/api/hki/export?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Gagal memproses permintaan di server." }));
        return reject(new Error(err.message || "Gagal membuat file ekspor."));
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_hki_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      resolve("Ekspor berhasil diunduh!");
    });

    toast.promise(exportPromise(), {
      loading: "Mempersiapkan ekspor data...",
      success: (message) => {
        onClose();
        return message as string;
      },
      error: (err) => err.message,
      finally: () => setIsExporting(false),
    });
  }, [selectedColumns, format, filters, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 flex flex-col h-full max-h-[90vh]">
        <DialogHeader className="flex flex-row items-center gap-4 px-6 py-4 border-b">
          <div className="bg-primary/10 p-2.5 rounded-lg flex-shrink-0">
            <Download className="h-6 w-6 text-primary" />
          </div>
          <div>
            <DialogTitle className="text-xl font-semibold">Ekspor Data HKI</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Pilih format dan kolom yang akan disertakan dalam file.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-6 p-6 overflow-y-auto">
          <ActiveFiltersDisplay filters={filters} formOptions={formOptions} />

          <div className="space-y-2">
            <Label>1. Pilih Format File</Label>
            <Select value={format} onValueChange={setFormat} disabled={isExporting}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Pilih format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Cocok untuk spreadsheet)</SelectItem>
                <SelectItem value="xlsx" disabled>Excel (XLSX) (Segera Hadir)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>2. Pilih Kolom untuk Diekspor</Label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => handleSelectPreset('default')} disabled={isExporting}><ListChecks className="mr-2 h-4 w-4" /> Pilih Umum</Button>
              <Button size="sm" variant="outline" onClick={() => handleSelectPreset('all')} disabled={isExporting}><Check className="mr-2 h-4 w-4" /> Pilih Semua</Button>
              <Button size="sm" variant="outline" onClick={() => handleSelectPreset('none')} disabled={isExporting}><X className="mr-2 h-4 w-4" /> Hapus Semua</Button>
            </div>
            <div className="space-y-4 rounded-md border p-4">
              {Object.entries(groupedColumns).map(([groupName, columns]) => (
                <div key={groupName}>
                  <h4 className="font-semibold text-sm mb-3 border-b pb-2">{groupName}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                    {columns.map((col) => (
                      <div key={col.id} className="flex items-center space-x-2">
                        <Checkbox id={`col-${col.id}`} checked={selectedColumns.has(col.id)} onCheckedChange={() => handleToggleColumn(col.id)} disabled={isExporting} />
                        <Label htmlFor={`col-${col.id}`} className="font-normal text-sm cursor-pointer">{col.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Terpilih: {selectedColumns.size} dari {ALL_COLUMNS.length} kolom.</p>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t bg-muted/40">
          <Button type="button" variant="outline" onClick={onClose} disabled={isExporting}>Batal</Button>
          <Button onClick={handleExport} disabled={isExporting || selectedColumns.size === 0} className="gap-2">
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isExporting ? `Mengekspor...` : `Ekspor ${selectedColumns.size} Kolom ke ${format.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}