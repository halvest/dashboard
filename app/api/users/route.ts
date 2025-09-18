// app/api/users/route.ts

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET: Mengambil daftar semua pengguna.
 * Hanya bisa diakses oleh pengguna dengan role 'admin'.
 */
export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabaseSession = createServerClient(cookieStore)

  try {
    // 1. Verifikasi bahwa requester adalah admin
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
        { message: 'Akses ditolak: Hanya admin yang diizinkan' },
        { status: 403 }
      )
    }

    // 2. Buat admin client untuk mengambil semua data
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 3. Ambil semua pengguna dari Auth dan semua profil dari database
    const {
      data: { users },
      error: usersError,
    } = await supabaseAdmin.auth.admin.listUsers()
    if (usersError) throw usersError

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
    if (profilesError) throw profilesError

    // 4. Gabungkan data auth dan profil
    const combinedUsers = users.map((user) => {
      const userProfile = profiles.find((p) => p.id === user.id)
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        full_name: userProfile?.full_name ?? null,
        avatar_url: userProfile?.avatar_url ?? null,
        role: userProfile?.role ?? 'user',
      }
    })

    return NextResponse.json(combinedUsers)
  } catch (error: any) {
    console.error('API GET Users Error:', error)
    return NextResponse.json(
      { message: `Gagal mengambil data pengguna: ${error.message}` },
      { status: 500 }
    )
  }
}

/**
 * POST: Membuat pengguna baru.
 * Hanya bisa diakses oleh pengguna dengan role 'admin'.
 */
export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabaseSession = createServerClient(cookieStore)

  try {
    // 1. Verifikasi admin (tetap sama)
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
        { message: 'Akses ditolak: Hanya admin yang diizinkan' },
        { status: 403 }
      )
    }

    // 2. Buat admin client (tetap sama)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 3. Validasi input (tetap sama)
    const { email, password, full_name, role } = await request.json()

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { message: 'Email, password, dan nama lengkap wajib diisi' },
        { status: 400 }
      )
    }
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    // 4. Buat pengguna baru, masukkan data profil ke 'user_metadata'
    // Ini agar trigger otomatis bisa mengambilnya
    const { data: newUser, error: signUpError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role: role || 'user', // Masukkan role ke metadata
        },
      })

    if (signUpError) {
      if (signUpError.message.includes('User already registered')) {
        return NextResponse.json(
          { message: 'Email ini sudah terdaftar.' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { message: `Gagal membuat pengguna di Auth: ${signUpError.message}` },
        { status: 400 }
      )
    }
    if (!newUser.user) {
      return NextResponse.json(
        { message: 'Gagal membuat pengguna di sistem otentikasi' },
        { status: 500 }
      )
    }

    // ========================================================================
    // PERBAIKAN: HAPUS BLOK INSERT PROFIL
    // Proses ini sekarang sepenuhnya ditangani oleh trigger otomatis di database
    // untuk menghindari error 'duplicate key'.
    // ========================================================================

    return NextResponse.json(
      { message: 'Pengguna baru berhasil ditambahkan' },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('API POST User Error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan internal pada server' },
      { status: 500 }
    )
  }
}
