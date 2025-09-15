// app/api/users/[id]/route.ts
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

async function isAdmin(supabase: any): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin';
}

// PATCH: Memperbarui data pengguna
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: userIdToUpdate } = params;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
  }

  try {
    const { full_name, password, role } = await request.json();
    const supabaseAdmin = createClient(cookieStore);

    // Update user metadata (nama) dan password jika ada
    const userUpdateData: any = { user_metadata: { full_name } };
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ message: 'Password baru minimal 6 karakter'}, { status: 400 });
      }
      userUpdateData.password = password;
    }
    
    const { error: userUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userIdToUpdate, userUpdateData);
    if (userUpdateError) throw new Error(userUpdateError.message);

    // Update profile (nama dan role)
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ full_name, role })
      .eq('id', userIdToUpdate);
    if (profileUpdateError) throw new Error(profileUpdateError.message);

    return NextResponse.json({ message: 'Data pengguna berhasil diperbarui' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE: Menghapus pengguna
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
    const { id: userIdToDelete } = params;
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    if (!(await isAdmin(supabase))) {
        return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
    }

    try {
        const supabaseAdmin = createClient(cookieStore);
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

        if (deleteError) {
            throw new Error(deleteError.message);
        }

        // Profil akan terhapus otomatis karena 'ON DELETE CASCADE' di skema SQL
        return NextResponse.json({ message: 'Pengguna berhasil dihapus' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}