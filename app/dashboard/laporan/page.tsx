// app/dashboard/laporan/page.tsx
import { Suspense } from 'react'
import { getReportFilterOptions } from '@/lib/reports/hki-report-service'
import { LaporanFilterWrapper } from '@/components/laporan/LaporanFilterWrapper'
import { LaporanContent } from '@/components/laporan/LaporanContent'
import { LaporanFilterSkeleton, LaporanContentSkeleton } from '@/components/laporan/LaporanSkeleton'
import { GeneratePdfButton } from '@/components/laporan/GeneratePdfButton'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ year?: string; status?: string }>
}

export default async function LaporanPage({ searchParams }: PageProps) {
  // Parsing search parameters
  const resolvedSearchParams = await searchParams
  const rawYear = resolvedSearchParams.year
  const rawStatus = resolvedSearchParams.status

  const year = rawYear ? parseInt(rawYear, 10) : null
  const statusId = rawStatus ? parseInt(rawStatus, 10) : null

  // Kita tidak perlu fetch data di sini, karena sudah dipindah ke Server Components (Streaming)
  // Ini memastikan UI awal memuat secara instant!

  // HANYA ambil statusName dari database jika ada statusId agar activeFilterLabel akurat.
  // Ini query sangat cepat, namun jika lambat bisa disatukan ke dalam LaporanContent
  let statusName: string | null = null
  if (statusId) {
    try {
      const options = await getReportFilterOptions()
      statusName = options.statusOptions.find((s) => s.id_status === statusId)?.nama_status ?? null
    } catch {
      // Abaikan error, statusName fallback ke null
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-2 border-b dark:border-gray-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Laporan Data Pengajuan HKI
          </h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl leading-relaxed">
            Analisis statistik dan insight pengajuan Hak Kekayaan Intelektual berdasarkan data arsip yang tersedia.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-2 sm:mt-0">
          <Suspense>
            <GeneratePdfButton />
          </Suspense>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card/50 backdrop-blur-sm p-4 shadow-sm dark:border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-4 w-1 rounded-full bg-blue-600" />
          <p className="text-sm font-semibold text-foreground">
            Filter Laporan
          </p>
        </div>
        {/* Suspense untuk wrapper filter */}
        <Suspense fallback={<LaporanFilterSkeleton />}>
          <LaporanFilterWrapper rawYear={rawYear} rawStatus={rawStatus} />
        </Suspense>
      </div>

      {/* Konten Utama (Cards, Charts, Summary) */}
      <Suspense fallback={<LaporanContentSkeleton />}>
        <LaporanContent year={year} statusId={statusId} statusName={statusName} />
      </Suspense>
    </div>
  )
}