'use client'

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  memo,
  lazy,
  Suspense,
} from 'react'
import { useForm, useWatch, FieldErrors, Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'

// UI Components
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HKIEntry, JenisHKI, StatusHKI } from '@/lib/types'
import { FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const LazyCombobox = lazy(() =>
  import('@/components/ui/combobox').then((module) => ({
    default: module.Combobox,
  }))
)

// --- Skema dan Tipe Data ---
const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ACCEPTED_FILE_TYPES = ['application/pdf']

const fileSchema = z
  .instanceof(FileList)
  .optional()
  .refine(
    (files) =>
      !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE_BYTES,
    `Ukuran file maksimal ${MAX_FILE_SIZE_MB}MB.`
  )
  .refine(
    (files) =>
      !files ||
      files.length === 0 ||
      ACCEPTED_FILE_TYPES.includes(files[0].type),
    'Hanya file format .pdf.'
  )

const hkiSchema = z
  .object({
    // ✅ PERBAIKAN: Validasi .min(3, ...) diubah menjadi .min(1, ...)
    nama_hki: z.string().min(1, 'Nama HKI wajib diisi.'),
    nama_pemohon: z
      .string()
      .min(3, 'Nama pemohon harus memiliki minimal 3 karakter.'),
    alamat: z.string().optional().nullable(),
    jenis_produk: z.string().optional().nullable(),
    tahun_fasilitasi: z.coerce
      .number({ invalid_type_error: 'Tahun wajib dipilih.' })
      .int()
      .min(2020, 'Tahun fasilitasi tidak boleh kurang dari 2020.')
      .max(
        new Date().getFullYear() + 5,
        `Tahun tidak boleh melebihi ${new Date().getFullYear() + 5}.`
      ),
    keterangan: z.string().optional().nullable(),
    id_jenis_hki: z
      .string({ required_error: 'Jenis HKI wajib dipilih.' })
      .min(1, 'Jenis HKI wajib dipilih.'),
    id_status: z
      .string({ required_error: 'Status wajib dipilih.' })
      .min(1, 'Status wajib dipilih.'),
    id_pengusul: z
      .string({ required_error: 'Pengusul wajib dipilih.' })
      .min(1, 'Pengusul wajib dipilih.'),
    id_kelas: z.string().optional().nullable(),
    sertifikat_pdf: fileSchema,
  })
  .transform((data) => ({
    ...data,
    alamat: data.alamat === '' ? null : data.alamat,
    jenis_produk: data.jenis_produk === '' ? null : data.jenis_produk,
    keterangan: data.keterangan === '' ? null : data.keterangan,
    id_kelas: data.id_kelas === '' ? null : data.id_kelas,
  }))

type HKIFormData = z.infer<typeof hkiSchema>
type ComboboxOption = { value: string; label: string; is_active?: boolean }

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

interface FileUploaderProps {
  control: Control<HKIFormData>
  formId: string
  isSubmitting: boolean
  initialPdf: string | null | undefined
  onRemoveExisting: () => void
}

const FileUploader = memo(
  ({
    control,
    formId,
    isSubmitting,
    initialPdf,
    onRemoveExisting,
  }: FileUploaderProps) => {
    const [isDragging, setIsDragging] = useState(false)
    const selectedFile = useWatch({ control, name: 'sertifikat_pdf' })
    const showExistingFile = !!initialPdf && !selectedFile?.[0]

    return (
      <FormField
        control={control}
        name="sertifikat_pdf"
        render={({ field: { onChange, onBlur, name, ref } }) => (
          <FormItem>
            <FormLabel>Sertifikat PDF (Opsional)</FormLabel>
            <FormControl>
              <Input
                type="file"
                accept=".pdf"
                className="hidden"
                id={`${formId}-file-upload`}
                name={name}
                ref={ref}
                onBlur={onBlur}
                onChange={(e) => onChange(e.target.files)}
                disabled={isSubmitting}
              />
            </FormControl>
            <label
              htmlFor={`${formId}-file-upload`}
              className={cn(
                'flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                isDragging && 'border-primary bg-primary/10',
                isSubmitting
                  ? 'bg-muted/50 cursor-not-allowed'
                  : 'hover:bg-muted/50'
              )}
              onDragEnter={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              onDrop={() => setIsDragging(false)}
            >
              <div className="text-center">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">
                    Klik untuk memilih file
                  </span>{' '}
                  atau seret file ke sini
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF (Maks. {MAX_FILE_SIZE_MB}MB)
                </p>
              </div>
            </label>
            {showExistingFile && (
              <div className="mt-2 p-2 border rounded-md flex items-center justify-between bg-muted/50 text-sm">
                <span className="truncate text-blue-600 font-medium">
                  {initialPdf.split('/').pop()}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onRemoveExisting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {selectedFile?.[0] && (
              <div className="mt-2 p-2 border rounded-md flex items-center justify-between bg-muted/50 text-sm">
                <span className="truncate text-green-600 font-medium">
                  {selectedFile[0].name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onChange(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <FormDescription>
              {initialPdf &&
                'Mengunggah file baru akan menggantikan file yang lama.'}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }
)
FileUploader.displayName = 'FileUploader'

// --- Komponen Utama ---
export const HKIForm = memo(
  ({ id, initialData, mode, ...props }: HKIFormProps) => {
    const {
      jenisOptions,
      statusOptions,
      pengusulOptions,
      kelasOptions,
      onSubmittingChange,
      onSuccess,
      onError,
    } = props
    const [isDeletingFile, setIsDeletingFile] = useState(false)

    const form = useForm<HKIFormData>({
      resolver: zodResolver(hkiSchema),
      defaultValues: useMemo(
        () => ({
          nama_hki: initialData?.nama_hki || '',
          nama_pemohon: initialData?.pemohon?.nama_pemohon || '',
          alamat: initialData?.pemohon?.alamat || '',
          jenis_produk: initialData?.jenis_produk || '',
          tahun_fasilitasi:
            initialData?.tahun_fasilitasi || new Date().getFullYear(),
          keterangan: initialData?.keterangan || '',
          id_jenis_hki:
            initialData?.jenis?.id_jenis_hki.toString() || undefined,
          id_status: initialData?.status_hki?.id_status.toString() || undefined,
          id_pengusul:
            initialData?.pengusul?.id_pengusul.toString() || undefined,
          id_kelas: initialData?.kelas?.id_kelas.toString() || undefined,
          sertifikat_pdf: undefined,
        }),
        [initialData]
      ),
      mode: 'onBlur',
    })

    const {
      formState: { isSubmitting },
      control,
    } = form

    useEffect(() => {
      onSubmittingChange(isSubmitting)
    }, [isSubmitting, onSubmittingChange])

    const selectedJenisId = useWatch({ control, name: 'id_jenis_hki' })
    const showKelasField = useMemo(() => {
      const selectedJenis = jenisOptions.find(
        (opt) => String(opt.id_jenis_hki) === selectedJenisId
      )
      return selectedJenis?.nama_jenis_hki?.toLowerCase().includes('merek')
    }, [selectedJenisId, jenisOptions])

    useEffect(() => {
      if (!showKelasField) {
        form.setValue('id_kelas', null, { shouldValidate: true })
      }
    }, [showKelasField, form])

    // Filter opsi aktif
    const filteredJenisOptions = useMemo(() => {
      return jenisOptions.filter((opt) => opt.is_active || String(opt.id_jenis_hki) === String(initialData?.jenis?.id_jenis_hki))
    }, [jenisOptions, initialData])

    const filteredKelasOptions = useMemo(() => {
      return kelasOptions.filter((opt) => opt.is_active || opt.value === String(initialData?.kelas?.id_kelas))
    }, [kelasOptions, initialData])

    const yearOptions = useMemo(() => {
      const currentYear = new Date().getFullYear()
      const endYear = currentYear + 5
      const startYear = 2020
      const length = endYear - startYear + 1
      return Array.from({ length }, (_, i) => ({
        value: (endYear - i).toString(),
        label: (endYear - i).toString(),
      }))
    }, [])

    const onSubmit = useCallback(
      async (data: HKIFormData) => {
        if (showKelasField && !data.id_kelas) {
          form.setError('id_kelas', { type: 'manual', message: 'Kelas HKI wajib dipilih untuk jenis Merek.' })
          const el = document.querySelector('[name="id_kelas"]') as HTMLElement
          el?.focus({ preventScroll: true })
          return
        }

        const actionText = mode === 'create' ? 'membuat' : 'memperbarui'
        const toastId = toast.loading(`Sedang ${actionText} entri HKI...`)

        try {
          const formData = new FormData()
          const file = data.sertifikat_pdf?.[0]
          if (file instanceof File) {
            formData.append('file', file)
          }

          if (mode === 'edit' && isDeletingFile) {
            formData.append('delete_sertifikat', 'true')
          }

          Object.entries(data).forEach(([key, value]) => {
            if (
              key !== 'sertifikat_pdf' &&
              value !== null &&
              value !== undefined
            ) {
              formData.append(key, String(value))
            }
          })

          const url =
            mode === 'create' ? '/api/hki' : `/api/hki/${initialData?.id_hki}`
          const method = mode === 'create' ? 'POST' : 'PATCH'

          const response = await fetch(url, { method, body: formData })
          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || `Gagal ${actionText} data.`)
          }

          toast.dismiss(toastId)
          onSuccess?.(result.data)
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : `Terjadi kesalahan saat ${actionText} data.`

          toast.error(errorMessage, {
            id: toastId,
            description:
              'Silakan periksa kembali isian Anda atau coba beberapa saat lagi.',
          })
          onError?.(errorMessage)
        }
      },
      [mode, initialData, isDeletingFile, onSuccess, onError]
    )

    const onInvalid = useCallback((errors: FieldErrors<HKIFormData>) => {
      const firstErrorKey = Object.keys(errors)[0] as keyof HKIFormData
      if (firstErrorKey) {
        toast.error('Validasi Gagal', {
          description: errors[firstErrorKey]?.message,
        })
        const element = document.querySelector(
          `[name="${firstErrorKey}"]`
        ) as HTMLElement
        element?.focus({ preventScroll: true })
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, [])

    const handleRemoveExistingFile = useCallback(() => {
      setIsDeletingFile(true)
      form.setValue('sertifikat_pdf', undefined, { shouldValidate: true })
    }, [form])

    const ComboboxFallback = <Skeleton className="h-10 w-full" />

    return (
      <Form {...form}>
        <form
          id={id}
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="space-y-6"
        >
          <fieldset disabled={isSubmitting} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Utama HKI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  name="nama_hki"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama HKI *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Merek Kopi 'Sleman Jaya'"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="jenis_produk"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Produk</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Makanan Olahan, Minuman, Jasa Konsultasi"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Jelaskan produk atau jasa yang terkait.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Detail Pemohon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  name="nama_pemohon"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Pemohon *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nama lengkap perorangan atau perusahaan"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="alamat"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Pemohon</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Alamat lengkap sesuai KTP/domisili..."
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Data Administrasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    name="id_jenis_hki"
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis HKI *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih jenis HKI" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredJenisOptions.map((opt) => (
                              <SelectItem
                                key={opt.id_jenis_hki}
                                value={String(opt.id_jenis_hki)}
                              >
                                {opt.nama_jenis_hki} {opt.is_active === false && '(Nonaktif)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="id_status"
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status HKI *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih status HKI" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((opt) => (
                              <SelectItem
                                key={opt.id_status}
                                value={String(opt.id_status)}
                              >
                                {opt.nama_status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="tahun_fasilitasi"
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tahun Fasilitasi *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Masukkan tahun..."
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  name="id_pengusul"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-end">
                      <FormLabel>Pengusul (OPD) *</FormLabel>
                      <FormControl>
                        <Suspense fallback={ComboboxFallback}>
                          <LazyCombobox
                            options={pengusulOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Pilih OPD pengusul..."
                            searchPlaceholder="Cari OPD..."
                          />
                        </Suspense>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showKelasField && (
                  <FormField
                    name="id_kelas"
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kelas HKI (Nice) *</FormLabel>
                        <FormControl>
                          <Suspense fallback={ComboboxFallback}>
                            <LazyCombobox
                              options={filteredKelasOptions.map(opt => ({
                                ...opt,
                                label: opt.is_active === false ? `${opt.label} (Nonaktif)` : opt.label
                              }))}
                              value={field.value ?? ''}
                              onChange={field.onChange}
                              placeholder="Pilih kelas HKI..."
                            />
                          </Suspense>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  name="keterangan"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keterangan</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Informasi tambahan, catatan internal, atau detail lain..."
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FileUploader
                  control={control}
                  formId={id}
                  isSubmitting={isSubmitting}
                  initialPdf={
                    !isDeletingFile ? initialData?.sertifikat_pdf : null
                  }
                  onRemoveExisting={handleRemoveExistingFile}
                />
              </CardContent>
            </Card>
          </fieldset>
        </form>
      </Form>
    )
  }
)
HKIForm.displayName = 'HKIForm'
