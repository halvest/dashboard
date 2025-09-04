// app/api/hki/[id]/signed-url/route.ts

// app/api/hki/[id]/signed-url/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const id = parseInt(params.id, 10);

  if (isNaN(id)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

  try {
    const { data: hkiEntry, error: fetchError } = await supabase
      .from('hki')
      .select('sertifikat_pdf')
      .eq('id_hki', id)
      .single();

    if (fetchError || !hkiEntry) {
      return NextResponse.json({ error: 'Entri tidak ditemukan' }, { status: 404 });
    }
    if (!hkiEntry.sertifikat_pdf) {
      return NextResponse.json({ error: 'Sertifikat tidak tersedia untuk entri ini' }, { status: 404 });
    }

    const { data, error: urlError } = await supabase.storage
      .from('sertifikat-hki')
      .createSignedUrl(hkiEntry.sertifikat_pdf, 60); // URL berlaku selama 60 detik

    if (urlError) throw urlError;

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}