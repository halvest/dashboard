// app/hki/layout.tsx
import { Metadata } from 'next'
import { AdminLayout } from '@/components/layout/admin-layout'
import { createClient } from '@/lib/supabase-server' // Mengimpor Supabase server client
import { redirect } from 'next/navigation' // Mengimpor redirect dari Next.js

export const metadata: Metadata = {
  title: 'Manajemen Pengajuan Data HKI | Dashboard',
  description: 'Manajemen Pengajuan Data Hak Kekayaan Intelektual',
}

// Ubah fungsi menjadi 'async'
export default async function HKILayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  const supabase = createClient()

  // --- Pemeriksaan Admin (Guard) Versi Perbaikan ---

  // 1. Ambil data pengguna dari sesi (dari tabel auth.users)
  const { data: { user } } = await supabase.auth.getUser()

  // Cek 1: Apakah pengguna sudah login?
  if (!user) {
    redirect('/login')
  }

  // 2. Ambil profil publik pengguna dari tabel 'profiles'
  //    (Ini diperlukan karena role Anda ada di tabel terpisah)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin, role') // Ambil kolom 'is_admin' (atau 'role' jika Anda lebih suka)
    .eq('id', user.id)       // Cocokkan ID profil dengan ID auth pengguna
    .single()

  if (profileError || !profile) {
    // Ini terjadi jika pengguna ada di auth tapi tidak ada baris profil (data tidak sinkron)
    console.error('Gagal mengambil profil pengguna:', profileError?.message)
    redirect('/dashboard?error=Profil_tidak_ditemukan')
  }

  // 3. Cek apakah pengguna adalah admin
  //    Database Anda memiliki kolom boolean 'is_admin' yang sempurna untuk ini.
  if (profile.is_admin !== true) {
    // Jika BUKAN admin, lempar kembali ke dashboard utama
    redirect('/dashboard?error=Akses_Ditolak_Bukan_Admin')
  }

  // --- Pemeriksaan Selesai (Pengguna adalah Admin) ---

  // Jika lolos semua cek, tampilkan layout dan halaman HKI
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  )
}