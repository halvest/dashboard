'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button, buttonVariants } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, MoreHorizontal, Pen, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AnyMasterItem, MasterDataType, masterConfig } from './master-data-client'
import { cn } from '@/lib/utils'
import { useForm, Controller } from 'react-hook-form'

type Config = typeof masterConfig[MasterDataType];

interface MasterCrudTableProps {
  dataType: MasterDataType
  data: AnyMasterItem[]
  config: Config
}

export function MasterCrudTable({ dataType, data, config }: MasterCrudTableProps) {
  const [modalState, setModalState] = useState<{ isOpen: boolean; item?: AnyMasterItem }>({ isOpen: false })
  const [deleteAlert, setDeleteAlert] = useState<{ isOpen: boolean; item?: AnyMasterItem }>({ isOpen: false })
  const router = useRouter()

  const openModal = (item?: AnyMasterItem) => setModalState({ isOpen: true, item })
  const closeModal = () => setModalState({ isOpen: false })
  
  const openDeleteAlert = (item: AnyMasterItem) => setDeleteAlert({ isOpen: true, item })
  const closeDeleteAlert = () => setDeleteAlert({ isOpen: false })

  const handleDelete = async () => {
    if (!deleteAlert.item) return

    const id = (deleteAlert.item as any)[config.idKey]
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
        <Button onClick={() => openModal()} className="gap-2 w-full md:w-auto">
          <Plus className="h-4 w-4" /> Tambah Baru
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {config.columns.map((col: any) => <TableHead key={col.key} className={col.key.startsWith('id_') ? 'w-24' : ''}>{col.label}</TableHead>)}
                <TableHead className="text-right w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? data.map(item => (
                <TableRow key={(item as any)[config.idKey]}>
                  {config.columns.map((col: any) => (
                    <TableCell key={col.key} className="font-medium">{(item as any)[col.key]}</TableCell>
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

      {/* Modal untuk Create/Edit */}
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

      {/* Alert untuk Delete */}
      <AlertDialog open={deleteAlert.isOpen} onOpenChange={closeDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data <span className="font-semibold">&quot;{(deleteAlert.item as any)?.[config.nameKey]}&quot;</span> secara permanen.
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


/**
 * Modal dinamis untuk Create/Edit Data Master
 */
interface MasterDataModalProps {
  isOpen: boolean
  onClose: () => void
  item?: AnyMasterItem
  dataType: MasterDataType
  config: Config
  onSuccess: () => void
}

function MasterDataModal({ isOpen, onClose, item, dataType, config, onSuccess }: MasterDataModalProps) {
  const isEditMode = !!item
  
  // Siapkan default values berdasarkan tipe data
  const getDefaultValues = () => {
    if (isEditMode) return item;
    switch (dataType) {
      case 'kelas_hki': return { id_kelas: undefined, nama_kelas: '', tipe: 'Barang' };
      case 'jenis_hki': return { nama_jenis_hki: '' };
      case 'pengusul': return { nama_opd: '' };
      default: return {};
    }
  }

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: getDefaultValues()
  })

  const onSubmit = async (formData: any) => {
    const toastId = toast.loading(isEditMode ? 'Memperbarui data...' : 'Menyimpan data...')
    const id = isEditMode ? (item as any)[config.idKey] : ''
    const url = isEditMode ? `/api/master/${dataType}/${id}` : `/api/master/${dataType}`
    const method = isEditMode ? 'PATCH' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Terjadi kesalahan')

      toast.success(result.message, { id: toastId })
      onSuccess()
    } catch (error: any) {
      toast.error(error.message, { id: toastId })
    }
  }

  const renderFormFields = () => {
    switch (dataType) {
      case 'jenis_hki':
        return (
          <div className="space-y-2">
            <Label htmlFor="nama_jenis_hki">Nama Jenis HKI</Label>
            <Input id="nama_jenis_hki" {...register('nama_jenis_hki', { required: 'Nama wajib diisi' })} />
            {errors.nama_jenis_hki && <p className="text-sm text-red-600">{(errors.nama_jenis_hki as any).message}</p>}
          </div>
        )
      case 'kelas_hki':
        return (
          <div className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="id_kelas">ID Kelas (1-45)</Label>
              <Input id="id_kelas" type="number" {...register('id_kelas', { required: 'ID wajib diisi', valueAsNumber: true, min: 1, max: 45 })} disabled={isEditMode} />
              {errors.id_kelas && <p className="text-sm text-red-600">{(errors.id_kelas as any).message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama_kelas">Nama Kelas</Label>
              <Input id="nama_kelas" {...register('nama_kelas', { required: 'Nama wajib diisi' })} />
              {errors.nama_kelas && <p className="text-sm text-red-600">{(errors.nama_kelas as any).message}</p>}
            </div>
            <Controller
              name="tipe"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Tipe</Label>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Barang">Barang</SelectItem>
                      <SelectItem value="Jasa">Jasa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          </div>
        )
      case 'pengusul':
        return (
           <div className="space-y-2">
            <Label htmlFor="nama_opd">Nama Pengusul (OPD)</Label>
            <Input id="nama_opd" {...register('nama_opd', { required: 'Nama wajib diisi' })} />
            {errors.nama_opd && <p className="text-sm text-red-600">{(errors.nama_opd as any).message}</p>}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit' : 'Tambah'} {config.title}</DialogTitle>
          <DialogDescription>
            Isi detail di bawah ini untuk melanjutkan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          {renderFormFields()}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}