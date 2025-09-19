// app/components/hki/create-hki-modal.tsx
'use client'

import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { HKIForm } from '@/components/forms/hki-form'
import { HKIEntry, FormOptions } from '@/lib/types'
import { PlusSquare, Loader2 } from 'lucide-react'

interface CreateHKIModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (newItem: HKIEntry) => void
  onError?: (message: string) => void
  formOptions: Readonly<FormOptions>
}

const CREATE_FORM_ID = 'hki-create-form'

export function CreateHKIModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
  formOptions,
}: Readonly<CreateHKIModalProps>) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSuccess = useCallback(
    (newData: HKIEntry) => {
      onSuccess?.(newData)
      onClose()
    },
    [onSuccess, onClose]
  )

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose()
    }
  }, [isSubmitting, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl p-0 flex flex-col max-h-[90vh]">
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
            onError={onError}
          />
        </div>

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
            form={CREATE_FORM_ID}
            disabled={isSubmitting}
            className="gap-2 w-full sm:w-auto"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}