// app/hki/layout.tsx
import { Metadata } from 'next'
import { AdminLayout } from '@/components/layout/admin-layout'
import { createClient } from '@/utils/supabase/server' 
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'


export const metadata: Metadata = {
  title: 'Manajemen Pengajuan Data HKI | Dashboard',
  description: 'Manajemen Pengajuan Data Hak Kekayaan Intelektual',
}

export const dynamic = 'force-dynamic'

const PATHS = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
}

const ALLOWED_ROLES = ['admin']

export default async function HKILayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return redirect(PATHS.LOGIN)
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role') 
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error(`Database error saat mengambil profil untuk user ID: ${user.id}`, profileError)
      return redirect(`${PATHS.DASHBOARD}?error=database_error`)
    }

    if (!profile) {
      console.error(`Integritas data error: Tidak ditemukan profil untuk user ID: ${user.id} yang sudah terautentikasi.`)
      return redirect(`${PATHS.DASHBOARD}?error=profile_not_found`)
    }

    if (!ALLOWED_ROLES.includes(profile.role)) { 
      console.warn(`Akses ditolak: User ID ${user.id} dengan role '${profile.role}' mencoba mengakses /hki.`)
      return redirect(`${PATHS.DASHBOARD}?error=access_denied`)
    }

    return (
      <AdminLayout>
        {children}
      </AdminLayout>
    )
  } catch (error) {
    console.error("Terjadi error tak terduga di HKILayout:", error);
    return redirect(`${PATHS.DASHBOARD}?error=unexpected_error`);
  }
}