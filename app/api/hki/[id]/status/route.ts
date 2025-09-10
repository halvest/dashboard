// app/api/hki/[id]/status/route.ts
import { createClient } from '@/utils/supabase/server'; 
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Endpoint PATCH khusus untuk memperbarui status HKI secara inline dari tabel.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const hkiId = params.id;

  try {
    // 1. Validasi Autentikasi & Admin (Perlu cek profil)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 });
    }
    
    // Cek apakah user adalah admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    // 2. Ambil data dari body
    const { statusId } = await request.json();
    if (!statusId || typeof statusId !== 'number') {
      return NextResponse.json({ success: false, message: 'ID Status tidak valid' }, { status: 400 });
    }

    // 3. Jalankan query UPDATE sesuai permintaan
    const { data: updatedData, error } = await supabase
      .from('hki')
      .update({ 
        id_status: statusId,
        updated_at: new Date().toISOString() // Set updated_at ke 'now'
      })
      .eq('id_hki', hkiId)
      .select('id_hki, status_hki(nama_status)') // Kembalikan data baru untuk konfirmasi
      .single();

    if (error) {
      console.error("Gagal update status inline:", error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Status berhasil diperbarui ke "${updatedData.status_hki?.nama_status}"`,
      data: updatedData 
    }, { status: 200 });

  } catch (err: any) {
    console.error("Error di API update status:", err);
    return NextResponse.json({ success: false, message: `Terjadi kesalahan: ${err.message}` }, { status: 500 });
  }
}