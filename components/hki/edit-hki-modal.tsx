// components/hki/edit-hki-modal.tsx
"use client";

/* =================================================================================================
* KOMPONEN MODAL EDIT HKI (VERSI OPTIMAL)
* =================================================================================================
* Tujuan: Menyediakan antarmuka modal yang stabil, cepat, dan intuitif untuk mengedit entri HKI.
*
* Fitur & Optimalisasi Utama:
* 1. Layout Flexbox Stabil: Mencegah 'layout shift' saat memuat data atau menampilkan error.
* 2. UX Loading & Error: Menampilkan skeleton dan pesan error terintegrasi dengan tombol "Coba Lagi".
* 3. Performa Optimal: Komponen internal (Skeleton, ErrorDisplay) diekstraksi dan di-memoized.
* 4. Handler Stabil: Semua fungsi callback di-memoized dengan `useCallback`.
* 5. Animasi Loading: Menampilkan skeleton saat fetch data dan spinner (Loader2) saat submit.
* =================================================================================================*/

/* ======================== IMPORTS: REACT & LIBS ======================== */
import React, { useState, useCallback, memo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, 
} from "@/components/ui/dialog";
import { HKIForm } from "@/components/forms/hki-form";
import { HKIEntry, JenisHKI, StatusHKI } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
// ✅ PERBAIKAN: Impor Loader2 yang hilang untuk animasi tombol submit
import { AlertCircle, PencilLine, Loader2 } from "lucide-react"; 
import { useHKIEntry } from "@/hooks/use-hki-entry";

/* ======================== TYPES & PROPS ======================== */
type ComboboxOption = { value: string; label: string };

interface EditHKIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedEntry: HKIEntry) => void;
  onError: (message: string) => void;
  hkiId: number | null;
  formOptions: {
    jenisOptions: JenisHKI[];
    statusOptions: StatusHKI[];
    pengusulOptions: ComboboxOption[];
    kelasOptions: ComboboxOption[];
    tahunOptions: { tahun: number }[];
  };
}

const EDIT_FORM_ID = 'hki-edit-form';

/* ======================== SUB-KOMPONEN INTERNAL (MEMOIZED) ======================== */
const FormSkeleton = memo(() => (
  <div className="space-y-6">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-24 w-full" />
    </div>
  </div>
));
FormSkeleton.displayName = 'FormSkeleton';

const ErrorDisplay = memo(({ error, onRetry }: { error: string; onRetry: () => void; }) => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <Alert variant="destructive" className="max-w-md">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="font-semibold">Gagal Memuat Data</AlertTitle>
      </div>
      <AlertDescription>{error}</AlertDescription>
      <Button onClick={onRetry} variant="destructive" size="sm" className="mt-4">
        Coba Lagi
      </Button>
    </Alert>
  </div>
));
ErrorDisplay.displayName = 'ErrorDisplay';

/* ======================== MAIN COMPONENT ======================== */
export function EditHKIModal({
  isOpen, onClose, onSuccess, onError, hkiId, formOptions,
}: EditHKIModalProps) {
  const { data, isLoading, error, refetch } = useHKIEntry(hkiId, isOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuccess = useCallback((updatedData: HKIEntry) => {
    onSuccess(updatedData); 
  }, [onSuccess]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  // Fungsi untuk me-render konten utama berdasarkan state
  const renderContent = () => {
    if (isLoading) return <FormSkeleton />;
    if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
    if (data) {
      return (
        <HKIForm
          id={EDIT_FORM_ID} 
          mode="edit"
          initialData={data}
          jenisOptions={formOptions.jenisOptions}
          statusOptions={formOptions.statusOptions}
          pengusulOptions={formOptions.pengusulOptions}
          kelasOptions={formOptions.kelasOptions}
          onSubmittingChange={setIsSubmitting} 
          onSuccess={handleSuccess} 
          onError={onError}
        />
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl p-0 flex flex-col h-full max-h-[90vh] md:h-auto md:max-h-[800px]">
        {/* HEADER: Dibuat statis untuk mencegah layout shift */}
        <DialogHeader className="flex flex-row items-center gap-4 px-6 py-4 border-b">
          <div className="bg-primary/10 p-2.5 rounded-lg">
            <PencilLine className="h-6 w-6 text-primary" />
          </div>
          <div>
            <DialogTitle className="text-xl font-semibold">
              Edit Entri HKI
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              {isLoading ? "Memuat data..." : data ? `Perbarui informasi untuk "${data.nama_hki}"` : "Terjadi kesalahan"}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* KONTEN UTAMA: Dibuat fleksibel dan scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {renderContent()}
        </div>

        {/* FOOTER: Hanya muncul jika data berhasil dimuat */}
        {!isLoading && !error && data && (
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t bg-muted/40">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button 
              type="submit" 
              form={EDIT_FORM_ID}
              disabled={isSubmitting}
              className="gap-2"
            >
              {/* ✅ PERBAIKAN: Animasi loading ini sekarang akan tampil karena Loader2 sudah diimpor */}
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}