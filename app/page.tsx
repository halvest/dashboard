import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server' // ✅ 1. Impor client yang benar

export default async function RootPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore) // ✅ 2. Buat koneksi Supabase yang benar

  // ✅ 3. Ambil data user langsung di sini menggunakan koneksi yang benar
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  redirect('/dashboard')
}
