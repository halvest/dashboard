import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { HKIEntry } from '@/lib/types'

export function useHKIEntry(hkiId: number | null, isOpen: boolean) {
  const { data, isLoading, error, refetch } = useQuery<HKIEntry>({
    queryKey: ['hkiEntry', hkiId],
    queryFn: async () => {
      const response = await fetch(`/api/hki/${hkiId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message || result.error || 'Gagal mengambil data dari server'
        )
      }

      // API GET mengembalikan { success: true, data: {...} }
      return result.success && result.data ? result.data : result
    },
    enabled: isOpen && !!hkiId, // Hanya fetch jika modal terbuka DAN ada ID
    staleTime: 5 * 60 * 1000, // Cache selama 5 menit untuk menghindari fetch berulang
  })

  // Tampilkan toast jika terjadi error saat memuat data (sama seperti perilaku sebelumnya)
  useEffect(() => {
    if (error) {
      toast.error('Gagal memuat data entri untuk diedit.')
    }
  }, [error])

  return {
    data: data ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  }
}
