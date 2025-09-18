// components/forms/file-uploader.tsx
'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { toast } from 'sonner'
import { UploadCloud, File as FileIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void
  accept?: Record<string, string[]>
  maxSize?: number
}

export function FileUploader({
  onFileSelect,
  accept = { 'application/pdf': ['.pdf'] },
  maxSize = 10 * 1024 * 1024,
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)

  const maxSizeInMB = useMemo(() => maxSize / 1024 / 1024, [maxSize])
  const acceptTypesLabel = useMemo(
    () => Object.values(accept).flat().join(', ').toUpperCase(),
    [accept]
  )

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0]
        const firstError = rejection.errors[0]

        switch (firstError.code) {
          case 'file-too-large':
            toast.error('File terlalu besar', {
              description: `Ukuran file Anda (${formatBytes(rejection.file.size)}) melebihi batas maksimal ${maxSizeInMB}MB.`,
            })
            break
          case 'file-invalid-type':
            toast.error('Tipe file salah', {
              description: `Hanya file dengan format ${acceptTypesLabel} yang diizinkan.`,
            })
            break
          default:
            toast.error('File ditolak', {
              description: firstError.message || 'Gagal mengunggah file.',
            })
            break
        }
        return
      }

      // Tangani file yang diterima
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0]
        setFile(selectedFile)
        onFileSelect(selectedFile)
        toast.success('File berhasil dipilih!', {
          description: `${selectedFile.name} (${formatBytes(selectedFile.size)})`,
        })
      }
    },
    [onFileSelect, maxSizeInMB, acceptTypesLabel, accept] // 'accept' ditambahkan untuk onDrop-hook
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept, // Gunakan prop 'accept'
    maxSize: maxSize, // Gunakan prop 'maxSize'
    multiple: false,
  })

  const removeFile = useCallback(() => {
    setFile(null)
    onFileSelect(null)
  }, [onFileSelect])

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input bg-background hover:bg-muted p-8 text-center transition-colors duration-200 ease-in-out',
          isDragActive && 'border-primary bg-primary/10'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <UploadCloud className="h-10 w-10" />
          <span className="font-medium text-foreground">
            {isDragActive
              ? 'Lepaskan file di sini...'
              : 'Seret & lepas file, atau klik untuk memilih'}
          </span>
          <span className="text-xs">
            {acceptTypesLabel} (Maks. {maxSizeInMB}MB)
          </span>
        </div>
      </div>

      {file && (
        <div className="flex items-center justify-between rounded-md border border-input bg-muted/50 p-3 shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-foreground">
                {file.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatBytes(file.size)}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0 text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10"
            onClick={removeFile}
          >
            <span className="sr-only">Hapus file</span>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
