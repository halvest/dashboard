// app/api/hki/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import ExcelJS from 'exceljs';
import { createClient } from '@/utils/supabase/server'; // Sesuaikan path jika perlu

// Fungsi helper untuk membersihkan nilai sel CSV
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // Jika nilai mengandung koma, kutip, atau baris baru, bungkus dengan kutip ganda
  if (/[",\n]/.test(stringValue)) {
    // Ganti setiap kutip ganda di dalam string dengan dua kutip ganda
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 1. Otentikasi & Otorisasi Pengguna (Admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya admin yang dapat mengekspor data.' }, { status: 403 });
    }

    // 2. Validasi Parameter URL
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'xlsx').toLowerCase();
    const filter = (searchParams.get('filter') || '').toLowerCase();
    const value = searchParams.get('value') || '';

    if (!['csv', 'xlsx'].includes(format)) {
      return NextResponse.json({ error: 'Format tidak valid. Pilihan: csv, xlsx' }, { status: 400 });
    }
    if (!['year', 'pengusul', 'status'].includes(filter)) {
      return NextResponse.json({ error: 'Filter tidak valid. Pilihan: year, pengusul, status' }, { status: 400 });
    }
    if (!value) {
      return NextResponse.json({ error: 'Nilai filter wajib diisi' }, { status: 400 });
    }

    // 3. Bangun Kueri Database Tunggal yang Dinamis
    let query = supabase
      .from('hki')
      .select(`
        id_hki, nama_hki, jenis_produk, tahun_fasilitasi, keterangan,
        pemohon ( nama_pemohon, alamat ),
        jenis ( nama_jenis ),
        status_hki ( nama_status ),
        pengusul ( nama_pengusul ),
        kelas ( id_kelas, nama_kelas, tipe )
      `);

    // Terapkan filter berdasarkan parameter
    if (filter === 'year') {
      query = query.eq('tahun_fasilitasi', Number(value));
    } else if (filter === 'pengusul') {
      query = query.eq('id_pengusul', Number(value));
    } else if (filter === 'status') {
      query = query.eq('id_status', Number(value));
    }

    // Eksekusi kueri untuk mengambil semua data yang cocok (tanpa paginasi)
    const { data: hkiData, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Kesalahan Database saat Ekspor:', error);
      throw new Error('Gagal mengambil data dari database.');
    }

    if (!hkiData || hkiData.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang cocok dengan filter yang Anda pilih.' }, { status: 404 });
    }
    
    // Batas aman untuk ekspor sinkron
    if (hkiData.length > 10000) {
        return NextResponse.json({ error: 'Data terlalu besar (>10.000 baris) untuk diekspor secara langsung. Harap persempit filter Anda.'}, { status: 413 });
    }

    // 4. Definisikan Kolom dan Normalisasi Data
    const columns = [
      { key: 'nama_hki', label: 'Nama HKI' },
      { key: 'jenis_produk', label: 'Jenis Produk' },
      { key: 'nama_pemohon', label: 'Nama Pemohon' },
      { key: 'alamat_pemohon', label: 'Alamat Pemohon' },
      { key: 'nama_jenis', label: 'Jenis HKI' },
      { key: 'kelas_info', label: 'Kelas HKI' },
      { key: 'nama_pengusul', label: 'Pengusul (OPD)' },
      { key: 'tahun_fasilitasi', label: 'Tahun Fasilitasi' },
      { key: 'nama_status', label: 'Status' },
      { key: 'keterangan', label: 'Keterangan' },
    ];
    
    // Ubah data relasional menjadi data datar (flat) yang siap diekspor
    const normalizedData = hkiData.map((row: any) => ({
      nama_hki: row.nama_hki,
      jenis_produk: row.jenis_produk,
      nama_pemohon: row.pemohon?.nama_pemohon,
      alamat_pemohon: row.pemohon?.alamat,
      nama_jenis: row.jenis?.nama_jenis,
      kelas_info: row.kelas ? `Kelas ${row.kelas.id_kelas}: ${row.kelas.nama_kelas}` : '-',
      nama_pengusul: row.pengusul?.nama_pengusul,
      tahun_fasilitasi: row.tahun_fasilitasi,
      nama_status: row.status_hki?.nama_status,
      keterangan: row.keterangan,
    }));

    const filename = `hki-export_${filter}-${value}_${new Date().toISOString().split('T')[0]}`;

    // 5. Buat File Berdasarkan Format
    if (format === 'csv') {
      const headers = columns.map(c => c.label).join(',');
      const csvRows = normalizedData.map(row =>
        columns.map(col => escapeCsvValue((row as any)[col.key])).join(',')
      );
      const csvContent = `${headers}\n${csvRows.join('\n')}`;

      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data HKI');
      
      // Tambah Header
      worksheet.columns = columns.map(col => ({ header: col.label, key: col.key, width: 25 }));
      worksheet.getRow(1).font = { bold: true };
      
      // Tambah Data
      worksheet.addRows(normalizedData);

      // Atur lebar kolom otomatis
      worksheet.columns.forEach(column => {
          let maxLength = 0;
          column.eachCell!({ includeEmpty: true }, cell => {
              let cellLength = cell.value ? cell.value.toString().length : 10;
              if (cellLength > maxLength) {
                  maxLength = cellLength;
              }
          });
          column.width = maxLength < 10 ? 10 : maxLength + 2;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      });
    }
    
    // Fallback jika format tidak didukung (seharusnya sudah tertangani oleh validasi di atas)
    return NextResponse.json({ error: 'Format tidak didukung' }, { status: 400 });

  } catch (error: any) {
    console.error('Kesalahan pada API Ekspor:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}