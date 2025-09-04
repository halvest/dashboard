// app/api/hki/bulk-delete/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { ids } = await request.json();

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Daftar ID tidak valid' }, { status: 400 });
  }

  try {
    const { data: entriesToDelete } = await supabase.from('hki').select('sertifikat_pdf').in('id_hki', ids);
    
    if (entriesToDelete && entriesToDelete.length > 0) {
        const filePaths = entriesToDelete.map(e => e.sertifikat_pdf).filter(Boolean) as string[];
        if (filePaths.length > 0) {
            await supabase.storage.from('sertifikat-hki').remove(filePaths);
        }
    }

    const { error } = await supabase.from('hki').delete().in('id_hki', ids);
    if (error) throw error;

    return NextResponse.json({ message: `${ids.length} entri berhasil dihapus.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}