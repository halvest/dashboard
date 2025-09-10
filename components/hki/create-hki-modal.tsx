// app/components/hki/create-hki-modal.tsx
'use client'

/* =================================================================================================
* KOMPONEN MODAL BUAT HKI (VERSI OPTIMAL)
* =================================================================================================
* Tujuan: Menyediakan antarmuka modal yang stabil dan intuitif untuk membuat entri HKI baru.
*
* Fitur & Optimalisasi Utama:
* 1. Layout Flexbox Stabil: Mencegah 'layout shift' dengan struktur header, content (scrollable),
* dan footer yang kokoh, konsisten dengan modal lain dalam aplikasi.
* 2. UX Konsisten: Desain header dengan ikon dan tombol footer dengan animasi loading
* kini seragam dengan EditModal, menciptakan pengalaman pengguna yang dapat diprediksi.
* 3. Handler yang Dioptimalkan: Semua fungsi callback di-memoized dengan `useCallback` untuk
* stabilitas referensi dan performa yang lebih baik.
* 4. Alur Kerja yang Jelas: Memisahkan antara callback dari form (onSuccess, onError)
* dan aksi modal (onClose), membuat alur data lebih mudah dipahami.
* =================================================================================================*/

/* ======================== IMPORTS: REACT & LIBS ======================== */
import React, { useState, useCallback } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { HKIForm } from '@/components/forms/hki-form' 
import { HKIEntry, JenisHKI, StatusHKI } from '@/lib/types'
import { PlusSquare, Loader2 } from 'lucide-react' // Impor ikon yang relevan

/* ======================== TYPES & PROPS ======================== */
type ComboboxOption = { value: string; label: string };

interface CreateHKIModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  onError?: (message: string) => void
  formOptions: {
    jenisOptions: JenisHKI[]
    statusOptions: StatusHKI[]
    pengusulOptions: ComboboxOption[]
    kelasOptions: ComboboxOption[]
  }
}

const CREATE_FORM_ID = 'hki-create-form';

/* ======================== MAIN COMPONENT ======================== */
export function CreateHKIModal({
  isOpen,
  onClose,
  onSuccess: onParentSuccess,
  onError: onParentError,
  formOptions,
}: CreateHKIModalProps) {
  
  const [isSubmitting, setIsSubmitting] = useState(false) 

  // Handler kini di-memoized dengan useCallback untuk performa
  const handleSuccess = useCallback((_newData: HKIEntry) => {
    onParentSuccess?.()
    onClose() 
  }, [onParentSuccess, onClose])

  const handleError = useCallback((message: string) => {
    onParentError?.(message)
  }, [onParentError])
  
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl p-0 flex flex-col h-full max-h-[90vh] md:h-auto md:max-h-[800px]">
        {/* HEADER: Didesain ulang agar konsisten dengan modal lain */}
        <DialogHeader className="flex flex-row items-center gap-4 px-6 py-4 border-b">
          <div className="bg-primary/10 p-2.5 rounded-lg">
            <PlusSquare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <DialogTitle className="text-xl font-semibold">
              Buat Entri HKI Baru
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Isi semua informasi yang diperlukan untuk membuat catatan HKI baru.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* KONTEN UTAMA: Dibuat fleksibel dan scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <HKIForm
            id={CREATE_FORM_ID} 
            mode="create"
            jenisOptions={formOptions.jenisOptions}
            statusOptions={formOptions.statusOptions}
            pengusulOptions={formOptions.pengusulOptions}
            kelasOptions={formOptions.kelasOptions}
            onSubmittingChange={setIsSubmitting}
            onSuccess={handleSuccess} 
            onError={handleError}
          />
        </div>

        {/* FOOTER: Didesain ulang agar konsisten dan responsif */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t bg-muted/40">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            type="submit"
            form={CREATE_FORM_ID} 
            disabled={isSubmitting}
            className="gap-2"
          >
            {/* ✅ UX: Tambahkan animasi loading spinner */}
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}