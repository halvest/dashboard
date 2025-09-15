// app/dashboard/page.tsx
export const dynamic = "force-dynamic";

import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from "@/components/ui/skeleton";
import { HKIEntry } from '@/lib/types';
import { cn } from '@/lib/utils';
import { 
  ArrowUpRight, BookCheck, Activity, Database, FileText, Clock, XCircle, AlertTriangle, type LucideIcon 
} from 'lucide-react';
import { Suspense } from 'react';

// ============================================================================
// Komponen UI (Helper)
// ============================================================================
const getInitials = (name?: string | null) => {
  if (!name) return 'A';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getGreeting = (timezone: string): string => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { timeZone: timezone, hour: '2-digit', hour12: false };
    const hour = parseInt(new Intl.DateTimeFormat('en-US', options).format(now), 10);
    if (hour >= 4 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 19) return "Selamat Sore";
    return "Selamat Malam";
};

const StatCard = ({ title, value, description, Icon, className }: { title: string; value: string | number; description: string; Icon: LucideIcon; className: string }) => (
  <Card className="shadow-sm transition-all hover:shadow-md dark:border-gray-800">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={cn("flex items-center justify-center h-8 w-8 rounded-full text-white", className)}>
        <Icon className="h-4 w-4" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-4xl font-bold text-gray-900 dark:text-gray-50">{value}</div>
      <p className="text-xs text-muted-foreground pt-1">{description}</p>
    </CardContent>
  </Card>
);

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-8 h-full">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">Terjadi Kesalahan</h2>
        <p className="text-red-600 dark:text-red-400 mt-2 font-mono bg-red-100 dark:bg-red-900/50 p-4 rounded-md">{message}</p>
    </div>
);

const EmptyStateDisplay = ({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) => (
    <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-16">
        <Icon className="h-12 w-12 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
        <p className="text-sm mt-1">{description}</p>
    </div>
);

// ============================================================================
// Komponen Server Terpisah untuk Data Fetching
// ============================================================================
async function WelcomeHeader() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    const greeting = getGreeting('Asia/Jakarta');
    const userName = user?.user_metadata?.full_name || 'Admin';

    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{greeting}, {userName}!</h1>
          <p className="text-muted-foreground mt-1">Ini ringkasan data fasilitasi HKI untuk Anda.</p>
        </div>
        <Button asChild className="gap-2 w-full sm:w-auto shadow-sm h-10 font-semibold" variant="default">
          <Link href="/dashboard/data-pengajuan-fasilitasi">
            <Database className="h-4 w-4" />
            Kelola Data HKI
          </Link>
        </Button>
      </div>
    );
}

async function StatsCards() {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: statuses, error: statusError } = await supabase.from('status_hki').select('id_status, nama_status');
        if (statusError) throw new Error(`Gagal fetch status: ${statusError.message}`);

        const statusMap = statuses.reduce((acc, status) => ({ ...acc, [status.nama_status]: status.id_status }), {} as Record<string, number>);
        
        const [totalRes, diterimaRes, diprosesRes, ditolakRes] = await Promise.all([
            supabase.from('hki').select('*', { count: 'exact', head: true }),
            supabase.from('hki').select('*', { count: 'exact', head: true }).in('id_status', [statusMap['Diterima'], statusMap['Didaftar']].filter(Boolean)),
            supabase.from('hki').select('*', { count: 'exact', head: true }).eq('id_status', statusMap['Dalam Proses']),
            supabase.from('hki').select('*', { count: 'exact', head: true }).eq('id_status', statusMap['Ditolak']),
        ]);
        
        const statsData = {
            total_hki: totalRes.count ?? 0,
            diterima_terdaftar: diterimaRes.count ?? 0,
            diproses: diprosesRes.count ?? 0,
            ditolak: ditolakRes.count ?? 0,
        };

        return (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Pengajuan" value={statsData.total_hki} description="Total semua entri HKI" Icon={FileText} className="bg-blue-600" />
            <StatCard title="Diterima & Terdaftar" value={statsData.diterima_terdaftar} description="Total HKI yang disetujui" Icon={BookCheck} className="bg-green-600" />
            <StatCard title="HKI Diproses" value={statsData.diproses} description="Menunggu persetujuan/daftar" Icon={Clock} className="bg-yellow-500 text-yellow-950" />
            <StatCard title="HKI Ditolak" value={statsData.ditolak} description="Total pengajuan ditolak" Icon={XCircle} className="bg-red-600" />
          </div>
        );
    } catch (error) {
        return <ErrorDisplay message={error instanceof Error ? error.message : "Gagal memuat statistik."} />;
    }
}

async function RecentActivity() {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: recentEntries, error } = await supabase.from('hki').select(`id_hki, nama_hki, created_at, pemohon(nama_pemohon), status_hki(nama_status)`).order('created_at', { ascending: false }).limit(5);

        if (error) throw new Error(`Gagal memuat aktivitas: ${error.message}`);
        
        return (
          <Card className="shadow-sm dark:border-gray-800">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-1">
                <CardTitle className="flex items-center gap-2 text-xl"><Activity className="h-5 w-5 text-muted-foreground" />Aktivitas Terbaru</CardTitle>
                <CardDescription>5 entri HKI terakhir yang dibuat.</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="ml-auto gap-1.5 shrink-0"><Link href="/dashboard/data-pengajuan-fasilitasi">Lihat Semua<ArrowUpRight className="h-4 w-4" /></Link></Button>
            </CardHeader>
            <CardContent>
              {recentEntries && recentEntries.length > 0 ? (
                <div className="space-y-5">
                  {recentEntries.map((entry) => (
                    <div key={entry.id_hki} className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border dark:border-gray-700"><AvatarFallback className="font-semibold">{getInitials(entry.pemohon?.nama_pemohon)}</AvatarFallback></Avatar>
                      <div className="flex-1 grid gap-0.5 min-w-0">
                        <p className="font-semibold leading-none truncate text-gray-900 dark:text-gray-100">{entry.nama_hki}</p>
                        <p className="text-sm text-muted-foreground truncate">{entry.pemohon?.nama_pemohon || 'N/A'}</p>
                      </div>
                      <Badge variant="outline" className="font-normal shrink-0">{entry.status_hki?.nama_status || 'N/A'}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateDisplay icon={Activity} title="Belum Ada Aktivitas" description="Aktivitas terbaru akan muncul di sini." />
              )}
            </CardContent>
          </Card>
        );
    } catch (error) {
        return <ErrorDisplay message={error instanceof Error ? error.message : "Gagal memuat aktivitas terbaru."} />;
    }
}

// Skeletons
const WelcomeHeaderSkeleton = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
        <div>
            <Skeleton className="h-9 w-64 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-md mt-2" />
        </div>
        <Skeleton className="h-10 w-full sm:w-40 rounded-md" />
    </div>
);
const StatsCardsSkeleton = () => (
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
        <Skeleton className="h-[125px] w-full rounded-xl" />
        <Skeleton className="h-[125px] w-full rounded-xl" />
        <Skeleton className="h-[125px] w-full rounded-xl" />
        <Skeleton className="h-[125px] w-full rounded-xl" />
    </div>
);
const RecentActivitySkeleton = () => <Skeleton className="h-[350px] w-full rounded-xl animate-pulse" />;


// ============================================================================
// Komponen Halaman Utama
// ============================================================================
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