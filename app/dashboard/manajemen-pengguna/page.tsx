// app/dashboard/manajemen-pengguna/page.tsx

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { UserManagementClient } from './user-management-client'

// Memaksa halaman untuk selalu dirender secara dinamis setiap kali diakses
export const dynamic = 'force-dynamic'

// Tipe data gabungan dari auth.users dan public.profiles
export type UserProfile = {
  id: string
  email: string | undefined
  full_name: string // Diubah menjadi string, karena kita akan memberikan nilai pengganti
  role: 'admin' | 'user'
  created_at: string
}

/**
 * Mengambil semua data pengguna dan profil mereka menggunakan hak akses admin.
 * Fungsi ini hanya boleh dijalankan di server.
 */
async function getUsersData() {
  // 1. Buat klien Supabase khusus dengan SERVICE_ROLE_KEY untuk hak akses admin
  // Pastikan variabel environment sudah diatur di .env.local
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // 2. Ambil semua pengguna dari Supabase Auth menggunakan klien admin
  const {
    data: { users },
    error: usersError,
  } = await supabaseAdmin.auth.admin.listUsers()

  if (usersError) {
    console.error('Gagal mengambil daftar pengguna:', usersError)
    throw new Error(`Gagal mengambil daftar pengguna: ${usersError.message}`)
  }

  // 3. Ambil semua profil dari tabel 'profiles' menggunakan klien admin yang sama
  // Ini untuk memastikan kita melewati RLS dan mendapatkan semua data
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, role')

  if (profilesError) {
    console.error('Gagal mengambil data profil:', profilesError)
    throw new Error(`Gagal mengambil data profil: ${profilesError.message}`)
  }

  // 4. Gabungkan data pengguna dari Auth dengan data dari tabel profiles
  const combinedUsers: UserProfile[] = users.map((user) => {
    const profile = profiles?.find((p) => p.id === user.id)
    return {
      id: user.id,
      email: user.email,
      // Memberikan nilai pengganti jika full_name null atau undefined.
      full_name: profile?.full_name ?? 'Nama Tidak Ditemukan',
      role: profile?.role === 'admin' ? 'admin' : 'user',
      created_at: new Date(user.created_at).toISOString(),
    }
  })

  return combinedUsers
}

export default async function UserManagementPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // Langkah Keamanan: Pastikan hanya admin yang bisa mengakses halaman ini
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard?error=Akses_Ditolak')
  }

  // DIPERBAIKI: Menentukan apakah pengguna saat ini adalah super admin.
  // Cara ini aman karena dievaluasi di server.
  // Pastikan Anda sudah mengatur SUPER_ADMIN_EMAIL di file .env.local Anda.
  const isSuperAdmin = user.email === process.env.SUPER_ADMIN_EMAIL

  try {
    // Ambil data pengguna jika verifikasi berhasil
    const usersData = await getUsersData()

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
          <p className="mt-1 text-muted-foreground">
            Tambah, edit, dan kelola peran pengguna yang dapat mengakses dasbor.
          </p>
        </div>

        {/* Render Client Component dan kirim data sebagai props, termasuk status super admin */}
        <UserManagementClient
          initialUsers={usersData}
          currentUserIsSuperAdmin={isSuperAdmin}
        />
      </div>
    )
  } catch (error) {
    // Tampilkan pesan error jika pengambilan data gagal
    return (
      <div className="text-red-600 bg-red-50 border border-red-200 p-4 rounded-md">
        <h2 className="font-bold">Terjadi Kesalahan</h2>
        <p>
          {error instanceof Error
            ? error.message
            : 'Gagal memuat data pengguna karena kesalahan tidak diketahui.'}
        </p>
      </div>
    )
  }
}
