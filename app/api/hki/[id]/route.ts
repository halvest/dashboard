// app/api/hki/[id]/route.ts

// app/api/hki/[id]/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// --- GET: Mengambil detail satu HKI ---
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const id = parseInt(params.id, 10);

  if (isNaN(id)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  
  try {
    const { data, error } = await supabase
      .from('hki')
      .select(`*, pemohon(*), jenis_hki(*), status_hki(*), pengusul(*)`)
      .eq('id_hki', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
      throw error;
    }
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- PATCH: Memperbarui entri HKI ---
async function getOrCreatePemohon(supabase, nama_pemohon, alamat) {
    // (Fungsi ini sama seperti di file sebelumnya, bisa juga diekstrak ke helper)
    let { data: existing } = await supabase.from('pemohon').select('id_pemohon').eq('nama_pemohon', nama_pemohon).single();
    if (existing) return existing.id_pemohon;
    const { data: newData, error } = await supabase.from('pemohon').insert({ nama_pemohon, alamat }).select('id_pemohon').single();
    if (error) throw new Error(`Gagal membuat pemohon: ${error.message}`);
    return newData.id_pemohon;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createRouteHandlerClient({ cookies });
    const formData = await request.formData();
    const id_hki = parseInt(params.id, 10);
  
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    formData.forEach((value, key) => {
        if (!['file', 'nama_pemohon', 'alamat'].includes(key)) {
            updateData[key] = value;
        }
    });

    try {
        const namaPemohon = formData.get('nama_pemohon') as string;
        const alamatPemohon = formData.get('alamat') as string | null;
        const file = formData.get('file') as File | null;

        updateData.id_pemohon = await getOrCreatePemohon(supabase, namaPemohon, alamatPemohon);
    
        if (file) {
            const { data: oldEntry } = await supabase.from('hki').select('sertifikat_pdf').eq('id_hki', id_hki).single();
            if (oldEntry?.sertifikat_pdf) {
                await supabase.storage.from('sertifikat-hki').remove([oldEntry.sertifikat_pdf]);
            }
            const fileName = `${uuidv4()}.${file.name.split('.').pop()}`;
            const { error: uploadError } = await supabase.storage.from('sertifikat-hki').upload(fileName, file);
            if (uploadError) throw new Error(`Gagal upload file: ${uploadError.message}`);
            updateData.sertifikat_pdf = fileName;
        }

        const { data, error } = await supabase.from('hki').update(updateData).eq('id_hki', id_hki).select().single();
        if (error) throw new Error(`Gagal update data HKI: ${error.message}`);
        
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


// --- DELETE: Menghapus satu HKI ---
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createRouteHandlerClient({ cookies });
    const id_hki = parseInt(params.id, 10);

    if (isNaN(id_hki)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

    try {
        const { data: entryToDelete, error: selectError } = await supabase.from('hki').select('sertifikat_pdf').eq('id_hki', id_hki).single();
        if (selectError) throw selectError;

        if (entryToDelete?.sertifikat_pdf) {
            await supabase.storage.from('sertifikat-hki').remove([entryToDelete.sertifikat_pdf]);
        }

        const { error: deleteError } = await supabase.from('hki').delete().eq('id_hki', id_hki);
        if (deleteError) throw deleteError;
        
        return NextResponse.json({ message: 'Entri berhasil dihapus' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}