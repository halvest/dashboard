'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip, TooltipProvider, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext,
} from '@/components/ui/pagination'
import {
  Plus, MoreHorizontal, Trash2, Eye, Edit, Download, FolderOpen, X, ArrowUpDown, ArrowUp, ArrowDown, Search,
} from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { HKIEntry, JenisHKI, Pengusul, StatusHKI } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ======================== TYPES & CONSTANTS ======================== */
// (Kode ini sudah benar)
const STATUS_BADGE: Record<string, string> = {
  'Diterima': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-500/20',
  'Didaftar': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500/20',
  'Ditolak': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/20',
  'Dalam Proses': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-500/20',
}
const getStatusBadge = (statusName?: string) => STATUS_BADGE[statusName ?? ''] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'

const DEFAULTS = {
  page: 1,
  pageSize: 10,
  sortBy: 'created_at',
  sortOrder: 'desc' as 'asc' | 'desc',
}

const clamp = (num: number, min: number, max: number) => Math.max(min, Math.min(num, max));

const buildPageItems = (current: number, total: number) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current < 5) return [1, 2, 3, 4, '…', total]
  if (current > total - 4) return [1, '…', total - 3, total - 2, total - 1, total]
  return [1, '…', current - 1, current, current + 1, '…', total]
}

/* ======================== CUSTOM HOOK FOR DATA TABLE LOGIC ======================== */
// (Hook ini sudah benar)
function useDataTable(totalCount: number) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    jenisId: searchParams.get('jenisId') || '',
    statusId: searchParams.get('statusId') || '',
    year: searchParams.get('year') || '',
    pengusulId: searchParams.get('pengusulId') || '',
  })
  const [pagination, setPagination] = useState({
    page: Number(searchParams.get('page')) || DEFAULTS.page,
    pageSize: Number(searchParams.get('pageSize')) || DEFAULTS.pageSize,
  })
  const [sort, setSort] = useState({
    sortBy: searchParams.get('sortBy') || DEFAULTS.sortBy,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || DEFAULTS.sortOrder,
  })
  const [selectedRows, setSelectedRows] = useState(new Set<number>())
  const debouncedSearch = useDebounce(filters.search, 500)

  useEffect(() => {
    const params = new URLSearchParams()
    
    const updateParam = (key: string, value: string | number, defaultValue?: any) => {
        if (value && value !== defaultValue) {
            params.set(key, String(value));
        }
    }

    updateParam('search', debouncedSearch, '')
    updateParam('jenisId', filters.jenisId, '')
    updateParam('statusId', filters.statusId, '')
    updateParam('year', filters.year, '')
    updateParam('pengusulId', filters.pengusulId, '')
    updateParam('page', pagination.page, DEFAULTS.page)
    updateParam('pageSize', pagination.pageSize, DEFAULTS.pageSize)
    updateParam('sortBy', sort.sortBy, DEFAULTS.sortBy)
    updateParam('sortOrder', sort.sortOrder, DEFAULTS.sortOrder)

    router.push(`/hki?${params.toString()}`, { scroll: false })
    
  }, [debouncedSearch, filters, pagination, sort, router])
  
  const handleSort = useCallback((columnId: string) => {
    if (columnId !== 'tahun_fasilitasi') return;
    setSort(currentSort => ({
      sortBy: columnId,
      sortOrder: currentSort.sortBy === columnId && currentSort.sortOrder === 'asc' ? 'desc' : 'asc',
    }))
    setPagination(p => ({ ...p, page: 1 }))
  }, [])
  
  const handleFilterChange = useCallback((filterName: keyof typeof filters, value: string) => {
    setFilters(currentFilters => ({ ...currentFilters, [filterName]: value }))
    setPagination(p => ({ ...p, page: 1 }))
  }, [])
  
  const clearFilters = useCallback(() => {
    setFilters({ search: '', jenisId: '', statusId: '', year: '', pengusulId: '' })
    setPagination(p => ({ ...p, page: 1 }))
  }, [])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pagination.pageSize)), [totalCount, pagination.pageSize])

  return {
    filters, pagination, sort, selectedRows, totalPages,
    setPagination, setSelectedRows,
    handleSort, handleFilterChange, clearFilters,
  }
}

/* ======================== PROPS ======================== */
interface DataTableProps {
  data: HKIEntry[];
  totalCount: number;
  formOptions: {
    jenisOptions: JenisHKI[];
    statusOptions: StatusHKI[];
    tahunOptions: { tahun: number }[];
    pengusulOptions: Pengusul[];
  };
  onEdit: (id: number) => void;
  onOpenCreateModal: () => void; // ✅ PERBAIKAN MODAL 1: Tambahkan prop baru
  isLoading?: boolean;
}

/* ======================== MAIN COMPONENT ======================== */
export function DataTable({ 
  data, 
  totalCount, 
  formOptions, 
  onEdit, 
  isLoading = false,
  onOpenCreateModal // ✅ PERBAIKAN MODAL 2: Terima prop baru
}: DataTableProps) {
  
  const router = useRouter()
  const tableState = useDataTable(totalCount)

  const [deleteAlert, setDeleteAlert] = useState<{ open: boolean; entry?: HKIEntry; isBulk?: boolean }>({ open: false })
  const [isDeleting, setIsDeleting] = useState(false)

  // Logika Delete (Sudah benar)
  const handleDelete = async () => {
    setIsDeleting(true)
    const itemsToDelete = deleteAlert.isBulk
      ? Array.from(tableState.selectedRows)
      : (deleteAlert.entry ? [deleteAlert.entry.id_hki] : [])

    if (itemsToDelete.length === 0) {
      setIsDeleting(false); return;
    }

    const toastId = toast.loading(`Menghapus ${itemsToDelete.length} entri...`)
    try {
      const response = await fetch(`/api/hki/bulk-delete`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: itemsToDelete })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Beberapa entri gagal dihapus.')
      }

      toast.success('Entri berhasil dihapus.', { id: toastId })
      setDeleteAlert({ open: false })
      tableState.setSelectedRows(new Set())
      router.refresh() 
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus entri.', { id: toastId })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteSingle = (entry: HKIEntry) => setDeleteAlert({ open: true, entry, isBulk: false })
  const handleBulkDelete = () => setDeleteAlert({ open: true, isBulk: true })

  return (
    <div className="space-y-4">
      <DataTableToolbar 
        tableState={tableState} 
        formOptions={formOptions}
        onBulkDelete={handleBulkDelete}
        onOpenCreateModal={onOpenCreateModal} // ✅ PERBAIKAN MODAL 2.1: Teruskan prop ke Toolbar
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-12 sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-20 px-4">
                    <Checkbox
                      checked={!isLoading && data.length > 0 && tableState.selectedRows.size === data.length}
                      onCheckedChange={(checked) => {
                        const newSelectedRows = new Set<number>()
                        if (checked) data.forEach(row => newSelectedRows.add(row.id_hki))
                        tableState.setSelectedRows(newSelectedRows)
                      }}
                      aria-label="Pilih semua baris"
                      disabled={isLoading || data.length === 0}
                    />
                  </TableHead>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead className="min-w-[250px]">Nama HKI & Produk</TableHead>
                  <TableHead className="min-w-[250px]">Pemohon</TableHead>
                  <TableHead className="min-w-[150px]">Jenis HKI</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <SortableHeader columnId="tahun_fasilitasi" sort={tableState.sort} onSort={tableState.handleSort}>Tahun</SortableHeader>
                  <TableHead className="min-w-[150px]">Pengusul</TableHead>
                  <TableHead className="min-w-[250px]">Keterangan</TableHead>
                  <TableHead className="text-right sticky right-0 bg-slate-50 dark:bg-slate-800/50 z-20 px-4">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: tableState.pagination.pageSize }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {Array.from({ length: 10 }).map((__, j) => (
                        <TableCell key={j}><div className="h-5 w-full rounded bg-muted animate-pulse" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data.length > 0 ? (
                  data.map((entry, index) => (
                    <DataTableRow 
                      key={entry.id_hki}
                      entry={entry} 
                      index={index} 
                      pagination={tableState.pagination}
                      isSelected={tableState.selectedRows.has(entry.id_hki)}
                      onSelectRow={(id, checked) => {
                        const newSelectedRows = new Set(tableState.selectedRows)
                        checked ? newSelectedRows.add(id) : newSelectedRows.delete(id)
                        tableState.setSelectedRows(newSelectedRows)
                      }}
                      onEdit={onEdit} 
                      onDelete={handleDeleteSingle}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-48 text-center">
                      <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-4 font-semibold">Tidak Ada Data Ditemukan</p>
                      <p className="text-sm text-muted-foreground">Coba ubah filter pencarian Anda atau buat entri baru.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {totalCount > 0 && (
          <DataTablePagination 
            totalCount={totalCount}
            pagination={tableState.pagination} 
            totalPages={tableState.totalPages} 
            setPagination={tableState.setPagination} 
          />
        )}
      </Card>
      
      {/* Dialog Konfirmasi Hapus (Sudah benar) */}
      <AlertDialog open={deleteAlert.open} onOpenChange={(isOpen) => !isOpen && setDeleteAlert({ open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAlert.isBulk
                ? `Anda yakin ingin menghapus ${tableState.selectedRows.size} entri yang dipilih?`
                : `Anda yakin ingin menghapus "${deleteAlert.entry?.nama_hki}"?`}
                <br />
                Tindakan ini tidak dapat diurungkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ======================== SUB-COMPONENTS ======================== */
// ✅ PERBAIKAN MODAL 3: Update fungsi Toolbar untuk menerima prop baru
function DataTableToolbar({ 
  tableState, 
  formOptions, 
  onBulkDelete,
  onOpenCreateModal
}: { 
  tableState: ReturnType<typeof useDataTable>, 
  formOptions: DataTableProps['formOptions'], 
  onBulkDelete: () => void,
  onOpenCreateModal: () => void // <-- Tambahkan tipe prop di sini
}) {
  // const router = useRouter() // Tidak perlu lagi untuk tombol Create
  const { filters, selectedRows, handleFilterChange, clearFilters } = tableState
  const activeFiltersCount = Object.values(filters).filter(f => f && f !== '').length;

  return (
    <Card className="p-4">
       <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
         <div className="relative w-full sm:max-w-xs">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input
             placeholder="Cari HKI, produk, atau pemohon..."
             value={filters.search}
             onChange={(e) => handleFilterChange('search', e.target.value)}
             className="pl-9"
           />
         </div>
         <div className="flex w-full sm:w-auto items-center justify-end gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" onClick={clearFilters} className="gap-2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" /> Bersihkan Filter
              </Button>
            )}
            {/* ✅ PERBAIKAN MODAL 3.1: Ubah onClick untuk membuka modal */}
            <Button className="gap-2 w-full sm:w-auto" onClick={onOpenCreateModal}>
                <Plus className="h-4 w-4" /> Tambah Baru
            </Button>
         </div>
       </div>
       
       {/* Filter Grid (Kode ini sudah benar semua) */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
         <Select value={filters.jenisId || 'all'} onValueChange={(v) => handleFilterChange('jenisId', v === 'all' ? '' : v)}>
           <SelectTrigger><SelectValue placeholder="Semua Jenis HKI" /></SelectTrigger>
           <SelectContent>
             <SelectItem value="all">Semua Jenis HKI</SelectItem>
             {formOptions.jenisOptions.map((opt) => <SelectItem key={opt.id_jenis} value={String(opt.id_jenis)}>{opt.nama_jenis}</SelectItem>)}
           </SelectContent>
         </Select>
         <Select value={filters.statusId || 'all'} onValueChange={(v) => handleFilterChange('statusId', v === 'all' ? '' : v)}>
           <SelectTrigger><SelectValue placeholder="Semua Status" /></SelectTrigger>
           <SelectContent>
             <SelectItem value="all">Semua Status</SelectItem>
             {formOptions.statusOptions.map((opt) => <SelectItem key={opt.id_status} value={String(opt.id_status)}>{opt.nama_status}</SelectItem>)}
           </SelectContent>
         </Select>
         <Select value={filters.year || 'all'} onValueChange={(v) => handleFilterChange('year', v === 'all' ? '' : v)}>
           <SelectTrigger><SelectValue placeholder="Semua Tahun" /></SelectTrigger>
           <SelectContent>
             <SelectItem value="all">Semua Tahun</SelectItem>
             {formOptions.tahunOptions.map((opt) => <SelectItem key={opt.tahun} value={String(opt.tahun)}>{String(opt.tahun)}</SelectItem>)}
           </SelectContent>
         </Select>
         <Select value={filters.pengusulId || 'all'} onValueChange={(v) => handleFilterChange('pengusulId', v === 'all' ? '' : v)}>
           <SelectTrigger><SelectValue placeholder="Semua Pengusul (OPD)" /></SelectTrigger>
           <SelectContent>
             <SelectItem value="all">Semua Pengusul (OPD)</SelectItem>
             {formOptions.pengusulOptions.map((opt) => <SelectItem key={opt.id_pengusul} value={String(opt.id_pengusul)}>{opt.nama_pengusul}</SelectItem>)}
           </SelectContent>
         </Select>
       </div>
       {selectedRows.size > 0 && (
           <div className="mt-4">
             <Button variant="outline" size="sm" className="gap-2" onClick={onBulkDelete}>
               <Trash2 className="h-4 w-4" /> Hapus ({selectedRows.size}) Entri Terpilih
             </Button>
           </div>
       )}
    </Card>
  )
}

// DataTableRow (Kode ini sudah benar semua)
function DataTableRow({ entry, index, pagination, isSelected, onSelectRow, onEdit, onDelete }: { entry: HKIEntry, index: number, pagination: { page: number, pageSize: number }, isSelected: boolean, onSelectRow: (id: number, checked: boolean) => void, onEdit: (id: number) => void, onDelete: (entry: HKIEntry) => void }) {
  const router = useRouter()

  const handleDownloadPDF = useCallback(async (sertifikat_pdf: string | null) => {
    if (!sertifikat_pdf) {
      toast.error('File sertifikat tidak tersedia.');
      return;
    }
    const toastId = toast.loading('Mempersiapkan unduhan...');
    try {
        const response = await fetch(`/api/hki/${entry.id_hki}/signed-url`);
        if (!response.ok) throw new Error('Gagal mendapatkan URL unduhan.');
        const { signedUrl } = await response.json();
        window.open(signedUrl, '_blank');
        toast.success('Unduhan dimulai.', { id: toastId });
    } catch (error) {
        toast.error('Gagal mengunduh file.', { id: toastId });
    }
  }, [entry.id_hki]);

  return (
    <TableRow data-state={isSelected ? 'selected' : ''} className="dark:border-slate-800">
      <TableCell className="sticky left-0 bg-white dark:bg-slate-900 z-10 px-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectRow(entry.id_hki, !!checked)}
          aria-label={`Pilih baris untuk ${entry.nama_hki}`}
        />
      </TableCell>
      <TableCell className="text-muted-foreground">{(pagination.page - 1) * pagination.pageSize + index + 1}</TableCell>
      <TableCell>
        <div className="flex flex-col">
            <span className="font-semibold text-foreground">{entry.nama_hki}</span>
            <span className="text-xs text-muted-foreground">{entry.jenis_produk || 'Tidak ada jenis produk'}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
            <span className="font-medium text-foreground">{entry.pemohon?.nama_pemohon || '-'}</span>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{entry.pemohon?.alamat || ''}</span>
                    </TooltipTrigger>
                    {entry.pemohon?.alamat && <TooltipContent><p>{entry.pemohon.alamat}</p></TooltipContent>}
                </Tooltip>
            </TooltipProvider>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{entry.jenis?.nama_jenis || '-'}</TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("font-normal", getStatusBadge(entry.status_hki?.nama_status))}>
          {entry.status_hki?.nama_status || 'N/A'}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{entry.tahun_fasilitasi || '-'}</TableCell>
      <TableCell className="text-muted-foreground">{entry.pengusul?.nama_pengusul || '-'}</TableCell>
      <TableCell>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <p className="max-w-[250px] truncate text-muted-foreground">{entry.keterangan || '-'}</p>
                </TooltipTrigger>
                {entry.keterangan && <TooltipContent className="max-w-xs"><p>{entry.keterangan}</p></TooltipContent>}
            </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="text-right sticky right-0 bg-white dark:bg-slate-900 z-10 px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <span className="sr-only">Buka menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/hki/${entry.id_hki}`)}><Eye className="mr-2 h-4 w-4" /> Detail</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(entry.id_hki)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
            {entry.sertifikat_pdf && (
              <DropdownMenuItem onClick={() => handleDownloadPDF(entry.sertifikat_pdf)}>
                  <Download className="mr-2 h-4 w-4" /> Unduh Sertifikat
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20" onClick={() => onDelete(entry)}><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

// DataTablePagination (Kode ini sudah benar)
function DataTablePagination({ totalCount, pagination, totalPages, setPagination }: any) {
  const pages = useMemo(() => buildPageItems(pagination.page, totalPages), [pagination.page, totalPages])
  
  const setPage = (page: number) => setPagination((p: any) => ({ ...p, page: clamp(page, 1, totalPages) }))
  
  return (
    <CardFooter className="p-4 flex items-center justify-between flex-wrap gap-4">
      <div className="text-sm text-muted-foreground">
        <strong>{totalCount}</strong> total entri
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <PaginationPrevious className="h-4 w-4" />
            </Button>
          </PaginationItem>
          {pages.map((p, idx) => (
            <PaginationItem key={`${p}-${idx}`} className="hidden md:flex">
              {p === '…' ? (
                <span className="px-4 py-2 text-sm">…</span>
              ) : (
                <Button
                  variant={p === pagination.page ? 'default' : 'ghost'}
                  size="icon"
                  className="h-9 w-9 text-sm"
                  onClick={() => setPage(Number(p))}
                >
                  {p}
                </Button>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPage(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
            >
              <PaginationNext className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
       <div className="text-sm text-muted-foreground">
        Halaman <strong>{pagination.page}</strong> dari <strong>{totalPages}</strong>
      </div>
    </CardFooter>
  )
}

// SortableHeader (Kode ini sudah benar)
function SortableHeader({ columnId, children, sort, onSort }: { columnId: string, children: React.ReactNode, sort: { sortBy: string, sortOrder: 'asc' | 'desc' }, onSort: (columnId: string) => void }) {
  const isSorted = sort.sortBy === columnId;
  const SortIcon = isSorted ? (sort.sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  
  return (
    <TableHead onClick={() => onSort(columnId)} className="cursor-pointer select-none group whitespace-nowrap" role="columnheader" aria-sort={isSorted ? (sort.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <div className="flex items-center gap-2">
        {children}
        <SortIcon className={`h-4 w-4 ${!isSorted && "text-muted-foreground/50 group-hover:text-muted-foreground"}`} />
      </div>
    </TableHead>
  )
}