// components/hki/edit-hki-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HKIForm } from '@/components/forms/hki-form';
import { HKIEntry, JenisHKI, StatusHKI, Pengusul } from '@/lib/types'; // Pastikan tipe FasilitasiTahun sudah benar di sini
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// 1. PERBAIKI PROPS YANG DITERIMA KOMPONEN
interface EditHKIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hkiId: number | null; // Ubah nama dari 'entryId' dan tipe dari 'string' ke 'number'
  formOptions: {
    jenisOptions: JenisHKI[];
    statusOptions: StatusHKI[];
    tahunOptions: { tahun: number }[]; // Sesuaikan tipe ini jika perlu
    pengusulOptions: Pengusul[];
  };
}

// Komponen Skeleton untuk form loading
const FormSkeleton = () => (
  <div className="space-y-6 pt-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
    <div className="flex justify-end pt-4 gap-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

// 2. TERIMA PROPS YANG SUDAH DIPERBAIKI
export function EditHKIModal({ isOpen, onClose, onSuccess, hkiId, formOptions }: EditHKIModalProps) {
  const [initialData, setInitialData] = useState<HKIEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Jalankan fetch hanya jika modal terbuka DAN ada hkiId
    if (isOpen && hkiId) {
      const fetchEntryData = async () => {
        setIsLoading(true);
        setError(null);
        setInitialData(null); // Reset data sebelumnya

        try {
          // 3. GUNAKAN 'hkiId' DARI PROPS UNTUK FETCH DATA
          const response = await fetch(`/api/hki/${hkiId}`); 
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Gagal mengambil data`);
          }
          const data: HKIEntry = await response.json();
          setInitialData(data);
        } catch (err: any) {
          setError(err.message);
          toast.error("Gagal memuat data entri untuk diedit.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchEntryData();
    }
  }, [isOpen, hkiId]); // Tambahkan hkiId sebagai dependency

  // Menangani penutupan dialog untuk mereset state
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Entri HKI</DialogTitle>
          <DialogDescription>
            Perbarui informasi untuk "{initialData?.nama_hki || '...'}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-[80vh] overflow-y-auto pr-2">
          {isLoading && <FormSkeleton />}
          
          {error && !isLoading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Gagal Memuat Data</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isLoading && !error && initialData && (
            <HKIForm 
              mode="edit" 
              initialData={initialData}
              jenisOptions={formOptions.jenisOptions}
              statusOptions={formOptions.statusOptions}
              // tahunOptions tidak digunakan di HKIForm, tapi bisa diteruskan jika perlu
              pengusulOptions={formOptions.pengusulOptions}
              onSuccess={onSuccess} 
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}