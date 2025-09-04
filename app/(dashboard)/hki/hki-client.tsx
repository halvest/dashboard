'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/hki/data-table';
import { EditHKIModal } from '@/components/hki/edit-hki-modal';
import { HKIEntry, JenisHKI, StatusHKI, Pengusul } from '@/lib/types';
import { toast } from 'sonner';

interface HKIClientPageProps {
  initialData: HKIEntry[];
  totalCount: number;
  formOptions: {
    jenisOptions: JenisHKI[];
    statusOptions: StatusHKI[];
    // tahunOptions tidak digunakan di sini, tapi bisa ada
    pengusulOptions: Pengusul[];
  };
}

export function HKIClientPage({ initialData, totalCount, formOptions }: HKIClientPageProps) {
  const router = useRouter();
  
  // 1. PERBAIKAN: Ubah tipe state dari 'string' menjadi 'number'
  const [editingHkiId, setEditingHkiId] = useState<number | null>(null);

  const handleEdit = (id: number) => {
    setEditingHkiId(id);
  };

  const handleCloseModal = () => {
    setEditingHkiId(null);
  };

  const handleSuccess = () => {
    setEditingHkiId(null);
    toast.success("Data berhasil diperbarui!");
    router.refresh();
  };

  return (
    <>
      <DataTable
        data={initialData}
        totalCount={totalCount}
        formOptions={formOptions}
        onEdit={handleEdit}
      />

      <EditHKIModal
        // 2. PERBAIKAN: Gunakan 'hkiId' agar konsisten dan kontrol visibilitas
        isOpen={!!editingHkiId}
        hkiId={editingHkiId}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        formOptions={formOptions}
      />
    </>
  );
}