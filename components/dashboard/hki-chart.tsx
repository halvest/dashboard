// components/dashboard/hki-chart.tsx

'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig, // Impor tipe ChartConfig
} from '@/components/ui/chart'

// Definisikan tipe props agar lebih jelas
interface HkiChartProps {
  data: {
    year: number
    count: number
  }[]
}

// Konfigurasi chart untuk shadcn/ui.
// Ini adalah praktik terbaik untuk membuat chart lebih mudah dikelola.
const chartConfig = {
  pendaftaran: {
    label: 'Jumlah Pendaftaran',
    // Menggunakan variabel CSS untuk warna agar konsisten dengan tema (dark/light mode)
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export function HkiChart({ data }: HkiChartProps) {
  return (
    // Gunakan ChartContainer dengan konfigurasi yang sudah kita buat
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      {/* ResponsiveContainer membuat chart beradaptasi dengan ukuran parent */}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 30, right: 10, left: 0, bottom: 0 }}
          aria-label="Grafik pendaftaran HKI per tahun"
        >
          {/* Menambahkan gradient untuk tampilan yang lebih modern */}
          <defs>
            <linearGradient id="fillPendaftaran" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.3}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            className="stroke-gray-200 dark:stroke-gray-800"
          />

          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs text-muted-foreground"
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={30}
            allowDecimals={false} // Memastikan angka di sumbu Y selalu bilangan bulat
            className="text-xs text-muted-foreground"
          />

          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(label) => `Tahun ${label}`}
                indicator="dot"
              />
            }
          />

          <Bar
            dataKey="count"
            // Menggunakan nama dari chartConfig
            name={chartConfig.pendaftaran.label}
            // Menggunakan gradient yang sudah didefinisikan
            fill="url(#fillPendaftaran)"
            radius={[4, 4, 0, 0]} // Memberi sudut melengkung di bagian atas bar
          >
            {/* Menambahkan label angka di atas setiap bar */}
            <LabelList
              position="top"
              offset={8}
              className="fill-foreground text-xs"
              formatter={(value: number) => (value > 0 ? value : '')}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
