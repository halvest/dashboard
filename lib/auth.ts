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
  const user = await getUser() // Menggunakan fungsi getUser() agar tidak duplikasi kode
  
  if (!user) {
    return null
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
    
  if (error) {
      // Jika RLS memblokir, profil tidak akan ditemukan tapi tidak error.
      // Error di sini bisa jadi masalah koneksi, dll.
      console.error("Error fetching user profile:", error)
      return null
  }
    
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
 * Memeriksa kolom 'role' di profil pengguna.
 * Jika bukan admin, akan dialihkan ke halaman utama '/'.
 * @returns {Promise<object>} Objek profil admin jika berhasil.
 */
export async function requireAdmin() {
  const profile = await getUserProfile()
  
  // PERBAIKAN: Memeriksa 'profile.role' bukan 'profile.is_admin'
  if (!profile || profile.role !== 'admin') {
    // PERBAIKAN: Redirect ke halaman utama, bukan /login
    redirect('/') 
  }
  
  return profile
}