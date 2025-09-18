// lib/hooks/use-hki-entry.ts
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { HKIEntry } from '@/lib/types'

export function useHKIEntry(hkiId: number | null, isOpen: boolean) {
  const [data, setData] = useState<HKIEntry | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEntryData = useCallback(async () => {
    if (!hkiId) return

    setIsLoading(true)
    setError(null)
    setData(null) // Kosongkan data lama saat memuat yang baru

    try {
      const response = await fetch(`/api/hki/${hkiId}`)

      // Coba parse JSON bahkan jika response.ok = false, karena API kita mengirim pesan error di body
      const result = await response.json()

      if (!response.ok) {
        // Gunakan pesan error dari body JSON jika ada
        throw new Error(
          result.message || result.error || 'Gagal mengambil data dari server'
        )
      }

      // API GET kita mengembalikan { success: true, data: {...} }
      // jadi kita harus mengambil 'data' dari result
      if (result.success && result.data) {
        setData(result.data)
      } else {
        // Jika format tidak terduga tapi response OK
        setData(result) // Fallback jika API hanya mengembalikan data
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga'
      setError(message)
      toast.error('Gagal memuat data entri untuk diedit.')
    } finally {
      setIsLoading(false)
    }
  }, [hkiId])

  useEffect(() => {
    // Hanya fetch jika modal terbuka DAN ada ID
    if (isOpen && hkiId) {
      fetchEntryData()
    }
    // Reset data jika modal ditutup (opsional, tapi bersih)
    if (!isOpen) {
      setData(null)
      setError(null)
    }
  }, [isOpen, hkiId, fetchEntryData])

  // Fungsi refetch untuk tombol "Coba Lagi"
  const refetch = () => {
    fetchEntryData()
  }

  return { data, isLoading, error, refetch }
}
