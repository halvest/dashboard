// app/dashboard/data-master/master-crud-components.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import * as z from 'zod'
import { useForm, FieldValues, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button, buttonVariants } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Loader2, MoreHorizontal, Pen, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AnyMasterItem, MasterDataType, masterConfig } from './master-data-client'
import { cn } from '@/lib/utils'

type Config = typeof masterConfig[MasterDataType];

interface MasterCrudTableProps<T extends AnyMasterItem> {
  dataType: MasterDataType
  data: T[]
  config: Config
}

export function MasterCrudTable<T extends AnyMasterItem>({ dataType, data, config }: MasterCrudTableProps<T>) {
  const [modalState, setModalState] = useState<{ isOpen: boolean; item?: T }>({ isOpen: false })
  const [deleteAlert, setDeleteAlert] = useState<{ isOpen: boolean; item?: T }>({ isOpen: false })
  const router = useRouter()

  const openModal = (item?: T) => setModalState({ isOpen: true, item })
  const closeModal = () => setModalState({ isOpen: false })
  
  const openDeleteAlert = (item: T) => setDeleteAlert({ isOpen: true, item })
  const closeDeleteAlert = () => setDeleteAlert({ isOpen: false })

  const handleDelete = async () => {
    if (!deleteAlert.item) return
    const id = deleteAlert.item[config.idKey as keyof T]
    const toastId = toast.loading(`Menghapus data ${config.title}...`)

    try {
      const res = await fetch(`/api/master/${dataType}/${id}`, { method: 'DELETE' })
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Gagal menghapus data')
      }
      toast.success(result.message, { id: toastId })
      closeDeleteAlert()
      router.refresh()
    } catch (error: any) {
      toast.error(error.message, { id: toastId })
    }
  }
  
  const onFormSubmitSuccess = () => {
    closeModal()
    router.refresh()
  }

  const canAddNew = dataType === 'pengusul' || dataType === 'jenis_hki' || dataType === 'kelas_hki';

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <config.icon className="h-5 w-5" />
            {config.title}
          </CardTitle>
          <CardDescription className="mt-1">{config.description} Total {data.length} item.</CardDescription>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button 
                  onClick={() => openModal()} 
                  className="gap-2 w-full md:w-auto"
                  disabled={!canAddNew}
                >
                  <Plus className="h-4 w-4" /> Tambah Baru
                </Button>
              </span>
            </TooltipTrigger>
            {!canAddNew && (
              <TooltipContent>
                <p>Data ini tidak dapat ditambah secara manual.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {config.columns.map(col => <TableHead key={col.key} className={col.key.startsWith('id_') ? 'w-24' : ''}>{col.label}</TableHead>)}
                <TableHead className="text-right w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? data.map(item => (
                <TableRow key={item[config.idKey as keyof T] as React.Key}>
                  {config.columns.map(col => (
                    <TableCell key={col.key} className="font-medium">{String(item[col.key as keyof T] ?? '-')}</TableCell>
                  ))}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openModal(item)}><Pen className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteAlert(item)} className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={config.columns.length + 1} className="h-24 text-center">
                    Belum ada data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {modalState.isOpen && (
         <MasterDataModal
           isOpen={modalState.isOpen}
           onClose={closeModal}
           item={modalState.item}
           dataType={dataType}
           config={config}
           onSuccess={onFormSubmitSuccess}
        />
      )}

      <AlertDialog open={deleteAlert.isOpen} onOpenChange={closeDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              {/* PERBAIKAN 1: Menggunakan String() untuk memastikan nilai dapat dirender */}
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data <span className="font-semibold">&quot;{String(deleteAlert.item?.[config.nameKey as keyof T])}&quot;</span> secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({ variant: 'destructive' }))}>
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

// PERBAIKAN 2: Skema Zod digabungkan menjadi satu union schema
const masterSchema = z.union([
  z.object({
    nama_jenis_hki: z.string().min(3, 'Nama jenis harus memiliki minimal 3 karakter.'),
  }),
  z.object({
    id_kelas: z.coerce.number().int().min(1, 'ID harus antara 1-45').max(45, 'ID harus antara 1-45'),
    nama_kelas: z.string().min(3, 'Nama kelas harus memiliki minimal 3 karakter.'),
    tipe: z.enum(['Barang', 'Jasa'], { required_error: 'Tipe harus dipilih.' }),
  }),
  z.object({
    nama_opd: z.string().min(3, 'Nama pengusul harus memiliki minimal 3 karakter.'),
  }),
]);

// Buat tipe dari union schema
type MasterFormValues = z.infer<typeof masterSchema>;

const generateSchema = (dataType: MasterDataType) => {
  switch (dataType) {
    case 'jenis_hki':
      return z.object({
        nama_jenis_hki: z.string().min(3, 'Nama jenis harus memiliki minimal 3 karakter.'),
      });
    case 'kelas_hki':
      return z.object({
        id_kelas: z.coerce.number().int().min(1, 'ID harus antara 1-45').max(45, 'ID harus antara 1-45'),
        nama_kelas: z.string().min(3, 'Nama kelas harus memiliki minimal 3 karakter.'),
        tipe: z.enum(['Barang', 'Jasa'], { required_error: 'Tipe harus dipilih.' }),
      });
    case 'pengusul':
      return z.object({
        nama_opd: z.string().min(3, 'Nama pengusul harus memiliki minimal 3 karakter.'),
      });
    default:
      // Seharusnya tidak pernah terjadi, tapi baik untuk penanganan error
      return z.object({});
  }
};


interface MasterDataModalProps<T extends AnyMasterItem> {
  isOpen: boolean
  onClose: () => void
  item?: T
  dataType: MasterDataType
  config: Config
  onSuccess: () => void
}

function MasterDataModal<T extends AnyMasterItem>({ isOpen, onClose, item, dataType, config, onSuccess }: MasterDataModalProps<T>) {
  const isEditMode = !!item;

  const formSchema = useMemo(() => generateSchema(dataType), [dataType]);
  
  // PERBAIKAN 3: Memberi tipe eksplisit pada useForm
  const form = useForm<MasterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: useMemo(() => {
      if (isEditMode && item) return item as any; // 'as any' untuk menyederhanakan tipe default
      switch (dataType) {
        case 'jenis_hki': return { nama_jenis_hki: '' };
        case 'kelas_hki': return { id_kelas: undefined, nama_kelas: '', tipe: 'Barang' };
        case 'pengusul': return { nama_opd: '' };
        default: return {};
      }
    }, [item, isEditMode, dataType]),
  });

  const { isSubmitting } = form.formState;

  // PERBAIKAN 4: Memberi tipe eksplisit pada 'values' di onSubmit
  const onSubmit = async (values: MasterFormValues) => {
    const toastId = toast.loading(isEditMode ? 'Memperbarui data...' : 'Menyimpan data...');
    const id = isEditMode && item ? item[config.idKey as keyof T] : '';
    const url = isEditMode ? `/api/master/${dataType}/${id}` : `/api/master/${dataType}`;
    const method = isEditMode ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Terjadi kesalahan');

      toast.success(result.message, { id: toastId });
      onSuccess();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  };

  // PERBAIKAN 5: Melakukan type assertion pada `form.control` untuk memuaskan tipe FormField
  const typedForm = form as unknown as UseFormReturn<FieldValues>;

  const renderFormFields = () => {
    switch (dataType) {
      case 'jenis_hki':
        return (
          <FormField control={typedForm.control} name="nama_jenis_hki" render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Jenis HKI</FormLabel>
              <FormControl><Input placeholder="Contoh: Merek" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        );
      case 'kelas_hki':
        return (
          <div className="space-y-4">
            <FormField control={typedForm.control} name="id_kelas" render={({ field }) => (
              <FormItem>
                <FormLabel>ID Kelas (1-45)</FormLabel>
                <FormControl><Input type="number" placeholder="Contoh: 35" {...field} disabled={isEditMode} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={typedForm.control} name="nama_kelas" render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Kelas</FormLabel>
                <FormControl><Input placeholder="Contoh: Periklanan, manajemen usaha..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={typedForm.control} name="tipe" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Barang">Barang</SelectItem>
                    <SelectItem value="Jasa">Jasa</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        );
      case 'pengusul':
        return (
          <FormField control={typedForm.control} name="nama_opd" render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Pengusul (OPD)</FormLabel>
              <FormControl><Input placeholder="Contoh: Dinas Koperasi, Usaha Kecil dan Menengah" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit' : 'Tambah'} {config.title}</DialogTitle>
          <DialogDescription>Isi detail di bawah ini untuk melanjutkan.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            {renderFormFields()}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}