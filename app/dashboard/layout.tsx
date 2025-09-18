// app/dashboard/layout.tsx
import { Metadata } from 'next'
import { AdminLayout } from '@/components/layout/admin-layout'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ShieldOff, ServerCrash } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Manajemen Pengajuan Data HKI | Dashboard',
  description: 'Manajemen Pengajuan Data Hak Kekayaan Intelektual',
}

// Menjadikan layout ini dinamis untuk memastikan pengecekan otentikasi selalu dijalankan
export const dynamic = 'force-dynamic'

// ============================================================================
// KONSTANTA & TIPE DATA
// ============================================================================
const PATHS = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
}

const ALLOWED_ROLES = ['admin']

// Tipe data untuk hasil dari fungsi keamanan, agar lebih terstruktur
type AuthResult = {
  user: any
  errorType:
    | null
    | 'unauthenticated'
    | 'unauthorized'
    | 'profile_not_found'
    | 'database_error'
    | 'unexpected_error'
  errorMessage?: string
}

// ============================================================================
// FUNGSI HELPER KEAMANAN (PRINSIP DRY)
// ============================================================================
/**
 * Melindungi route dengan memeriksa otentikasi dan otorisasi peran admin.
 * Fungsi ini mengembalikan user jika berhasil, atau tipe error jika gagal.
 * Ini membuat komponen utama menjadi lebih bersih dan deklaratif.
 */
async function protectAdminRoute(): Promise<AuthResult> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { user: null, errorType: 'unauthenticated' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error(
        `Database error saat mengambil profil untuk user ID: ${user.id}`,
        profileError
      )
      return {
        user: null,
        errorType: 'database_error',
        errorMessage: profileError.message,
      }
    }

    if (!profile) {
      console.error(
        `Integritas data error: Tidak ditemukan profil untuk user ID: ${user.id}`
      )
      return { user: null, errorType: 'profile_not_found' }
    }

    // PERBAIKAN: Tambahkan pengecekan null untuk `profile.role` sebelum digunakan
    if (!profile.role || !ALLOWED_ROLES.includes(profile.role)) {
      console.warn(
        `Akses ditolak: User ID ${user.id} dengan role '${profile.role}' mencoba mengakses route admin.`
      )
      return { user, errorType: 'unauthorized' }
    }

    // Jika semua pengecekan berhasil
    return { user, errorType: null }
  } catch (error) {
    console.error(
      'Terjadi error tak terduga di fungsi protectAdminRoute:',
      error
    )
    return {
      user: null,
      errorType: 'unexpected_error',
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan tidak diketahui',
    }
  }
}

// ============================================================================
// KOMPONEN UI UNTUK MENAMPILKAN ERROR
// ============================================================================
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

// ============================================================================
// KOMPONEN LAYOUT UTAMA (SEKARANG JAUH LEBIH BERSIH)
// ============================================================================
export default async function HKILayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, errorType, errorMessage } = await protectAdminRoute()

  // Kasus 1: Tidak terautentikasi, lempar ke halaman login
  if (errorType === 'unauthenticated') {
    return redirect(PATHS.LOGIN)
  }

  // Kasus 2: Terjadi error (tidak diizinkan, database error, dll.)
  // Tampilkan UI error yang sesuai di dalam layout admin.
  if (errorType) {
    let errorContent
    switch (errorType) {
      case 'unauthorized':
        errorContent = (
          <ErrorDisplay
            icon={ShieldOff}
            title="Akses Ditolak"
            description="Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi administrator jika Anda merasa ini adalah kesalahan."
          />
        )
        break
      case 'database_error':
        errorContent = (
          <ErrorDisplay
            icon={ServerCrash}
            title="Kesalahan Database"
            description="Gagal terhubung atau mengambil data dari database."
            details={errorMessage}
          />
        )
        break
      case 'profile_not_found':
        errorContent = (
          <ErrorDisplay
            icon={ServerCrash}
            title="Profil Tidak Ditemukan"
            description="Data profil Anda tidak ditemukan di sistem. Ini adalah kesalahan integritas data."
          />
        )
        break
      default:
        errorContent = (
          <ErrorDisplay
            icon={ServerCrash}
            title="Terjadi Kesalahan Tak Terduga"
            description="Sistem mengalami masalah yang tidak diharapkan."
            details={errorMessage}
          />
        )
    }
    return <AdminLayout>{errorContent}</AdminLayout>
  }

  // Kasus 3: Sukses, tampilkan konten halaman
  return <AdminLayout>{children}</AdminLayout>
}
