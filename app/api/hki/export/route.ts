// app/api/hki/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import ExcelJS from 'exceljs'
import { createClient } from '@/utils/supabase/server'
import { Database } from '@/lib/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
// Runtime Node.js diperlukan untuk library seperti ExcelJS
export const runtime = 'nodejs'

// Mendefinisikan tipe data yang diharapkan dari query Supabase
type HKIExportData = Database['public']['Tables']['hki']['Row'] & {
  pemohon: { nama_pemohon: string; alamat: string } | null
  jenis: { nama_jenis_hki: string } | null
  status_hki: { nama_status: string } | null
  pengusul: { nama_opd: string } | null
  kelas: { id_kelas: number; nama_kelas: string; tipe: string } | null
}

/**
 * Helper untuk mengubah nilai menjadi format CSV yang aman.
 */
function escapeCsvValue(value: any): string {
  const stringValue = String(value ?? '')
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

/**
 * Helper terpusat untuk otentikasi dan otorisasi admin.
 */
async function authorizeAdmin(supabase: SupabaseClient<Database>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return { user: null, error: NextResponse.json({ error: 'Akses ditolak. Tindakan ini memerlukan hak admin.' }, { status: 403 }) }
  }

  return { user, error: null }
}


export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // --- PERBAIKAN 1: Menggunakan helper otorisasi ---
    const { error: authError } = await authorizeAdmin(supabase)
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')?.toLowerCase() || 'xlsx'

    if (format !== 'xlsx' && format !== 'csv') {
        return NextResponse.json({ error: `Format file tidak valid: ${format}` }, { status: 400 });
    }

    const search = searchParams.get('search')
    const jenisId = searchParams.get('jenisId')
    const statusId = searchParams.get('statusId')
    const year = searchParams.get('year')
    const pengusulId = searchParams.get('pengusulId')

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
    )

    if (search) query = query.ilike('nama_hki', `%${search}%`)
    if (jenisId) query = query.eq('id_jenis_hki', Number(jenisId))
    if (statusId) query = query.eq('id_status', Number(statusId))
    if (year) query = query.eq('tahun_fasilitasi', Number(year))
    if (pengusulId) query = query.eq('id_pengusul', Number(pengusulId))

    const { data, error, count } = await query.order('created_at', { ascending: true })

    if (error) {
      console.error('Kesalahan Database saat Ekspor:', error)
      throw new Error(`Database error: ${error.message}`)
    }
    
    const hkiData = data as HKIExportData[];

    if (!hkiData || hkiData.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang cocok dengan filter yang Anda pilih.' }, { status: 404 })
    }
    if (count && count > 5000) {
      return NextResponse.json({ error: `Data terlalu besar (${count} baris) untuk diekspor. Silakan persempit filter Anda.` }, { status: 413 })
    }

    const columns = [
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
    ]

    // --- PERBAIKAN 2: Memberi tipe pada 'row' untuk type safety ---
    const normalizedData = hkiData.map((row: HKIExportData) => ({
      nama_hki: row.nama_hki,
      jenis_produk: row.jenis_produk,
      nama_pemohon: row.pemohon?.nama_pemohon,
      alamat_pemohon: row.pemohon?.alamat,
      nama_jenis_hki: row.jenis?.nama_jenis_hki,
      kelas_info: row.kelas ? `Kelas ${row.kelas.id_kelas}: ${row.kelas.nama_kelas}` : '-',
      nama_opd: row.pengusul?.nama_opd,
      tahun_fasilitasi: row.tahun_fasilitasi,
      nama_status: row.status_hki?.nama_status,
      keterangan: row.keterangan,
    }))

    const filename = `hki-export_${new Date().toISOString().split('T')[0]}`

    if (format === 'csv') {
      const headers = columns.map((c) => c.label).join(',')
      const csvRows = normalizedData.map((rowData) =>
        columns.map((col) => escapeCsvValue((rowData as any)[col.key])).join(',')
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
            const cellLength = cell.value ? String(cell.value).length : 10
            const finalLength = Math.min(cellLength, 100); // Batasi panjang maks
            if (finalLength > maxLength) {
              maxLength = finalLength
            }
          })
        }
        column.width = maxLength < 12 ? 12 : maxLength + 2
      })

      const buffer = await workbook.xlsx.writeBuffer()
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      })
    }
    
    // Fallback jika format tidak valid, meskipun sudah divalidasi di atas
    return NextResponse.json({ error: 'Format tidak didukung' }, { status: 400 });

  } catch (err: unknown) { // --- PERBAIKAN 3: Type-safe catch block ---
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga.'
    console.error('Kesalahan pada API Ekspor:', message)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}