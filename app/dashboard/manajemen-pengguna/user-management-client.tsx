// app/dashboard/users/user-management-client.tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  MoreHorizontal,
  Pen,
  Plus,
  Shield,
  Trash2,
  User as UserIcon,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useForm, Controller } from 'react-hook-form'
import { Badge } from '@/components/ui/badge'

// Tipe data untuk pengguna yang digabungkan
type UserProfile = {
  id: string
  email?: string
  role: 'admin' | 'user'
  full_name: string
  created_at: string
}

interface UserManagementClientProps {
  initialUsers: UserProfile[]
  currentUserIsSuperAdmin: boolean
}

export function UserManagementClient({
  initialUsers,
  currentUserIsSuperAdmin,
}: UserManagementClientProps) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    user?: UserProfile
  }>({ isOpen: false })
  const [deleteAlert, setDeleteAlert] = useState<{
    isOpen: boolean
    user?: UserProfile
  }>({ isOpen: false })
  const router = useRouter()

  const openModal = (user?: UserProfile) =>
    setModalState({ isOpen: true, user })
  const closeModal = () => setModalState({ isOpen: false })

  const openDeleteAlert = (user: UserProfile) =>
    setDeleteAlert({ isOpen: true, user })
  const closeDeleteAlert = () => setDeleteAlert({ isOpen: false })

  const handleDelete = async () => {
    if (!deleteAlert.user) return

    const toastId = toast.loading(
      `Menghapus pengguna ${deleteAlert.user.email}...`
    )

    try {
      const res = await fetch(`/api/users/${deleteAlert.user.id}`, {
        method: 'DELETE',
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal menghapus pengguna')
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
      <CardHeader className="flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pengguna Sistem
          </CardTitle>
          <CardDescription className="mt-1">
            Total {initialUsers.length} pengguna admin terdaftar.
          </CardDescription>
        </div>
        <Button onClick={() => openModal()} className="gap-2 w-full md:w-auto">
          <Plus className="h-4 w-4" /> Tambah Admin Baru
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran (Role)</TableHead>
                <TableHead>Tanggal Dibuat</TableHead>
                <TableHead className="text-right w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialUsers.length > 0 ? (
                initialUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === 'admin' ? 'default' : 'secondary'
                        }
                        className="gap-1.5 pl-2"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openModal(user)}>
                            <Pen className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteAlert(user)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Belum ada pengguna admin.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {modalState.isOpen && (
        <UserModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          user={modalState.user}
          onSuccess={onFormSubmitSuccess}
          currentUserIsSuperAdmin={currentUserIsSuperAdmin}
        />
      )}

      <AlertDialog open={deleteAlert.isOpen} onOpenChange={closeDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus pengguna{' '}
              <span className="font-semibold">
                &quot;{deleteAlert.user?.full_name}&quot;
              </span>{' '}
              secara permanen. Pengguna ini tidak akan bisa login kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={cn(buttonVariants({ variant: 'destructive' }))}
            >
              Ya, Hapus Pengguna
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  user?: UserProfile
  onSuccess: () => void
  currentUserIsSuperAdmin: boolean
}

function UserModal({
  isOpen,
  onClose,
  user,
  onSuccess,
  currentUserIsSuperAdmin,
}: UserModalProps) {
  const isEditMode = !!user
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      password: '',
      role: user?.role || 'admin',
    },
  })

  const onSubmit = async (formData: any) => {
    const toastId = toast.loading(
      isEditMode ? 'Memperbarui data...' : 'Menambahkan pengguna...'
    )
    const url = isEditMode ? `/api/users/${user.id}` : '/api/users'
    const method = isEditMode ? 'PATCH' : 'POST'

    // Jangan kirim password kosong saat edit jika tidak ingin diubah
    if (isEditMode && !formData.password) {
      delete formData.password
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Terjadi kesalahan')
      toast.success(result.message, { id: toastId })
      onSuccess()
    } catch (error: any) {
      toast.error(error.message, { id: toastId })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna Admin Baru'}
          </DialogTitle>
          <DialogDescription>
            Isi detail di bawah ini. Email harus unik dan kata sandi minimal 6
            karakter.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nama Lengkap</Label>
            <Input
              id="full_name"
              {...register('full_name', { required: 'Nama wajib diisi' })}
            />
            {errors.full_name && (
              <p className="text-sm text-red-600">
                {(errors.full_name as any).message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email', { required: 'Email wajib diisi' })}
              disabled={isEditMode}
            />
            {errors.email && (
              <p className="text-sm text-red-600">
                {(errors.email as any).message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <Input
              id="password"
              type="password"
              {...register('password', { minLength: isEditMode ? 0 : 6 })}
            />
            <p className="text-xs text-muted-foreground">
              {isEditMode
                ? 'Kosongkan jika tidak ingin mengubah kata sandi.'
                : 'Minimal 6 karakter.'}
            </p>
            {errors.password && (
              <p className="text-sm text-red-600">
                Kata sandi minimal 6 karakter
              </p>
            )}
          </div>
          {currentUserIsSuperAdmin && (
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Peran (Role)</Label>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User (read-only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
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
