'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileUploader } from '@/components/forms/file-uploader'
import { HKIEntry, JenisHKI, StatusHKI, FasilitasiTahun, Pengusul } from '@/lib/types'
import { toast } from 'sonner'
import { Label } from '../ui/label'

const hkiSchema = z.object({
  nama_hki: z.string().min(1, 'Nama HKI wajib diisi'),
  nama_pemohon: z.string().min(1, 'Nama pemohon wajib diisi'),
  alamat: z.string().optional().nullable(),
  jenis_produk: z.string().optional().nullable(),
  nomor_permohonan: z.string().optional().nullable(),
  tanggal_permohonan: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
  jenis_hki_id: z.string({ required_error: 'Jenis HKI wajib dipilih' }),
  status_hki_id: z.string({ required_error: 'Status wajib dipilih' }),
  fasilitasi_tahun_id: z.string({ required_error: 'Tahun fasilitasi wajib dipilih' }),
  pengusul_id: z.string().optional().nullable(),
})

type HKIFormData = z.infer<typeof hkiSchema>

interface HKIFormProps {
  initialData?: HKIEntry
  mode: 'create' | 'edit'
  jenisOptions: JenisHKI[]
  statusOptions: StatusHKI[]
  tahunOptions: FasilitasiTahun[]
  pengusulOptions: Pengusul[]
}

export function HKIForm({ initialData, mode, jenisOptions, statusOptions, tahunOptions, pengusulOptions }: HKIFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const form = useForm<HKIFormData>({
    resolver: zodResolver(hkiSchema),
    defaultValues: {
      nama_hki: initialData?.nama_hki || '',
      nama_pemohon: initialData?.pemohon?.nama || '',
      alamat: initialData?.pemohon?.alamat || '',
      jenis_produk: initialData?.jenis_produk || '',
      nomor_permohonan: initialData?.nomor_permohonan || '',
      tanggal_permohonan: initialData?.tanggal_permohonan?.split('T')[0] || '',
      keterangan: initialData?.keterangan || '',
      jenis_hki_id: initialData?.jenis_hki?.id?.toString(),
      status_hki_id: initialData?.status_hki?.id?.toString(),
      fasilitasi_tahun_id: initialData?.fasilitasi_tahun?.id?.toString(),
      pengusul_id: initialData?.pengusul?.id?.toString(),
    },
  })

  const onSubmit = async (data: HKIFormData) => {
    setIsLoading(true)
    const toastId = toast.loading(`Sedang menyimpan data...`)

    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value.toString())
      })

      if (selectedFile) formData.append('file', selectedFile)

      const url = mode === 'create' ? '/api/hki' : `/api/hki/${initialData?.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, { method, body: formData })
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan data')

      toast.success(`Entri HKI berhasil ${mode === 'create' ? 'dibuat' : 'diperbarui'}!`, { id: toastId })
      router.push('/hki')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Buat Entri HKI Baru' : `Edit Entri`}</CardTitle>
        <CardDescription>Isi detail entri HKI pada formulir di bawah ini.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama HKI */}
              <FormField name="nama_hki" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nama HKI *</FormLabel>
                  <FormControl><Input {...field} placeholder="Contoh: Sistem Inventaris Cerdas" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Nama Pemohon */}
              <FormField name="nama_pemohon" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Pemohon *</FormLabel>
                  <FormControl><Input {...field} placeholder="Contoh: PT. Inovasi Bangsa" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Alamat */}
              <FormField name="alamat" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Pemohon</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Jenis HKI */}
              <FormField name="jenis_hki_id" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis HKI *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih Jenis HKI" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {jenisOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id.toString()}>{opt.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Status */}
              <FormField name="status_hki_id" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id.toString()}>{opt.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Jenis Produk */}
              <FormField name="jenis_produk" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Produk</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} placeholder="Contoh: Perangkat Lunak" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Pengusul */}
              <FormField name="pengusul_id" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Pengusul</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih Pengusul" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {pengusulOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id.toString()}>{opt.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Nomor Permohonan */}
              <FormField name="nomor_permohonan" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Permohonan</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Tanggal Permohonan */}
              <FormField name="tanggal_permohonan" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Permohonan</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} type="date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Tahun Fasilitasi */}
              <FormField name="fasilitasi_tahun_id" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Fasilitasi Tahun *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih Tahun" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {tahunOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id.toString()}>{opt.tahun}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Keterangan */}
            <FormField name="keterangan" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Keterangan</FormLabel>
                <FormControl><Textarea {...field} value={field.value || ''} placeholder="Catatan tambahan..." rows={4} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Upload File */}
            <div>
              <Label>File Sertifikat (PDF, maks. 10MB)</Label>
              <FileUploader onFileSelect={setSelectedFile} accept=".pdf" maxSize={10 * 1024 * 1024} />
              {initialData?.sertifikat_path && !selectedFile && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ Berkas sudah ada. Unggah file baru untuk menggantinya.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Batal</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : (mode === 'create' ? 'Buat Entri' : 'Simpan Perubahan')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}