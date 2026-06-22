'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useQueryClient } from '@tanstack/react-query'
import { useDebouncedCallback } from 'use-debounce'

/**
 * Hook kustom untuk berlangganan perubahan real-time pada tabel HKI di Supabase.
 * Ini akan secara otomatis memperbarui data di tabel ketika ada perubahan
 * dari pengguna lain atau proses backend.
 */
export function useHkiRealtime() {
  const queryClient = useQueryClient()

  // Throttle invalidation maksimal tiap 1.5 detik (1500ms) untuk mencegah
  // spam request ke server saat terjadi mutasi data secara massal.
  const invalidateHkiData = useDebouncedCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['hkiData'] })
  }, 1500)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('hki_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hki' },
        (payload) => {
          console.log('Perubahan realtime terdeteksi:', payload)

          // Panggil fungsi debounce alih-alih langsung invalidate
          invalidateHkiData()
        }
      )
      .subscribe()

    // Cleanup function untuk berhenti berlangganan saat komponen di-unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [invalidateHkiData])
}
