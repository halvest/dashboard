// app/api/users/[id]/route.ts

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Helper terpusat untuk otentikasi dan otorisasi admin.
 */
async function authorizeAdmin(supabase: SupabaseClient<Database>) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return { user: null, profile: null, error: NextResponse.json({ message: 'Akses ditolak: Tidak terautentikasi' }, { status: 401 }) };
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (profileError || profile?.role !== 'admin') {
        return { user: null, profile: null, error: NextResponse.json({ message: 'Akses ditolak: Hanya admin yang diizinkan' }, { status: 403 }) };
    }

    return { user, profile, error: null };
}

/**
 * Handler untuk mengedit pengguna (PATCH)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userIdToUpdate = params.id

  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  
  try {
    // --- PERBAIKAN 1: Menggunakan helper otorisasi terpusat ---
    const { error: authError } = await authorizeAdmin(supabase);
    if (authError) return authError;

    // Membuat admin client untuk melakukan update (bypass RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { full_name, role, password } = await request.json()

    // Update data di Auth (jika ada)
    const authUpdateData: { password?: string; user_metadata?: any } = {}
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ message: 'Password minimal 6 karakter' }, { status: 400 })
      }
      authUpdateData.password = password
    }
    if (full_name) {
      authUpdateData.user_metadata = { full_name }
    }

    if (Object.keys(authUpdateData).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userIdToUpdate, authUpdateData)
      if (authError) throw authError
    }

    // Update data di tabel Profiles (jika ada)
    const profileUpdateData: { full_name?: string; role?: string } = {}
    if (full_name) profileUpdateData.full_name = full_name
    if (role) profileUpdateData.role = role

    if (Object.keys(profileUpdateData).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userIdToUpdate)
      if (profileError) throw profileError
    }

    return NextResponse.json({ message: 'Data pengguna berhasil diperbarui' })
  } catch (err: unknown) { // --- PERBAIKAN 2: Type-safe catch block ---
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga.';
    console.error('Update User Error:', err)
    return NextResponse.json({ message: `Gagal memperbarui pengguna: ${message}` }, { status: 500 })
  }
}

/**
 * Handler untuk menghapus pengguna (DELETE)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userIdToDelete = params.id

  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    // --- PERBAIKAN 1: Menggunakan helper otorisasi terpusat ---
    // Kita butuh 'user' dari helper untuk memeriksa apakah admin menghapus dirinya sendiri
    const { user: requester, error: authError } = await authorizeAdmin(supabase);
    if (authError) return authError;

    // Mencegah admin menghapus dirinya sendiri
    if (userIdToDelete === requester?.id) {
      return NextResponse.json({ message: 'Anda tidak dapat menghapus akun Anda sendiri' }, { status: 403 })
    }

    // Membuat admin client untuk melakukan penghapusan
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete)
    if (error) throw error

    return NextResponse.json({ message: 'Pengguna berhasil dihapus' })
  } catch (err: unknown) { // --- PERBAIKAN 2: Type-safe catch block ---
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga.';
    console.error('Delete User Error:', err)
    return NextResponse.json({ message: `Gagal menghapus pengguna: ${message}` }, { status: 500 })
  }
}