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

export default async function HKILayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role') 
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Gagal mengambil profil pengguna:', profileError?.message)
    redirect('/dashboard?error=Profil_tidak_ditemukan')
  }

  if (profile.role !== 'admin') { 
    console.warn(`Akses ditolak untuk user ${user.id} dengan role '${profile.role}' ke /hki`)
    redirect('/dashboard?error=Akses_Ditolak')
  }

  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  )
}