// app/components/forms/hki-form.tsx
'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
// Penambahan: Impor 'FieldErrors' untuk type-checking pada fungsi onInvalid
import { useForm, useWatch, FieldErrors } from 'react-hook-form' 
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'
import { Combobox } from '@/components/ui/combobox'
import { HKIEntry, JenisHKI, StatusHKI } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { FileText, X } from 'lucide-react'

// --- Konstanta dan Skema Zod (Tidak ada perubahan) ---
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ["application/pdf"];

const hkiSchema = z.object({
  nama_hki: z.string().min(3, 'Nama HKI harus memiliki minimal 3 karakter.'),
  nama_pemohon: z.string().min(3, 'Nama pemohon harus memiliki minimal 3 karakter.'),
  alamat: z.preprocess((val) => val === '' ? null : val, z.string().optional().nullable()),
  jenis_produk: z.preprocess((val) => val === '' ? null : val, z.string().optional().nullable()),
  tahun_fasilitasi: z.coerce.number({ invalid_type_error: 'Tahun wajib dipilih.' })
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
});

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

const ACCORDION_ITEMS = {
  mainInfo: 'item-hki-info',
  applicantInfo: 'item-applicant-info',
  adminInfo: 'item-admin-info',
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

  const selectedFile = useWatch({ control: form.control, name: 'sertifikat_pdf' });
  const { formState: { isSubmitting } } = form;

  React.useEffect(() => {
    onSubmittingChange(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear + 1; i >= currentYear - 25; i--) {
      years.push({ value: i.toString(), label: i.toString() });
    }
    return years;
  }, []);
  
  // ✨ PENAMBAHAN: Fungsi untuk menangani validasi yang gagal (invalid submit)
  const onInvalid = (errors: FieldErrors<HKIFormData>) => {
    // Dapatkan nama field pertama yang memiliki error
    const firstErrorField = Object.keys(errors)[0] as keyof HKIFormData;
    
    // Cari elemen di dalam DOM yang sesuai dengan nama field tersebut
    const element = document.querySelector(`[name="${firstErrorField}"]`);
    
    if (element) {
      // Perintahkan browser untuk scroll ke elemen tersebut
      element.scrollIntoView({
        behavior: 'smooth', // Animasi scroll yang halus
        block: 'center',     // Posisikan elemen di tengah viewport
      });
      // Beri feedback tambahan kepada pengguna
      toast.error("Harap periksa kembali isian Anda, ada data yang belum valid.");
    }
  };

  const onSubmit = async (data: HKIFormData) => {
    const toastId = toast.loading('Menyimpan data...');
    try {
      const formData = new FormData();
      
      const file = data.sertifikat_pdf?.[0];
      if (file instanceof File) {
        formData.append('file', file);
      }
      
      if (mode === 'edit' && initialData?.sertifikat_pdf && !file) {
        formData.append('sertifikat_pdf', 'null');
      }

      const dataToSend = { ...data };
      delete dataToSend.sertifikat_pdf;

      Object.entries(dataToSend).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          const apiKey = key === 'id_jenis' ? 'id_jenis_hki' : key;
          formData.append(apiKey, String(value));
        }
      });

      const url = mode === 'create' ? '/api/hki' : `/api/hki/${initialData?.id_hki}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, { method, body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan data');

      toast.success(`Entri HKI berhasil ${mode === 'create' ? 'dibuat' : 'diperbarui'}!`, { id: toastId });

      if (onSuccess) {
        onSuccess(result.data);
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui.';
      toast.error(errorMessage, { id: toastId });
      if (onError) onError(errorMessage);
    }
  }

  return (
    <Form {...form}>
      {/* ✨ PERBAIKAN: Tambahkan handler 'onInvalid' di sini */}
      <form
        id={id}
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        // ✨ PERBAIKAN: Sesuaikan max-height untuk UX yang lebih baik di modal
        className="max-h-[70vh] overflow-y-auto" 
      >
        <div className="pr-6 space-y-4">
          <fieldset disabled={isSubmitting} className="space-y-4">
            {/* ... Isi Form (Accordion, Card, FormField, dll) tidak ada perubahan ... */}
            <Accordion type="multiple" defaultValue={Object.values(ACCORDION_ITEMS)} className="w-full">
              
              <AccordionItem value={ACCORDION_ITEMS.mainInfo}>
                <AccordionTrigger className="font-semibold text-base">Informasi Utama HKI</AccordionTrigger>
                <AccordionContent className="pt-2">
                  <Card>
                    <CardContent className="pt-6 space-y-6">
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
                          <FormDescription>Jelaskan produk atau jasa yang terkait.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value={ACCORDION_ITEMS.applicantInfo}>
                <AccordionTrigger className="font-semibold text-base">Detail Pemohon</AccordionTrigger>
                <AccordionContent className="pt-2">
                  <Card>
                    <CardContent className="pt-6 space-y-6">
                      <FormField name="nama_pemohon" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Pemohon *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama lengkap perorangan atau perusahaan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name="alamat" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alamat Pemohon</FormLabel>
                          <FormControl>
                            <Textarea rows={3} placeholder="Alamat lengkap sesuai KTP/domisili..." {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value={ACCORDION_ITEMS.adminInfo}>
                <AccordionTrigger className="font-semibold text-base">Data Administrasi</AccordionTrigger>
                <AccordionContent className="pt-2">
                  <Card>
                    <CardContent className="pt-6 space-y-8">
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
                            <Select onValueChange={field.onChange} defaultValue={String(field.value)} disabled={isSubmitting}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Pilih tahun" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectGroup>
                                    {yearOptions.map(year => (
                                      <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                            </Select>
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
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sertifikat PDF (Opsional)</FormLabel>
                            <FormControl>
                                <Input
                                  type="file"
                                  accept=".pdf"
                                  className="hidden"
                                  id="file-upload"
                                  onChange={(e) => field.onChange(e.target.files)}
                                  disabled={isSubmitting}
                                />
                            </FormControl>
                            <label htmlFor="file-upload" className={`
                              flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer
                              ${isSubmitting ? 'bg-muted/50 cursor-not-allowed' : 'hover:bg-muted/50'}
                            `}>
                              <div className="text-center">
                                <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">
                                  <span className="font-semibold text-primary">Klik untuk memilih file</span> atau seret file ke sini
                                </p>
                                <p className="text-xs text-muted-foreground">PDF (Maks. {MAX_FILE_SIZE_MB}MB)</p>
                              </div>
                            </label>

                            {initialData?.sertifikat_pdf && !selectedFile?.[0] && (
                              <div className="mt-2 p-2 border rounded-md flex items-center justify-between bg-muted/50 text-sm">
                                <span className="truncate text-blue-600 font-medium">
                                  {initialData.sertifikat_pdf.split('/').pop()}
                                </span>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => field.onChange(null)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}

                            {selectedFile?.[0] && (
                              <div className="mt-2 p-2 border rounded-md flex items-center justify-between bg-muted/50 text-sm">
                                <span className="truncate text-green-600 font-medium">{selectedFile[0].name}</span>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => field.onChange(null)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}

                            <FormDescription>
                                {mode === 'edit' && initialData?.sertifikat_pdf && 'Mengunggah file baru akan menggantikan file yang lama.'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </fieldset>
        </div>
      </form>
    </Form>
  )
}