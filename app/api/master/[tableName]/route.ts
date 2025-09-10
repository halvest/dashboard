// app/api/master/[tableName]/route.ts
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const TABLE_SAFELIST = ['jenis_hki', 'kelas_hki', 'pengusul'];

/**
 * Admin Guard Helper
 */
async function isAdmin(supabase: any): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  return profile?.role === 'admin';
}

/**
 * POST: Membuat item data master baru
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tableName: string } }
) {
  const { tableName } = params;
  if (!TABLE_SAFELIST.includes(tableName)) {
    return NextResponse.json({ message: 'Tabel tidak valid' }, { status: 400 });
  }

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Validasi sederhana untuk mencegah duplikat ID di kelas_hki
    if (tableName === 'kelas_hki' && body.id_kelas) {
      const { data: existing } = await supabase.from('kelas_hki').select('id_kelas').eq('id_kelas', body.id_kelas).single();
      if (existing) {
        return NextResponse.json({ message: `ID Kelas ${body.id_kelas} sudah digunakan.` }, { status: 409 });
      }
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Error membuat data master:', error);
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Data berhasil dibuat', data }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}