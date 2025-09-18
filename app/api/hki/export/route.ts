// app/api/hki/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import ExcelJS from 'exceljs'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function escapeCsvValue(value: any): string {
  const stringValue = String(value ?? '')
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // 1. Otentikasi & Otorisasi Admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin yang dapat mengekspor data.' },
        { status: 403 }
      )
    }

    // 2. Ambil semua parameter dari URL
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'xlsx').toLowerCase()

    // Filter
    const search = searchParams.get('search')
    const jenisId = searchParams.get('jenisId')
    const statusId = searchParams.get('statusId')
    const year = searchParams.get('year')
    const pengusulId = searchParams.get('pengusulId')

    // Parameter `page` dan `pageSize` dihapus dari query export ini
    // agar bisa mengekspor SEMUA data yang cocok, bukan hanya satu halaman.

    // 3. Bangun Kueri Dinamis
    let query = supabase.from('hki').select(
      `
                id_hki, nama_hki, jenis_produk, tahun_fasilitasi, keterangan,
                pemohon ( nama_pemohon, alamat ),
                jenis:jenis_hki ( nama_jenis_hki ), 
                status_hki ( nama_status ),
                pengusul ( nama_opd ),
                kelas:kelas_hki ( id_kelas, nama_kelas, tipe )
            `,
      { count: 'exact' }
    ) // <-- PERBAIKAN SELECT QUERY

    // Terapkan filter jika ada
    if (search) query = query.ilike('nama_hki', `%${search}%`)
    if (jenisId) query = query.eq('id_jenis_hki', Number(jenisId)) // <-- PERBAIKAN KOLOM FILTER
    if (statusId) query = query.eq('id_status', Number(statusId))
    if (year) query = query.eq('tahun_fasilitasi', Number(year))
    if (pengusulId) query = query.eq('id_pengusul', Number(pengusulId))

    // Export tidak perlu pagination range, karena kita mau semua data
    const {
      data: hkiData,
      error,
      count,
    } = await query.order('created_at', { ascending: true })

    if (error) {
      console.error('Kesalahan Database saat Ekspor:', error)
      // Jangan lempar error generik, lempar error asli agar lebih jelas saat debug
      throw new Error(`Database error: ${error.message}`)
    }
    if (!hkiData || hkiData.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data yang cocok dengan filter yang Anda pilih.' },
        { status: 404 }
      )
    }
    // Batasi jumlah ekspor untuk mencegah server timeout
    if (count && count > 5000) {
      return NextResponse.json(
        {
          error: `Data terlalu besar (${count} baris) untuk diekspor. Silakan persempit filter Anda.`,
        },
        { status: 413 }
      )
    }

    // 4. Definisikan Kolom dan Normalisasi Data
    const columns = [
      { key: 'nama_hki', label: 'Nama HKI' },
      { key: 'jenis_produk', label: 'Jenis Produk' },
      { key: 'nama_pemohon', label: 'Nama Pemohon' },
      { key: 'alamat_pemohon', label: 'Alamat Pemohon' },
      { key: 'nama_jenis_hki', label: 'Jenis HKI' }, // <-- PERBAIKAN
      { key: 'kelas_info', label: 'Kelas HKI' },
      { key: 'nama_opd', label: 'Pengusul (OPD)' }, // <-- PERBAIKAN
      { key: 'tahun_fasilitasi', label: 'Tahun Fasilitasi' },
      { key: 'nama_status', label: 'Status' },
      { key: 'keterangan', label: 'Keterangan' },
    ]

    const normalizedData = hkiData.map((row: any) => ({
      nama_hki: row.nama_hki,
      jenis_produk: row.jenis_produk,
      nama_pemohon: row.pemohon?.nama_pemohon,
      alamat_pemohon: row.pemohon?.alamat,
      nama_jenis_hki: row.jenis?.nama_jenis_hki, // <-- PERBAIKAN
      kelas_info: row.kelas
        ? `Kelas ${row.kelas.id_kelas}: ${row.kelas.nama_kelas}`
        : '-',
      nama_opd: row.pengusul?.nama_opd, // <-- PERBAIKAN
      tahun_fasilitasi: row.tahun_fasilitasi,
      nama_status: row.status_hki?.nama_status,
      keterangan: row.keterangan,
    }))

    const filename = `hki-export_semua-data_${new Date().toISOString().split('T')[0]}`

    // 5. Buat File Berdasarkan Format
    if (format === 'csv') {
      const headers = columns.map((c) => c.label).join(',')
      const csvRows = normalizedData.map((rowData) =>
        columns
          .map((col) => escapeCsvValue((rowData as any)[col.key]))
          .join(',')
      )
      const csvContent = `${headers}\n${csvRows.join('\n')}`

      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    }

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Data HKI')

      worksheet.columns = columns.map((col) => ({
        header: col.label,
        key: col.key,
        width: 25,
      }))

      worksheet.getRow(1).font = { bold: true }
      worksheet.addRows(normalizedData)

      worksheet.columns.forEach((column) => {
        if (!column.key) return
        let maxLength = column.header?.length ?? 10
        if (column.eachCell) {
          column.eachCell({ includeEmpty: true }, (cell) => {
            let cellLength = cell.value ? String(cell.value).length : 10
            if (cellLength > 100) cellLength = 100 // Batasi panjang maks
            if (cellLength > maxLength) {
              maxLength = cellLength
            }
          })
        }
        column.width = maxLength < 12 ? 12 : maxLength + 2
      })

      const buffer = await workbook.xlsx.writeBuffer()
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      })
    }

    return NextResponse.json(
      { error: `Format file tidak valid: ${format}` },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Kesalahan pada API Ekspor:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
