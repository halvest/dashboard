'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search, 
  Plus, 
  MoreHorizontal,
  Trash2, 
  Eye, 
  Edit, 
  Download,
  FolderOpen,
  X
} from 'lucide-react'
import { HKIEntry, JenisHKI, StatusHKI, FasilitasiTahun } from '@/lib/types'
import { toast } from 'sonner'
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface DataTableProps {
  data: HKIEntry[]
  totalCount: number
  currentPage: number
  pageSize: number
  formOptions: {
    jenisOptions: JenisHKI[]
    statusOptions: StatusHKI[]
    tahunOptions: FasilitasiTahun[]
  }
}

export function DataTable({ 
  data, 
  totalCount, 
  currentPage, 
  pageSize,
  formOptions,
}: DataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [jenisFilter, setJenisFilter] = useState(searchParams.get('jenis') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [yearFilter, setYearFilter] = useState(searchParams.get('year') || '')
  
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<HKIEntry | null>(null)

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleApplyFilters = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (jenisFilter) params.set('jenis', jenisFilter)
    if (statusFilter) params.set('status', statusFilter)
    if (yearFilter) params.set('year', yearFilter)
    params.set('page', '1')
    router.push(`/hki?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setJenisFilter('')
    setStatusFilter('')
    setYearFilter('')
    router.push('/hki')
  }

  const handleDelete = async () => {
    if (!entryToDelete) return;
    setIsDeleting(true)
    const toastId = toast.loading(`Menghapus "${entryToDelete.nama_hki}"...`)
    try {
      const response = await fetch(`/api/hki/${entryToDelete.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Gagal menghapus entri')
      toast.success('Entri HKI berhasil dihapus', { id: toastId })
      setDeleteAlertOpen(false)
      router.refresh()
    } catch (error) {
      toast.error('Gagal menghapus entri HKI', { id: toastId })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownloadPDF = async (id: string) => {
    const toastId = toast.loading("Membuat tautan unduhan...")
    try {
      const response = await fetch(`/api/hki/${id}/signed-url`)
      const data = await response.json()
      if (response.ok && data.signedUrl) {
        if (typeof window !== 'undefined') {
          window.open(data.signedUrl, '_blank')
        }
        toast.success("Tautan berhasil dibuat!", { id: toastId })
      } else {
        throw new Error(data.error || 'Sertifikat tidak tersedia.')
      }
    } catch (error: any) {
      toast.error(error.message, { id: toastId })
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/hki?${params.toString()}`)
  }
 
  const getStatusBadge = (statusName?: string) => {
    const variants: Record<string, string> = {
      'Diterima': 'bg-green-100 text-green-800 border-green-200',
      'Didaftar': 'bg-blue-100 text-blue-800 border-blue-200',
      'Ditolak': 'bg-red-100 text-red-800 border-red-200',
      'Dalam Proses': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    }
    return variants[statusName ?? ''] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <div className="p-4 bg-white rounded-lg border space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            placeholder="Cari HKI, pemohon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            className="lg:col-span-2"
          />
          <Select value={jenisFilter} onValueChange={setJenisFilter}>
            <SelectTrigger><SelectValue placeholder="Semua Jenis HKI" /></SelectTrigger>
            <SelectContent>
              {formOptions.jenisOptions.map(opt => <SelectItem key={opt.id} value={opt.nama}>{opt.nama}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Semua Status" /></SelectTrigger>
            <SelectContent>
              {formOptions.statusOptions.map(opt => <SelectItem key={opt.id} value={opt.nama}>{opt.nama}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger><SelectValue placeholder="Semua Tahun" /></SelectTrigger>
            <SelectContent>
              {formOptions.tahunOptions.map(opt => <SelectItem key={opt.id} value={String(opt.tahun)}>{opt.tahun}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} className="gap-2"><Search className="h-4 w-4" /> Terapkan</Button>
            <Button variant="ghost" onClick={clearFilters} className="gap-2"><X className="h-4 w-4" /> Bersihkan</Button>
          </div>
          <Button className="gap-2" onClick={() => router.push('/hki/create')}><Plus className="h-4 w-4" /> Tambah</Button>
        </div>
      </div>
     
      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>Nama Pemohon</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Nama HKI</TableHead>
                  <TableHead>Jenis Produk</TableHead>
                  <TableHead>Jenis HKI</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tahun</TableHead>
                  <TableHead>Sertifikat</TableHead>
                  <TableHead>Pengusul</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right sticky right-0 bg-white shadow-sm z-10">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length > 0 ? (
                  data.map((entry, index) => (
                    <TableRow key={entry.id}>
                      <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                      <TableCell className="font-medium">{entry.pemohon?.nama || '-'}</TableCell>
                      <TableCell>
                        <TooltipProvider><Tooltip>
                          <TooltipTrigger asChild>
                            <p className="max-w-[200px] truncate">{entry.pemohon?.alamat || '-'}</p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs"><p>{entry.pemohon?.alamat}</p></TooltipContent>
                        </Tooltip></TooltipProvider>
                      </TableCell>
                      <TableCell>{entry.nama_hki}</TableCell>
                      <TableCell>{entry.jenis_produk || '-'}</TableCell>
                      <TableCell>{entry.jenis_hki?.nama || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadge(entry.status_hki?.nama)}>{entry.status_hki?.nama || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>{entry.fasilitasi_tahun?.tahun || '-'}</TableCell>
                      <TableCell>
                        {entry.sertifikat_path ? (
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => handleDownloadPDF(entry.id)}>
                            <Download className="h-3 w-3" /> Unduh
                          </Button>
                        ) : (<span className="text-xs text-muted-foreground">Tidak ada</span>)}
                      </TableCell>
                      <TableCell>{entry.pengusul?.nama || '-'}</TableCell>
                      <TableCell>
                        <TooltipProvider><Tooltip>
                          <TooltipTrigger asChild>
                            <p className="max-w-[200px] truncate">{entry.keterangan || '-'}</p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs"><p>{entry.keterangan}</p></TooltipContent>
                        </Tooltip></TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right sticky right-0 bg-white shadow-sm z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/hki/${entry.id}`)}><Eye className="mr-2 h-4 w-4" /> Detail</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/hki/${entry.id}/edit`)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => { setEntryToDelete(entry); setDeleteAlertOpen(true); }}>
                              <Trash2 className="mr-2 h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="h-48 text-center">
                      <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-4 font-semibold">Tidak Ada Data</p>
                      <p className="text-sm text-muted-foreground">Coba ubah filter Anda atau buat entri baru.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Halaman {currentPage} dari {totalPages}</p>
            <Pagination>
              <PaginationContent>
                <PaginationItem><PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} aria-disabled={currentPage <= 1} className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                <PaginationItem><span className="font-medium text-sm p-2">{currentPage}</span></PaginationItem>
                <PaginationItem><PaginationNext onClick={() => handlePageChange(currentPage + 1)} aria-disabled={currentPage >= totalPages} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>
      
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus entri HKI untuk <b>{entryToDelete?.nama_hki}</b> secara permanen? Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}