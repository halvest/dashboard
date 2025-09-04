export const dynamic = "force-dynamic";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-server';
import { HKIEntry } from '@/lib/types'; // Pastikan tipe ini juga sudah sesuai
import { ArrowUpRight, CheckCircle, Clock, FileText, Plus, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default async function DashboardPage() {
  const supabase = createClient();

  // Ambil data statistik secara paralel dengan query yang sudah diperbaiki
  const [
    { count: totalEntries },
    { count: acceptedEntries },
    { count: processingEntries },
    { data: recentEntries, error: recentError }
  ] = await Promise.all([
    supabase.from('hki').select('id_hki', { count: 'exact', head: true }),
    supabase.from('hki').select('id_hki', { count: 'exact', head: true }).eq('id_status', 1), // Mohon cek kembali ID 'Diterima' di DB Anda
    supabase.from('hki').select('id_hki', { count: 'exact', head: true }).in('id_status', [2, 4]), // Mohon cek kembali ID 'Didaftar' & 'Dalam Proses'
    supabase
      .from('hki')
      .select(`
        id_hki, 
        nama_hki, 
        pemohon ( nama_pemohon ), 
        status_hki ( nama_status )
      `)
      .order('created_at', { ascending: false })
      .limit(5)
  ]);
  
  if (recentError) {
    console.error("Gagal mengambil entri terbaru:", recentError.message);
  }

  // Menghitung pemohon unik dari data yang sudah benar
  const uniqueApplicants = recentEntries ? [...new Set(recentEntries.map(e => e.pemohon?.nama_pemohon))].length : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dasbor Utama</h1>
          <p className="text-gray-600 mt-1">Selamat datang kembali, Admin!</p>
        </div>
        <Link href="/hki/create">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Buat Entri Baru</Button>
        </Link>
      </div>

      {/* Kartu Statistik */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <div className="text-2xl font-bold">{acceptedEntries ?? 0}</div>
            <p className="text-xs text-muted-foreground">Jumlah entri disetujui</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dalam Proses</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingEntries ?? 0}</div>
            <p className="text-xs text-muted-foreground">Menunggu persetujuan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pemohon Aktif</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueApplicants}</div>
            <p className="text-xs text-muted-foreground">Pemohon unik (5 entri terakhir)</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Aktivitas Terbaru */}
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>5 entri HKI yang baru saja ditambahkan.</CardDescription>
          </div>
          <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/hki">Lihat Semua<ArrowUpRight className="h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentEntries && recentEntries.length > 0 ? (
            <div className="divide-y">
              {(recentEntries as unknown as HKIEntry[]).map((entry) => (
                <div key={entry.id_hki} className="grid grid-cols-[40px_1fr_auto] items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{entry.pemohon?.nama_pemohon?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none truncate">{entry.nama_hki}</p>
                    <p className="text-sm text-muted-foreground">{entry.pemohon?.nama_pemohon || 'N/A'}</p>
                  </div>
                  <Badge variant="outline">{entry.status_hki?.nama_status || 'N/A'}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-8">
              <p>Belum ada aktivitas terbaru.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}