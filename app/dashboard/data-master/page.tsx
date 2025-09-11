// app/master/page.tsx
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { MasterDataClient } from './master-data-client' // Komponen Klien Utama
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/**
 * Mengambil semua data master secara paralel.
 */
async function getMasterData(supabase: any) {
  const [jenisRes, kelasRes, pengusulRes] = await Promise.all([
    supabase.from('jenis_hki').select('*').order('id_jenis_hki'),
    supabase.from('kelas_hki').select('*').order('id_kelas'),
    supabase.from('pengusul').select('*').order('nama_opd')
  ])

  if (jenisRes.error || kelasRes.error || pengusulRes.error) {
    console.error("Gagal mengambil data master:", { 
      jenisError: jenisRes.error, 
      kelasError: kelasRes.error, 
      pengusulError: pengusulRes.error 
    })
  }

  return {
    jenisData: jenisRes.data || [],
    kelasData: kelasRes.data || [],
    pengusulData: pengusulRes.data || [],
  }
}

export default async function MasterDataPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // Guard: Pastikan hanya admin yang bisa mengakses halaman ini
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard?error=Akses_Ditolak')

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