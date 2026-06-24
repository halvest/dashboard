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
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Loader2, Pen, Plus, Trash2, X, Check, Search, SearchX, FileQuestion, Power, PowerOff } from 'lucide-react'
import { toast } from 'sonner'
import {
  AnyMasterItem, MasterDataType, masterConfig,
} from './master-data-client'
import { cn } from '@/lib/utils'

// --- Tipe dan Skema ---
const jenisHkiSchema = z.object({
  nama_jenis_hki: z.string().min(3, 'Nama jenis harus memiliki minimal 3 karakter.'),
  is_active: z.boolean().optional().default(true),
});
const kelasHkiSchema = z.object({
  nomor_kelas: z.coerce.number().int().min(1, 'Nomor Kelas minimal 1'),
  nama_kelas: z.string().min(3, 'Nama kelas harus memiliki minimal 3 karakter.'),
  tipe: z.enum(['Barang', 'Jasa'], { required_error: 'Tipe harus dipilih.' }),
  is_active: z.boolean().optional().default(true),
});
const pengusulSchema = z.object({
  nama_opd: z.string().min(3, 'Nama pengusul harus memiliki minimal 3 karakter.'),
});
const schemaMap: Record<MasterDataType, z.ZodObject<any>> = {
  jenis_hki: jenisHkiSchema,
  kelas_hki: kelasHkiSchema,
  pengusul: pengusulSchema,
};
type MasterFormValues = z.infer<typeof jenisHkiSchema | typeof kelasHkiSchema | typeof pengusulSchema>;
type Config = (typeof masterConfig)[MasterDataType];

// --- Komponen Baris Tabel ---
interface TableRowItemProps<T extends AnyMasterItem> {
    item: T;
    config: Config;
    dataType: MasterDataType;
    rowIndex: number;
    isEditing: boolean;
    onEdit: (item: T) => void;
    onCancel: () => void;
    onDelete: (item: T) => void;
    onToggleActive?: (item: T) => void;
    onSave: (values: FieldValues) => Promise<void>;
}

const TableRowItem = memo(function TableRowItem<T extends AnyMasterItem>({ 
    item, config, dataType, rowIndex, isEditing, onEdit, onCancel, onDelete, onToggleActive, onSave 
}: TableRowItemProps<T>) {
    const formSchema = useMemo(() => schemaMap[dataType] || z.object({}), [dataType]);
    const form = useForm<MasterFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: item as DefaultValues<MasterFormValues>,
    });
    const { isSubmitting } = form.formState;

    const handleSave = form.handleSubmit(async (data) => {
      await onSave(data);
    });

    const renderEditingFields = () => {
        switch (dataType) {
            case 'jenis_hki':
                return (
                    <>
                      <TableCell>
                          <FormField control={form.control} name="nama_jenis_hki" render={({ field }) => (
                             <Input {...field} className="h-8" value={field.value ?? ''} />
                          )} />
                      </TableCell>
                      <TableCell>
                          {'is_active' in item ? (item.is_active ? 'Aktif' : 'Nonaktif') : ''}
                      </TableCell>
                    </>
                );
            case 'kelas_hki':
                return (
                    <>
                        <TableCell>
                            <FormField control={form.control} name="nomor_kelas" render={({ field }) => (
                                <Input type="number" {...field} className="h-8 w-16" value={field.value ?? ''} />
                            )} />
                        </TableCell>
                        <TableCell>
                            <FormField control={form.control} name="nama_kelas" render={({ field }) => (
                                <Input {...field} className="h-8" value={field.value ?? ''} />
                            )} />
                        </TableCell>
                        <TableCell>
                            <FormField control={form.control} name="tipe" render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Barang">Barang</SelectItem>
                                        <SelectItem value="Jasa">Jasa</SelectItem>
                                    </SelectContent>
                                </Select>
                            )} />
                        </TableCell>
                        <TableCell>
                            {/* is_active status text just shown normally while editing */}
                            {'is_active' in item ? (item.is_active ? 'Aktif' : 'Nonaktif') : ''}
                        </TableCell>
                    </>
                );
            case 'pengusul':
                return (
                    <TableCell>
                        <FormField control={form.control} name="nama_opd" render={({ field }) => (
                            <Input {...field} className="h-8" />
                        )} />
                    </TableCell>
                );
            default:
                return null;
        }
    };

    if (isEditing) {
        return (
            <TableRow className="bg-muted/50">
                {dataType !== 'kelas_hki' && <TableCell className="text-center">{rowIndex + 1}</TableCell>}
                {renderEditingFields()}
                <TableCell className="text-right">
                    <TooltipProvider delayDuration={100}>
                        <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-600" onClick={handleSave} disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Simpan Perubahan</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel} disabled={isSubmitting}><X className="h-4 w-4" /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Batal</p></TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>
                </TableCell>
            </TableRow>
        );
    }
    
    return (
      <TableRow className="hover:bg-muted/50 transition-colors group">
          {dataType !== 'kelas_hki' && <TableCell className="text-center font-medium">{rowIndex + 1}</TableCell>}
          {config.columns.filter(col => !col.key.startsWith('id_')).map((col) => (
              <TableCell key={col.key} className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {col.key === 'is_active' ? (
                      <Badge variant={item[col.key as keyof T] ? 'default' : 'destructive'} className="font-normal">
                          {item[col.key as keyof T] ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                  ) : col.key === 'tipe' ? (
                      <Badge variant={item[col.key as keyof T] === 'Barang' ? 'outline' : 'secondary'} className="font-normal">
                          {String(item[col.key as keyof T])}
                      </Badge>
                  ) : (
                      String(item[col.key as keyof T] ?? '-')
                  )}
              </TableCell>
          ))}
          <TableCell className="text-right">
              <TooltipProvider delayDuration={100}>
                  <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}><Pen className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Edit Data</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-600" onClick={() => onDelete(item)}><Trash2 className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Hapus Permanen</p></TooltipContent>
                      </Tooltip>
                      {dataType !== 'pengusul' && onToggleActive && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className={cn("h-8 w-8", ('is_active' in item && item.is_active) ? "text-amber-500 hover:text-amber-600" : "text-green-500 hover:text-green-600")} onClick={() => onToggleActive(item)}>
                                    {('is_active' in item && item.is_active) ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{('is_active' in item && item.is_active) ? 'Nonaktifkan' : 'Aktifkan'}</p></TooltipContent>
                        </Tooltip>
                      )}
                  </div>
              </TooltipProvider>
          </TableCell>
      </TableRow>
    );
});
TableRowItem.displayName = 'TableRowItem';


// --- Komponen Utama ---
interface MasterCrudComponentProps<T extends AnyMasterItem> {
  dataType: MasterDataType;
  data: T[];
  config: Config;
}
export const MasterCrudComponent = memo(function MasterCrudComponent<T extends AnyMasterItem>({
  dataType, data, config,
}: MasterCrudComponentProps<T>) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | number | null>(null);
  const [deleteAlert, setDeleteAlert] = useState<{ isOpen: boolean; item?: T }>({ isOpen: false });

  const openDeleteAlert = useCallback((item: AnyMasterItem) => setDeleteAlert({ isOpen: true, item: item as T }), []);
  const startEditing = useCallback((item: AnyMasterItem) => setEditingItemId(item[config.idKey as keyof AnyMasterItem] as string | number), [config.idKey]);

  const closeDeleteAlert = useCallback(() => setDeleteAlert({ isOpen: false, item: undefined }), []);
  const cancelEditing = useCallback(() => setEditingItemId(null), []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const handleSave = useCallback(async (values: FieldValues, item?: T) => {
    const isEditMode = !!item;
    const toastId = toast.loading(isEditMode ? 'Memperbarui data...' : 'Menyimpan data...');
    const id = isEditMode ? item[config.idKey as keyof T] : '';
    const url = isEditMode ? `/api/master/${dataType}/${id}` : `/api/master/${dataType}`;
    const method = isEditMode ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Terjadi kesalahan');
      
      toast.success(result.message, { id: toastId });
      if (isEditMode) {
        cancelEditing();
      } else {
        setAddModalOpen(false);
      }
      router.refresh();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  }, [dataType, config.idKey, cancelEditing, router]);
  
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
  
  const handleToggleActive = useCallback(async (item: AnyMasterItem) => {
    const id = item[config.idKey as keyof AnyMasterItem];
    const currentStatus = 'is_active' in item ? !!item.is_active : true;
    const newStatus = !currentStatus;
    const toastId = toast.loading(newStatus ? 'Mengaktifkan data...' : 'Menonaktifkan data...');

    try {
      const res = await fetch(`/api/master/${dataType}/${id}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Gagal mengubah status');
      
      toast.success(result.message, { id: toastId });
      router.refresh();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  }, [dataType, config.idKey, router]);
  
  const visibleColumns = useMemo(() => config.columns.filter(col => !col.key.startsWith('id_')), [config.columns]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2"><config.icon className="h-5 w-5" />{config.title}</CardTitle>
              <CardDescription className="mt-1">{config.description}</CardDescription>
            </div>
            <div className="w-full md:w-auto flex flex-col-reverse sm:flex-row items-center gap-2">
                <div className="relative w-full sm:w-64 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors"/>
                    <Input placeholder={`Cari ${config.title}...`} className="pl-9 pr-8 transition-shadow focus-visible:ring-primary/20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                    {searchTerm && (
                        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setSearchTerm('')}>
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>
                <Button onClick={() => setAddModalOpen(true)} className="gap-2 w-full sm:w-auto flex-shrink-0"><Plus className="h-4 w-4" /> Tambah Baru</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md max-h-[60vh] overflow-y-auto relative bg-background/50 backdrop-blur-sm">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-md z-10 shadow-sm">
              <TableRow>
                {dataType !== 'kelas_hki' && <TableHead className="w-16 text-center font-semibold text-foreground">No.</TableHead>}
                {visibleColumns.map((col) => (<TableHead key={col.key} className="font-semibold text-foreground">{col.label}</TableHead>))}
                <TableHead className="text-right w-28 font-semibold text-foreground">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <TableRowItem
                    key={item[config.idKey as keyof T] as React.Key}
                    item={item}
                    config={config}
                    dataType={dataType}
                    rowIndex={index}
                    isEditing={editingItemId === item[config.idKey as keyof AnyMasterItem]}
                    onEdit={startEditing}
                    onCancel={cancelEditing}
                    onDelete={openDeleteAlert}
                    onToggleActive={handleToggleActive}
                    onSave={(values) => handleSave(values, item)}
                  />
                ))
              ) : (
                <TableRow>
                   <TableCell colSpan={visibleColumns.length + 2} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          {searchTerm ? (
                              <>
                                <SearchX className="h-8 w-8 opacity-50 mb-1" />
                                <p>Tidak ada data untuk pencarian &quot;<span className="font-medium text-foreground">{searchTerm}</span>&quot;.</p>
                                <Button variant="link" onClick={() => setSearchTerm('')} className="mt-1 h-auto py-1">Hapus Filter Pencarian</Button>
                              </>
                          ) : (
                              <>
                                <FileQuestion className="h-8 w-8 opacity-50 mb-1" />
                                <p>Belum ada data referensi.</p>
                                <Button variant="outline" onClick={() => setAddModalOpen(true)} className="mt-2 h-8 text-xs">Tambah Data Pertama</Button>
                              </>
                          )}
                      </div>
                   </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-muted-foreground mt-3">Menampilkan {filteredData.length} dari {data.length} total item.</p>
      </CardContent>
      
      {isAddModalOpen && (
        <MasterDataModal
          isOpen={isAddModalOpen}
          onClose={() => setAddModalOpen(false)}
          dataType={dataType}
          config={config}
          onSave={handleSave}
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
MasterCrudComponent.displayName = 'MasterCrudComponent';

// --- Komponen Modal (Hanya untuk Tambah Data Baru) ---
const AddFormFields: Record<MasterDataType, React.FC<{ control: UseFormReturn<any>['control'] }>> = {
  jenis_hki: ({ control }) => ( <FormField control={control} name="nama_jenis_hki" render={({ field }) => ( <FormItem><FormLabel>Nama Jenis HKI</FormLabel><FormControl><Input placeholder="Contoh: Merek" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />),
  kelas_hki: ({ control }) => (<div className="space-y-4"><FormField control={control} name="nomor_kelas" render={({ field }) => ( <FormItem><FormLabel>Nomor Kelas</FormLabel><FormControl><Input type="number" placeholder="Contoh: 35" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} /><FormField control={control} name="nama_kelas" render={({ field }) => ( <FormItem><FormLabel>Nama Kelas</FormLabel><FormControl><Input placeholder="Contoh: Periklanan, manajemen usaha..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} /><FormField control={control} name="tipe" render={({ field }) => ( <FormItem><FormLabel>Tipe</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Barang">Barang</SelectItem><SelectItem value="Jasa">Jasa</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} /></div>),
  pengusul: ({ control }) => ( <FormField control={control} name="nama_opd" render={({ field }) => ( <FormItem><FormLabel>Nama Pengusul (OPD)</FormLabel><FormControl><Input placeholder="Contoh: Dinas Koperasi, Usaha Kecil dan Menengah" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} /> ),
};

function MasterDataModal({ isOpen, onClose, dataType, config, onSave }: {
    isOpen: boolean; onClose: () => void; dataType: MasterDataType; config: Config; onSave: (values: FieldValues, item?: any) => Promise<void>;
}) {
  const formSchema = useMemo(() => schemaMap[dataType] || z.object({}), [dataType]);
  const defaultValues = useMemo(() => {
    switch (dataType) {
      case 'jenis_hki': return { nama_jenis_hki: '' };
      case 'kelas_hki': return { nomor_kelas: '', nama_kelas: '', tipe: 'Barang' };
      case 'pengusul': return { nama_opd: '' };
      default: return {};
    }
  }, [dataType]);

  const form = useForm<MasterFormValues>({ resolver: zodResolver(formSchema), defaultValues: defaultValues as DefaultValues<MasterFormValues> });
  const { isSubmitting } = form.formState;

  const FormComponent = AddFormFields[dataType];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah {config.title}</DialogTitle>
          <DialogDescription>Isi detail di bawah ini untuk menambahkan data baru.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSave(data))} className="space-y-6 pt-4">
            {FormComponent && <FormComponent control={form.control} />}
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