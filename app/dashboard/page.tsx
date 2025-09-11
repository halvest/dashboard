// app/dashboard/page.tsx

// Menjadikan halaman ini dinamis, memastikan data selalu yang terbaru setiap kali diakses.
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
// HAPUS: Import untuk HkiChart tidak diperlukan lagi
import { 
  ArrowUpRight, 
  BookCheck, 
  Activity, 
  Database, 
  FileText, 
  Clock, 
  XCircle,
  AlertTriangle,
  // HAPUS: BarChartBig tidak diperlukan lagi
  type LucideIcon 
} from 'lucide-react';
import { Suspense } from 'react';

// ============================================================================
// FUNGSI PENGAMBILAN DATA (DISEDERHANAKAN TANPA DATA GRAFIK)
// ============================================================================
async function getDashboardData() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: statuses, error: statusError } = await supabase.from('status_hki').select('id_status, nama_status');
  if (statusError) {
    console.error("Failed to fetch statuses:", statusError);
    throw new Error(`[KESALAHAN TABEL 'status_hki']: ${statusError.message}.`);
  }

  const statusMap = statuses.reduce((acc, status) => {
    acc[status.nama_status] = status.id_status;
    return acc;
  }, {} as Record<string, number>);

  const diterimaDaftarIds = [statusMap['Diterima'], statusMap['Didaftar']].filter(Boolean);
  const diprosesId = statusMap['Dalam Proses'];
  const ditolakId = statusMap['Ditolak'];

  const [
    userRes,
    totalRes,
    diterimaRes,
    diprosesRes,
    ditolakRes,
    recentEntriesRes,
    // HAPUS: Panggilan RPC untuk chartDataRes dihapus dari Promise.all
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('hki').select('*', { count: 'exact', head: true }),
    diterimaDaftarIds.length > 0 ? supabase.from('hki').select('*', { count: 'exact', head: true }).in('id_status', diterimaDaftarIds) : Promise.resolve({ count: 0, error: null }),
    diprosesId ? supabase.from('hki').select('*', { count: 'exact', head: true }).eq('id_status', diprosesId) : Promise.resolve({ count: 0, error: null }),
    ditolakId ? supabase.from('hki').select('*', { count: 'exact', head: true }).eq('id_status', ditolakId) : Promise.resolve({ count: 0, error: null }),
    supabase.from('hki').select(`id_hki, nama_hki, created_at, pemohon(nama_pemohon), status_hki(nama_status)`).order('created_at', { ascending: false }).limit(5),
  ]);

  const errors = [
      { name: "Otentikasi", error: userRes.error },
      { name: "Total HKI", error: totalRes.error },
      { name: "HKI Diterima", error: diterimaRes.error },
      { name: "HKI Diproses", error: diprosesRes.error },
      { name: "HKI Ditolak", error: ditolakRes.error },
      { name: "Aktivitas Terbaru", error: recentEntriesRes.error },
  ];

  const firstError = errors.find(e => e.error);
  if (firstError) {
    console.error(`Error fetching ${firstError.name}:`, firstError.error);
    throw new Error(`[KESALAHAN PADA '${firstError.name}']: ${firstError.error.message}`);
  }

  const statsData = {
    total_hki: totalRes.count ?? 0,
    diterima_terdaftar: diterimaRes.count ?? 0,
    diproses: diprosesRes.count ?? 0,
    ditolak: ditolakRes.count ?? 0,
  };

  const user = userRes.data.user;
  const recentEntries = (recentEntriesRes.data || []) as HKIEntry[];
  
  // HAPUS: chartData tidak lagi dikembalikan
  return { user, statsData, recentEntries };
}

// ============================================================================
// Kode Komponen UI
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

async function DashboardContent() {
  try {
    // HAPUS: chartData tidak lagi diambil
    const { user, statsData, recentEntries } = await getDashboardData();
    const greeting = getGreeting('Asia/Jakarta');
    const userName = user?.user_metadata?.full_name || 'Admin';

    return (
      <div className="flex flex-col gap-8">
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
        
        {/* ====================================================================== */}
        {/* LAYOUT DISEDERHANAKAN SETELAH GRAFIK DIHAPUS */}
        {/* ====================================================================== */}
        <div className="flex flex-col gap-6">
          {/* Grid hanya untuk Kartu Statistik */}
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Pengajuan" value={statsData.total_hki} description="Total semua entri HKI" Icon={FileText} className="bg-blue-600" />
            <StatCard title="Diterima & Terdaftar" value={statsData.diterima_terdaftar} description="Total HKI yang disetujui" Icon={BookCheck} className="bg-green-600" />
            <StatCard title="HKI Diproses" value={statsData.diproses} description="Menunggu persetujuan/daftar" Icon={Clock} className="bg-yellow-500 text-yellow-950" />
            <StatCard title="HKI Ditolak" value={statsData.ditolak} description="Total pengajuan ditolak" Icon={XCircle} className="bg-red-600" />
          </div>

          {/* Kartu Aktivitas Terbaru sekarang berada di bawah statistik */}
          <Card className="shadow-sm dark:border-gray-800">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  Aktivitas Terbaru
                </CardTitle>
                <CardDescription>5 entri HKI terakhir yang dibuat.</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="ml-auto gap-1.5 shrink-0">
                <Link href="/dashboard/data-pengajuan-fasilitasi">Lihat Semua<ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentEntries.length > 0 ? (
                <div className="space-y-5">
                  {recentEntries.map((entry) => (
                    <div key={entry.id_hki} className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border dark:border-gray-700">
                        <AvatarFallback className="font-semibold">{getInitials(entry.pemohon?.nama_pemohon)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 grid gap-0.5 min-w-0">
                        <p className="font-semibold leading-none truncate text-gray-900 dark:text-gray-100">{entry.nama_hki}</p>
                        <p className="text-sm text-muted-foreground truncate">{entry.pemohon?.nama_pemohon || 'N/A'}</p>
                      </div>
                      <Badge variant="outline" className="font-normal shrink-0">{entry.status_hki?.nama_status || 'N/A'}</Badge>
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
        </div>
      </div>
    );
  } catch (error) {
    return <ErrorDisplay message={error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui."} />;
  }
}

const DashboardSkeleton = () => (
  <div className="flex flex-col gap-8 animate-pulse">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <Skeleton className="h-9 w-64 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md mt-2" />
      </div>
      <Skeleton className="h-10 w-full sm:w-40 rounded-md" />
    </div>
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-[125px] w-full rounded-xl" />
        <Skeleton className="h-[125px] w-full rounded-xl" />
        <Skeleton className="h-[125px] w-full rounded-xl" />
        <Skeleton className="h-[125px] w-full rounded-xl" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  </div>
);

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

