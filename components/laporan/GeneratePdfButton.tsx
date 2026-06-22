'use client'

// components/laporan/GeneratePdfButton.tsx
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function GeneratePdfButton() {
  const [isGenerating, setIsGenerating] = useState(false)
  const searchParams = useSearchParams()

  const handleGenerate = async () => {
    setIsGenerating(true)
    const toastId = toast.loading('Membuat laporan PDF, harap tunggu...')

    try {
      // Build URL dengan filter yang sama dari URL saat ini
      const params = new URLSearchParams()
      const year = searchParams.get('year')
      const status = searchParams.get('status')

      if (year) params.set('year', year)
      if (status) params.set('status', status)

      const url = `/api/laporan/hki/pdf?${params.toString()}`
      const response = await fetch(url)

      if (!response.ok) {
        const errData = await response.json().catch(() => null)
        throw new Error(errData?.error ?? 'Gagal membuat laporan PDF.')
      }

      // Ambil nama file dari header
      const disposition = response.headers.get('Content-Disposition') ?? ''
      const match = disposition.match(/filename="(.+?)"/)
      const fileName = match?.[1] ?? 'laporan-hki.pdf'

      // Trigger download di browser
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)

      toast.success(`Laporan "${fileName}" berhasil diunduh.`, { id: toastId })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Gagal mengunduh PDF.'
      toast.error(msg, { id: toastId })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      onClick={handleGenerate}
      disabled={isGenerating}
      className="gap-2 shadow-sm"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {isGenerating ? 'Membuat PDF...' : 'Generate PDF'}
    </Button>
  )
}
