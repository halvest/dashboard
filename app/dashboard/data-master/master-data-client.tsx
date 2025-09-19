// app/dashboard/data-master/master-data-client.tsx
'use client'

// --- PERBAIKAN: Mengimpor 'memo' dari React ---
import React, { memo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MasterCrudTable } from './master-crud-components'
import { JenisHKI, KelasHKI, Pengusul } from '@/lib/types'
import { Copyright, Building, FileText } from 'lucide-react'

export type MasterDataType = 'jenis_hki' | 'kelas_hki' | 'pengusul'
export type AnyMasterItem = JenisHKI | KelasHKI | Pengusul

export const masterConfig = {
  jenis_hki: {
    title: 'Jenis HKI',
    description: 'Data referensi untuk tipe-tipe HKI yang tersedia.',
    icon: Copyright,
    columns: [
      { key: 'id_jenis_hki', label: 'ID' },
      { key: 'nama_jenis_hki', label: 'Nama Jenis' },
    ],
    idKey: 'id_jenis_hki',
    nameKey: 'nama_jenis_hki',
  },
  kelas_hki: {
    title: 'Kelas HKI',
    description: 'Data referensi 45 Kelas Merek (Nice Classification).',
    icon: FileText,
    columns: [
      { key: 'id_kelas', label: 'ID Kelas' },
      { key: 'nama_kelas', label: 'Nama Kelas' },
      { key: 'tipe', label: 'Tipe' },
    ],
    idKey: 'id_kelas',
    nameKey: 'nama_kelas',
  },
  pengusul: {
    title: 'Pengusul (OPD)',
    description: 'Data referensi Organisasi Perangkat Daerah (OPD) pengusul.',
    icon: Building,
    columns: [
      { key: 'id_pengusul', label: 'ID' },
      { key: 'nama_opd', label: 'Nama OPD' },
    ],
    idKey: 'id_pengusul',
    nameKey: 'nama_opd',
  },
}

interface MasterDataClientProps {
  initialJenis: JenisHKI[]
  initialKelas: KelasHKI[]
  initialPengusul: Pengusul[]
}

// --- PERBAIKAN: Membungkus komponen dengan React.memo ---
export const MasterDataClient = memo(function MasterDataClient({
  initialJenis,
  initialKelas,
  initialPengusul,
}: MasterDataClientProps) {
  return (
    <Tabs defaultValue="jenis_hki" className="w-full">
      <TabsList className="grid w-full grid-cols-3 h-12">
        <TabsTrigger value="jenis_hki" className="gap-2 text-base md:text-sm">
          <Copyright className="h-4 w-4" /> Jenis HKI
        </TabsTrigger>
        <TabsTrigger value="kelas_hki" className="gap-2 text-base md:text-sm">
          <FileText className="h-4 w-4" /> Kelas HKI
        </TabsTrigger>
        <TabsTrigger value="pengusul" className="gap-2 text-base md:text-sm">
          <Building className="h-4 w-4" /> Pengusul (OPD)
        </TabsTrigger>
      </TabsList>

      <TabsContent value="jenis_hki" className="mt-4">
        <MasterCrudTable
          dataType="jenis_hki"
          data={initialJenis}
          config={masterConfig.jenis_hki}
        />
      </TabsContent>

      <TabsContent value="kelas_hki" className="mt-4">
        <MasterCrudTable
          dataType="kelas_hki"
          data={initialKelas}
          config={masterConfig.kelas_hki}
        />
      </TabsContent>

      <TabsContent value="pengusul" className="mt-4">
        <MasterCrudTable
          dataType="pengusul"
          data={initialPengusul}
          config={masterConfig.pengusul}
        />
      </TabsContent>
    </Tabs>
  )
})

// Menambahkan displayName untuk kemudahan debugging
MasterDataClient.displayName = 'MasterDataClient'