'use client'

import { HKIEntry } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { 
  Edit, 
  Download, 
  ArrowLeft,
  Clock,
  FileText,
  User,
  MapPin,
  Package,
  Building,
  Hash,
  Calendar,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

// Komponen helper untuk menampilkan baris info agar lebih rapi
function InfoField({ icon, label, children }: { icon: React.ElementType, label: string, children: React.ReactNode }) {
  const Icon = icon;
  return (
    <div>
      <Label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        {label}
      </Label>
      <div className="text-lg font-semibold text-gray-900">
        {children}
      </div>
    </div>
  );
}

export function HKIDetailClient({ entry }: { entry: HKIEntry }) {
  
  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      'Diterima': 'bg-green-50 text-green-700 border-green-200',
      'Didaftar': 'bg-blue-50 text-blue-700 border-blue-200',
      'Ditolak': 'bg-red-50 text-red-700 border-red-200',
      'Dalam Proses': 'bg-yellow-50 text-yellow-700 border-yellow-200'
    }
    return variants[status] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getJenisBadge = (jenis: string) => {
    const variants: { [key: string]: string } = {
      'Merek': 'bg-purple-50 text-purple-700 border-purple-200',
      'Hak Cipta': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'Paten': 'bg-orange-50 text-orange-700 border-orange-200',
      'Paten Sederhana': 'bg-amber-50 text-amber-700 border-amber-200',
      'Indikasi Geografis': 'bg-teal-50 text-teal-700 border-teal-200'
    }
    return variants[jenis] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const handleDownloadPDF = async () => {
    const toastId = toast.loading("Membuat tautan unduhan...")
    try {
      const response = await fetch(`/api/hki/${entry.id}/signed-url`);
      const data = await response.json();
      
      if (response.ok && data.signedUrl) {
        window.open(data.signedUrl, '_blank');
        toast.success("Tautan berhasil dibuat!", { id: toastId });
      } else {
        throw new Error(data.error || 'Sertifikat tidak tersedia.');
      }
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/hki" className="inline-block mb-4">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar HKI
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{entry.nama_hki}</h1>
        <p className="text-gray-600 mt-2">Detail entri HKI, termasuk informasi pemohon dan status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Informasi Utama */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informasi Utama
              </CardTitle>
              <Link href={`/hki/${entry.id}/edit`}>
                <Button size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <InfoField icon={User} label="Nama Pemohon">{entry.nama_pemohon}</InfoField>
                <InfoField icon={MapPin} label="Alamat">{entry.alamat || 'Tidak ada data'}</InfoField>
                <InfoField icon={Building} label="Pengusul">{entry.pengusul || 'Tidak ada data'}</InfoField>
                <InfoField icon={Package} label="Jenis Produk">{entry.jenis_produk || 'Tidak ada data'}</InfoField>
                
                <InfoField icon={FileText} label="Jenis HKI">
                  <Badge variant="outline" className={getJenisBadge(entry.jenis_hki)}>{entry.jenis_hki}</Badge>
                </InfoField>
                
                <InfoField icon={Clock} label="Status">
                  <Badge variant="outline" className={getStatusBadge(entry.status)}>{entry.status}</Badge>
                </InfoField>

                <div className="md:col-span-2">
                  <InfoField icon={Info} label="Keterangan">
                    <p className="text-base font-normal text-gray-800 whitespace-pre-wrap mt-1">
                      {entry.keterangan || 'Tidak ada keterangan.'}
                    </p>
                  </InfoField>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Sertifikat</CardTitle></CardHeader>
            <CardContent>
              {entry.sertifikat_path ? (
                <div className="space-y-3">
                  <p className="text-sm text-center text-green-700 p-2 bg-green-50 rounded-md">Sertifikat tersedia untuk diunduh.</p>
                  <Button onClick={handleDownloadPDF} className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Lihat Sertifikat
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-center text-gray-500 py-4">Sertifikat belum diunggah.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Hash className="h-5 w-5" />Detail Permohonan</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Nomor:</span>
                  <span className="font-medium text-gray-900">{entry.nomor_permohonan}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Tanggal:</span>
                  <span className="font-medium text-gray-900">{new Date(entry.tanggal_permohonan).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Tahun Fasilitasi:</span>
                  <Badge variant="secondary">{entry.fasilitasi_tahun}</Badge>
                </div>
            </CardContent>
          </Card>
          
          <Card>
             <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" />Riwayat</CardTitle></CardHeader>
             <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Dibuat:</span>
                  <span className="font-medium text-gray-900">{new Date(entry.created_at).toLocaleString('id-ID')}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-gray-500">Diperbarui:</span>
                  <span className="font-medium text-gray-900">{new Date(entry.updated_at).toLocaleString('id-ID')}</span>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}