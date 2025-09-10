// app/components/forms/hki-form.tsx
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Combobox } from '@/components/ui/combobox'
import { HKIEntry, JenisHKI, StatusHKI } from '@/lib/types'

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ["application/pdf"];
const hkiSchema = z.object({
  nama_hki: z.string().min(3, 'Nama HKI harus memiliki minimal 3 karakter.'),
  nama_pemohon: z.string().min(3, 'Nama pemohon harus memiliki minimal 3 karakter.'),
  alamat: z.preprocess((val) => val === '' ? null : val, z.string().optional().nullable()),
  jenis_produk: z.preprocess((val) => val === '' ? null : val, z.string().optional().nullable()),
  tahun_fasilitasi: z.coerce.number({ invalid_type_error: 'Tahun harus berupa angka.' })
    .int()
    .min(new Date().getFullYear() - 25, `Tahun tidak valid.`) 
    .max(new Date().getFullYear() + 1, `Tahun tidak boleh melebihi ${new Date().getFullYear() + 1}.`),
  keterangan: z.preprocess((val) => val === '' ? null : val, z.string().optional().nullable()),
  id_jenis: z.string({ required_error: 'Jenis HKI wajib dipilih.' }).min(1, 'Jenis HKI wajib dipilih.'),
  id_status: z.string({ required_error: 'Status wajib dipilih.' }).min(1, 'Status wajib dipilih.'),
  id_pengusul: z.string({ required_error: 'Pengusul wajib dipilih.' }).min(1, 'Pengusul wajib dipilih.'),
  id_kelas: z.preprocess((val) => val === '' ? null : val, z.string().optional().nullable()),
  
  sertifikat_pdf: z.any()
    .optional()
    .refine((files: FileList | undefined) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE_BYTES, 
      `Ukuran file maksimal adalah ${MAX_FILE_SIZE_MB}MB.`
    )
    .refine((files: FileList | undefined) => !files || files.length === 0 || ACCEPTED_FILE_TYPES.includes(files[0].type),
      'Hanya file format .pdf yang diterima.'
    ),
})

type HKIFormData = z.infer<typeof hkiSchema>
type ComboboxOption = { value: string; label: string };

interface HKIFormProps {
  id: string 
  initialData?: HKIEntry
  mode: 'create' | 'edit'
  jenisOptions: JenisHKI[]
  statusOptions: StatusHKI[]
  pengusulOptions: ComboboxOption[]
  kelasOptions: ComboboxOption[]
  onSubmittingChange: (isSubmitting: boolean) => void 
  onSuccess?: (newData: HKIEntry) => void
  onError?: (message: string) => void
}

/* ======================== MAIN COMPONENT ======================== */
export function HKIForm({
  id, initialData, mode, jenisOptions, statusOptions, pengusulOptions, kelasOptions,
  onSubmittingChange, onSuccess, onError
}: HKIFormProps) {
  
  const router = useRouter()

  const form = useForm<HKIFormData>({
    resolver: zodResolver(hkiSchema),
    defaultValues: {
      nama_hki: initialData?.nama_hki || '',
      nama_pemohon: initialData?.pemohon?.nama_pemohon || '',
      alamat: initialData?.pemohon?.alamat || '',
      jenis_produk: initialData?.jenis_produk || '',
      tahun_fasilitasi: initialData?.tahun_fasilitasi || new Date().getFullYear(),
      keterangan: initialData?.keterangan || '',
      id_jenis: initialData?.jenis?.id_jenis.toString() || undefined, 
      id_status: initialData?.status_hki?.id_status.toString() || undefined,
      id_pengusul: initialData?.pengusul?.id_pengusul.toString() || undefined,
      id_kelas: initialData?.kelas?.id_kelas.toString() || undefined,
    },
  })

  const { formState: { isSubmitting } } = form;

  React.useEffect(() => {
    onSubmittingChange(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  const onSubmit = async (data: HKIFormData) => {
    const toastId = toast.loading('Menyimpan data...')
    try {
      const formData = new FormData()
      
      const file = data.sertifikat_pdf?.[0];
      if (file instanceof File) {
        formData.append('file', file);
      }
      
      const dataToSend = { ...data };
      delete dataToSend.sertifikat_pdf; 

      Object.entries(dataToSend).forEach(([key, value]) => {
        if (value !== null && value !== undefined) { 
          const apiKey = key === 'id_jenis' ? 'id_jenis_hki' : key; 
          formData.append(apiKey, String(value))
        }
      })

      const url = mode === 'create' ? '/api/hki' : `/api/hki/${initialData?.id_hki}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, { method, body: formData })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan data')

      toast.success(`Entri HKI berhasil ${mode === 'create' ? 'dibuat' : 'diperbarui'}!`, { id: toastId })

      if (onSuccess) {
        onSuccess(result.data) 
      } else {
        router.refresh() 
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui.'
      toast.error(errorMessage, { id: toastId })
      if (onError) onError(errorMessage)
    } 

  }

  return (
    <Form {...form}>
      <form
        id={id} 
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-h-[75vh] overflow-y-auto" 
      >
        <div className="pr-6 space-y-4"> 
          <fieldset disabled={isSubmitting} className="space-y-4">

            <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full">
              
              <AccordionItem value="item-1">
                <AccordionTrigger className="font-semibold text-base">Informasi Utama HKI</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
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
                        <Input placeholder="Contoh: Makanan Olahan, Minuman, Jasa Konsultasi" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormDescription>Jelaskan produk atau jasa yang terkait dengan HKI ini.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="font-semibold text-base">Detail Pemohon</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  <FormField name="nama_pemohon" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Pemohon *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama lengkap perorangan atau nama perusahaan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="alamat" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Pemohon</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Alamat lengkap sesuai KTP atau domisili usaha..." {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger className="font-semibold text-base">Data Administrasi</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField name="id_jenis" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis HKI *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Pilih jenis HKI" /></SelectTrigger></FormControl>
                          <SelectContent>{jenisOptions.map(opt => (<SelectItem key={opt.id_jenis} value={String(opt.id_jenis)}>{opt.nama_jenis}</SelectItem>))}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="id_status" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status HKI *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Pilih status HKI" /></SelectTrigger></FormControl>
                          <SelectContent>{statusOptions.map(opt => (<SelectItem key={opt.id_status} value={String(opt.id_status)}>{opt.nama_status}</SelectItem>))}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="tahun_fasilitasi" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tahun Fasilitasi *</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" placeholder={`${new Date().getFullYear()}`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  
                  <FormField name="id_pengusul" control={form.control} render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Pengusul (OPD) *</FormLabel>
                      <Combobox options={pengusulOptions} value={field.value} onChange={field.onChange} placeholder="Pilih OPD pengusul..." searchPlaceholder="Cari OPD..." disabled={isSubmitting} />
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField name="id_kelas" control={form.control} render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Kelas HKI (Opsional)</FormLabel>
                      <Combobox options={kelasOptions} value={field.value ?? ''} onChange={field.onChange} placeholder="Pilih Kelas HKI (1-45)..." searchPlaceholder="Cari kelas (cth: 1, 35, atau Iklan)..." disabled={isSubmitting} />
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField name="keterangan" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keterangan</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Informasi tambahan, catatan internal, atau detail lain..." {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField
                    control={form.control}
                    name="sertifikat_pdf"
                    render={({ field: { onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel>Sertifikat PDF (Opsional)</FormLabel>
                        <FormControl>
                          <Input 
                            {...fieldProps} 
                            type="file"
                            accept=".pdf"
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:file:bg-primary/20 dark:file:text-primary-foreground"
                            onChange={(e) => {
                              onChange(e.target.files);
                            }}
                          />
                        </FormControl>
                         {initialData?.sertifikat_pdf && !form.getValues("sertifikat_pdf")?.[0] && (
                           <FormDescription>
                             File saat ini: <span className="font-medium text-blue-600">{initialData.sertifikat_pdf.split('/').pop()?.substring(0, 30)}...</span>
                             <br/>Mengunggah file baru akan menggantikan file lama.
                           </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </fieldset>
        </div>
      </form>
    </Form>
  )
}