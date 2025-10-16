// components/hki/edit-hki-modal.tsx
'use client'

import React, { useState, useCallback, memo, lazy, Suspense } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { HKIEntry, FormOptions } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, PencilLine, Loader2 } from 'lucide-react'
import { useHKIEntry } from '@/hooks/use-hki-entry'
import { motion, AnimatePresence } from 'framer-motion'

const HKIForm = lazy(() =>
  import('@/components/forms/hki-form').then((module) => ({
    default: module.HKIForm,
  }))
)

type EditModalFormOptions = Pick<
  FormOptions,
  'jenisOptions' | 'statusOptions' | 'pengusulOptions' | 'kelasOptions'
>

interface EditHKIModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedEntry: HKIEntry) => void
  onError: (message: string) => void
  hkiId: number | null
  formOptions: Readonly<EditModalFormOptions>
}

const EDIT_FORM_ID = 'hki-edit-form'

const FormSkeleton = memo(() => (
  <div className="space-y-6" aria-label="Loading form data">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="space-y-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-24 w-full" />
    </div>
  </div>
))
FormSkeleton.displayName = 'FormSkeleton'

const ErrorDisplay = memo(
  ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="font-semibold">Gagal Memuat Data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button
          onClick={onRetry}
          variant="destructive"
          size="sm"
          className="mt-4"
        >
          Coba Lagi
        </Button>
      </Alert>
    </div>
  )
)
ErrorDisplay.displayName = 'ErrorDisplay'

export const EditHKIModal = memo(
  ({
    isOpen,
    onClose,
    onSuccess,
    onError,
    hkiId,
    formOptions,
  }: EditHKIModalProps) => {
    const { data, isLoading, error, refetch } = useHKIEntry(hkiId, isOpen)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleClose = useCallback(() => {
      if (!isSubmitting) {
        onClose()
      }
    }, [isSubmitting, onClose])

    const renderContent = () => {
      if (isLoading) {
        return <FormSkeleton />
      }
      if (error) {
        return <ErrorDisplay error={error} onRetry={refetch} />
      }
      if (data) {
        return (
          <Suspense fallback={<FormSkeleton />}>
            <HKIForm
              key={hkiId}
              id={EDIT_FORM_ID}
              mode="edit"
              initialData={data}
              jenisOptions={formOptions.jenisOptions}
              statusOptions={formOptions.statusOptions}
              pengusulOptions={formOptions.pengusulOptions}
              kelasOptions={formOptions.kelasOptions}
              onSubmittingChange={setIsSubmitting}
              onSuccess={onSuccess}
              onError={onError}
            />
          </Suspense>
        )
      }
      return null
    }

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-4xl p-0 flex flex-col max-h-[90vh]">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <DialogHeader className="flex flex-row items-center gap-4 px-6 py-4 border-b">
              <div className="bg-primary/10 p-2.5 rounded-lg">
                <PencilLine className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">
                  Edit Entri HKI
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  {isLoading
                    ? 'Memuat data...'
                    : data
                      ? `Perbarui informasi untuk "${data.nama_hki}"`
                      : error
                        ? 'Gagal memuat detail entri.'
                        : 'Pilih data untuk diedit.'}
                </DialogDescription>
              </div>
            </DialogHeader>
          </motion.div>

          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-[300px]">
            {renderContent()}
          </div>

          <AnimatePresence>
            {!isLoading && !error && data && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t bg-muted/40">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    form={EDIT_FORM_ID}
                    disabled={isSubmitting}
                    className="gap-2 w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </Button>
                </DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    )
  }
)
EditHKIModal.displayName = 'EditHKIModal'
