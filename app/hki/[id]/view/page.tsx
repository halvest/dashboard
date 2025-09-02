import { requireAdmin } from '@/lib/auth'
import { AdminLayout } from '@/components/layout/admin-layout'
import { createClient } from '@/lib/supabase-server'
import { HKIEntry } from '@/lib/types'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Edit, 
  Download, 
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Hash,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default async function ViewHKIPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  await requireAdmin()
  
  const supabase = createClient()
  
  const { data: entry, error } = await supabase
    .from('hki_entries')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !entry) {
    notFound()
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'Diterima': 'bg-green-50 text-green-700 border-green-200',
      'Didaftar': 'bg-blue-50 text-blue-700 border-blue-200',
      'Ditolak': 'bg-red-50 text-red-700 border-red-200',
      'Dalam Proses': 'bg-yellow-50 text-yellow-700 border-yellow-200'
    }
    return variants[status as keyof typeof variants] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getJenisBadge = (jenis: string) => {
    const variants = {
      'Merek': 'bg-purple-50 text-purple-700 border-purple-200',
      'Hak Cipta': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'Paten': 'bg-orange-50 text-orange-700 border-orange-200',
      'Paten Sederhana': 'bg-amber-50 text-amber-700 border-amber-200',
      'Indikasi Geografis': 'bg-teal-50 text-teal-700 border-teal-200'
    }
    return variants[jenis as keyof typeof variants] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/hki/${entry.id}/signed-url`)
      const data = await response.json()
      
      if (data.signedUrl) {
        window.open(data.signedUrl, '_blank')
      } else {
        alert('No certificate file available')
      }
    } catch (error) {
      alert('Failed to generate download link')
    }
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/hki">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to HKI List
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{entry.nama_hki}</h1>
          <p className="text-gray-600 mt-2">
            HKI Entry Details
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <Link href={`/hki/${entry.id}/edit`}>
                    <Button size="sm" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nama HKI</Label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {entry.nama_hki}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Jenis HKI</Label>
                    <div className="mt-1">
                      <Badge 
                        variant="outline" 
                        className={getJenisBadge(entry.jenis_hki)}
                      >
                        {entry.jenis_hki}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nama Pemohon</Label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {entry.nama_pemohon}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <div className="mt-1">
                      <Badge 
                        variant="outline" 
                        className={getStatusBadge(entry.status)}
                      >
                        {entry.status}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nomor Permohonan</Label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {entry.nomor_permohonan}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">Fasilitasi Tahun</Label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {entry.fasilitasi_tahun}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">Tanggal Permohonan</Label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {new Date(entry.tanggal_permohonan).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {entry.keterangan && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Keterangan</Label>
                    <p className="text-gray-900 mt-2 whitespace-pre-wrap">
                      {entry.keterangan}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Certificate File */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Certificate File</CardTitle>
              </CardHeader>
              <CardContent>
                {entry.sertifikat_path ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Certificate Available
                      </span>
                    </div>
                    <Button 
                      onClick={handleDownloadPDF}
                      className="w-full gap-2"
                    >
                      <Download className="h-4 w-4" />
                      View Certificate
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      No certificate file uploaded
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audit Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Audit Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(entry.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(entry.updated_at).toLocaleString('id-ID')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={className}>{children}</label>
}