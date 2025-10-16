// components/hki/create-hki-modal.tsx
'use client'

import React, { useState, useCallback, memo, lazy, Suspense } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { HKIEntry, FormOptions } from '@/lib/types'
import { PlusSquare, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'

// ✨ OPTIMASI UTAMA: Gunakan dynamic import untuk HKIForm.
// Kode untuk HKIForm baru akan di-download saat modal ini dibuka.
const HKIForm = lazy(() =>
  import('@/components/forms/hki-form').then((module) => ({
    default: module.HKIForm,
  }))
)

interface CreateHKIModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newItem: HKIEntry) => void
  onError: (message: string) => void
  formOptions: Readonly<FormOptions>
}

const CREATE_FORM_ID = 'hki-create-form'

// Komponen placeholder sederhana saat form sedang di-load
const FormSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-20 w-full" />
    </div>
  </div>
)

export const CreateHKIModal = memo(
  ({
    isOpen,
    onClose,
    onSuccess,
    onError,
    formOptions,
  }: CreateHKIModalProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleClose = useCallback(() => {
      if (!isSubmitting) {
        onClose()
      }
    }, [isSubmitting, onClose])

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-4xl p-0 flex flex-col max-h-[90vh]">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <DialogHeader className="flex flex-row items-start gap-4 px-6 py-4 border-b">
              <div className="bg-primary/10 p-2.5 rounded-lg flex-shrink-0">
                <PlusSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">
                  Buat Entri HKI Baru
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Isi semua informasi yang diperlukan untuk membuat catatan HKI
                  baru.
                </DialogDescription>
              </div>
            </DialogHeader>
          </motion.div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* ✨ OPTIMASI: Bungkus HKIForm dengan Suspense. */}
            {/* Fallback akan ditampilkan saat kode HKIForm sedang diunduh. */}
            <Suspense fallback={<FormSkeleton />}>
              {isOpen && (
                <HKIForm
                  key={String(isOpen)}
                  id={CREATE_FORM_ID}
                  mode="create"
                  jenisOptions={formOptions.jenisOptions}
                  statusOptions={formOptions.statusOptions}
                  pengusulOptions={formOptions.pengusulOptions}
                  kelasOptions={formOptions.kelasOptions}
                  onSubmittingChange={setIsSubmitting}
                  onSuccess={onSuccess}
                  onError={onError}
                />
              )}
            </Suspense>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
          >
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t bg-muted/40">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                form={CREATE_FORM_ID}
                disabled={isSubmitting}
                className="gap-2 w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  'Simpan Data'
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }
)

CreateHKIModal.displayName = 'CreateHKIModal'
