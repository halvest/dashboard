// components/laporan/LaporanContent.tsx
import { getHKIReportSummary } from '@/lib/reports/hki-report-service'
import { generateAllInsights } from '@/lib/reports/hki-report-insights'
import type { ReportFilters } from '@/lib/reports/hki-report-types'
import { LaporanInsightCards } from './LaporanInsightCards'
import { LaporanCharts } from './LaporanCharts'
import { LaporanInsightSummary } from './LaporanInsightSummary'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

interface LaporanContentProps {
  year: number | null
  statusId: number | null
  statusName: string | null
}

export async function LaporanContent({ year, statusId, statusName }: LaporanContentProps) {
  let summary
  let chartSummary
  let errorMessage: string | null = null

  try {
    summary = await getHKIReportSummary(year, statusId)
    chartSummary = { ...summary }
    
    // Bypass: Hanya untuk grafik (chartSummary), ambil data tren penuh 
    // agar grafik Pengajuan per Tahun tidak menyempit menjadi 1 titik.
    // Sementara `summary` utama dibiarkan terfilter agar Insight Cards & Teks tetap akurat.
    if (year !== null) {
      const unfilteredTrend = await getHKIReportSummary(null, statusId)
      chartSummary.by_year = unfilteredTrend.by_year
    }
  } catch (err: unknown) {
    errorMessage = err instanceof Error ? err.message : 'Gagal memuat data laporan.'
    summary = {
      total_pengajuan: 0,
      by_year: [],
      by_status: [],
      by_jenis_hki: [],
      by_pengusul: [],
    }
    chartSummary = summary
  }

  const filters: ReportFilters = { year, statusId, statusName }
  const insights = generateAllInsights(summary, filters)

  const yearLabel = year ? `Tahun ${year}` : 'Semua Tahun'
  const statusLabel = statusName ?? 'Semua Status'
  const activeFilterLabel = `${yearLabel} • ${statusLabel}`

  if (errorMessage) {
    return (
      <Card className="border-destructive mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Gagal Memuat Data Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Terjadi kesalahan saat mengambil data dari server.
          </p>
          <pre className="rounded-md bg-muted p-3 text-xs text-destructive overflow-x-auto">
            <code>{errorMessage}</code>
          </pre>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8 mt-8">
      {/* Insight Cards */}
      <LaporanInsightCards summary={summary} />

      <Separator className="dark:border-gray-800" />

      {/* Charts */}
      <LaporanCharts summary={chartSummary} />

      <Separator className="dark:border-gray-800" />

      {/* Insight Summary, Kesimpulan & Rekomendasi */}
      <LaporanInsightSummary insights={insights} activeFilterLabel={activeFilterLabel} />
    </div>
  )
}
