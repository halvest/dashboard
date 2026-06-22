'use client'

// components/laporan/LaporanCharts.tsx
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
  Cell,
  Pie,
  PieChart,
  Tooltip,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { TrendingUp, BookCheck, Copyright } from 'lucide-react'
import type { HKIReportSummary } from '@/lib/reports/hki-report-types'

const STATUS_PALETTE = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

const BAR_PALETTE = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

interface LaporanChartsProps {
  summary: HKIReportSummary
}

// Custom label untuk pie chart — tampilkan nama + angka di dalam / dekat slice
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  total,
}: {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  total: number
  [key: string]: unknown
}) => {
  if (total === 0) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={13}
      fontWeight="bold"
    >
      {total.toLocaleString('id-ID')}
    </text>
  )
}

export function LaporanCharts({ summary }: LaporanChartsProps) {
  const yearChartConfig: ChartConfig = {
    total: { label: 'Jumlah Pengajuan' },
  }

  const statusData = summary.by_status
    .filter((s) => s.total > 0)
    .map((s, i) => ({
      ...s,
      fill: STATUS_PALETTE[i % STATUS_PALETTE.length],
    }))

  const jenisData = summary.by_jenis_hki.slice(0, 8)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Bar Chart: Pengajuan per Tahun */}
      <Card className="lg:col-span-3 shadow-sm dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Pengajuan per Tahun
          </CardTitle>
          <CardDescription>
            Jumlah total pengajuan HKI yang difasilitasi setiap tahunnya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.by_year.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
              Tidak ada data untuk ditampilkan.
            </div>
          ) : (
            <ChartContainer config={yearChartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...summary.by_year].sort((a, b) => a.tahun - b.tahun)}
                  margin={{ top: 30, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="tahun" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} width={30} allowDecimals={false} className="text-xs" />
                  <ChartTooltip
                    cursor={{ fill: 'hsl(var(--accent))', radius: 4 }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) => `Tahun ${payload[0]?.payload?.tahun}`}
                        indicator="dot"
                      />
                    }
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    <LabelList position="top" offset={8} className="fill-foreground text-xs" formatter={(v: number) => (v > 0 ? v : '')} />
                    {summary.by_year.map((_, i) => (
                      <Cell key={i} fill={BAR_PALETTE[i % BAR_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Donut Chart: Per Status — dengan angka di dalam slice */}
      <Card className="lg:col-span-2 shadow-sm dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookCheck className="h-5 w-5 text-emerald-600" />
            Distribusi Status
          </CardTitle>
          <CardDescription>Proporsi pengajuan berdasarkan status saat ini.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {statusData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-muted-foreground text-sm">
              Tidak ada data untuk ditampilkan.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value.toLocaleString('id-ID'),
                      name,
                    ]}
                  />
                  <Pie
                    data={statusData}
                    dataKey="total"
                    nameKey="nama_status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Legend custom dengan nama + angka */}
              <div className="flex flex-col gap-1.5 px-1">
                {statusData.map((s, i) => (
                  <div key={s.id_status} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: STATUS_PALETTE[i % STATUS_PALETTE.length] }}
                      />
                      <span className="truncate text-foreground">{s.nama_status}</span>
                    </div>
                    <span className="font-semibold tabular-nums text-foreground shrink-0">
                      {s.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bar Chart: Per Jenis HKI — full width */}
      <Card className="lg:col-span-5 shadow-sm dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Copyright className="h-5 w-5 text-violet-600" />
            Distribusi Jenis HKI
          </CardTitle>
          <CardDescription>Jumlah pengajuan berdasarkan jenis Hak Kekayaan Intelektual.</CardDescription>
        </CardHeader>
        <CardContent>
          {jenisData.length === 0 ? (
            <div className="flex h-[160px] items-center justify-center text-muted-foreground text-sm">
              Tidak ada data untuk ditampilkan.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={jenisData} layout="vertical" margin={{ top: 0, right: 50, left: 10, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" allowDecimals={false} />
                <YAxis
                  dataKey="nama_jenis_hki"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(v: number) => [v.toLocaleString('id-ID'), 'Jumlah']} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  <LabelList position="right" className="fill-foreground text-xs font-semibold" formatter={(v: number) => (v > 0 ? v.toLocaleString('id-ID') : '')} />
                  {jenisData.map((_, i) => (
                    <Cell key={i} fill={STATUS_PALETTE[i % STATUS_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
