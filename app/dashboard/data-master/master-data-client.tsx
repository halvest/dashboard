'use client'

import React, { memo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MasterCrudComponent } from './master-crud-components'
import { JenisHKI, KelasHKI, Pengusul } from '@/lib/types'
import { Copyright, Building, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

export type MasterDataType = 'jenis_hki' | 'kelas_hki' | 'pengusul'
export type AnyMasterItem = JenisHKI | KelasHKI | Pengusul

export const masterConfig = {
  jenis_hki: {
    title: 'Jenis HKI',
    description: 'Data referensi untuk tipe-tipe HKI yang tersedia.',
    icon: Copyright,
    columns: [
      { key: 'nama_jenis_hki', label: 'Nama Jenis' },
      { key: 'is_active', label: 'Status' },
    ],
    idKey: 'id_jenis_hki',
    nameKey: 'nama_jenis_hki',
  },
  kelas_hki: {
    title: 'Kelas HKI',
    description: 'Data referensi Kelas Merek (Nice Classification).',
    icon: FileText,
    columns: [
      { key: 'nomor_kelas', label: 'Nomor Kelas' },
      { key: 'nama_kelas', label: 'Nama Kelas' },
      { key: 'tipe', label: 'Tipe' },
      { key: 'is_active', label: 'Status' },
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

export const MasterDataClient = memo(function MasterDataClient({
  initialJenis,
  initialKelas,
  initialPengusul,
}: MasterDataClientProps) {
  return (
    <Tabs defaultValue="jenis_hki" className="w-full">
      {/* --- PERBAIKAN: Menghapus 'grid' & 'grid-cols-3', menggunakan Flexbox --- */}
      <TabsList className="w-full h-12">
        <TabsTrigger value="jenis_hki" className="flex-1 gap-2 text-base md:text-sm">
          <Copyright className="h-4 w-4" /> Jenis HKI
        </TabsTrigger>
        <TabsTrigger value="kelas_hki" className="flex-1 gap-2 text-base md:text-sm">
          <FileText className="h-4 w-4" /> Kelas HKI
        </TabsTrigger>
        <TabsTrigger value="pengusul" className="flex-1 gap-2 text-base md:text-sm">
          <Building className="h-4 w-4" /> Pengusul (OPD)
        </TabsTrigger>
      </TabsList>

      <TabsContent value="jenis_hki" className="mt-4 outline-none">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
          <MasterCrudComponent
            dataType="jenis_hki"
            data={initialJenis}
            config={masterConfig.jenis_hki}
          />
        </motion.div>
      </TabsContent>

      <TabsContent value="kelas_hki" className="mt-4 outline-none">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
          <MasterCrudComponent
            dataType="kelas_hki"
            data={initialKelas}
            config={masterConfig.kelas_hki}
          />
        </motion.div>
      </TabsContent>

      <TabsContent value="pengusul" className="mt-4 outline-none">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
          <MasterCrudComponent
            dataType="pengusul"
            data={initialPengusul}
            config={masterConfig.pengusul}
          />
        </motion.div>
      </TabsContent>
    </Tabs>
  )
})

// Menambahkan displayName untuk kemudahan debugging
MasterDataClient.displayName = 'MasterDataClient'