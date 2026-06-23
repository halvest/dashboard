'use client'

// components/laporan/LaporanInsightSummary.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Lightbulb, FileCheck2, ListChecks, TrendingUp, BookCheck, Copyright, Building2 } from 'lucide-react'
import type { ReportInsights } from '@/lib/reports/hki-report-types'
import { cn } from '@/lib/utils'

interface LaporanInsightSummaryProps {
  insights: ReportInsights
  activeFilterLabel: string
}

export function LaporanInsightSummary({ insights, activeFilterLabel }: LaporanInsightSummaryProps) {
  const insightItems = [
    { icon: TrendingUp, label: 'Tren Pengajuan', text: insights.trendInsight, color: 'text-blue-600' },
    { icon: BookCheck, label: 'Analisis Status', text: insights.statusInsight, color: 'text-emerald-600' },
    { icon: Copyright, label: 'Analisis Jenis HKI', text: insights.jenisInsight, color: 'text-violet-600' },
    { icon: Building2, label: 'Analisis Pengusul', text: insights.pengusulInsight, color: 'text-rose-600' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Insight Analitis */}
      <Card className="shadow-sm dark:border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Insight Analitis
          </CardTitle>
          <CardDescription>
            Analisis otomatis berdasarkan data{' '}
            <Badge variant="secondary" className="text-xs font-normal">
              {activeFilterLabel}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col divide-y dark:divide-gray-800">
            {insightItems.map(({ icon: Icon, label, text, color }) => (
              <div key={label} className="flex gap-4 p-5 hover:bg-muted/50 transition-colors">
                <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background border shadow-sm", color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground tracking-tight mb-1">
                    {label}
                  </p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Kesimpulan & Rekomendasi */}
      <div className="space-y-6">
        <Card className="shadow-sm dark:border-gray-800 bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50 h-full">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-blue-900 dark:text-blue-100">
              <FileCheck2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-[15px] text-slate-700 dark:text-slate-300 leading-loose text-justify font-medium">
                {insights.conclusion}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
