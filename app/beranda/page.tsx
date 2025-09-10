// app/dashboard/page.tsx
export const dynamic = "force-dynamic";

import Link from 'next/link';
import { cookies } from 'next/headers';
// ✅ 1. PERBAIKAN: Menggunakan helper Supabase SSR standar proyek Anda
import { createClient } from '@/utils/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HKIEntry } from '@/lib/types';
// ✅ UPDATE: Impor ikon yang lebih relevan
import { 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  FileText, 
  Plus, 
  XCircle,
  BookCheck, 
  Activity, 
  Database, // Ikon baru untuk tombol Kelola
  type LucideIcon 
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HkiChart } from '@/components/dashboard/hki-chart';

/**
 * Komponen Kartu Statistik Modern
 * (Desain bersih dan modern dari versi sebelumnya)
 */
const StatCard = ({ 
  title, 
  value, 
  description, 
  Icon, 
  className 
}: { 
  title: string, 
  value: string | number, 
  description: string, 
  Icon: LucideIcon, 
  className: string 
}) => (
  <Card className="shadow-sm transition-all hover:shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={cn("flex items-center justify-center h-8 w-8 rounded-full text-white", className)}>
         <Icon className="h-4 w-4" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-4xl font-bold text-foreground">{value}</div>
      <p className="text-xs text-muted-foreground pt-1">{description}</p>
    </CardContent>
  </Card>
);

/**
 * Helper untuk inisial nama
 */
const getInitials = (name?: string | null) => {
  if (!name) return '?';
  const names = name.split(' ');
  const initials = names.map(n => n[0]).join('');
  return initials.substring(0, 2).toUpperCase();
};

/**
 * Helper untuk mengambil semua statistik HKI secara paralel
 * (Menggunakan query langsung untuk data akurat)
 */
async function getAllStats(supabase: any) {
  const [
    totalRes,
    acceptedRes,
    processingRes,
    rejectedRes
  ] = await Promise.all([
    // 1. Total Pengajuan Fasilitasi HKI
    supabase.from('hki').select('*', { count: 'exact', head: true }),
    
    // 2. Fasilitasi HKI Diterima & Terdaftar (Gabungan)
    supabase
      .from('hki')
      .select('status_hki!inner(nama_status)', { count: 'exact', head: true })
      .in('status_hki.nama_status', ['Diterima', 'Didaftar']),
      
    // 3. Fasilitasi HKI Diproses
    supabase
      .from('hki')
      .select('status_hki!inner(nama_status)', { count: 'exact', head: true })
      .eq('status_hki.nama_status', 'Dalam Proses'),
      
    // 4. Fasilitasi HKI Ditolak
    supabase
      .from('hki')
      .select('status_hki!inner(nama_status)', { count: 'exact', head: true })
      .eq('status_hki.nama_status', 'Ditolak')
  ]);

  // Ekstrak count dengan aman, default ke 0 jika error
  return {
    total_hki: totalRes.count ?? 0,
    diterima_terdaftar: acceptedRes.count ?? 0,
    diproses: processingRes.count ?? 0,
    ditolak: rejectedRes.count ?? 0,
  };
}


export default async function DashboardPage() {
  // 1. Inisialisasi Supabase Client menggunakan helper terpusat
  const cookieStore = cookies();
  const supabase = createClient(cookieStore); // ✅ PERBAIKAN: Menggunakan createClient standar

  // 2. Mengambil SEMUA data secara paralel
  const [
    statsData, 
    recentEntriesResult, 
    chartDataResult
  ] = await Promise.all([
    // Panggil fungsi helper statistik baru
    getAllStats(supabase), 
    
    // Query untuk aktivitas terbaru (5 entri terakhir)
    supabase
      .from('hki')
      .select(`id_hki, nama_hki, created_at, pemohon(nama_pemohon), status_hki(nama_status)`)
      .order('created_at', { ascending: false })
      .limit(5),
      
    // RPC untuk data chart (tetap dipertahankan)
    supabase.rpc('get_hki_yearly_count')
  ]);
  
  // Cek error jika ada (opsional tapi praktik yang baik)
   if (recentEntriesResult.error || chartDataResult.error) {
     console.error("Gagal mengambil data dasbor:", { 
       recentEntriesError: recentEntriesResult.error?.message, 
       chartDataError: chartDataResult.error?.message 
     });
   }

  // 3. Ekstrak data dengan aman
  const recentEntries = (recentEntriesResult.data || []) as HKIEntry[];
  const chartData = (chartDataResult.data as { year: number; count: number }[] || []).sort((a, b) => a.year - b.year);
  
  return (
    <div className="flex flex-col gap-8">
      {/* HEADER HALAMAN */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dasbor Utama</h1>
          <p className="text-muted-foreground mt-1">Ringkasan data fasilitasi HKI Bappeda Sleman.</p>
        </div>
        
        {/* ✅ 2. PERBAIKAN UX: Tombol sekarang mengarah ke halaman /hki (tempat modal create berada) */}
        <Link href="/hki" legacyBehavior passHref>
          <Button asChild className="gap-2 w-full sm:w-auto shadow-sm h-10" variant="primary">
            <a className='no-underline'>
              <Database className="h-4 w-4" /> 
              <span className="font-semibold text-base md:text-sm">Kelola Data HKI</span>
            </a>
          </Button>
        </Link>
      </div>

      {/* GRID KONTEN UTAMA */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        
        {/* Kolom Kiri (Statistik & Grafik) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* GRID STATISTIK 4 KARTU */}
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
                  className="bg-yellow-500 text-yellow-950" // Warna ikon diubah agar kontras
                />
                <StatCard 
                  title="HKI Ditolak" 
                  value={statsData.ditolak} 
                  description="Total pengajuan ditolak" 
                  Icon={XCircle} 
                  className="bg-red-600" 
                />
            </div>
            
            {/* KARTU GRAFIK (BAR CHART) */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Grafik Pendaftaran HKI</CardTitle>
                <CardDescription>Jumlah pendaftaran HKI baru per tahun.</CardDescription>
              </CardHeader>
              <CardContent className="pl-0">
                {/* Chart akan ditampilkan jika chartData.length > 0 */}
                {chartData.length > 0 ? (
                  <HkiChart data={chartData} /> 
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-16">
                    Data tidak cukup untuk menampilkan grafik.
                  </div>
                )}
              </CardContent>
            </Card>
        </div>

        {/* Kolom Kanan (Aktivitas Terbaru) */}
        <div className="lg:col-span-1">
          <Card className="h-full shadow-sm">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  Aktivitas Terbaru
                </CardTitle>
                <CardDescription>5 entri HKI terakhir yang dibuat.</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="ml-auto gap-1.5 shrink-0">
                <Link href="/hki">Lihat Semua<ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentEntries.length > 0 ? (
                <div className="space-y-5">
                  {recentEntries.map((entry) => (
                    <div key={entry.id_hki} className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border">
                        <AvatarFallback className="font-semibold">{getInitials(entry.pemohon?.nama_pemohon)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 grid gap-0.5">
                        <p className="font-semibold leading-none truncate text-foreground">{entry.nama_hki}</p>
                        <p className="text-sm text-muted-foreground">{entry.pemohon?.nama_pemohon || 'N/A'}</p>
                      </div>
                      <Badge variant="outline" className="font-normal">{entry.status_hki?.nama_status || 'N/A'}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-16">
                  <p>Belum ada aktivitas terbaru.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}