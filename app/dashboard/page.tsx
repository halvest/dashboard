export const dynamic = "force-dynamic";

import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-server';
import { HKIEntry } from '@/lib/types';
import { ArrowUpRight, CheckCircle, Clock, FileText, Plus, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default async function DashboardPage() {
  await requireAdmin();
  const supabase = createClient();

  // 1. Mengambil ID untuk status 'Diterima'
  const { data: statusDiterima } = await supabase
    .from('status_hki')
    .select('id')
    .eq('nama', 'Diterima')
    .single();

  // 2. Mengambil data statistik menggunakan query yang benar
  const totalEntriesQuery = supabase.from('hki_entries').select('id', { count: 'exact', head: true });
  
  const acceptedEntriesQuery = statusDiterima
    ? supabase.from('hki_entries').select('id', { count: 'exact', head: true }).eq('status_id', statusDiterima.id)
    : Promise.resolve({ count: 0 }); // Fallback jika status tidak ditemukan

  // 3. Mengambil entri terbaru dengan JOIN ke tabel relasional
  const recentEntriesQuery = supabase
    .from('hki_entries')
    .select(`
      id,
      nama_hki,
      created_at,
      pemohon ( id, nama ),
      status_hki ( id, nama )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  const [
    { count: totalEntries },
    { count: acceptedEntries },
    { data: recentEntries, error: recentError }
  ] = await Promise.all([
    totalEntriesQuery,
    acceptedEntriesQuery,
    recentEntriesQuery,
  ]);

  if (recentError) {
    console.error("Gagal mengambil entri terbaru:", recentError.message);
  }
  
  const uniqueApplicants = recentEntries ? [...new Set(recentEntries.map(e => e.pemohon?.nama))].length : 0;

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-2xl">Dasbor Utama</h1>
          <Link href="/hki/create">
            <Button className="gap-1"><Plus className="h-4 w-4" /> Entri Baru</Button>
          </Link>
        </div>

        {/* Kartu KPI */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total HKI</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEntries ?? 0}</div>
              <p className="text-xs text-muted-foreground">Total entri terdaftar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">HKI Diterima</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{acceptedEntries ?? 0}</div>
              <p className="text-xs text-muted-foreground">Jumlah entri yang disetujui</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pemohon Aktif</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{uniqueApplicants}</div>
              <p className="text-xs text-muted-foreground">Pemohon unik dalam 5 entri terakhir</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dalam Proses</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(totalEntries ?? 0) - (acceptedEntries ?? 0)}</div>
              <p className="text-xs text-muted-foreground">Menunggu persetujuan</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Aktivitas Terbaru */}
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Aktivitas Terbaru</CardTitle>
              <CardDescription>Entri HKI yang baru saja ditambahkan.</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/hki">Lihat Semua<ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentEntries && recentEntries.length > 0 ? (
              <div className="divide-y">
                {(recentEntries as HKIEntry[]).map((entry) => (
                  <div key={entry.id} className="grid grid-cols-[40px_1fr_auto] items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{entry.pemohon?.nama?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                      <p className="text-sm font-medium leading-none">{entry.nama_hki}</p>
                      <p className="text-sm text-muted-foreground">{entry.pemohon?.nama || 'Pemohon tidak diketahui'}</p>
                    </div>
                    <Badge variant="outline">{entry.status_hki?.nama || 'Status tidak diketahui'}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center text-muted-foreground py-8">Belum ada aktivitas.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}