// app/dashboard/data-master/page.tsx
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { MasterDataClient } from './master-data-client'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

/**
 * Mengambil semua data master secara paralel.
 * --- PERBAIKAN: Melempar error jika query gagal ---
 */
async function getMasterData(supabase: SupabaseClient<Database>) {
  const [jenisRes, kelasRes, pengusulRes] = await Promise.all([
    supabase.from('jenis_hki').select('*').order('id_jenis_hki'),
    supabase.from('kelas_hki').select('*').order('id_kelas'),
    supabase.from('pengusul').select('*').order('nama_opd'),
  ])

  // Jika salah satu query gagal, lempar error untuk ditangkap oleh Next.js
  if (jenisRes.error) throw new Error(`Gagal mengambil data Jenis HKI: ${jenisRes.error.message}`);
  if (kelasRes.error) throw new Error(`Gagal mengambil data Kelas HKI: ${kelasRes.error.message}`);
  if (pengusulRes.error) throw new Error(`Gagal mengambil data Pengusul: ${pengusulRes.error.message}`);

  return {
    jenisData: jenisRes.data || [],
    kelasData: kelasRes.data || [],
    pengusulData: pengusulRes.data || [],
  }
}

export default async function MasterDataPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // --- PERBAIKAN: Menyederhanakan logika otorisasi ---
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  // Jika ada error saat mengambil profil atau peran bukan admin, redirect
  if (profileError || profile?.role !== 'admin') {
    redirect('/dashboard?error=Akses_Ditolak')
  }

  // Ambil data
  const { jenisData, kelasData, pengusulData } = await getMasterData(supabase)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Manajemen Data Master
        </h1>
        <p className="mt-1 text-muted-foreground">
          Kelola data referensi untuk Jenis HKI, Kelas HKI, dan Pengusul (OPD).
        </p>
      </div>

      <MasterDataClient
        initialJenis={jenisData}
        initialKelas={kelasData}
        initialPengusul={pengusulData}
      />
    </div>
  )
}