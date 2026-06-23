// app/dashboard/page.tsx
// IMPROVEMENT: Membuat komponen skeleton yang lebih spesifik dan detail.
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  ArrowUpRight,
  BookCheck,
  Activity,
  Database,
  FileText,
  Clock,
  XCircle,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { Suspense, cache } from 'react'

const getInitials = (name?: string | null) => {
  if (!name) return 'A'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

const getGreeting = (timezone: string): string => {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: '2-digit',
    hour12: false,
  }
  const hour = parseInt(
    new Intl.DateTimeFormat('en-US', options).format(now),
    10
  )
  if (hour >= 4 && hour < 11) return 'Selamat Pagi'
  if (hour >= 11 && hour < 15) return 'Selamat Siang'
  if (hour >= 15 && hour < 19) return 'Selamat Sore'
  return 'Selamat Malam'
}

const StatCard = ({
  title,
  value,
  description,
  Icon,
  className,
}: {
  title: string
  value: string | number
  description: string
  Icon: LucideIcon
  className: string
}) => (
  <Card className="group relative overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:border-gray-800">
    <div
      className={cn(
        'absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150',
        className
      )}
    />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
      <CardTitle className="text-sm font-semibold text-muted-foreground">
        {title}
      </CardTitle>
      <div
        className={cn(
          'flex items-center justify-center h-10 w-10 rounded-xl text-white shadow-inner',
          className
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </CardHeader>
    <CardContent className="relative z-10">
      <div className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
        {value}
      </div>
      <p className="text-xs font-medium text-muted-foreground pt-2">{description}</p>
    </CardContent>
  </Card>
)

const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-8 h-full">
    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
    <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">
      Terjadi Kesalahan
    </h2>
    <p className="text-red-600 dark:text-red-400 mt-2 font-mono bg-red-100 dark:bg-red-900/50 p-4 rounded-md">
      {message}
    </p>
  </div>
)

const EmptyStateDisplay = ({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) => (
  <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-16">
    <Icon className="h-12 w-12 mb-4" />
    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
      {title}
    </h3>
    <p className="text-sm mt-1">{description}</p>
  </div>
)

const WelcomeHeader = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const greeting = getGreeting('Asia/Jakarta')
  const userName = user?.user_metadata?.full_name || 'Admin'

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 sm:p-8 rounded-xl border border-blue-100 dark:border-blue-900/50 shadow-sm relative overflow-hidden">
      <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/40 dark:from-black/40 to-transparent pointer-events-none" />
      <div className="relative z-10">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-950 dark:text-blue-50">
          {greeting}, {userName}!
        </h1>
        <p className="text-blue-800/80 dark:text-blue-200/80 mt-1.5 text-sm sm:text-base font-medium max-w-xl">
          Berikut adalah ringkasan operasional dan status terkini dari seluruh pengajuan Hak Kekayaan Intelektual (HKI) hari ini.
        </p>
      </div>
      <Button
        asChild
        className="gap-2 w-full sm:w-auto shadow-sm h-11 font-semibold relative z-10 hover:shadow-md transition-shadow"
        variant="default"
      >
        <Link href="/dashboard/data-pengajuan-fasilitasi">
          <Database className="h-4 w-4" />
          Kelola Arsip HKI
        </Link>
      </Button>
    </div>
  )
})

const StatsCards = cache(async () => {
  try {
    const supabase = await createClient()

    const { data: statsData, error } = await supabase.rpc('get_dashboard_stats')
    if (error) throw new Error(`Gagal mengambil statistik: ${error.message}`)

    return (
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pengajuan"
          value={statsData.total_hki}
          description="Total semua entri HKI"
          Icon={FileText}
          className="bg-blue-600"
        />
        <StatCard
          title="Diterima & Terdaftar"
          value={statsData.diterima_terdaftar}
          description="Total HKI yang disetujui"
          Icon={BookCheck}
          className="bg-green-600"
        />
        <StatCard
          title="HKI Diproses"
          value={statsData.diproses}
          description="Menunggu persetujuan/daftar"
          Icon={Clock}
          className="bg-yellow-500 text-yellow-950"
        />
        <StatCard
          title="HKI Ditolak"
          value={statsData.ditolak}
          description="Total pengajuan ditolak"
          Icon={XCircle}
          className="bg-red-600"
        />
      </div>
    )
  } catch (error) {
    return (
      <ErrorDisplay
        message={
          error instanceof Error ? error.message : 'Gagal memuat statistik.'
        }
      />
    )
  }
})

const RecentActivity = cache(async () => {
  try {
    const supabase = await createClient()
    const { data: recentEntries, error } = await supabase
      .from('hki')
      .select(
        'id_hki, nama_hki, pemohon(nama_pemohon), status_hki(nama_status)'
      )
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) throw new Error(`Gagal memuat aktivitas: ${error.message}`)

    return (
      <Card className="shadow-sm dark:border-gray-800">
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Aktivitas Terbaru
            </CardTitle>
            <CardDescription>5 entri HKI terakhir yang dibuat.</CardDescription>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="ml-auto gap-1.5 shrink-0"
          >
            <Link href="/dashboard/data-pengajuan-fasilitasi">
              Lihat Semua
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentEntries && recentEntries.length > 0 ? (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div key={entry.id_hki} className="group flex items-center gap-4 p-3 -mx-3 rounded-xl transition-all duration-200 hover:bg-muted/50 hover:shadow-sm">
                  <Avatar className="h-11 w-11 border shadow-sm dark:border-gray-700 transition-transform duration-200 group-hover:scale-105">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {getInitials(entry.pemohon?.nama_pemohon)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 grid gap-1 min-w-0">
                    <p className="font-semibold leading-none truncate text-gray-900 dark:text-gray-100">
                      {entry.nama_hki}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground truncate">
                      {entry.pemohon?.nama_pemohon || 'N/A'}
                    </p>
                  </div>
                  <Badge variant="outline" className="font-medium shrink-0 bg-background/50">
                    {entry.status_hki?.nama_status || 'N/A'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyStateDisplay
              icon={Activity}
              title="Belum Ada Aktivitas"
              description="Aktivitas terbaru akan muncul di sini."
            />
          )}
        </CardContent>
      </Card>
    )
  } catch (error) {
    return (
      <ErrorDisplay
        message={
          error instanceof Error
            ? error.message
            : 'Gagal memuat aktivitas terbaru.'
        }
      />
    )
  }
})

// --- SKELETONS ---
const WelcomeHeaderSkeleton = () => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/30 p-6 sm:p-8 rounded-xl border border-border/50">
    <div className="space-y-3 w-full max-w-xl">
      <Skeleton className="h-9 w-64 rounded-lg" />
      <Skeleton className="h-5 w-full rounded-md" />
    </div>
    <Skeleton className="h-11 w-full sm:w-44 rounded-md shrink-0" />
  </div>
)

const StatsCardsSkeleton = () => (
  <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i} className="shadow-sm dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-1/3 mt-1" />
          <Skeleton className="h-3 w-2/3 mt-3" />
        </CardContent>
      </Card>
    ))}
  </div>
)

const RecentActivitySkeleton = () => (
  <Card className="shadow-sm dark:border-gray-800">
    <CardHeader>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-1/2 mt-1" />
    </CardHeader>
    <CardContent className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 -mx-3">
          <Skeleton className="h-11 w-11 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full shrink-0" />
        </div>
      ))}
    </CardContent>
  </Card>
)

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<WelcomeHeaderSkeleton />}>
        <WelcomeHeader />
      </Suspense>
      <div className="flex flex-col gap-6">
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards />
        </Suspense>
        <Suspense fallback={<RecentActivitySkeleton />}>
          <RecentActivity />
        </Suspense>
      </div>
    </div>
  )
}
