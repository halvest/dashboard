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
  pengusul ( id_pengusul, nama_pengusul:nama_opd ),
  kelas:kelas_hki ( id_kelas, nama_kelas, tipe )
`;

// --- [GET] (Tidak ada perubahan signifikan, sudah baik) ---
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


// --- [PATCH] (Logika Diperbaiki Total) ---
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

    // 1. Ambil data HKI yang ada saat ini
    const { data: currentHki, error: findHkiError } = await supabase
      .from(HKI_TABLE)
      .select('id_pemohon, sertifikat_pdf')
      .eq('id_hki', hkiId)
      .single();

    if (findHkiError) {
      return NextResponse.json({ success: false, message: `HKI dengan ID ${hkiId} tidak ditemukan.`}, { status: 404 });
    }

    // 2. PERBAIKAN LOGIKA PEMOHON: Selalu update data pemohon yang sudah ada.
    const namaPemohon = (getVal('nama_pemohon') as string | null)?.trim();
    if (!namaPemohon) {
        return NextResponse.json({ success: false, message: 'Nama pemohon wajib diisi.' }, { status: 400 });
    }
    const alamatPemohon = getVal('alamat') as string | null;

    const { error: pemohonUpdateError } = await supabase
        .from(PEMOHON_TABLE)
        .update({ nama_pemohon: namaPemohon, alamat: alamatPemohon })
        .eq('id_pemohon', currentHki.id_pemohon);

    if (pemohonUpdateError) {
        // Jika nama pemohon yang baru sudah ada (unique constraint), beri pesan error yang jelas
        if (pemohonUpdateError.code === '23505') {
            throw new Error(`Nama pemohon "${namaPemohon}" sudah digunakan oleh entri lain.`);
        }
        throw new Error(`Gagal memperbarui data pemohon: ${pemohonUpdateError.message}`);
    }

    // 3. UPDATE DATA HKI DI DATABASE (TANPA FILE DULU)
    const idKelas = getVal('id_kelas');
    const hkiUpdateData: Omit<Database['public']['Tables']['hki']['Update'], 'sertifikat_pdf'> = {
      nama_hki: String(getVal('nama_hki') || '').trim(),
      jenis_produk: (getVal('jenis_produk') as string | null) || null,
      tahun_fasilitasi: Number(getVal('tahun_fasilitasi')),
      keterangan: (getVal('keterangan') as string | null) || null,
      id_jenis_hki: Number(getVal('id_jenis_hki')),
      id_status: Number(getVal('id_status')),
      id_pengusul: Number(getVal('id_pengusul')),
      id_pemohon: currentHki.id_pemohon, // Gunakan ID pemohon yang sama
      id_kelas: idKelas ? Number(idKelas) : null,
    };

    const { error: hkiUpdateError } = await supabase
      .from(HKI_TABLE)
      .update(hkiUpdateData)
      .eq('id_hki', hkiId);
    
    if (hkiUpdateError) {
        throw new Error(`Gagal memperbarui data HKI: ${hkiUpdateError.message}`);
    }

    // 4. LOGIKA UPLOAD FILE BARU (JIKA ADA)
    const file = formData.get('file') as File | null;
    if (file && file.size > 0) {
        const oldFilePath = currentHki.sertifikat_pdf;
        
        const fileExt = file.name.split('.').pop() || 'pdf';
        const newFilePath = `public/${user.id}-${uuidv4()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from(HKI_BUCKET)
            .upload(newFilePath, file, { contentType: file.type });

        if (uploadError) {
            throw new Error(`Upload file baru gagal: ${uploadError.message}`);
        }

        // Jika upload berhasil, update path di DB dan hapus file lama
        await supabase.from(HKI_TABLE).update({ sertifikat_pdf: newFilePath }).eq('id_hki', hkiId);
        if (oldFilePath) {
            await supabase.storage.from(HKI_BUCKET).remove([oldFilePath]);
        }
    }

    // 5. AMBIL DATA TERBARU UNTUK DIKIRIM KE CLIENT
    const { data: updatedHki, error: finalFetchError } = await supabase
      .from(HKI_TABLE)
      .select(ALIASED_SELECT_QUERY)
      .eq('id_hki', hkiId)
      .single();

    if (finalFetchError) {
        throw new Error("Gagal mengambil data terbaru setelah update.");
    }
    
    return NextResponse.json({ success: true, data: updatedHki }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ success: false, message: `Terjadi kesalahan: ${err.message}` }, { status: 500 });
  }
}

// --- [DELETE] (Logika sudah cukup baik, tidak perlu perubahan besar) ---
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
    
    // Ambil path file sebelum menghapus record database
    const { data: hkiData, error: findError } = await supabase
      .from(HKI_TABLE)
      .select('sertifikat_pdf')
      .eq('id_hki', hkiId)
      .single();

    if (findError) {
      return NextResponse.json({ success: false, message: 'Data HKI tidak ditemukan untuk dihapus' }, { status: 404 });
    }
    
    // Hapus record dari database terlebih dahulu
    const { error: deleteError } = await supabase
      .from(HKI_TABLE)
      .delete()
      .eq('id_hki', hkiId);

    if (deleteError) {
      throw new Error(`Gagal menghapus data HKI: ${deleteError.message}`);
    }

    // Jika record berhasil dihapus, hapus file terkait di storage
    if (hkiData.sertifikat_pdf) {
      const { error: storageError } = await supabase.storage.from(HKI_BUCKET).remove([hkiData.sertifikat_pdf]);
      if (storageError) {
        // Jangan mengembalikan error ke user, cukup catat di log karena data utama sudah terhapus
        console.warn(`Gagal menghapus file di storage: ${storageError.message}`);
      }
    }
    
    return NextResponse.json({ success: true, message: 'Data HKI berhasil dihapus' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}