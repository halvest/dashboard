export const dynamic = "force-dynamic";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-server';
import { HKIEntry } from '@/lib/types';
import { ArrowUpRight, CheckCircle, Clock, FileText, Plus, Users, type LucideIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HkiChart } from '@/components/dashboard/hki-chart';

// Komponen Kartu Statistik yang Telah Ditingkatkan
const StatCard = ({ title, value, description, Icon, iconBgColor }: { title: string, value: string | number, description: string, Icon: LucideIcon, iconBgColor: string }) => (
  <Card>
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex flex-col space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="text-3xl font-bold">{value}</div>
        </div>
        <div className={cn("flex items-center justify-center h-12 w-12 rounded-lg", iconBgColor)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default async function DashboardPage() {
  const supabase = createClient();

  // Ambil semua data secara paralel
  const [
    stats,
    recentEntriesResult,
    chartDataResult
  ] = await Promise.all([
    // Ambil semua hitungan dalam satu query agregat untuk efisiensi
    supabase.rpc('get_hki_stats'),
    // Ambil aktivitas terbaru
    supabase
      .from('hki')
      .select(`id_hki, nama_hki, created_at, pemohon(nama_pemohon), status_hki(nama_status)`)
      .order('created_at', { ascending: false })
      .limit(5),
    // Ambil data untuk grafik
    supabase.rpc('get_hki_yearly_count')
  ]);

  // Ekstrak data statistik dari hasil RPC
  const { total_hki, diterima, dalam_proses } = stats.data?.[0] || { total_hki: 0, diterima: 0, dalam_proses: 0 };
  if(stats.error) console.error("Gagal mengambil statistik HKI:", stats.error.message);

  const recentEntries = recentEntriesResult.data;
  if (recentEntriesResult.error) console.error("Gagal mengambil entri terbaru:", recentEntriesResult.error.message);

  const chartData = (chartDataResult.data as { year: number; count: number }[] || []).sort((a, b) => a.year - b.year);
  if (chartDataResult.error) console.error("Gagal mengambil data grafik:", chartDataResult.error.message);
  
  const uniqueApplicants = recentEntries ? new Set(recentEntries.map(e => e.pemohon?.nama_pemohon).filter(Boolean)).size : 0;
  
  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dasbor Utama</h1>
          <p className="text-muted-foreground mt-1">Ringkasan data HKI terbaru.</p>
        </div>
        <Link href="/hki/create">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Buat Entri Baru
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Kolom Kiri untuk Statistik & Aktivitas */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
                <StatCard title="Total HKI" value={total_hki} description="Total entri terdaftar" Icon={FileText} iconBgColor="bg-blue-500" />
                <StatCard title="HKI Diterima" value={diterima} description="Jumlah entri disetujui" Icon={CheckCircle} iconBgColor="bg-green-500" />
                <StatCard title="Dalam Proses" value={dalam_proses} description="Menunggu persetujuan" Icon={Clock} iconBgColor="bg-yellow-500" />
                <StatCard title="Pemohon Unik" value={uniqueApplicants} description="Pemohon unik (5 entri baru)" Icon={Users} iconBgColor="bg-indigo-500" />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Grafik Pendaftaran HKI</CardTitle>
                <CardDescription>Jumlah pendaftaran HKI per tahun.</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? <HkiChart data={chartData} /> : <div className="text-center text-sm text-muted-foreground py-10">Data tidak cukup untuk menampilkan grafik.</div>}
              </CardContent>
            </Card>
        </div>

        {/* Kolom Kanan untuk Aktivitas Terbaru */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Aktivitas Terbaru</CardTitle>
                <CardDescription>5 entri HKI terakhir.</CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/hki">Lihat Semua<ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentEntries && recentEntries.length > 0 ? (
                <div className="space-y-4">
                  {(recentEntries as unknown as HKIEntry[]).map((entry) => (
                    <div key={entry.id_hki} className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border">
                        <AvatarFallback>{getInitials(entry.pemohon?.nama_pemohon)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 grid gap-1">
                        <p className="font-medium leading-none truncate">{entry.nama_hki}</p>
                        <p className="text-sm text-muted-foreground">{entry.pemohon?.nama_pemohon || 'N/A'}</p>
                      </div>
                      <Badge variant="outline" className="font-normal">{entry.status_hki?.nama_status || 'N/A'}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-10">
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

