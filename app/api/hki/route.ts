// app/api/hki/route.ts

// app/api/hki/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// --- GET: Mengambil daftar HKI ---
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
  const search = searchParams.get('search')?.trim() || '';
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // Filter tambahan
  const jenisId = searchParams.get('jenisId');
  const statusId = searchParams.get('statusId');
  const year = searchParams.get('year');

  const query = supabase
    .from('hki')
    .select(`
      id_hki, nama_hki, jenis_produk, tahun_fasilitasi, sertifikat_pdf, keterangan, created_at,
      pemohon ( id_pemohon, nama_pemohon, alamat ),
      jenis_hki ( id_jenis_hki, nama_jenis_hki ),
      status_hki ( id_status, nama_status ),
      pengusul ( id_pengusul, nama_opd )
    `, { count: 'exact' });

  if (search) {
    query.or(`nama_hki.ilike.%${search}%,pemohon.nama_pemohon.ilike.%${search}%`);
  }
  if (jenisId) query.eq('id_jenis_hki', jenisId);
  if (statusId) query.eq('id_status', statusId);
  if (year) query.eq('tahun_fasilitasi', year);

  query.order(sortBy, { ascending: sortOrder === 'asc' });
  query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching HKI list:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count });
}


// --- POST: Membuat entri HKI baru ---
async function getOrCreatePemohon(supabase, nama_pemohon, alamat) {
  let { data: existing } = await supabase.from('pemohon').select('id_pemohon').eq('nama_pemohon', nama_pemohon).single();
  if (existing) return existing.id_pemohon;
  const { data: newData, error } = await supabase.from('pemohon').insert({ nama_pemohon, alamat }).select('id_pemohon').single();
  if (error) throw new Error(`Gagal membuat pemohon: ${error.message}`);
  return newData.id_pemohon;
}

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const formData = await request.formData();
  
  const hkiData: Record<string, any> = {};
  formData.forEach((value, key) => {
    if (!['file', 'nama_pemohon', 'alamat'].includes(key)) {
      hkiData[key] = value;
    }
  });

  try {
    const namaPemohon = formData.get('nama_pemohon') as string;
    const alamatPemohon = formData.get('alamat') as string | null;
    const file = formData.get('file') as File | null;

    hkiData.id_pemohon = await getOrCreatePemohon(supabase, namaPemohon, alamatPemohon);
    
    if (file) {
      const fileName = `${uuidv4()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('sertifikat-hki').upload(fileName, file);
      if (uploadError) throw new Error(`Gagal upload file: ${uploadError.message}`);
      hkiData.sertifikat_pdf = fileName;
    }

    const { data, error } = await supabase.from('hki').insert(hkiData).select().single();
    if (error) throw new Error(`Gagal menyimpan data HKI: ${error.message}`);
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}