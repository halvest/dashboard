import { createRouteHandlerClient, SupabaseClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const HKI_TABLE = 'hki';
const PEMOHON_TABLE = 'pemohon';
const HKI_BUCKET = 'sertifikat-hki';

async function getOrCreatePemohon(supabase: SupabaseClient, nama_pemohon: string, alamat: string | null) {
  const { data, error } = await supabase
    .from(PEMOHON_TABLE)
    .upsert({ nama_pemohon, alamat }, { onConflict: 'nama_pemohon' })
    .select('id_pemohon')
    .single();

  if (error || !data) {
    throw new Error(`Gagal memproses pemohon: ${error?.message || 'Tidak ditemukan'}`);
  }
  return data.id_pemohon;
}

// --- GET ---
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    return NextResponse.json({ success: false, error: 'ID HKI tidak valid.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from(HKI_TABLE)
      .select(`*, pemohon(*), jenis_hki(*), status_hki(*), pengusul(*)`)
      .eq('id_hki', id)
      .single();

    if (error) {
      if (error?.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Data HKI tidak ditemukan.' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Error fetching HKI detail:', err);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

// --- PATCH ---
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const id_hki = parseInt(params.id, 10);

  if (isNaN(id_hki)) {
    return NextResponse.json({ success: false, error: 'ID HKI tidak valid.' }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    formData.forEach((value, key) => {
      if (!['file', 'nama_pemohon', 'alamat'].includes(key)) {
        updateData[key] = value;
      }
    });

    const namaPemohon = formData.get('nama_pemohon') as string;
    const alamatPemohon = formData.get('alamat') as string | null;
    const file = formData.get('file') as File | null;

    if (!namaPemohon) throw new Error('Nama pemohon wajib diisi.');

    updateData.id_pemohon = await getOrCreatePemohon(supabase, namaPemohon, alamatPemohon);

    if (file) {
      // Hapus file lama
      const { data: oldEntry } = await supabase
        .from(HKI_TABLE)
        .select('sertifikat_pdf')
        .eq('id_hki', id_hki)
        .single();

      if (oldEntry?.sertifikat_pdf) {
        await supabase.storage.from(HKI_BUCKET).remove([oldEntry.sertifikat_pdf]);
      }

      // Upload baru
      const fileExtension = file.name.split('.').pop();
      if (!fileExtension) throw new Error('File tidak memiliki ekstensi.');

      const fileName = `${uuidv4()}.${fileExtension}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from(HKI_BUCKET)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw new Error(`Upload gagal: ${uploadError.message}`);
      updateData.sertifikat_pdf = fileName;
    }

    const { data, error } = await supabase
      .from(HKI_TABLE)
      .update(updateData)
      .eq('id_hki', id_hki)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Error updating HKI:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// --- DELETE ---
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const id_hki = parseInt(params.id, 10);

  if (isNaN(id_hki)) {
    return NextResponse.json({ success: false, error: 'ID HKI tidak valid.' }, { status: 400 });
  }

  try {
    const { data: entry, error } = await supabase
      .from(HKI_TABLE)
      .delete()
      .eq('id_hki', id_hki)
      .select('sertifikat_pdf')
      .single();

    if (error) {
      if (error?.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Data HKI tidak ditemukan.' }, { status: 404 });
      }
      throw error;
    }

    if (entry?.sertifikat_pdf) {
      const { error: storageError } = await supabase.storage.from(HKI_BUCKET).remove([entry.sertifikat_pdf]);
      if (storageError) {
        console.error('File gagal dihapus dari storage:', storageError);
      }
    }

    return NextResponse.json({ success: true, message: 'HKI berhasil dihapus.' });
  } catch (err: any) {
    console.error('Error deleting HKI:', err);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
