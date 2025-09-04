// components/forms/hki-form.tsx

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
import { FileUploader } from '@/components/forms/file-uploader'
import { HKIEntry, JenisHKI, StatusHKI, Pengusul } from '@/lib/types'
import { toast } from 'sonner'

// Skema Zod yang disesuaikan dengan DB
const hkiSchema = z.object({
  nama_hki: z.string().min(1, 'Nama HKI wajib diisi'),
  nama_pemohon: z.string().min(1, 'Nama pemohon wajib diisi'),
  alamat: z.string().optional().nullable(),
  jenis_produk: z.string().optional().nullable(),
  tahun_fasilitasi: z.coerce.number({ invalid_type_error: 'Tahun harus berupa angka' }).int().min(2000, 'Tahun tidak valid').max(2100, 'Tahun tidak valid'),
  keterangan: z.string().optional().nullable(),
  id_jenis_hki: z.string({ required_error: 'Jenis HKI wajib dipilih' }),
  id_status: z.string({ required_error: 'Status wajib dipilih' }),
  id_pengusul: z.string({ required_error: 'Pengusul wajib dipilih' }),
})

type HKIFormData = z.infer<typeof hkiSchema>

interface HKIFormProps {
  initialData?: HKIEntry
  mode: 'create' | 'edit'
  jenisOptions: JenisHKI[]
  statusOptions: StatusHKI[]
  pengusulOptions: Pengusul[]
  onSuccess?: () => void
}

export function HKIForm({ initialData, mode, jenisOptions, statusOptions, pengusulOptions, onSuccess }: HKIFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const form = useForm<HKIFormData>({
    resolver: zodResolver(hkiSchema),
    defaultValues: {
      nama_hki: initialData?.nama_hki || '',
      nama_pemohon: initialData?.pemohon?.nama_pemohon || '',
      alamat: initialData?.pemohon?.alamat || '',
      jenis_produk: initialData?.jenis_produk || '',
      tahun_fasilitasi: initialData?.tahun_fasilitasi || new Date().getFullYear(),
      keterangan: initialData?.keterangan || '',
      id_jenis_hki: initialData?.id_jenis_hki?.toString(),
      id_status: initialData?.id_status?.toString(),
      id_pengusul: initialData?.id_pengusul?.toString(),
    },
  })

  const onSubmit = async (data: HKIFormData) => {
    setIsLoading(true)
    const toastId = toast.loading(`Sedang menyimpan data...`)

    try {
      const formData = new FormData()
      // Append semua data form ke FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString())
        }
      })

      if (selectedFile) {
        formData.append('file', selectedFile)
      }

      const url = mode === 'create' ? '/api/hki' : `/api/hki/${initialData?.id_hki}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, { method, body: formData })
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan data')

      toast.success(`Entri HKI berhasil ${mode === 'create' ? 'dibuat' : 'diperbarui'}!`, { id: toastId })
      
      if(onSuccess) {
        onSuccess()
      } else {
        router.push('/hki')
        router.refresh()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField name="nama_hki" control={form.control} render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Nama HKI *</FormLabel>
              <FormControl><Input placeholder="Contoh: Kopi Robusta Merapi" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField name="nama_pemohon" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Pemohon *</FormLabel>
              <FormControl><Input placeholder="Nama lengkap pemohon..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField name="alamat" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Alamat Pemohon</FormLabel>
              <FormControl><Textarea placeholder="Alamat lengkap pemohon..." {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField name="jenis_produk" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Produk</FormLabel>
              <FormControl><Input placeholder="Contoh: Makanan, Minuman, Kerajinan" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField name="tahun_fasilitasi" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Tahun Fasilitasi *</FormLabel>
              <FormControl><Input type="number" placeholder="Contoh: 2024" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField name="id_jenis_hki" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis HKI *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Pilih jenis HKI" /></SelectTrigger></FormControl>
                <SelectContent>
                  {jenisOptions.map(opt => <SelectItem key={opt.id_jenis_hki} value={String(opt.id_jenis_hki)}>{opt.nama_jenis_hki}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField name="id_status" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Status HKI *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Pilih status HKI" /></SelectTrigger></FormControl>
                <SelectContent>
                  {statusOptions.map(opt => <SelectItem key={opt.id_status} value={String(opt.id_status)}>{opt.nama_status}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
            
          <FormField name="id_pengusul" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Pengusul (OPD) *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Pilih OPD pengusul" /></SelectTrigger></FormControl>
                <SelectContent>
                  {pengusulOptions.map(opt => <SelectItem key={opt.id_pengusul} value={String(opt.id_pengusul)}>{opt.nama_opd}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormItem className="md:col-span-2">
            <FormLabel>Sertifikat PDF</FormLabel>
            <FormControl>
              <FileUploader 
                onFileSelect={setSelectedFile} 
                initialFileUrl={initialData?.sertifikat_pdf} 
              />
            </FormControl>
          </FormItem>

          <FormField name="keterangan" control={form.control} render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Keterangan</FormLabel>
              <FormControl><Textarea placeholder="Informasi tambahan..." {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onSuccess ? onSuccess() : router.back()} disabled={isLoading}>Batal</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Menyimpan...' : (mode === 'create' ? 'Buat Entri' : 'Simpan Perubahan')}
          </Button>
        </div>
      </form>
    </Form>
  )
}