'use client'

// components/laporan/LaporanInsightCards.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  BookCheck,
  CalendarDays,
  Copyright,
} from 'lucide-react'
import type { HKIReportSummary } from '@/lib/reports/hki-report-types'
import { getTopItem } from '@/lib/reports/hki-report-insights'
import { cn } from '@/lib/utils'

interface InsightCardProps {
  title: string
  value: string
  sub?: string
  icon: React.ElementType
  bgClass: string
  textClass: string
}

function InsightCard({ title, value, sub, icon: Icon, bgClass, textClass }: InsightCardProps) {
  return (
    <Card className="shadow-sm border dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden relative group">
      {/* Decorative gradient blur in background */}
      <div className={cn("absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity", bgClass)} />
      
      <CardContent className="p-5 flex items-start gap-4 relative z-10">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
            bgClass,
            textClass
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground truncate">{value}</p>
          {sub && (
            <p className="mt-1 text-[11px] text-muted-foreground truncate font-medium">
              {sub}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface LaporanInsightCardsProps {
  summary: HKIReportSummary
}

export function LaporanInsightCards({ summary }: LaporanInsightCardsProps) {
  const topStatus = getTopItem(summary.by_status)
  const topYear = getTopItem(summary.by_year)
  const topJenis = getTopItem(summary.by_jenis_hki)

  const formatIDN = (n: number) => n.toLocaleString('id-ID')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <InsightCard
        title="Total Pengajuan"
        value={formatIDN(summary.total_pengajuan)}
        sub="Entri data HKI"
        icon={FileText}
        bgClass="bg-blue-100 dark:bg-blue-900/30"
        textClass="text-blue-700 dark:text-blue-400"
      />
      <InsightCard
        title="Status Dominan"
        value={topStatus?.nama_status ?? '-'}
        sub={topStatus ? `${formatIDN(topStatus.total)} pengajuan` : 'Belum ada data'}
        icon={BookCheck}
        bgClass="bg-emerald-100 dark:bg-emerald-900/30"
        textClass="text-emerald-700 dark:text-emerald-400"
      />
      <InsightCard
        title="Tahun Terbanyak"
        value={topYear ? String(topYear.tahun) : '-'}
        sub={topYear ? `${formatIDN(topYear.total)} pengajuan` : 'Belum ada data'}
        icon={CalendarDays}
        bgClass="bg-amber-100 dark:bg-amber-900/30"
        textClass="text-amber-700 dark:text-amber-400"
      />
      <InsightCard
        title="Jenis Terbanyak"
        value={topJenis?.nama_jenis_hki ?? '-'}
        sub={topJenis ? `${formatIDN(topJenis.total)} pengajuan` : 'Belum ada data'}
        icon={Copyright}
        bgClass="bg-violet-100 dark:bg-violet-900/30"
        textClass="text-violet-700 dark:text-violet-400"
      />
    </div>
  )
}
