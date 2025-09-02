// app/dashboard/page.tsx
export const dynamic = "force-dynamic";

import { requireAdmin } from '@/lib/auth'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase-server'
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  TrendingUp
} from 'lucide-react'

export default async function DashboardPage() {
  await requireAdmin()
  
  const supabase = createClient()
  
  // --- OPTIMIZED DATA FETCHING ---
  // Menyiapkan semua query tanpa 'await'
  const totalEntriesQuery = supabase
    .from('hki_entries')
    .select('id', { count: 'exact', head: true })
  
  const acceptedEntriesQuery = supabase
    .from('hki_entries')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'Diterima')
    
  const pendingEntriesQuery = supabase
    .from('hki_entries')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'Dalam Proses')
    
  const rejectedEntriesQuery = supabase
    .from('hki_entries')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'Ditolak')

  const recentEntriesQuery = supabase
    .from('hki_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // Menjalankan semua query secara bersamaan
  const [
    { count: totalEntries },
    { count: acceptedEntries },
    { count: pendingEntries },
    { count: rejectedEntries },
    { data: recentEntries, error: recentEntriesError } // Menambahkan penanganan error
  ] = await Promise.all([
    totalEntriesQuery,
    acceptedEntriesQuery,
    pendingEntriesQuery,
    rejectedEntriesQuery,
    recentEntriesQuery
  ]);

  if (recentEntriesError) {
    // Menangani kemungkinan error saat mengambil data terbaru
    console.error("Error fetching recent entries:", recentEntriesError.message);
    // Anda bisa menampilkan pesan error di UI jika perlu
  }

  // --- END OF OPTIMIZED DATA FETCHING ---

  const stats = [
    {
      title: 'Total HKI Entries',
      value: totalEntries || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Diterima',
      value: acceptedEntries || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Dalam Proses',
      value: pendingEntries || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Ditolak',
      value: rejectedEntries || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ]

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      'Diterima': 'bg-green-50 text-green-700 border-green-200',
      'Didaftar': 'bg-blue-50 text-blue-700 border-blue-200',
      'Ditolak': 'bg-red-50 text-red-700 border-red-200',
      'Dalam Proses': 'bg-yellow-50 text-yellow-700 border-yellow-200'
    }
    return variants[status] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overview of HKI (Intellectual Property Rights) management system
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle>Recent HKI Entries</CardTitle>
            </div>
            <CardDescription>
              Latest HKI entries added to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentEntries && recentEntries.length > 0 ? (
              <div className="space-y-4">
                {recentEntries.map((entry: any) => (
                  <div 
                    key={entry.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {entry.nama_hki}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {entry.nama_pemohon} • {entry.jenis_hki}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(entry.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className={getStatusBadge(entry.status)}
                      >
                        {entry.status}
                      </Badge>
                      <Badge variant="secondary">
                        {entry.fasilitasi_tahun}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No HKI entries found. Start by creating your first entry.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}