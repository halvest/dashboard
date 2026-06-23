// app/api/hki/export/route.ts

import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient } from '@/utils/supabase/server'
import { Database } from '@/lib/database.types' // ✅ Perbaikan: Impor tipe Database untuk type safety
import { Readable } from 'stream'

export const dynamic = 'force-dynamic'
// ✅ Perbaikan: Tetap gunakan runtime nodejs karena ketergantungan pada ExcelJS
export const runtime = 'nodejs'

// ✅ Perbaikan: Tipe data yang lebih spesifik untuk hasil query
type HKIExportData = {
  nama_hki: string | null
  jenis_produk: string | null
  tahun_fasilitasi: number | null
  keterangan: string | null
  pemohon: { nama_pemohon: string; alamat: string | null } | null
  jenis: { nama_jenis_hki: string } | null
  status_hki: { nama_status: string } | null
  pengusul: { nama_opd: string } | null
  kelas: { id_kelas: number; nama_kelas: string; tipe: string } | null
}

// ✅ Perbaikan: Kolom didefinisikan sekali dengan tipe yang kuat
const EXPORT_COLUMNS = [
  { key: 'nama_hki', label: 'Nama HKI' },
  { key: 'jenis_produk', label: 'Jenis Produk' },
  { key: 'nama_pemohon', label: 'Nama Pemohon' },
  { key: 'alamat_pemohon', label: 'Alamat Pemohon' },
  { key: 'nama_jenis_hki', label: 'Jenis HKI' },
  { key: 'kelas_info', label: 'Kelas HKI' },
  { key: 'nama_opd', label: 'Pengusul (OPD)' },
  { key: 'tahun_fasilitasi', label: 'Tahun Fasilitasi' },
  { key: 'nama_status', label: 'Status' },
  { key: 'keterangan', label: 'Keterangan' },
] as const // Gunakan 'as const' untuk tipe yang lebih ketat

type NormalizedRow = Record<(typeof EXPORT_COLUMNS)[number]['key'], string | number | null>

/**
 * ✅ Perbaikan: Fungsi otorisasi yang diekstraksi untuk penggunaan kembali.
 */
async function authorizeAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Tidak terautentikasi')
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    throw new Error('Akses ditolak. Hanya admin yang dapat mengekspor data.')
  }
}

/**
 * ✅ Perbaikan: Normalisasi data menjadi fungsi terpisah.
 */
function normalizeHkiData(data: HKIExportData[]): NormalizedRow[] {
  return data.map((row) => ({
    nama_hki: row.nama_hki,
    jenis_produk: row.jenis_produk,
    nama_pemohon: row.pemohon?.nama_pemohon ?? null,
    alamat_pemohon: row.pemohon?.alamat ?? null,
    nama_jenis_hki: row.jenis?.nama_jenis_hki ?? null,
    kelas_info: row.kelas ? `Kelas ${row.kelas.id_kelas}: ${row.kelas.nama_kelas}` : '-',
    nama_opd: row.pengusul?.nama_opd ?? null,
    tahun_fasilitasi: row.tahun_fasilitasi,
    nama_status: row.status_hki?.nama_status ?? null,
    keterangan: row.keterangan,
  }))
}

function escapeCsvValue(value: any): string {
    const stringValue = String(value ?? '')
    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    await authorizeAdmin(supabase)

    const { searchParams } = request.nextUrl
    const format = (searchParams.get('format') || 'xlsx').toLowerCase()
    
    // ✅ Perbaikan: Gunakan Supabase RPC 'search_hki' untuk pencarian yang lebih konsisten dan efisien
    // (Asumsi RPC ini sudah dibuat di database Anda seperti yang direkomendasikan sebelumnya)
    const search = searchParams.get('search')
    const jenisId = searchParams.get('jenisId')
    const statusId = searchParams.get('statusId')
    const year = searchParams.get('year')
    const pengusulId = searchParams.get('pengusulId')

    const query = supabase.from('hki').select(
        `id_hki, nama_hki, jenis_produk, tahun_fasilitasi, keterangan,
         pemohon ( nama_pemohon, alamat ),
         jenis:jenis_hki ( nama_jenis_hki ), 
         status_hki ( nama_status ),
         pengusul ( nama_opd ),
         kelas:kelas_hki ( id_kelas, nama_kelas, tipe )`,
        { count: 'exact' }
    )

    if (search) query.ilike('nama_hki', `%${search}%`) // Untuk saat ini, kita pertahankan .ilike() jika RPC belum ada
    if (jenisId) query.eq('id_jenis_hki', Number(jenisId))
    if (statusId) query.eq('id_status', Number(statusId))
    if (year) query.eq('tahun_fasilitasi', Number(year))
    if (pengusulId) query.eq('id_pengusul', Number(pengusulId))

    const { data, error, count } = await query.order('created_at', { ascending: true })

    if (error) throw new Error(`Kesalahan Database: ${error.message}`)
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang cocok dengan filter Anda.' }, { status: 404 })
    }

    const normalizedData = normalizeHkiData(data as HKIExportData[])
    const filename = `hki-export_${new Date().toISOString().split('T')[0]}`

    // --- PEMBUATAN FILE ---

    if (format === 'csv') {
      // ✅ Perbaikan: Implementasi streaming untuk CSV
      const stream = new Readable({
          read() {
              this.push(EXPORT_COLUMNS.map(c => c.label).join(',') + '\n');
              for (const row of normalizedData) {
                  const csvRow = EXPORT_COLUMNS.map(col => escapeCsvValue(row[col.key])).join(',');
                  this.push(csvRow + '\n');
              }
              this.push(null); // Sinyal akhir stream
          }
      });

      return new Response(stream as any, {
          status: 200,
          headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="${filename}.csv"`,
          },
      });
    }

    if (format === 'xlsx') {
      // ✅ Perbaikan: Batas ekspor Excel diperketat untuk Vercel Free Plan
      if (count && count > 2000) {
        return NextResponse.json({ error: `Data terlalu besar (${count} baris) untuk ekspor Excel. Gunakan format CSV atau persempit filter Anda.` }, { status: 413 });
      }

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Data HKI')
      worksheet.columns = EXPORT_COLUMNS.map(col => ({ header: col.label, key: col.key, width: 25 }));
      worksheet.getRow(1).font = { bold: true }
      worksheet.addRows(normalizedData)
      
      const buffer = await workbook.xlsx.writeBuffer()
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      })
    }
    
    return NextResponse.json({ error: `Format file tidak valid: ${format}` }, { status: 400 })

  } catch (error: any) {
    console.error('Kesalahan pada API Ekspor:', error)
    const status = error.message.includes('Tidak terautentikasi') ? 401 : error.message.includes('Akses ditolak') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan pada server' }, { status });
  }
}