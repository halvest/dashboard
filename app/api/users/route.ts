// app/api/users/route.ts

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Helper terpusat untuk otentikasi dan otorisasi admin.
 */
async function authorizeAdmin(supabase: ReturnType<typeof createServerClient>) {
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
 * GET: Mengambil daftar semua pengguna.
 * Hanya bisa diakses oleh pengguna dengan role 'admin'.
 */
export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    // --- PERBAIKAN 1: Menggunakan helper otorisasi ---
    const { error: authError } = await authorizeAdmin(supabase);
    if (authError) return authError;

    // Membuat admin client untuk bypass RLS dan mengambil semua data
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const [usersRes, profilesRes] = await Promise.all([
        supabaseAdmin.auth.admin.listUsers(),
        supabaseAdmin.from('profiles').select('*')
    ]);

    const { data: { users }, error: usersError } = usersRes;
    if (usersError) throw usersError;

    const { data: profiles, error: profilesError } = profilesRes;
    if (profilesError) throw profilesError;

    // Gabungkan data auth dan profil
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
  } catch (err: unknown) { // --- PERBAIKAN 2: Type-safe catch block ---
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga.';
    console.error('API GET Users Error:', err)
    return NextResponse.json(
      { message: `Gagal mengambil data pengguna: ${message}` },
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
  const supabase = createServerClient(cookieStore)

  try {
    // --- PERBAIKAN 1: Menggunakan helper otorisasi ---
    const { error: authError } = await authorizeAdmin(supabase);
    if (authError) return authError;
    
    // Membuat admin client dengan opsi khusus untuk operasi admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { email, password, full_name, role } = await request.json()

    if (!email || !password || !full_name) {
      return NextResponse.json({ message: 'Email, password, dan nama lengkap wajib diisi' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password minimal 6 karakter' }, { status: 400 })
    }

    // Membuat pengguna baru dengan user_metadata untuk dihandle oleh trigger
    const { data: newUser, error: signUpError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role: role || 'user',
        },
      })

    if (signUpError) {
      if (signUpError.message.includes('User already registered')) {
        return NextResponse.json({ message: 'Email ini sudah terdaftar.' }, { status: 409 })
      }
      throw signUpError; // Lempar error untuk ditangkap oleh catch block
    }
    
    if (!newUser.user) {
      throw new Error('Gagal membuat pengguna di sistem otentikasi.');
    }

    return NextResponse.json({ message: 'Pengguna baru berhasil ditambahkan' }, { status: 201 })
  } catch (err: unknown) { // --- PERBAIKAN 2: Type-safe catch block ---
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga.';
    console.error('API POST User Error:', err)
    return NextResponse.json(
      { message: `Gagal membuat pengguna: ${message}` },
      { status: 500 }
    )
  }
}