// app/api/hki/bulk-delete/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const HKI_TABLE = 'hki';
const HKI_BUCKET = 'sertifikat-hki';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Daftar ID tidak valid' }, { status: 400 });
    }

    // Ambil file path sebelum delete
    const { data: entriesToDelete, error: fetchError } = await supabase
      .from(HKI_TABLE)
      .select('sertifikat_pdf')
      .in('id_hki', ids);

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json({ error: 'Gagal mengambil data HKI untuk dihapus' }, { status: 500 });
    }

    // Hapus data dari DB
    const { error: deleteError } = await supabase.from(HKI_TABLE).delete().in('id_hki', ids);
    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      return NextResponse.json({ error: 'Gagal menghapus entri HKI' }, { status: 500 });
    }

    // Hapus file dari storage (jika ada)
    if (entriesToDelete && entriesToDelete.length > 0) {
      const filePaths = entriesToDelete.map(e => e.sertifikat_pdf).filter(Boolean) as string[];
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage.from(HKI_BUCKET).remove(filePaths);
        if (storageError) {
          // Tidak fatal, log aja
          console.error('Gagal menghapus file dari storage:', storageError);
        }
      }
    }

    return NextResponse.json({
      message: `${ids.length} entri berhasil dihapus.`,
      deletedIds: ids
    });
  } catch (error: any) {
    console.error('Unexpected bulk delete error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
