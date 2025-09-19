// app/dashboard/data-master/master-crud-components.tsx
'use client'

import React, { useState, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import * as z from 'zod'
import { useForm, FieldValues, UseFormReturn, Controller, DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { Loader2, MoreHorizontal, Pen, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AnyMasterItem, MasterDataType, masterConfig,
} from './master-data-client'
import { cn } from '@/lib/utils'

// --- Tipe dan Skema Zod ---
const jenisHkiSchema = z.object({
  nama_jenis_hki: z.string().min(3, 'Nama jenis harus memiliki minimal 3 karakter.'),
});

const kelasHkiSchema = z.object({
  id_kelas: z.coerce.number().int().min(1, 'ID harus antara 1-45').max(45, 'ID harus antara 1-45'),
  nama_kelas: z.string().min(3, 'Nama kelas harus memiliki minimal 3 karakter.'),
  tipe: z.enum(['Barang', 'Jasa'], { required_error: 'Tipe harus dipilih.' }),
});

const pengusulSchema = z.object({
  nama_opd: z.string().min(3, 'Nama pengusul harus memiliki minimal 3 karakter.'),
});

const masterSchema = z.union([jenisHkiSchema, kelasHkiSchema, pengusulSchema]);
type MasterFormValues = z.infer<typeof masterSchema>;

const schemaMap: Record<MasterDataType, z.ZodObject<any>> = {
  jenis_hki: jenisHkiSchema,
  kelas_hki: kelasHkiSchema,
  pengusul: pengusulSchema,
};

// --- Komponen Anak yang Dioptimalkan ---

const TableRowItem = memo(function TableRowItem<T extends AnyMasterItem>({ item, config, rowIndex, onEdit, onDelete }: {
    item: T;
    config: Config;
    rowIndex: number;
    onEdit: (item: T) => void;
    onDelete: (item: T) => void;
}) {
    // UBAH 1: Filter kolom untuk menyembunyikan ID
    const visibleColumns = useMemo(
      () => config.columns.filter(col => !col.key.startsWith('id_')),
      [config.columns]
    );

    return (
        <TableRow key={item[config.idKey as keyof T] as React.Key}>
            <TableCell className="text-center font-medium">{rowIndex + 1}</TableCell>
            {/* // Gunakan `visibleColumns` untuk me-render sel */}
            {visibleColumns.map((col) => (
                <TableCell key={col.key} className="font-medium">
                    {String(item[col.key as keyof T] ?? '-')}
                </TableCell>
            ))}
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Pen className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
});
TableRowItem.displayName = 'TableRowItem';


// --- Komponen Utama ---
type Config = (typeof masterConfig)[MasterDataType];

interface MasterCrudTableProps<T extends AnyMasterItem> {
  dataType: MasterDataType;
  data: T[];
  config: Config;
}

export const MasterCrudTable = memo(function MasterCrudTable<T extends AnyMasterItem>({
  dataType,
  data,
  config,
}: MasterCrudTableProps<T>) {
  const [modalState, setModalState] = useState<{ isOpen: boolean; item?: T }>({ isOpen: false });
  const [deleteAlert, setDeleteAlert] = useState<{ isOpen: boolean; item?: T }>({ isOpen: false });
  const router = useRouter();

  const openModal = useCallback((item?: T) => setModalState({ isOpen: true, item }), []);
  const closeModal = useCallback(() => setModalState({ isOpen: false, item: undefined }), []);
  const openDeleteAlert = useCallback((item: T) => setDeleteAlert({ isOpen: true, item }), []);
  const closeDeleteAlert = useCallback(() => setDeleteAlert({ isOpen: false, item: undefined }), []);

  const handleDelete = useCallback(async () => {
    if (!deleteAlert.item) return;
    const id = deleteAlert.item[config.idKey as keyof T];
    const toastId = toast.loading(`Menghapus data ${config.title}...`);

    try {
      const res = await fetch(`/api/master/${dataType}/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Gagal menghapus data');
      toast.success(result.message, { id: toastId });
      closeDeleteAlert();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  }, [deleteAlert.item, config, dataType, router, closeDeleteAlert]);
  
  const onFormSubmitSuccess = useCallback(() => {
    closeModal();
    router.refresh();
  }, [closeModal, router]);

  const canAddNew = useMemo(() => ['pengusul', 'jenis_hki', 'kelas_hki'].includes(dataType), [dataType]);
  
  // UBAH 2: Filter kolom untuk menyembunyikan ID di sini juga
  const visibleColumns = useMemo(
    () => config.columns.filter(col => !col.key.startsWith('id_')),
    [config.columns]
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl flex items-center gap-2"><config.icon className="h-5 w-5" />{config.title}</CardTitle>
          <CardDescription className="mt-1">{config.description} Total {data.length} item.</CardDescription>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button onClick={() => openModal()} className="gap-2 w-full md:w-auto" disabled={!canAddNew}><Plus className="h-4 w-4" /> Tambah Baru</Button>
              </span>
            </TooltipTrigger>
            {!canAddNew && <TooltipContent><p>Data ini tidak dapat ditambah secara manual.</p></TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">No.</TableHead>
                {/* // Gunakan `visibleColumns` untuk me-render header */}
                {visibleColumns.map((col) => (<TableHead key={col.key}>{col.label}</TableHead>))}
                <TableHead className="text-right w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <TableRowItem
                    key={item[config.idKey as keyof T] as React.Key}
                    item={item}
                    config={config}
                    rowIndex={index}
                    onEdit={() => openModal(item)}
                    onDelete={() => openDeleteAlert(item)}
                  />
                ))
              ) : (
                // Sesuaikan `colSpan` dengan jumlah kolom yang terlihat
                <TableRow><TableCell colSpan={visibleColumns.length + 2} className="h-24 text-center">Belum ada data.</TableCell></TableRow>
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
              Tindakan ini akan menghapus data <span className="font-semibold">&quot;{String(deleteAlert.item?.[config.nameKey as keyof T])}&quot;</span> secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({ variant: 'destructive' }))}>Ya, Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
});
MasterCrudTable.displayName = 'MasterCrudTable';


// --- Komponen Modal dan Form ---
const FormFields: Record<MasterDataType, React.FC<{ control: UseFormReturn<any>['control']; isEditMode?: boolean }>> = {
    jenis_hki: memo(({ control }) => (
        <FormField control={control} name="nama_jenis_hki" render={({ field }) => (
            <FormItem><FormLabel>Nama Jenis HKI</FormLabel><FormControl><Input placeholder="Contoh: Merek" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
    )),
    kelas_hki: memo(({ control, isEditMode }) => (
        <div className="space-y-4">
            <FormField control={control} name="id_kelas" render={({ field }) => (
                <FormItem><FormLabel>ID Kelas (1-45)</FormLabel><FormControl><Input type="number" placeholder="Contoh: 35" {...field} disabled={isEditMode} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={control} name="nama_kelas" render={({ field }) => (
                <FormItem><FormLabel>Nama Kelas</FormLabel><FormControl><Input placeholder="Contoh: Periklanan, manajemen usaha..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={control} name="tipe" render={({ field }) => (
                <FormItem><FormLabel>Tipe</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Barang">Barang</SelectItem><SelectItem value="Jasa">Jasa</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
        </div>
    )),
    pengusul: memo(({ control }) => (
        <FormField control={control} name="nama_opd" render={({ field }) => (
            <FormItem><FormLabel>Nama Pengusul (OPD)</FormLabel><FormControl><Input placeholder="Contoh: Dinas Koperasi, Usaha Kecil dan Menengah" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
    )),
};

interface MasterDataModalProps<T extends AnyMasterItem> {
  isOpen: boolean;
  onClose: () => void;
  item?: T;
  dataType: MasterDataType;
  config: Config;
  onSuccess: () => void;
}

function MasterDataModal<T extends AnyMasterItem>({
  isOpen, onClose, item, dataType, config, onSuccess,
}: MasterDataModalProps<T>) {
  const isEditMode = !!item;
  
  const formSchema = useMemo(() => schemaMap[dataType] || z.object({}), [dataType]);
  
  const defaultValues = useMemo(() => {
    if (isEditMode && item) return item;
    switch (dataType) {
      case 'jenis_hki': return { nama_jenis_hki: '' };
      case 'kelas_hki': return { id_kelas: undefined, nama_kelas: '', tipe: 'Barang' };
      case 'pengusul': return { nama_opd: '' };
      default: return {};
    }
  }, [item, isEditMode, dataType]);

  const form = useForm<MasterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as DefaultValues<MasterFormValues>,
  });

  const { isSubmitting } = form.formState;

  const onSubmit = useCallback(async (values: FieldValues) => {
    const toastId = toast.loading(isEditMode ? 'Memperbarui data...' : 'Menyimpan data...');
    const id = isEditMode && item ? item[config.idKey as keyof T] : '';
    const url = isEditMode ? `/api/master/${dataType}/${id}` : `/api/master/${dataType}`;
    const method = isEditMode ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Terjadi kesalahan');
      toast.success(result.message, { id: toastId });
      onSuccess();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  }, [isEditMode, item, dataType, config.idKey, onSuccess]);

  const FormComponent = FormFields[dataType];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit' : 'Tambah'} {config.title}</DialogTitle>
          <DialogDescription>Isi detail di bawah ini untuk melanjutkan.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            {FormComponent && <FormComponent control={form.control} isEditMode={isEditMode} />}
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