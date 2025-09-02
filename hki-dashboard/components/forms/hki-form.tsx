'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUploader } from '@/components/forms/file-uploader'
import { HKIEntry, JENIS_HKI_OPTIONS, STATUS_OPTIONS } from '@/lib/types'
import { toast } from 'sonner'

const hkiSchema = z.object({
  nama_hki: z.string().min(1, 'Nama HKI is required'),
  jenis_hki: z.enum(['Merek', 'Hak Cipta', 'Paten', 'Paten Sederhana', 'Indikasi Geografis']),
  nama_pemohon: z.string().min(1, 'Nama pemohon is required'),
  nomor_permohonan: z.string().min(1, 'Nomor permohonan is required'),
  tanggal_permohonan: z.string().min(1, 'Tanggal permohonan is required'),
  status: z.enum(['Diterima', 'Didaftar', 'Ditolak', 'Dalam Proses']),
  fasilitasi_tahun: z.number().min(2000).max(new Date().getFullYear() + 5),
  keterangan: z.string().optional(),
})

type HKIFormData = z.infer<typeof hkiSchema>

interface HKIFormProps {
  initialData?: HKIEntry
  mode: 'create' | 'edit'
}

export function HKIForm({ initialData, mode }: HKIFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const form = useForm<HKIFormData>({
    resolver: zodResolver(hkiSchema),
    defaultValues: {
      nama_hki: initialData?.nama_hki || '',
      jenis_hki: initialData?.jenis_hki || 'Merek',
      nama_pemohon: initialData?.nama_pemohon || '',
      nomor_permohonan: initialData?.nomor_permohonan || '',
      tanggal_permohonan: initialData?.tanggal_permohonan || '',
      status: initialData?.status || 'Dalam Proses',
      fasilitasi_tahun: initialData?.fasilitasi_tahun || new Date().getFullYear(),
      keterangan: initialData?.keterangan || '',
    },
  })

  const onSubmit = async (data: HKIFormData) => {
    setIsLoading(true)

    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value?.toString() || '')
      })
      
      if (selectedFile) {
        formData.append('file', selectedFile)
      }

      const url = mode === 'create' ? '/api/hki' : `/api/hki/${initialData?.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error?.includes('nama_hki')) {
          toast.error('Nama HKI sudah terdaftar.')
        } else {
          toast.error(result.error || 'Failed to save HKI entry')
        }
        return
      }

      toast.success(`HKI entry ${mode === 'create' ? 'created' : 'updated'} successfully`)
      router.push('/hki')
      router.refresh()
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i + 5)

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Create New HKI Entry' : 'Edit HKI Entry'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama HKI */}
              <FormField
                control={form.control}
                name="nama_hki"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama HKI *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter HKI name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Jenis HKI */}
              <FormField
                control={form.control}
                name="jenis_hki"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis HKI *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select HKI type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {JENIS_HKI_OPTIONS.map((jenis) => (
                          <SelectItem key={jenis} value={jenis}>
                            {jenis}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nama Pemohon */}
              <FormField
                control={form.control}
                name="nama_pemohon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Pemohon *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter applicant name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nomor Permohonan */}
              <FormField
                control={form.control}
                name="nomor_permohonan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Permohonan *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter application number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tanggal Permohonan */}
              <FormField
                control={form.control}
                name="tanggal_permohonan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Permohonan *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fasilitasi Tahun */}
              <FormField
                control={form.control}
                name="fasilitasi_tahun"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fasilitasi Tahun *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Keterangan */}
            <FormField
              control={form.control}
              name="keterangan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keterangan</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional notes or comments"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Certificate File (PDF)</Label>
              <FileUploader
                onFileSelect={setSelectedFile}
                accept=".pdf"
                maxSize={10 * 1024 * 1024} // 10MB
              />
              {initialData?.sertifikat_path && !selectedFile && (
                <p className="text-sm text-green-600">
                  ✓ Certificate file is already uploaded
                </p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading 
                  ? (mode === 'create' ? 'Creating...' : 'Updating...') 
                  : (mode === 'create' ? 'Create HKI Entry' : 'Update HKI Entry')
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}