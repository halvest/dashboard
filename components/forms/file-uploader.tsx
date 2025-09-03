'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { UploadCloud, File as FileIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void
  accept?: string
  maxSize?: number // dalam bytes
}

export function FileUploader({
  onFileSelect,
  accept = 'application/pdf',
  maxSize = 10 * 1024 * 1024, // 10MB default
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      if (fileRejections.length > 0) {
        toast.error('File ditolak.', {
          description: `Pastikan file berformat PDF dan ukurannya kurang dari ${
            maxSize / 1024 / 1024
          }MB.`,
        })
        return
      }

      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0]
        setFile(selectedFile)
        onFileSelect(selectedFile)
      }
    },
    [onFileSelect, maxSize]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize,
    multiple: false,
  })

  const removeFile = () => {
    setFile(null)
    onFileSelect(null)
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input p-8 text-center transition-colors',
          isDragActive && 'border-primary bg-accent'
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mb-4 h-10 w-10 text-muted-foreground" />
        {isDragActive ? (
          <p>Lepaskan file di sini...</p>
        ) : (
          <p>
            Seret & lepas file di sini, atau klik untuk memilih file
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Hanya PDF (maks. 10MB)
        </p>
      </div>
      {file && (
        <div className="flex items-center justify-between rounded-md border bg-muted p-2.5">
          <div className="flex items-center gap-2">
            <FileIcon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">{file.name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={removeFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}