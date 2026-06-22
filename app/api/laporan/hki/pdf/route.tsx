import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { renderToStream } from '@react-pdf/renderer'
import { HKIReportPDF } from '@/lib/reports/hki-report-pdf'
import { getHKIReportSummary } from '@/lib/reports/hki-report-service'
import { generateAllInsights } from '@/lib/reports/hki-report-insights'
import type { ReportFilters } from '@/lib/reports/hki-report-types'
import React from 'react'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // 1. Validasi sesi dan role admin
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin yang dapat mengunduh laporan.' },
        { status: 403 }
      )
    }

    // 2. Parse query params
    const searchParams = req.nextUrl.searchParams
    const yearParam = searchParams.get('year')
    const statusParam = searchParams.get('status')

    const year = yearParam ? parseInt(yearParam, 10) : null
    const statusId = statusParam ? parseInt(statusParam, 10) : null

    // 3. Ambil nama status untuk label filter (jika ada)
    let statusName: string | null = null
    if (statusId) {
      const { data: statusData } = await supabase
        .from('status_hki')
        .select('nama_status')
        .eq('id_status', statusId)
        .single()
      statusName = statusData?.nama_status ?? null
    }

    const filters: ReportFilters = { year, statusId, statusName }

    // 4. Ambil data ringkasan dari RPC
    const summary = await getHKIReportSummary(year, statusId)

    // 5. Generate insight
    const insights = generateAllInsights(summary, filters)

    // 6. Format tanggal generate
    const generatedAt = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    // 7. Render PDF menggunakan JSX dan renderToStream (lebih stabil di Next.js App Router)
    const stream = await renderToStream(
      <HKIReportPDF
        summary={summary}
        insights={insights}
        filters={filters}
        generatedAt={generatedAt}
      />
    )

    // Convert NodeJS Readable stream to ArrayBuffer for NextResponse
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    const pdfBuffer = Buffer.concat(chunks)
    
    // 8. Buat nama file dinamis
    const yearLabel = year ? `-${year}` : '-semua-tahun'
    const statusLabel = statusName
      ? `-status-${statusName.toLowerCase().replace(/\s+/g, '-')}`
      : ''
    const fileName = `laporan-hki${yearLabel}${statusLabel}.pdf`

    // 9. Return response PDF — cast ke ArrayBuffer untuk kompatibilitas tipe
    const arrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    ) as ArrayBuffer

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: unknown) {
    console.error('[PDF API Error]:', error)
    const message = error instanceof Error ? error.message : 'Gagal membuat laporan PDF.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
