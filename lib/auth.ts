import { createClient } from './supabase-server'
import { redirect } from 'next/navigation'

/**
 * Mengambil data pengguna yang sedang login dari Supabase Auth.
 * @returns {Promise<User|null>} Objek pengguna jika login, atau null jika tidak.
 */
export async function getUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

/**
 * Mengambil data profil lengkap dari tabel 'profiles' berdasarkan pengguna yang sedang login.
 * @returns {Promise<object|null>} Objek profil jika ditemukan, atau null jika tidak.
 */
export async function getUserProfile() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
    
  return profile
}

/**
 * Pelindung Halaman: Memastikan ada pengguna yang login.
 * Jika tidak, akan dialihkan ke halaman '/login'.
 * @returns {Promise<User>} Objek pengguna jika berhasil.
 */
export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

/**
 * Pelindung Halaman Admin: Memastikan pengguna yang login adalah admin.
 * Memeriksa kolom 'is_admin' di profil pengguna.
 * Jika bukan admin, akan dialihkan ke halaman '/login'.
 * @returns {Promise<object>} Objek profil admin jika berhasil.
 */
export async function requireAdmin() {
  const profile = await getUserProfile()
  if (!profile || !profile.is_admin) {
    redirect('/login')
  }
  return profile
}