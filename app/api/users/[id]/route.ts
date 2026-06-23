// app/api/users/[id]/route.ts

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, AuthError } from '@/lib/auth/server'

// Handler untuk mengedit pengguna (PATCH)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userIdToUpdate } = await params
    const supabaseSession = await createClient()

    // 1. Verifikasi bahwa requester adalah admin
    await authorizeAdmin(supabaseSession)

    // 2. Buat admin client untuk melakukan update
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { full_name, role, password } = await request.json()

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
      authUpdateData.user_metadata = { full_name }
    }

    if (Object.keys(authUpdateData).length > 0) {
      const { error: authError } =
        await supabaseAdmin.auth.admin.updateUserById(
          userIdToUpdate,
          authUpdateData
        )
      if (authError) throw authError
    }

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
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: 403 })
    }
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userIdToDelete } = await params
    const supabaseSession = await createClient()

    // 1. Verifikasi bahwa requester adalah admin
    const requester = await authorizeAdmin(supabaseSession)

    // 2. Mencegah admin menghapus dirinya sendiri
    if (userIdToDelete === requester.id) {
      return NextResponse.json(
        { message: 'Anda tidak dapat menghapus akun Anda sendiri.' },
        { status: 403 }
      )
    }

    // 3. Buat admin client untuk melakukan penghapusan
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete)
    if (error) throw error

    return NextResponse.json({ message: 'Pengguna berhasil dihapus.' })
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: 403 })
    }
    console.error('Delete User Error:', error)
    return NextResponse.json(
      { message: `Gagal menghapus pengguna: ${error.message}` },
      { status: 500 }
    )
  }
}