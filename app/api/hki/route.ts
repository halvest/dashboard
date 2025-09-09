// app/api/hki/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'; // ✅ Impor tipe CookieOptions
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '@/lib/database.types';

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

// Fungsi helper untuk mendapatkan ID pemohon (Logika Upsert yang lebih aman)
async function getPemohonId(supabase: any, nama: string, alamat: string | null): Promise<number> {
    const trimmedNama = nama.trim();
    if (!trimmedNama) {
        throw new Error("Nama pemohon tidak boleh kosong.");
    }

    const { data: existingPemohon, error: findError } = await supabase
        .from(PEMOHON_TABLE)
        .select('id_pemohon')
        .ilike('nama_pemohon', trimmedNama)
        .limit(1)
        .single();

    if (findError && findError.code !== 'PGRST116') {
        console.error("Error saat mencari pemohon:", findError);
        throw new Error("Gagal memeriksa data pemohon: " + findError.message);
    }

    if (existingPemohon) {
        console.log(`Pemohon ditemukan: ID ${existingPemohon.id_pemohon} untuk nama '${trimmedNama}'`);
        return existingPemohon.id_pemohon;
    }

    console.log(`Pemohon '${trimmedNama}' tidak ditemukan, membuat baru...`);
    const { data: newPemohon, error: insertError } = await supabase
        .from(PEMOHON_TABLE)
        .insert({ nama_pemohon: trimmedNama, alamat: alamat })
        .select('id_pemohon')
        .single();

    if (insertError) {
        console.error("Error saat membuat pemohon baru:", insertError);
        throw new Error("Gagal menyimpan data pemohon baru: " + insertError.message);
    }

    if (!newPemohon) {
        throw new Error("Gagal membuat atau menemukan pemohon setelah insert.");
    }
    
    console.log(`Pemohon baru berhasil dibuat dengan ID: ${newPemohon.id_pemohon}`);
    return newPemohon.id_pemohon;
}

// --- POST: Create new HKI entry ---
export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  
  // ✅ PERBAIKAN FINAL: Melengkapi handler cookie untuk mengatasi error 'Failed to parse'
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Biarkan kosong jika terjadi di Route Handler
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Biarkan kosong jika terjadi di Route Handler
          }
        },
      },
    }
  );

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error otentikasi atau user tidak ditemukan:", userError);
      return NextResponse.json(
        { success: false, message: userError?.message || 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const getVal = (key: string) => formData.get(key);

    const namaPemohon = getVal('nama_pemohon') as string | null;
    if (!namaPemohon) {
        return NextResponse.json({ success: false, message: 'Nama pemohon wajib diisi.' }, { status: 400 });
    }
    const alamatPemohon = getVal('alamat') as string | null;
    const pemohonId = await getPemohonId(supabase, namaPemohon, alamatPemohon);
    
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
        console.log(`File berhasil diupload ke: ${dbFilePath}`);
      }
    }

    const hkiRecord: any = { // Gunakan 'any' untuk sementara agar bisa fleksibel
      nama_hki: String(getVal('nama_hki') || '').trim(),
      jenis_produk: getVal('jenis_produk') || null,
      tahun_fasilitasi: Number(getVal('tahun_fasilitasi')),
      keterangan: getVal('keterangan') || null,
      id_jenis_hki: Number(getVal('id_jenis_hki')),
      id_status: Number(getVal('id_status')),
      id_pengusul: Number(getVal('id_pengusul')),
      id_pemohon: pemohonId,
      sertifikat_pdf: dbFilePath,
    };
    
    // ❗️ PENTING: Cari nama kolom user ID Anda di tabel 'hki' Supabase.
    // Ganti 'NAMA_KOLOM_USER_ID_ANDA' dengan nama yang benar, lalu hapus komentar di bawah.
    // hkiRecord['NAMA_KOLOM_USER_ID_ANDA'] = user.id;

    console.log("\n--- Data Siap Insert ---");
    console.log(hkiRecord);
    console.log("-----------------------\n");
    
    if (!hkiRecord.nama_hki || !hkiRecord.id_jenis_hki || !hkiRecord.id_status || !hkiRecord.id_pengusul || !hkiRecord.tahun_fasilitasi) {
         return NextResponse.json({ success: false, message: 'Data wajib tidak lengkap (Nama, Jenis, Status, Pengusul, Tahun).'}, { status: 400 });
    }

    const { data: newHki, error: insertError } = await supabase
      .from(HKI_TABLE)
      .insert(hkiRecord)
      .select(ALIASED_SELECT_QUERY)
      .single();

    if (insertError) {
        console.error("!!! KRITIS: Error saat insert HKI:", insertError);
        return NextResponse.json({ success: false, message: `Database error: ${insertError.message}`}, { status: 500 });
    }

    console.log("--- BERHASIL DISIMPAN ---");
    return NextResponse.json({ success: true, data: newHki }, { status: 201 });

  } catch (err: any) {
    console.error('!!! KRITIS: API POST error (catch paling luar):', err.message);
    return NextResponse.json(
      { success: false, message: `Terjadi kesalahan tak terduga: ${err.message}` },
      { status: 500 }
    );
  }
}

