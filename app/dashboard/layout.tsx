// app/dashboard/layout.tsx
import { Metadata } from 'next'
import { AdminLayout } from '@/components/layout/admin-layout'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ShieldOff, ServerCrash } from 'lucide-react'
import { cache, ReactNode } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export const metadata: Metadata = {
  title: 'Manajemen Pengajuan Data HKI | Dashboard',
  description: 'Manajemen Pengajuan Data Hak Kekayaan Intelektual',
}

// ✅ Tetap 'force-dynamic' untuk memastikan autentikasi berjalan di setiap request.
export const dynamic = 'force-dynamic'

/**
 * ✅ Mengambil data user dan profil dengan React `cache`.
 * Ini memastikan bahwa query ke Supabase hanya terjadi SEKALI per request,
 * bahkan jika fungsi ini dipanggil di beberapa tempat (layout, page, dll).
 * Ini adalah optimasi performa kunci di App Router.
 */
const getUserProfile = cache(async () => {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    // Jika tidak ada user, langsung redirect tanpa perlu proses lebih lanjut.
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    // Melempar error agar ditangkap oleh Error Boundary atau blok try-catch
    throw new Error(
      `Kesalahan database saat mengambil profil: ${profileError.message}`
    )
  }

  if (!profile) {
    throw new Error(`Profil untuk user ID ${user.id} tidak ditemukan.`)
  }

  return { user, profile }
})

const ErrorDisplay = ({
  icon: Icon,
  title,
  description,
  details,
}: {
  icon: React.ElementType
  title: string
  description: string
  details?: string
}) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)] text-center p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
    <Icon className="h-16 w-16 text-red-500 mb-4" />
    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
      {title}
    </h1>
    <p className="text-muted-foreground mt-2 max-w-md">{description}</p>
    {details && (
      <pre className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 text-xs text-red-600 dark:text-red-400 rounded-md overflow-x-auto w-full max-w-md">
        <code>{details}</code>
      </pre>
    )}
  </div>
)

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  try {
    const { profile, user } = await getUserProfile()

    // ✅ Logika otorisasi disederhanakan.
    // Jika peran bukan 'admin', redirect dengan pesan error.
    if (profile.role !== 'admin') {
      redirect('/dashboard?error=Akses_Ditolak')
    }

    // Jika semua validasi lolos, render layout dengan children (halaman).
    return <AdminLayout user={user}>{children}</AdminLayout>
  } catch (error: any) {
    // Menangkap semua kemungkinan error dari `getUserProfile`
    // dan menampilkannya dengan UI yang sesuai.
    let errorContent
    if (error.message.includes('Akses_Ditolak')) {
      errorContent = (
        <ErrorDisplay
          icon={ShieldOff}
          title="Akses Ditolak"
          description="Anda tidak memiliki izin untuk mengakses halaman ini."
        />
      )
    } else {
      errorContent = (
        <ErrorDisplay
          icon={ServerCrash}
          title="Terjadi Kesalahan"
          description="Gagal memuat sesi pengguna atau data profil."
          details={error.message}
        />
      )
    }
    // Tetap bungkus error display dengan AdminLayout agar konsisten
    return <AdminLayout>{errorContent}</AdminLayout>
  }
}
