import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Mengubah array objek JSON menjadi string CSV
 */
function convertToCSV(data: any[], columns: string[]) {
  if (!data || data.length === 0) {
    return "";
  }
  
  // Buat header dinamis berdasarkan kolom yang dipilih
  const headers = columns.map(col => ALL_COLUMNS[col]?.label || col);
  const csvRows = [headers.join(',')];

  // Buat baris data
  for (const row of data) {
    const values = columns.map(col => {
      let value = row[col] || "";
      // Bersihkan string agar aman untuk CSV (tangani koma, tanda kutip, dan baris baru)
      if (typeof value === 'string') {
        value = `"${value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// Peta data lengkap, untuk memetakan kunci kolom ke label dan query select
const ALL_COLUMNS: Record<string, { label: string, select: string }> = {
  'id_hki': { label: 'ID HKI', select: 'id_hki' },
  'nama_hki': { label: 'Nama HKI', select: 'nama_hki' },
  'jenis_produk': { label: 'Jenis Produk', select: 'jenis_produk' },
  'pemohon': { label: 'Nama Pemohon', select: 'pemohon(nama_pemohon)' },
  'alamat': { label: 'Alamat Pemohon', select: 'pemohon(alamat)' },
  'jenis_hki': { label: 'Jenis HKI', select: 'jenis:jenis_hki(nama_jenis_hki)' },
  'kelas': { label: 'Kelas HKI (Nama)', select: 'kelas:kelas_hki(nama_kelas)' },
  'kelas_id': { label: 'Kelas HKI (ID)', select: 'kelas:kelas_hki(id_kelas)' },
  'kelas_tipe': { label: 'Kelas HKI (Tipe)', select: 'kelas:kelas_hki(tipe)' },
  'pengusul': { label: 'Pengusul (OPD)', select: 'pengusul(nama_opd)' },
  'status': { label: 'Status', select: 'status_hki(nama_status)' },
  'tahun_fasilitasi': { label: 'Tahun Fasilitasi', select: 'tahun_fasilitasi' },
  'keterangan': { label: 'Keterangan', select: 'keterangan' },
  'sertifikat_pdf': { label: 'Link Sertifikat', select: 'sertifikat_pdf' },
  'created_at': { label: 'Tanggal Dibuat', select: 'created_at' },
};

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    // 1. Validasi Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: 'Tidak terautentikasi' }, { status: 401 });
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
    }

    // 2. Ambil Filter dari URL
    const { searchParams } = new URL(request.url);
    const filters = {
      p_search_text: searchParams.get('search') || null,
      p_jenis_id: searchParams.get('jenisId') ? Number(searchParams.get('jenisId')) : null,
      p_status_id: searchParams.get('statusId') ? Number(searchParams.get('statusId')) : null,
      p_year: searchParams.get('year') ? Number(searchParams.get('year')) : null,
      p_pengusul_id: searchParams.get('pengusulId') ? Number(searchParams.get('pengusulId')) : null,
    };
    const format = searchParams.get('format') || 'csv';
    const selectedColumns = (searchParams.get('columns') || '').split(',');

    if (selectedColumns.length === 0) {
      return NextResponse.json({ message: 'Tidak ada kolom dipilih' }, { status: 400 });
    }

    // 3. Panggil RPC untuk mendapatkan SEMUA ID yang cocok (tanpa paginasi)
    const { data: rpcData, error: rpcError } = await supabase.rpc('search_hki_ids_with_count', filters);
    if (rpcError) throw rpcError;

    const filteredIds = rpcData?.map((r: any) => r.result_id) ?? [];
    if (filteredIds.length === 0) {
      return NextResponse.json({ message: 'Tidak ada data untuk diekspor sesuai filter yang dipilih.' }, { status: 404 });
    }

    // 4. Buat string SELECT dinamis
    const selectQuery = selectedColumns
      .map(colKey => ALL_COLUMNS[colKey]?.select)
      .filter(Boolean) // Hapus jika ada key yg tidak valid
      .join(', ');

    // 5. Ambil data lengkap untuk SEMUA ID
    const { data: exportData, error: dataError } = await supabase
      .from('hki')
      .select(selectQuery)
      .in('id_hki', filteredIds)
      .order('created_at', { ascending: false });

    if (dataError) throw dataError;

    // 6. Flatten data relasional (penting untuk CSV)
    const flattenedData = exportData.map(row => {
        const flatRow: Record<string, any> = {};
        for (const colKey of selectedColumns) {
            let value: any;
            const selectPath = ALL_COLUMNS[colKey]?.select;
            if(selectPath) {
                const parts = selectPath.split('(');
                if (parts.length > 1) { // Ini adalah relasi, misal: 'pemohon(nama_pemohon)'
                    const table = parts[0].split(':')[0].trim(); // 'pemohon'
                    const column = parts[1].replace(')', '').split(':')[0].trim(); // 'nama_pemohon'
                    value = (row as any)[table]?.[column];
                } else { // Ini adalah kolom biasa, misal: 'nama_hki'
                    value = (row as any)[colKey];
                }
            }
            flatRow[colKey] = value ?? ''; // Set nilai yang sudah di-flatten
        }
        return flatRow;
    });

    // 7. Konversi ke CSV dan kirim sebagai file
    if (format === 'csv') {
      const csvData = convertToCSV(flattenedData, selectedColumns);
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="export_hki_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ message: 'Format file tidak didukung' }, { status: 400 });

  } catch (error: any) {
    console.error('Gagal Ekspor:', error);
    return NextResponse.json({ message: error.message || 'Error server internal' }, { status: 500 });
  }
}