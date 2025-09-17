// components/hki/view-hki-modal.tsx

'use client'

import React, { useCallback, memo } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HKIEntry } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Download, Eye, Paperclip } from 'lucide-react'
import { getStatusStyle } from './data-table';
import { toast } from 'sonner'

/* ======================== HELPER COMPONENT (MEMOIZED) ======================== */
const DetailItem = memo(({ label, value, children }: { label: string; value?: string | number | null; children?: React.ReactNode }) => {
  const displayValue = value === null || value === undefined || value === '' ? '-' : value
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-base text-foreground break-words">
        {children ? children : displayValue}
      </dd>
    </div>
  )
})
DetailItem.displayName = 'DetailItem';

/* ======================== KOMPONEN MODAL UTAMA ======================== */
interface ViewHKIModalProps {
  isOpen: boolean
  onClose: () => void
  entry: HKIEntry | null
}

export function ViewHKIModal({ isOpen, onClose, entry }: ViewHKIModalProps) {
  
  const handleDownload = useCallback(() => {
    if (!entry || !entry.sertifikat_pdf) {
      toast.error('File tidak tersedia.');
      return;
    }

    const downloadPromise = () => new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/hki/${entry.id_hki}/signed-url`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Gagal mendapatkan URL unduhan.' }));
          throw new Error(errorData.error);
        }
        const data = await res.json();
        window.open(data.signedUrl, '_blank');
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(downloadPromise(), {
      loading: 'Mempersiapkan file unduhan...',
      success: 'Unduhan dimulai di tab baru.',
      error: (err: Error) => err.message || 'Gagal mengunduh file.',
    });

  }, [entry]);

  if (!entry) return null;

  const statusStyle = getStatusStyle(entry.status_hki?.nama_status);
  const StatusIcon = statusStyle.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl p-0 flex flex-col max-h-[90vh]">
        {/* HEADER MODAL */}
        <DialogHeader className="flex flex-row items-start gap-4 px-6 py-4 border-b">
          <div className="bg-primary/10 p-2.5 rounded-lg flex-shrink-0">
            <Eye className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <DialogTitle className="text-xl font-semibold break-words">
              {entry.nama_hki}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Detail lengkap untuk data pengajuan HKI. Data tahun {entry.tahun_fasilitasi || 'N/A'}.
            </DialogDescription>
          </div>
        </DialogHeader>
        
        {/* KONTEN UTAMA (SCROLLABLE) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6 overflow-y-auto">
          
          {/* Kolom Kiri - Info Utama */}
          <dl className="space-y-6">
            <DetailItem label="Nama HKI" value={entry.nama_hki} />
            <DetailItem label="Jenis Produk" value={entry.jenis_produk} />
            <DetailItem label="Jenis HKI">
              <Badge variant="outline" className="font-medium bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 w-fit">
                {/* DIPERBAIKI: Menggunakan nama properti `nama_jenis_hki` yang benar */}
                {entry.jenis?.nama_jenis_hki || '-'}
              </Badge>
            </DetailItem>
            <DetailItem label="Kelas HKI (Nice)">
              {entry.kelas ? (
                <div className="flex flex-col items-start gap-1.5">
                  <Badge variant="secondary" className="font-normal bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 w-fit">
                    Kelas {entry.kelas.id_kelas} ({entry.kelas.tipe})
                  </Badge>
                  <p className="text-sm text-muted-foreground italic">&quot;{entry.kelas.nama_kelas}&quot;</p>
                </div>
              ) : (
                <span className="text-muted-foreground italic">- Tidak diatur -</span>
              )}
            </DetailItem>
            <DetailItem label="Status Saat Ini">
              <Badge className={cn("text-base font-medium gap-2 px-3 py-1 w-fit", statusStyle.className)}>
                <StatusIcon className="h-4 w-4" />
                {entry.status_hki?.nama_status || 'N/A'}
              </Badge>
            </DetailItem>
          </dl>

          {/* Kolom Kanan - Info Admin & Pemohon */}
          <dl className="space-y-6">
            <DetailItem label="Pemohon" value={entry.pemohon?.nama_pemohon} />
            <DetailItem label="Alamat Pemohon">
              <p className="text-base text-foreground whitespace-pre-wrap">{entry.pemohon?.alamat || '-'}</p>
            </DetailItem>
            {/* DIPERBAIKI: Menggunakan nama properti `nama_opd` yang benar */}
            <DetailItem label="Pengusul (OPD)" value={entry.pengusul?.nama_opd} />
            <DetailItem label="Keterangan Tambahan">
              <p className="text-base text-foreground whitespace-pre-wrap">{entry.keterangan || '-'}</p>
            </DetailItem>
            <DetailItem label="Sertifikat PDF">
              {entry.sertifikat_pdf ? (
                <Button variant="outline" size="sm" className="gap-2 w-fit" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  Unduh File
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                  <Paperclip className="h-4 w-4" />
                  <span>Tidak ada file terlampir.</span>
                </div>
              )}
            </DetailItem>
          </dl>
        </div>
        
        {/* FOOTER MODAL */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/40 sm:justify-end">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}