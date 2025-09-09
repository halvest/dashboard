// app/api/hki/[id]/route.ts
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '@/lib/database.types';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const HKI_TABLE = 'hki';
const PEMOHON_TABLE = 'pemohon';
const HKI_BUCKET = 'sertifikat-hki';
const ALIASED_SELECT_QUERY = `
  id_hki, nama_hki, jenis_produk, tahun_fasilitasi, sertifikat_pdf, keterangan, created_at,
  pemohon ( id_pemohon, nama_pemohon, alamat ),
  jenis:jenis_hki ( id_jenis:id_jenis_hki, nama_jenis:nama_jenis_hki ), 
  status_hki ( id_status, nama_status ),
  pengusul ( id_pengusul, nama_pengusul:nama_opd )
`;

// --- [GET] /api/hki/[id] ---
// --- Mengambil satu data HKI berdasarkan ID ---
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const hkiId = params.id;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from(HKI_TABLE)
      .select(ALIASED_SELECT_QUERY)
      .eq('id_hki', hkiId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, message: 'Data HKI tidak ditemukan' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}


// --- [PATCH] /api/hki/[id] ---
// --- Memperbarui data HKI yang ada ---
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const hkiId = params.id;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 });
    }

    const formData = await request.formData();
    const getVal = (key: string) => formData.get(key);

    // --- ✅ PERBAIKAN TOTAL LOGIKA EDIT PEMOHON ---
    const newNamaPemohon = (getVal('nama_pemohon') as string | null)?.trim();
    if (!newNamaPemohon) {
        return NextResponse.json({ success: false, message: 'Nama pemohon wajib diisi.' }, { status: 400 });
    }
    const newAlamatPemohon = getVal('alamat') as string | null;
    let finalPemohonId: number;

    // 1. Cek apakah ada pemohon lain dengan nama baru yang diinput
    const { data: targetPemohon } = await supabase
      .from(PEMOHON_TABLE)
      .select('id_pemohon')
      .ilike('nama_pemohon', newNamaPemohon)
      .limit(1)
      .single();

    // 2. Ambil ID pemohon yang saat ini terhubung ke HKI
    const { data: currentHki, error: findHkiError } = await supabase
      .from(HKI_TABLE)
      .select('id_pemohon')
      .eq('id_hki', hkiId)
      .single();

    if (findHkiError) {
      return NextResponse.json({ success: false, message: `HKI dengan ID ${hkiId} tidak ditemukan.`}, { status: 404 });
    }
    const currentPemohonId = currentHki.id_pemohon;

    if (targetPemohon) {
      // KASUS A: Pemohon dengan nama baru SUDAH ADA.
      // Kita akan menautkan HKI ini ke pemohon yang sudah ada itu.
      finalPemohonId = targetPemohon.id_pemohon;
      
      // (Opsional) Jika alamat juga diupdate, perbarui alamat pemohon target.
      if (newAlamatPemohon !== null) {
        await supabase.from(PEMOHON_TABLE).update({ alamat: newAlamatPemohon }).eq('id_pemohon', finalPemohonId);
      }
    } else {
      // KASUS B: Pemohon dengan nama baru TIDAK ADA.
      // Kita akan memperbarui (rename) data pemohon yang lama.
      finalPemohonId = currentPemohonId;
      const { error: pemohonUpdateError } = await supabase
        .from(PEMOHON_TABLE)
        .update({ nama_pemohon: newNamaPemohon, alamat: newAlamatPemohon })
        .eq('id_pemohon', finalPemohonId);

      if (pemohonUpdateError) {
        throw new Error(`Gagal memperbarui data pemohon: ${pemohonUpdateError.message}`);
      }
    }

    // --- LANJUTKAN DENGAN LOGIKA UPDATE HKI ---
    let dbFilePath: string | null = null;
    const file = formData.get('file') as File | null;
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop() || 'pdf';
      const filePath = `public/${user.id}-${uuidv4()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from(HKI_BUCKET)
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) {
        console.error('Upload file gagal:', uploadError.message);
      } else {
        dbFilePath = filePath;
      }
    }

    const hkiUpdateData: any = {
      nama_hki: String(getVal('nama_hki') || '').trim(),
      jenis_produk: getVal('jenis_produk') || null,
      tahun_fasilitasi: Number(getVal('tahun_fasilitasi')),
      keterangan: getVal('keterangan') || null,
      id_jenis_hki: Number(getVal('id_jenis_hki')),
      id_status: Number(getVal('id_status')),
      id_pengusul: Number(getVal('id_pengusul')),
      id_pemohon: finalPemohonId, // Gunakan ID pemohon yang sudah kita tentukan
    };
    
    if (dbFilePath) {
      hkiUpdateData.sertifikat_pdf = dbFilePath;
    }

    const { data: updatedHki, error: updateError } = await supabase
      .from(HKI_TABLE)
      .update(hkiUpdateData)
      .eq('id_hki', hkiId)
      .select(ALIASED_SELECT_QUERY)
      .single();

    if (updateError) {
        return NextResponse.json({ success: false, message: `Database error: ${updateError.message}`}, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updatedHki }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ success: false, message: `Terjadi kesalahan: ${err.message}` }, { status: 500 });
  }
}

// --- [DELETE] /api/hki/[id] ---
// --- Menghapus data HKI ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const hkiId = params.id;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 });
    }

    // 1. Ambil data untuk mendapatkan path file sertifikat
    const { data: hkiData, error: findError } = await supabase
      .from(HKI_TABLE)
      .select('sertifikat_pdf')
      .eq('id_hki', hkiId)
      .single();

    if (findError) {
      return NextResponse.json({ success: false, message: 'Data HKI tidak ditemukan untuk dihapus' }, { status: 404 });
    }

    // 2. Hapus file dari Storage jika ada
    if (hkiData.sertifikat_pdf) {
      const { error: storageError } = await supabase.storage
        .from(HKI_BUCKET)
        .remove([hkiData.sertifikat_pdf]);
      
      if (storageError) {
        console.error("Gagal menghapus file di storage:", storageError.message);
      }
    }

    // 3. Hapus record dari database
    const { error: deleteError } = await supabase
      .from(HKI_TABLE)
      .delete()
      .eq('id_hki', hkiId);

    if (deleteError) {
      throw new Error(`Gagal menghapus data HKI: ${deleteError.message}`);
    }

    return NextResponse.json({ success: true, message: 'Data HKI berhasil dihapus' }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

