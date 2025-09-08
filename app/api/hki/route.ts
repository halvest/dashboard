import { createRouteHandlerClient, SupabaseClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const HKI_TABLE = 'hki';
const PEMOHON_TABLE = 'pemohon';
const HKI_BUCKET = 'sertifikat-hki';

const ALLOWED_SORT_FIELDS = ['created_at', 'nama_hki', 'tahun_fasilitasi'];

// --- GET: Fetch HKI list ---
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10));
  const search = searchParams.get('search')?.trim() || '';
  const sortBy = ALLOWED_SORT_FIELDS.includes(searchParams.get('sortBy') || '')
    ? searchParams.get('sortBy')!
    : 'created_at';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  const jenisId = searchParams.get('jenisId');
  const statusId = searchParams.get('statusId');
  const year = searchParams.get('year');

  let query = supabase
    .from(HKI_TABLE)
    .select(`
      id_hki, nama_hki, jenis_produk, tahun_fasilitasi, sertifikat_pdf, keterangan, created_at,
      pemohon ( id_pemohon, nama_pemohon, alamat ),
      jenis_hki ( id_jenis_hki, nama_jenis_hki ),
      status_hki ( id_status, nama_status ),
      pengusul ( id_pengusul, nama_opd )
    `, { count: 'exact' });

  if (search) {
    query = query.or(`nama_hki.ilike.%${search}%`);
  }
  if (jenisId) query = query.eq('id_jenis_hki', jenisId);
  if (statusId) query = query.eq('id_status', statusId);
  if (year) query = query.eq('tahun_fasilitasi', year);

  query = query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching HKI list:', error);
    return NextResponse.json({ success: false, message: 'Gagal mengambil data HKI.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data, count });
}

// --- Helper: Get or create pemohon ---
async function getOrCreatePemohon(supabase: SupabaseClient, nama_pemohon: string, alamat: string | null) {
  const { data, error } = await supabase
    .from(PEMOHON_TABLE)
    .upsert({ nama_pemohon, alamat }, { onConflict: 'nama_pemohon' })
    .select('id_pemohon')
    .single();

  if (error || !data) {
    throw new Error(`Gagal membuat/mendapatkan pemohon: ${error?.message || 'Tidak ditemukan'}`);
  }
  return data.id_pemohon;
}

// --- POST: Create new HKI entry ---
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const formData = await request.formData();
    const hkiData: Record<string, any> = {};

    formData.forEach((value, key) => {
      if (!['file', 'nama_pemohon', 'alamat'].includes(key)) {
        hkiData[key] = value;
      }
    });

    const namaPemohon = formData.get('nama_pemohon') as string;
    const alamatPemohon = formData.get('alamat') as string | null;
    const file = formData.get('file') as File | null;

    if (!namaPemohon) throw new Error('Nama pemohon wajib diisi.');

    hkiData.id_pemohon = await getOrCreatePemohon(supabase, namaPemohon, alamatPemohon);

    if (file) {
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

      if (uploadError) throw new Error(`Gagal upload file: ${uploadError.message}`);
      hkiData.sertifikat_pdf = fileName;
    }

    const { data, error } = await supabase.from(HKI_TABLE).insert(hkiData).select().single();
    if (error) throw new Error(`Gagal menyimpan data HKI: ${error.message}`);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating HKI:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
