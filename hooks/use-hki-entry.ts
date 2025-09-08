// lib/hooks/use-hki-entry.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { HKIEntry } from '@/lib/types';

export function useHKIEntry(hkiId: number | null, isOpen: boolean) {
  const [data, setData] = useState<HKIEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntryData = useCallback(async () => {
    if (!hkiId) return;

    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`/api/hki/${hkiId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal mengambil data dari server');
      }
      const result: HKIEntry = await response.json();
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga';
      setError(message);
      toast.error('Gagal memuat data entri untuk diedit.');
    } finally {
      setIsLoading(false);
    }
  }, [hkiId]);

  useEffect(() => {
    if (isOpen && hkiId) {
      fetchEntryData();
    }
  }, [isOpen, hkiId, fetchEntryData]);
  
  // Fungsi refetch untuk tombol "Coba Lagi"
  const refetch = () => {
    fetchEntryData();
  };

  return { data, isLoading, error, refetch };
}