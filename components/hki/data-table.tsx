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
  Plus, MoreHorizontal, Trash2, Eye, Edit, Download, FolderOpen, X, ArrowUpDown, ArrowUp, ArrowDown, FileDown,
} from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { HKIEntry, JenisHKI, Pengusul, StatusHKI } from '@/lib/types'
import { toast } from 'sonner'

/* ======================== TYPES & CONSTANTS ======================== */
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

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(num, max))
}

function buildPageItems(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current < 5) return [1, 2, 3, 4, '…', total]
  if (current > total - 4) return [1, '…', total - 3, total - 2, total - 1, total]
  return [1, '…', current - 1, current, current + 1, '…', total]
}

/* ======================== CUSTOM HOOK FOR DATA TABLE LOGIC ======================== */
function useDataTable(totalCount: number) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    jenisId: searchParams.get('jenisId') || '',
    statusId: searchParams.get('statusId') || '',
    year: searchParams.get('year') || '',
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
    
    // Fungsi ini hanya menambahkan parameter ke URL jika nilainya ada
    const addParam = (key: string, value: string | number) => {
        if (value) params.set(key, String(value));
    }

    addParam('search', debouncedSearch)
    addParam('jenisId', filters.jenisId)
    addParam('statusId', filters.statusId)
    addParam('year', filters.year)
    
    // Hanya tambahkan parameter jika tidak sesuai default
    if (pagination.page !== DEFAULTS.page) params.set('page', String(pagination.page))
    if (pagination.pageSize !== DEFAULTS.pageSize) params.set('pageSize', String(pagination.pageSize))
    if (sort.sortBy !== DEFAULTS.sortBy) params.set('sortBy', sort.sortBy)
    if (sort.sortOrder !== DEFAULTS.sortOrder) params.set('sortOrder', sort.sortOrder)

    // Cek apakah ada perubahan sebelum push router untuk menghindari render ulang yang tidak perlu
    const currentQueryString = new URLSearchParams(Array.from(searchParams.entries())).toString();
    const newQueryString = params.toString();

    if (currentQueryString !== newQueryString) {
        router.push(`/hki?${newQueryString}`, { scroll: false })
    }
  }, [debouncedSearch, filters, pagination, sort, router, searchParams])
  
  const handleSort = useCallback((columnId: string) => {
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
    setFilters({ search: '', jenisId: '', statusId: '', year: '' })
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
  isLoading?: boolean;
}

/* ======================== MAIN COMPONENT ======================== */
export function DataTable({ data, totalCount, formOptions, onEdit, isLoading = false }: DataTableProps) {
  const router = useRouter()
  const tableState = useDataTable(totalCount)

  const [deleteAlert, setDeleteAlert] = useState<{ open: boolean; entry?: HKIEntry; isBulk?: boolean }>({ open: false })
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDeleteSingle = (entry: HKIEntry) => {
    setDeleteAlert({ open: true, entry, isBulk: false })
  }

  return (
    <div className="space-y-6">
      <DataTableToolbar 
        tableState={tableState} 
        formOptions={formOptions} 
        data={data} 
        onBulkDelete={() => setDeleteAlert({ open: true, isBulk: true })} 
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="w-12 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 px-4">
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
                  <SortableHeader columnId="nama_pemohon" sort={tableState.sort} onSort={tableState.handleSort}>Nama Pemohon</SortableHeader>
                  <TableHead className="min-w-[250px]">Alamat</TableHead>
                  <SortableHeader columnId="nama_hki" sort={tableState.sort} onSort={tableState.handleSort}>Nama HKI</SortableHeader>
                  <TableHead>Jenis Produk</TableHead>
                  <SortableHeader columnId="nama_jenis_hki" sort={tableState.sort} onSort={tableState.handleSort}>Jenis HKI</SortableHeader>
                  <SortableHeader columnId="nama_status" sort={tableState.sort} onSort={tableState.handleSort}>Status</SortableHeader>
                  <SortableHeader columnId="tahun_fasilitasi" sort={tableState.sort} onSort={tableState.handleSort}>Tahun</SortableHeader>
                  <TableHead>Sertifikat</TableHead>
                  <SortableHeader columnId="nama_opd" sort={tableState.sort} onSort={tableState.handleSort}>Pengusul</SortableHeader>
                  <TableHead className="min-w-[250px]">Keterangan</TableHead>
                  <TableHead className="text-right sticky right-0 bg-slate-50 dark:bg-slate-900 z-10 px-4">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(tableState.pagination.pageSize)].map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {[...Array(13)].map((__, j) => (
                        <TableCell key={j}><div className="h-4 w-full rounded bg-muted animate-pulse" /></TableCell>
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
                    <TableCell colSpan={13} className="h-48 text-center">
                      <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-4 font-semibold">Tidak Ada Data Ditemukan</p>
                      <p className="text-sm text-muted-foreground">Coba ubah filter pencarian Anda.</p>
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
function DataTableToolbar({ tableState, formOptions, data, onBulkDelete }) {
  const router = useRouter()
  const { filters, selectedRows, handleFilterChange, clearFilters } = tableState
  const activeFiltersCount = Object.values(filters).filter(f => f).length

  const handleExportCSV = useCallback(() => {
    // ... Logika export CSV ...
  }, [data, tableState.pagination])

  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Input
          placeholder="Cari HKI, pemohon..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="lg:col-span-2"
        />
        <Select value={filters.jenisId || 'all'} onValueChange={(v) => handleFilterChange('jenisId', v === 'all' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Semua Jenis HKI" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis HKI</SelectItem>
            {formOptions.jenisOptions.map(opt => <SelectItem key={opt.id_jenis_hki} value={String(opt.id_jenis_hki)}>{opt.nama_jenis_hki}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.statusId || 'all'} onValueChange={(v) => handleFilterChange('statusId', v === 'all' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Semua Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {formOptions.statusOptions.map(opt => <SelectItem key={opt.id_status} value={String(opt.id_status)}>{opt.nama_status}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.year || 'all'} onValueChange={(v) => handleFilterChange('year', v === 'all' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Semua Tahun" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahun</SelectItem>
            {formOptions.tahunOptions.map(opt => <SelectItem key={opt.tahun} value={String(opt.tahun)}>{String(opt.tahun)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t dark:border-slate-800 pt-4 mt-4">
        <div className="flex items-center gap-2">
          {selectedRows.size > 0 ? (
            <>
              <span className="text-sm text-muted-foreground">{selectedRows.size} baris dipilih</span>
              <Button variant="destructive" size="sm" className="gap-2" onClick={onBulkDelete}>
                <Trash2 className="h-4 w-4" /> Hapus
              </Button>
            </>
          ) : (
            activeFiltersCount > 0 && (
                <Button variant="ghost" onClick={clearFilters} className="gap-2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" /> Bersihkan Filter ({activeFiltersCount})
                </Button>
            )
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV} disabled={data.length === 0}>
            <FileDown className="h-4 w-4" /> Ekspor
          </Button>
          <Button className="gap-2" onClick={() => router.push('/hki/create')}>
            <Plus className="h-4 w-4" /> Tambah Baru
          </Button>
        </div>
      </div>
    </Card>
  )
}

function DataTableRow({ entry, index, pagination, isSelected, onSelectRow, onEdit, onDelete }: { entry: HKIEntry, index: number, pagination: { page: number, pageSize: number }, isSelected: boolean, onSelectRow: (id: number, checked: boolean) => void, onEdit: (id: number) => void, onDelete: (entry: HKIEntry) => void }) {
  const router = useRouter()

  const handleDownloadPDF = useCallback(async (id: number) => {
    // ... Logika download PDF ...
  }, [])

  return (
    <TableRow data-state={isSelected ? 'selected' : ''} className="dark:border-slate-800">
      <TableCell className="sticky left-0 bg-white dark:bg-slate-900 z-10 px-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectRow(entry.id_hki, !!checked)}
          aria-label={`Pilih baris untuk ${entry.nama_hki}`}
        />
      </TableCell>
      <TableCell>{(pagination.page - 1) * pagination.pageSize + index + 1}</TableCell>
      <TableCell className="font-medium">{entry.pemohon?.nama_pemohon || '-'}</TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild><p className="max-w-[250px] truncate">{entry.pemohon?.alamat || '-'}</p></TooltipTrigger>
            <TooltipContent className="max-w-xs"><p>{entry.pemohon?.alamat}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="font-medium">{entry.nama_hki}</TableCell>
      <TableCell>{entry.jenis_produk || '-'}</TableCell>
      <TableCell>{entry.jenis_hki?.nama_jenis_hki || '-'}</TableCell>
      <TableCell>
        <Badge variant="outline" className={getStatusBadge(entry.status_hki?.nama_status)}>
          {entry.status_hki?.nama_status || 'N/A'}
        </Badge>
      </TableCell>
      <TableCell>{entry.tahun_fasilitasi || '-'}</TableCell>
      <TableCell>
        {entry.sertifikat_pdf ? (
          <Button variant="outline" size="sm" className="gap-1" onClick={() => handleDownloadPDF(entry.id_hki)}>
            <Download className="h-3 w-3" /> Unduh
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Tidak ada</span>
        )}
      </TableCell>
      <TableCell>{entry.pengusul?.nama_opd || '-'}</TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild><p className="max-w-[250px] truncate">{entry.keterangan || '-'}</p></TooltipTrigger>
            <TooltipContent className="max-w-xs"><p>{entry.keterangan}</p></TooltipContent>
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
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20" onClick={() => onDelete(entry)}><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

function DataTablePagination({ totalCount, pagination, totalPages, setPagination }) {
  const pages = useMemo(() => buildPageItems(pagination.page, totalPages), [pagination.page, totalPages])
  
  const setPage = (page: number) => setPagination((p: any) => ({ ...p, page: clamp(page, 1, totalPages) }))
  
  return (
    <CardFooter className="p-4 flex items-center justify-between flex-wrap gap-4">
      <div className="text-sm text-muted-foreground">
        Menampilkan halaman <strong>{pagination.page}</strong> dari <strong>{totalPages}</strong> ({totalCount} total entri)
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
              <span className="ml-2 hidden sm:inline">Sebelumnya</span>
            </Button>
          </PaginationItem>
          {pages.map((p, idx) => (
            <PaginationItem key={`${p}-${idx}`} className="hidden md:flex">
              {p === '…' ? (
                <span className="px-4 py-2">…</span>
              ) : (
                <Button
                  variant={p === pagination.page ? 'default' : 'ghost'}
                  size="sm"
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
              <span className="mr-2 hidden sm:inline">Berikutnya</span>
              <PaginationNext className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </CardFooter>
  )
}

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