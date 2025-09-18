// app/api/users/[id]/route.ts

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Handler untuk mengedit pengguna (PATCH)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userIdToUpdate = params.id

  // 1. Verifikasi bahwa requester adalah admin
  const cookieStore = cookies()
  const supabaseSession = createServerClient(cookieStore)
  const {
    data: { user: requester },
  } = await supabaseSession.auth.getUser()
  if (!requester) {
    return NextResponse.json(
      { message: 'Akses ditolak: Tidak terautentikasi' },
      { status: 401 }
    )
  }
  const { data: profile } = await supabaseSession
    .from('profiles')
    .select('role')
    .eq('id', requester.id)
    .single()
  if (profile?.role !== 'admin') {
    return NextResponse.json(
      { message: 'Hanya admin yang dapat mengubah data' },
      { status: 403 }
    )
  }

  // 2. Buat admin client untuk melakukan update
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const { full_name, role, password } = await request.json()

    // -- PENYEMPURNAAN 1: Update data Auth secara dinamis --
    const authUpdateData: { password?: string; user_metadata?: any } = {}
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { message: 'Password minimal 6 karakter' },
          { status: 400 }
        )
      }
      authUpdateData.password = password
    }
    if (full_name) {
      // Pastikan user_metadata tidak menimpa data lain yang mungkin ada
      authUpdateData.user_metadata = { full_name }
    }

    // Update data di Auth hanya jika ada data yang perlu diubah
    if (Object.keys(authUpdateData).length > 0) {
      const { error: authError } =
        await supabaseAdmin.auth.admin.updateUserById(
          userIdToUpdate,
          authUpdateData
        )
      if (authError) throw authError
    }

    // -- PENYEMPURNAAN 2: Update data Profile secara dinamis --
    const profileUpdateData: { full_name?: string; role?: string } = {}
    if (full_name) profileUpdateData.full_name = full_name
    if (role) profileUpdateData.role = role

    // Update data di tabel Profiles hanya jika ada data yang perlu diubah
    if (Object.keys(profileUpdateData).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userIdToUpdate)
      if (profileError) throw profileError
    }

    return NextResponse.json({ message: 'Data pengguna berhasil diperbarui' })
  } catch (error: any) {
    console.error('Update User Error:', error)
    return NextResponse.json(
      { message: `Gagal memperbarui pengguna: ${error.message}` },
      { status: 500 }
    )
  }
}

// Handler untuk menghapus pengguna (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userIdToDelete = params.id

  // 1. Verifikasi bahwa requester adalah admin
  const cookieStore = cookies()
  const supabaseSession = createServerClient(cookieStore)
  const {
    data: { user: requester },
  } = await supabaseSession.auth.getUser()
  if (!requester) {
    return NextResponse.json(
      { message: 'Akses ditolak: Tidak terautentikasi' },
      { status: 401 }
    )
  }
  const { data: profile } = await supabaseSession
    .from('profiles')
    .select('role')
    .eq('id', requester.id)
    .single()
  if (profile?.role !== 'admin') {
    return NextResponse.json(
      { message: 'Hanya admin yang dapat menghapus pengguna' },
      { status: 403 }
    )
  }

  // -- PENYEMPURNAAN 3: Mencegah admin menghapus dirinya sendiri --
  if (userIdToDelete === requester.id) {
    return NextResponse.json(
      { message: 'Anda tidak dapat menghapus akun Anda sendiri' },
      { status: 403 }
    )
  }

  // 2. Buat admin client untuk melakukan penghapusan
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete)
    if (error) throw error

    return NextResponse.json({ message: 'Pengguna berhasil dihapus' })
  } catch (error: any) {
    console.error('Delete User Error:', error)
    return NextResponse.json(
      { message: `Gagal menghapus pengguna: ${error.message}` },
      { status: 500 }
    )
  }
}
