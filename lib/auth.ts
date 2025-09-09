// lib/auth.ts
import { createClient } from './supabase-server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

/**
 * Ambil user login dari Supabase Auth.
 */
export async function getUser(): Promise<User | null> {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('Error getUser:', error.message)
    return null
  }

  return user
}

/**
 * Ambil profil lengkap dari tabel 'profiles'.
 */
export async function getUserProfile(): Promise<any | null> {
  const supabase = createClient()
  const user = await getUser()

  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error getUserProfile:', error.message)
    return null
  }

  return profile
}

/**
 * Proteksi: hanya bisa diakses user login.
 */
export async function requireAuth(): Promise<User> {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Proteksi: hanya bisa diakses admin.
 */
export async function requireAdmin(): Promise<any> {
  const profile = await getUserProfile()

  if (!profile || profile.role !== 'admin') {
    console.warn('Unauthorized access attempt:', profile)
    redirect('/')
  }

  return profile
}
