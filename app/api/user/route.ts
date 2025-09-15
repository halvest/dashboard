// app/api/users/route.ts
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    // Cek otorisasi: hanya admin yang bisa membuat user baru
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) return NextResponse.json({ message: 'Akses ditolak' }, { status: 401 });
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ message: 'Hanya admin yang dapat menambah pengguna' }, { status: 403 });
    }

    const { email, password, full_name, role } = await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ message: 'Email, password, dan nama lengkap wajib diisi' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password minimal 6 karakter' }, { status: 400 });
    }

    // Gunakan service role key untuk membuat user baru
    const supabaseAdmin = createClient(cookieStore);

    const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Langsung aktifkan user
      user_metadata: { full_name }
    });

    if (signUpError) {
      return NextResponse.json({ message: signUpError.message }, { status: 400 });
    }
    if (!newUser.user) {
        return NextResponse.json({ message: "Gagal membuat pengguna di sistem otentikasi" }, { status: 500 });
    }

    // Buat profil untuk user baru
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: newUser.user.id, full_name, role: role || 'admin' });

    if (profileError) {
      // Jika gagal buat profil, hapus user yang sudah terlanjur dibuat
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json({ message: `Gagal membuat profil: ${profileError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Pengguna baru berhasil ditambahkan' }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}