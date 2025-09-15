import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import ExcelJS from 'exceljs';
import { createClient } from '@/utils/supabase/server';

/**
 * Membersihkan nilai untuk sel CSV, menangani koma, kutipan, dan baris baru.
 * @param value Nilai sel yang akan dibersihkan.
 * @returns Nilai yang aman untuk CSV.
 */
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

        // 1. Otentikasi & Otorisasi Admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
        }
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Akses ditolak. Hanya admin yang dapat mengekspor data.' }, { status: 403 });
        }

        // 2. Ambil semua parameter dari URL
        const { searchParams } = new URL(request.url);
        const format = (searchParams.get('format') || 'xlsx').toLowerCase();
        
        // Filter
        const search = searchParams.get('search');
        const jenisId = searchParams.get('jenisId');
        const statusId = searchParams.get('statusId');
        const year = searchParams.get('year');
        const pengusulId = searchParams.get('pengusulId');

        // Pagination (opsional, untuk ekspor halaman saat ini)
        const page = searchParams.get('page');
        const pageSize = searchParams.get('pageSize');
        
        // 3. Bangun Kueri Dinamis
        let query = supabase
            .from('hki')
            .select(`
                id_hki, nama_hki, jenis_produk, tahun_fasilitasi, keterangan,
                pemohon ( nama_pemohon, alamat ),
                jenis_hki ( nama_jenis_hki ), 
                status_hki ( nama_status ),
                pengusul ( nama_opd ),
                kelas_hki ( id_kelas, nama_kelas, tipe )
            `, { count: 'exact' });

        // Terapkan filter jika ada
        if (search) query = query.ilike('nama_hki', `%${search}%`);
        if (jenisId) query = query.eq('id_jenis_hki', Number(jenisId));
        if (statusId) query = query.eq('id_status', Number(statusId));
        if (year) query = query.eq('tahun_fasilitasi', Number(year));
        if (pengusulId) query = query.eq('id_pengusul', Number(pengusulId));
        
        // Terapkan paginasi JIKA diminta (untuk fitur "Ekspor Halaman Ini")
        if (page && pageSize) {
            const pageNum = parseInt(page, 10);
            const sizeNum = parseInt(pageSize, 10);
            const from = (pageNum - 1) * sizeNum;
            const to = from + sizeNum - 1;
            query = query.range(from, to);
        }

        // Eksekusi kueri
        const { data: hkiData, error, count } = await query.order('created_at', { ascending: true });
        
        if (error) {
            console.error('Kesalahan Database saat Ekspor:', error);
            throw new Error('Gagal mengambil data dari database.');
        }
        if (!hkiData || hkiData.length === 0) {
            return NextResponse.json({ error: 'Tidak ada data yang cocok dengan filter yang Anda pilih.' }, { status: 404 });
        }
        // Batasi ekspor semua data (jika paginasi tidak aktif)
        if (!page && count && count > 10000) {
            return NextResponse.json({ error: `Data terlalu besar (${count} baris) untuk diekspor sekaligus. Silakan persempit filter Anda.` }, { status: 413 });
        }

        // 4. Definisikan Kolom dan Normalisasi Data
        const columns = [
          { key: 'nama_hki', label: 'Nama HKI' },
          { key: 'jenis_produk', label: 'Jenis Produk' },
          { key: 'nama_pemohon', label: 'Nama Pemohon' },
          { key: 'alamat_pemohon', label: 'Alamat Pemohon' },
          { key: 'nama_jenis_hki', label: 'Jenis HKI' },
          { key: 'kelas_info', label: 'Kelas HKI' },
          { key: 'nama_pengusul', label: 'Pengusul (OPD)' },
          { key: 'tahun_fasilitasi', label: 'Tahun Fasilitasi' },
          { key: 'nama_status', label: 'Status' },
          { key: 'keterangan', label: 'Keterangan' },
        ];
        
        const normalizedData = hkiData.map((row: any) => ({
          nama_hki: row.nama_hki,
          jenis_produk: row.jenis_produk,
          nama_pemohon: row.pemohon?.nama_pemohon,
          alamat_pemohon: row.pemohon?.alamat,
          nama_jenis_hki: row.jenis_hki?.nama_jenis_hki, 
          kelas_info: row.kelas_hki ? `Kelas ${row.kelas_hki.id_kelas}: ${row.kelas_hki.nama_kelas}` : '-',
          nama_pengusul: row.pengusul?.nama_opd,
          tahun_fasilitasi: row.tahun_fasilitasi,
          nama_status: row.status_hki?.nama_status,
          keterangan: row.keterangan,
        }));
        
        const isCurrentPageExport = page && pageSize;
        const filename = `hki-export_${isCurrentPageExport ? `halaman-${page}` : 'semua-data'}_${new Date().toISOString().split('T')[0]}`;
        
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
          
          worksheet.columns = columns.map(col => ({
              header: col.label,
              key: col.key,
              width: 25 // Lebar awal
          }));

          worksheet.getRow(1).font = { bold: true };
          worksheet.addRows(normalizedData);

          // Atur lebar kolom otomatis berdasarkan konten
          worksheet.columns.forEach(column => {
              if (!column.key) return;
              let maxLength = column.header?.length || 10;
              column.eachCell!({ includeEmpty: true }, cell => {
                  let cellLength = cell.value ? cell.value.toString().length : 10;
                  if (cellLength > 100) cellLength = 100; // Batasi lebar maks agar file tidak terlalu besar
                  if (cellLength > maxLength) {
                      maxLength = cellLength;
                  }
              });
              column.width = maxLength < 12 ? 12 : maxLength + 2;
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
        
    } catch (error: any) {
        console.error('Kesalahan pada API Ekspor:', error);
        return NextResponse.json({ error: error.message || 'Terjadi kesalahan pada server' }, { status: 500 });
    }
}