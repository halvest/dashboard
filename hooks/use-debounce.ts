'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook untuk menunda pembaruan nilai (debounce).
 * Ini berguna untuk input pencarian agar tidak memicu query
 * pada setiap ketikan.
 * @param value Nilai yang ingin di-debounce.
 * @param delay Waktu tunda dalam milidetik (ms).
 * @returns Nilai yang sudah di-debounce.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set timeout untuk memperbarui nilai setelah delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Bersihkan timeout jika nilai berubah (misal: pengguna mengetik lagi)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay]) // Hanya jalankan ulang efek jika nilai atau delay berubah

  return debouncedValue
}
