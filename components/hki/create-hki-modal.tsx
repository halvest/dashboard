'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
// ❌ import { useRouter } from 'next/navigation' // Dihapus untuk mengatasi error
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HKIEntry, JenisHKI, StatusHKI, Pengusul } from '@/lib/types'

//================================================================//
// BAGIAN 1: DEFINISI KOMPONEN FORM (HKIForm)                     //
//================================================================//

const hkiSchema = z.object({
  nama_hki: z.string().min(3, 'Nama HKI harus memiliki minimal 3 karakter.'),
  nama_pemohon: z.string().min(3, 'Nama pemohon harus memiliki minimal 3 karakter.'),
  alamat: z.string().optional().nullable(),
  jenis_produk: z.string().optional().nullable(),
  tahun_fasilitasi: z.coerce.number({ invalid_type_error: 'Tahun harus berupa angka.' })
    .int()
    .min(2000, 'Tahun tidak valid.')
    .max(new Date().getFullYear() + 1, 'Tahun tidak valid.'),
  keterangan: z.string().optional().nullable(),
  id_jenis: z.string({ required_error: 'Jenis HKI wajib dipilih.' }),
  id_status: z.string({ required_error: 'Status wajib dipilih.' }),
  id_pengusul: z.string({ required_error: 'Pengusul wajib dipilih.' }),
})

type HKIFormData = z.infer<typeof hkiSchema>

interface HKIFormProps {
  id: string
  mode: 'create' | 'edit'
  jenisOptions: JenisHKI[]
  statusOptions: StatusHKI[]
  pengusulOptions: Pengusul[]
  onSubmitting: () => void
  onSuccess?: (newData: HKIEntry) => void
  onError?: (message: string) => void
}

function HKIForm({
  id,
  mode,
  jenisOptions,
  statusOptions,
  pengusulOptions,
  onSubmitting,
  onSuccess,
  onError
}: HKIFormProps) {
  // ❌ const router = useRouter() // Dihapus
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const form = useForm<HKIFormData>({
    resolver: zodResolver(hkiSchema),
    defaultValues: {
      nama_hki: '',
      nama_pemohon: '',
      alamat: '',
      jenis_produk: '',
      tahun_fasilitasi: new Date().getFullYear(),
      keterangan: '',
      id_jenis: undefined,
      id_status: undefined,
      id_pengusul: undefined,
    },
  })
  
  const { isSubmitting } = form.formState;

  const onSubmit = async (data: HKIFormData) => {
    onSubmitting();
    
    const toastId = toast.loading('Menyimpan data...')

    try {
      const formData = new FormData()
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          const apiKey = key === 'id_jenis' ? 'id_jenis_hki' : key;
          formData.append(apiKey, String(value))
        }
      })
      
      if (selectedFile) {
        formData.append('file', selectedFile)
      }

      const url = mode === 'create' ? '/api/hki' : `/api/hki/some-id`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, { method, body: formData })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Gagal menyimpan data')
      }

      toast.success(`Entri HKI berhasil dibuat!`, { id: toastId })

      // ✅ Logika disederhanakan, hanya memanggil onSuccess
      if (onSuccess) {
        onSuccess(result.data)
      }
      // ❌ Blok 'else' yang menggunakan router dihapus
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error(errorMessage, { id: toastId })
      
      if (onError) onError(errorMessage)
    }
  }

  return (
    <Form {...form}>
      <form
        id={id}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-h-[75vh] overflow-y-auto p-1"
      >
        <fieldset disabled={isSubmitting} className="space-y-6">
          <Card className="rounded-xl border shadow-none">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Informasi Utama HKI</CardTitle>
              <CardDescription>Detail dasar mengenai Hak Kekayaan Intelektual.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <FormField name="nama_hki" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama HKI *</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Merek Kopi 'Sleman Jaya'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="jenis_produk" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Produk</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Makanan Olahan, Minuman" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-none">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Detail Pemohon</CardTitle>
              <CardDescription>Informasi mengenai pemilik atau pemohon HKI.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField name="nama_pemohon" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Pemohon *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lengkap atau nama perusahaan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="alamat" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Pemohon</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Alamat lengkap pemohon..." {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>
          
          <Card className="rounded-xl border shadow-none">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Informasi Administrasi</CardTitle>
              <CardDescription>Data administratif terkait pendaftaran dan status HKI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField name="id_jenis" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis HKI *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis HKI" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jenisOptions.map(opt => (
                          <SelectItem key={opt.id_jenis} value={String(opt.id_jenis)}>
                            {opt.nama_jenis}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="id_status" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status HKI *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status HKI" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map(opt => (
                          <SelectItem key={opt.id_status} value={String(opt.id_status)}>
                            {opt.nama_status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="tahun_fasilitasi" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun Fasilitasi *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={`${new Date().getFullYear()}`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField name="id_pengusul" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Pengusul (OPD) *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih OPD pengusul" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pengusulOptions.map(opt => (
                        <SelectItem key={opt.id_pengusul} value={String(opt.id_pengusul)}>
                          {opt.nama_pengusul}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="keterangan" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Keterangan</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Informasi tambahan..." {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormItem>
                <FormLabel>Sertifikat PDF (Opsional)</FormLabel>
                <FormControl>
                    <Input 
                      type="file"
                      accept=".pdf"
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                      onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                              setSelectedFile(e.target.files[0]);
                          } else {
                              setSelectedFile(null);
                          }
                      }}
                    />
                </FormControl>
              </FormItem>
            </CardContent>
          </Card>
        </fieldset>
      </form>
    </Form>
  )
}

//================================================================//
// BAGIAN 2: KOMPONEN UTAMA MODAL                                 //
//================================================================//

interface CreateHKIModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  onError?: (message: string) => void
  formOptions: {
    jenisOptions: JenisHKI[]
    statusOptions: StatusHKI[]
    pengusulOptions: Pengusul[]
  }
}

export function CreateHKIModal({
  isOpen,
  onClose,
  onSuccess: onParentSuccess,
  onError: onParentError,
  formOptions,
}: CreateHKIModalProps) {
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSuccess = (newData: HKIEntry) => {
    setIsSubmitting(false)
    onParentSuccess?.()
    onClose()
  }

  const handleError = (message: string) => {
    setIsSubmitting(false)
    onParentError?.(message)
  }
  
  const handleFormSubmitting = () => {
    setIsSubmitting(true);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Buat Entri HKI Baru</DialogTitle>
          <DialogDescription>
            Isi semua informasi yang diperlukan untuk membuat catatan HKI baru.
          </DialogDescription>
        </DialogHeader>

        <HKIForm
          id="hki-create-form" 
          mode="create"
          jenisOptions={formOptions.jenisOptions}
          statusOptions={formOptions.statusOptions}
          pengusulOptions={formOptions.pengusulOptions}
          onSubmitting={handleFormSubmitting}
          onSuccess={handleSuccess} 
          onError={handleError}
        />

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            type="submit"
            form="hki-create-form" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

