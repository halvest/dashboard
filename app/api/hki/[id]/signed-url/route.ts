// app/api/hki/[id]/signed-url/route.ts
import { createClient } from '@/utils/supabase/server'; 
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const HKI_BUCKET = 'sertifikat-hki';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore); 
  const id = parseInt(params.id, 10);

  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { data: hkiEntry, error: fetchError } = await supabase
      .from('hki')
      .select('sertifikat_pdf')
      .eq('id_hki', id)
      .single();

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json({ error: 'Gagal mengambil data HKI' }, { status: 500 });
    }

    if (!hkiEntry) {
      return NextResponse.json({ error: 'Entri tidak ditemukan' }, { status: 404 });
    }

    if (!hkiEntry.sertifikat_pdf) {
      return NextResponse.json({ error: 'Sertifikat tidak tersedia untuk entri ini' }, { status: 404 });
    }

    const { data, error: urlError } = await supabase.storage
      .from(HKI_BUCKET)
      .createSignedUrl(hkiEntry.sertifikat_pdf, 300); // 5 menit

    if (urlError) {
      console.error('Supabase signed URL error:', urlError);
      return NextResponse.json({ error: 'Gagal membuat signed URL' }, { status: 500 });
    }

    return NextResponse.json({ 
      signedUrl: data.signedUrl,
      fileName: hkiEntry.sertifikat_pdf 
    });
  } catch (error: any) {
    console.error('Unexpected error in signed-url route:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}