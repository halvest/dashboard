// components/hki/data-table.tsx
'use client'

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
  memo,
  useTransition,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookCheck,
  Building,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Copyright,
  Download,
  Edit,
  Eye,
  FolderOpen,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Combobox } from '@/components/ui/combobox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter as SimpleDialogFooter,
  DialogHeader as SimpleDialogHeader,
  DialogTitle as SimpleDialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useDebounce } from '@/hooks/use-debounce'
import { HKIEntry, StatusHKI, FormOptions } from '@/lib/types'
import { cn } from '@/lib/utils'
import { downloadFilteredExport } from '@/app/services/hki-service'
import { getStatusStyle } from './hki-utils'

type HKIFilters = {
  search: string
  jenisId: string
  statusId: string
  year: string
  pengusulId: string
}
const DEFAULTS = {
  page: 1,
  pageSize: 50,
  sortBy: 'created_at',
  sortOrder: 'desc' as const,
}

const clamp = (num: number, min: number, max: number) =>
  Math.max(min, Math.min(num, max))
const buildPageItems = (current: number, total: number) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current < 5) return [1, 2, 3, 4, '…', total]
  if (current > total - 4)
    return [1, '…', total - 3, total - 2, total - 1, total]
  return [1, '…', current - 1, current, current + 1, '…', total]
}

function useDataTable(totalCount: number) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<HKIFilters>(() => ({
    search: searchParams.get('search') || '',
    jenisId: searchParams.get('jenisId') || '',
    statusId: searchParams.get('statusId') || '',
    year: searchParams.get('year') || '',
    pengusulId: searchParams.get('pengusulId') || '',
  }))

  const [pagination, setPagination] = useState(() => ({
    page: Number(searchParams.get('page')) || DEFAULTS.page,
    pageSize: Number(searchParams.get('pageSize')) || DEFAULTS.pageSize,
  }))

  const [sort, setSort] = useState(() => ({
    sortBy: searchParams.get('sortBy') || DEFAULTS.sortBy,
    sortOrder:
      (searchParams.get('sortOrder') as 'asc' | 'desc') || DEFAULTS.sortOrder,
  }))

  const [selectedRows, setSelectedRows] = useState(new Set<number>())
  const debouncedSearch = useDebounce(filters.search, 400)

  useEffect(() => {
    const params = new URLSearchParams()
    const state = {
      ...filters,
      search: debouncedSearch,
      ...pagination,
      ...sort,
    }

    Object.entries(state).forEach(([key, value]) => {
      const defaultValue = DEFAULTS[key as keyof typeof DEFAULTS] ?? ''
      if (
        value !== null &&
        value !== undefined &&
        String(value).length > 0 &&
        String(value) !== String(defaultValue)
      ) {
        params.set(key, String(value))
      }
    })
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [debouncedSearch, filters, pagination, sort, router])

  const handleSort = useCallback((columnId: string) => {
    if (!['created_at', 'nama_hki', 'tahun_fasilitasi'].includes(columnId))
      return
    setSort((s) => ({
      sortBy: columnId,
      sortOrder:
        s.sortBy === columnId && s.sortOrder === 'asc' ? 'desc' : 'asc',
    }))
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleFilterChange = useCallback(
    (filterName: keyof HKIFilters, value: string) => {
      setFilters((f) => ({ ...f, [filterName]: value }))
      setPagination((p) => ({ ...p, page: 1 }))
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      jenisId: '',
      statusId: '',
      year: '',
      pengusulId: '',
    })
    setPagination((p) => ({ ...p, page: 1 }))
    setSort({ sortBy: DEFAULTS.sortBy, sortOrder: DEFAULTS.sortOrder })
  }, [])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pagination.pageSize)),
    [totalCount, pagination.pageSize]
  )

  return {
    filters,
    pagination,
    sort,
    selectedRows,
    totalPages,
    setPagination,
    setSelectedRows,
    handleSort,
    handleFilterChange,
    clearFilters,
  }
}
type UseDataTableReturn = ReturnType<typeof useDataTable>

const FilterTrigger = memo(
  ({
    icon: Icon,
    label,
    placeholder,
  }: {
    icon: LucideIcon
    label?: string
    placeholder: string
  }) => (
    <div className="flex items-center gap-2 text-sm font-normal">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className={cn('truncate', !label && 'text-muted-foreground')}>
        {label || placeholder}
      </span>
    </div>
  )
)
FilterTrigger.displayName = 'FilterTrigger'

const DataTableToolbar = memo(
  ({
    tableState,
    formOptions,
    onBulkDelete,
    onOpenCreateModal,
    onOpenExportModal,
    selectionModeActive,
    toggleSelectionMode,
  }: {
    tableState: UseDataTableReturn
    formOptions: FormOptions
    onBulkDelete: () => void
    onOpenCreateModal: () => void
    onOpenExportModal: () => void
    selectionModeActive: boolean
    toggleSelectionMode: () => void
  }) => {
    const { filters, selectedRows, handleFilterChange, clearFilters } =
      tableState
    const activeFiltersCount = Object.values(filters).filter(Boolean).length

    const selectedJenisLabel = useMemo(
      () =>
        formOptions.jenisOptions.find(
          (o) => o.id_jenis_hki.toString() === filters.jenisId
        )?.nama_jenis_hki,
      [formOptions.jenisOptions, filters.jenisId]
    )
    const selectedStatusLabel = useMemo(
      () =>
        formOptions.statusOptions.find(
          (o) => o.id_status.toString() === filters.statusId
        )?.nama_status,
      [formOptions.statusOptions, filters.statusId]
    )

    return (
      <Card className="border shadow-sm dark:border-slate-800">
        <CardHeader className="border-b dark:border-slate-800 p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Cari nama HKI atau nama pemohon..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-11 pr-10 h-10 rounded-lg text-base md:text-sm"
              />
              {filters.search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => handleFilterChange('search', '')}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center justify-end gap-3">
              <Button
                variant={selectionModeActive ? 'destructive' : 'outline'}
                className="gap-2 w-full sm:w-auto h-10"
                onClick={toggleSelectionMode}
              >
                {selectionModeActive ? (
                  <X className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span className="font-medium text-base md:text-sm">
                  {selectionModeActive ? 'Batal' : 'Pilih Data'}
                </span>
              </Button>
              <Button
                variant="outline"
                className="gap-2 w-full sm:w-auto h-10"
                onClick={onOpenExportModal}
              >
                <Upload className="h-4 w-4" />
                <span className="font-medium text-base md:text-sm">
                  Ekspor Data
                </span>
              </Button>
              <Button
                className="gap-2 w-full sm:w-auto shadow-sm h-10"
                onClick={onOpenCreateModal}
              >
                <Plus className="h-5 w-5" />
                <span className="font-semibold text-base md:text-sm">
                  Tambah Data
                </span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filter Lanjutan</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                  {activeFiltersCount} Aktif
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Select
                value={filters.jenisId}
                onValueChange={(v) =>
                  handleFilterChange('jenisId', v === 'all' ? '' : v)
                }
              >
                <SelectTrigger className="h-10 truncate">
                  <FilterTrigger
                    icon={Copyright}
                    label={selectedJenisLabel}
                    placeholder="Semua Jenis HKI"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis HKI</SelectItem>
                  {formOptions.jenisOptions.map((opt) => (
                    <SelectItem
                      key={opt.id_jenis_hki}
                      value={String(opt.id_jenis_hki)}
                    >
                      {opt.nama_jenis_hki}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.statusId}
                onValueChange={(v) =>
                  handleFilterChange('statusId', v === 'all' ? '' : v)
                }
              >
                <SelectTrigger className="h-10 truncate">
                  <FilterTrigger
                    icon={BookCheck}
                    label={selectedStatusLabel}
                    placeholder="Semua Status"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {formOptions.statusOptions.map((opt) => (
                    <SelectItem
                      key={opt.id_status}
                      value={String(opt.id_status)}
                    >
                      {opt.nama_status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.year}
                onValueChange={(v) =>
                  handleFilterChange('year', v === 'all' ? '' : v)
                }
              >
                <SelectTrigger className="h-10">
                  <FilterTrigger
                    icon={CalendarDays}
                    label={filters.year}
                    placeholder="Semua Tahun"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tahun</SelectItem>
                  {formOptions.tahunOptions.map((opt) => (
                    <SelectItem key={opt.tahun} value={String(opt.tahun)}>
                      {opt.tahun}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Combobox
                options={[
                  { value: '', label: 'Semua Pengusul (OPD)' },
                  ...formOptions.pengusulOptions,
                ]}
                value={filters.pengusulId}
                onChange={(v) => handleFilterChange('pengusulId', v)}
                placeholder={
                  <FilterTrigger
                    icon={Building}
                    label={undefined}
                    placeholder="Semua Pengusul"
                  />
                }
                searchPlaceholder="Cari OPD..."
              />
            </div>
            {(selectionModeActive || activeFiltersCount > 0) && (
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {selectionModeActive && selectedRows.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                    onClick={onBulkDelete}
                  >
                    <Trash2 className="h-4 w-4" /> Hapus ({selectedRows.size})
                    Pilihan
                  </Button>
                )}
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="gap-2 text-muted-foreground hover:text-foreground h-auto p-2 text-sm font-medium"
                  >
                    <X className="h-4 w-4" /> Bersihkan Filter (
                    {activeFiltersCount})
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
DataTableToolbar.displayName = 'DataTableToolbar'

const SortableHeader = memo(
  ({
    columnId,
    children,
    sort,
    onSort,
    className,
  }: {
    columnId: string
    children: ReactNode
    sort: { sortBy: string; sortOrder: 'asc' | 'desc' }
    onSort: (columnId: string) => void
    className?: string
  }) => {
    const isSorted = sort.sortBy === columnId
    const SortIcon = isSorted
      ? sort.sortOrder === 'asc'
        ? ArrowUp
        : ArrowDown
      : ArrowUpDown
    return (
      <TableHead
        onClick={() => onSort(columnId)}
        className={cn(
          'cursor-pointer select-none group whitespace-nowrap p-2',
          className
        )}
        role="columnheader"
        aria-sort={
          isSorted
            ? sort.sortOrder === 'asc'
              ? 'ascending'
              : 'descending'
            : 'none'
        }
      >
        <div
          className={cn(
            'flex items-center gap-2',
            className?.includes('text-center')
              ? 'justify-center'
              : 'justify-start'
          )}
        >
          {children}
          <SortIcon
            className={cn(
              'h-4 w-4 text-muted-foreground/50 transition-opacity group-hover:opacity-100',
              isSorted && 'text-foreground opacity-100'
            )}
          />
        </div>
      </TableHead>
    )
  }
)
SortableHeader.displayName = 'SortableHeader'

const DataTableRow = memo(
  ({
    entry,
    index,
    pagination,
    isSelected,
    onSelectRow,
    onEdit,
    onDelete,
    onViewDetails,
    statusOptions,
    onStatusUpdate,
    showCheckboxColumn,
  }: {
    entry: HKIEntry
    index: number
    pagination: { page: number; pageSize: number }
    isSelected: boolean
    onSelectRow: (id: number, checked: boolean) => void
    onEdit: (id: number) => void
    onDelete: (entry: HKIEntry) => void
    onViewDetails: (entry: HKIEntry) => void
    statusOptions: StatusHKI[]
    onStatusUpdate: (entryId: number, newStatusId: number) => void
    showCheckboxColumn: boolean
  }) => {
    const [isPending, startTransition] = useTransition()
    const [isFlashing, setIsFlashing] = useState(false)

    useEffect(() => {
      setIsFlashing(true)
      const timer = setTimeout(() => setIsFlashing(false), 2000)
      return () => clearTimeout(timer)
    }, [entry])

    const handleDownloadPDF = useCallback(() => {
      if (!entry.sertifikat_pdf) {
        toast.error('File tidak tersedia.')
        return
      }
      const toastId = toast.loading('Mempersiapkan unduhan...')
      // ✅ FIX: Tambahkan parameter `?disposition=attachment` untuk memaksa unduhan
      fetch(`/api/hki/${entry.id_hki}/signed-url?disposition=attachment`)
        .then((res) => {
          if (!res.ok) {
            return res.json().then((err) => {
              throw new Error(err.message || 'Gagal mendapatkan URL aman.')
            })
          }
          return res.json()
        })
        .then(({ signedUrl, fileName }) => {
          // Karena API sudah mengatur header Content-Disposition,
          // kita hanya perlu mengarahkan browser ke URL tersebut.
          window.location.href = signedUrl
          toast.success(`'${fileName}' mulai diunduh.`, { id: toastId })
        })
        .catch((error) => {
          toast.error(error.message || 'Gagal mengunduh file.', { id: toastId })
        })
    }, [entry.id_hki, entry.sertifikat_pdf])

    const handleSelectStatus = useCallback(
      (newStatusId: string) => {
        const numericId = Number(newStatusId)
        if (numericId !== entry.status_hki?.id_status) {
          startTransition(() => {
            onStatusUpdate(entry.id_hki, numericId)
          })
        }
      },
      [entry.id_hki, entry.status_hki?.id_status, onStatusUpdate]
    )

    const statusStyle = useMemo(
      () => getStatusStyle(entry?.status_hki?.nama_status),
      [entry?.status_hki?.nama_status]
    )

    return (
      <React.Fragment>
        {/* Desktop View */}
        <TableRow
          data-state={isSelected ? 'selected' : ''}
          className={cn(
            'dark:border-slate-800 transition-colors',
            'hidden md:table-row',
            isFlashing && 'bg-emerald-50 dark:bg-emerald-900/30',
            isSelected && 'bg-primary/5 dark:bg-primary/10'
          )}
        >
          {showCheckboxColumn && (
            <TableCell className="sticky left-0 bg-inherit z-10 px-2 py-2 border-r dark:border-slate-800 align-middle">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(c) => onSelectRow(entry.id_hki, !!c)}
                aria-label={`Select row ${index + 1}`}
              />
            </TableCell>
          )}
          <TableCell className="text-center font-mono text-sm text-muted-foreground p-2 align-middle">
            {(pagination.page - 1) * pagination.pageSize + index + 1}
          </TableCell>
          <TableCell className="p-2 align-middle">
            <div className="flex flex-col justify-center">
              <span className="font-semibold text-foreground leading-snug break-words">
                {entry.nama_hki}
              </span>
              <span className="text-sm text-muted-foreground break-words">
                {entry.jenis_produk || '-'}
              </span>
            </div>
          </TableCell>
          <TableCell className="p-2 align-middle">
            <div className="flex flex-col justify-center">
              <span className="font-medium text-foreground leading-snug break-words">
                {entry.pemohon?.nama_pemohon || '-'}
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-muted-foreground line-clamp-2 break-words">
                      {entry.pemohon?.alamat || ''}
                    </span>
                  </TooltipTrigger>
                  {entry.pemohon?.alamat && (
                    <TooltipContent
                      align="start"
                      className="max-w-xs whitespace-pre-line"
                    >
                      <p>{entry.pemohon.alamat}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </TableCell>
          <TableCell className="p-2 align-middle">
            <div className="flex flex-col justify-center gap-1 items-start">
              <Badge
                variant="outline"
                className="font-medium bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                {entry.jenis?.nama_jenis_hki || '-'}
              </Badge>
              {entry.kelas && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="cursor-default font-normal bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 line-clamp-1"
                      >
                        Kelas {entry.kelas.id_kelas}: {entry.kelas.tipe}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent align="start">
                      <p className="max-w-xs">{entry.kelas.nama_kelas}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground break-words p-2 align-middle">
            {entry.pengusul?.nama_opd || '-'}
          </TableCell>
          <TableCell className="text-center font-mono text-sm text-foreground p-2 align-middle">
            {entry.tahun_fasilitasi || '-'}
          </TableCell>
          <TableCell className="p-2 align-middle">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="line-clamp-2 text-sm text-muted-foreground break-words">
                    {entry.keterangan || '-'}
                  </p>
                </TooltipTrigger>
                {entry.keterangan && (
                  <TooltipContent
                    align="start"
                    className="max-w-sm whitespace-pre-line"
                  >
                    <p>{entry.keterangan}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </TableCell>
          <TableCell className="p-2 align-middle">
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={isPending}>
                <Button
                  variant="outline"
                  className={cn(
                    'h-auto px-2 py-1 text-sm font-medium disabled:opacity-100 justify-start gap-2 disabled:cursor-wait',
                    statusStyle.className
                  )}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <statusStyle.icon className="h-4 w-4" />
                  )}
                  <span className="truncate">
                    {entry.status_hki?.nama_status || 'N/A'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Ubah Status</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={String(entry.status_hki?.id_status)}
                  onValueChange={handleSelectStatus}
                >
                  {statusOptions.map((status) => {
                    const StatusIcon = getStatusStyle(status.nama_status).icon
                    return (
                      <DropdownMenuRadioItem
                        key={status.id_status}
                        value={String(status.id_status)}
                        className="gap-2 text-sm"
                        disabled={isPending}
                      >
                        <StatusIcon className="h-4 w-4" />
                        <span>{status.nama_status}</span>
                      </DropdownMenuRadioItem>
                    )
                  })}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
          <TableCell className="text-right sticky right-0 bg-inherit z-10 px-2 py-2 border-l dark:border-slate-800 align-middle">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 data-[state=open]:bg-muted"
                >
                  <span className="sr-only">Menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(entry)}>
                  <Eye className="mr-2 h-4 w-4" /> Detail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(entry.id_hki)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Data
                </DropdownMenuItem>
                {entry.sertifikat_pdf && (
                  <DropdownMenuItem onClick={handleDownloadPDF}>
                    <Download className="mr-2 h-4 w-4" /> Unduh Sertifikat
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                  onClick={() => onDelete(entry)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Hapus Entri
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>

        {/* Mobile View */}
        <tr className="md:hidden border-b dark:border-slate-800">
          <td colSpan={showCheckboxColumn ? 10 : 9} className="p-0">
            <Card
              className={cn(
                'm-2 border-l-4 rounded-lg shadow-none',
                statusStyle.className.replace(/border-(?!l)/g, 'border-'),
                isFlashing && 'bg-emerald-50 dark:bg-emerald-900/30',
                isSelected && 'ring-2 ring-primary/50 dark:ring-primary'
              )}
            >
              <CardHeader className="flex flex-row items-start justify-between p-4">
                <div className="flex items-start gap-4">
                  {showCheckboxColumn && (
                    <Checkbox
                      className="mt-1"
                      checked={isSelected}
                      onCheckedChange={(c) => onSelectRow(entry.id_hki, !!c)}
                      aria-label={`Select row ${index + 1}`}
                    />
                  )}
                  <div className="space-y-1">
                    <CardTitle className="text-base leading-tight">
                      {entry.nama_hki}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {entry.pemohon?.nama_pemohon || '-'}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="-mr-2 -mt-2 h-8 w-8 data-[state=open]:bg-muted"
                    >
                      <span className="sr-only">Menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(entry)}>
                      <Eye className="mr-2 h-4 w-4" /> Detail
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(entry.id_hki)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit Data
                    </DropdownMenuItem>
                    {entry.sertifikat_pdf && (
                      <DropdownMenuItem onClick={handleDownloadPDF}>
                        <Download className="mr-2 h-4 w-4" /> Unduh Sertifikat
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                      onClick={() => onDelete(entry)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Hapus Entri
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Jenis:</span>
                  <Badge variant="outline" className="text-right">
                    {entry.jenis?.nama_jenis_hki || '-'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pengusul:</span>
                  <span className="font-medium text-right">
                    {entry.pengusul?.nama_opd || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tahun:</span>
                  <span className="font-mono">{entry.tahun_fasilitasi}</span>
                </div>
              </CardContent>
            </Card>
          </td>
        </tr>
      </React.Fragment>
    )
  }
)
DataTableRow.displayName = 'DataTableRow'

const DataTablePagination = memo(
  ({
    totalCount,
    pagination,
    totalPages,
    setPagination,
    selectedCount,
    showSelectionCount,
  }: {
    totalCount: number
    pagination: { page: number }
    totalPages: number
    setPagination: (
      fn: (prevState: { page: number; pageSize: number }) => {
        page: number
        pageSize: number
      }
    ) => void
    selectedCount: number
    showSelectionCount: boolean
  }) => {
    const pages = useMemo(
      () => buildPageItems(pagination.page, totalPages),
      [pagination.page, totalPages]
    )
    const setPage = (page: number) =>
      setPagination((p) => ({ ...p, page: clamp(page, 1, totalPages) }))

    return (
      <div className="p-4 flex items-center justify-between flex-wrap gap-4 border-t dark:border-slate-800">
        <div className="text-sm text-muted-foreground flex-1 min-w-[150px]">
          {showSelectionCount && selectedCount > 0 ? (
            <span>
              <strong className="text-foreground">{selectedCount}</strong> dari{' '}
              <strong className="text-foreground">{totalCount}</strong> baris
              dipilih.
            </span>
          ) : (
            <span>
              Total <strong className="text-foreground">{totalCount}</strong>{' '}
              entri data.
            </span>
          )}
        </div>
        <Pagination className="flex-shrink-0">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="h-9 w-9"
                aria-label="Go to previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </PaginationItem>
            {pages.map((p, idx) => (
              <PaginationItem key={`${p}-${idx}`} className="hidden md:flex">
                {p === '…' ? (
                  <span className="flex items-center justify-center h-9 w-9 text-sm text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    variant={p === pagination.page ? 'default' : 'ghost'}
                    size="icon"
                    className="h-9 w-9 text-sm font-semibold"
                    onClick={() => setPage(Number(p))}
                    aria-current={p === pagination.page ? 'page' : undefined}
                  >
                    {p}
                  </Button>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
                className="h-9 w-9"
                aria-label="Go to next page"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <div className="text-sm font-medium text-muted-foreground hidden lg:flex flex-1 justify-end min-w-[150px]">
          Halaman <strong>{pagination.page}</strong> /{' '}
          <strong>{totalPages}</strong>
        </div>
      </div>
    )
  }
)
DataTablePagination.displayName = 'DataTablePagination'

const InteractiveExportModal = memo(
  ({
    isOpen,
    onClose,
    filters,
    formOptions,
  }: {
    isOpen: boolean
    onClose: () => void
    filters: HKIFilters
    formOptions: FormOptions
  }) => {
    const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx')
    const [isExporting, setIsExporting] = useState(false)

    const activeFiltersSummary = useMemo(() => {
      const summary: { label: string; value: string | undefined }[] = [
        { label: 'Pencarian', value: filters.search },
        { label: 'Tahun', value: filters.year },
        {
          label: 'Status',
          value: formOptions.statusOptions.find(
            (s) => s.id_status.toString() === filters.statusId
          )?.nama_status,
        },
        {
          label: 'Pengusul',
          value: formOptions.pengusulOptions.find(
            (p) => p.value === filters.pengusulId
          )?.label,
        },
        {
          label: 'Jenis HKI',
          value: formOptions.jenisOptions.find(
            (j) => j.id_jenis_hki.toString() === filters.jenisId
          )?.nama_jenis_hki,
        },
      ]
      return summary.filter((item) => item.value)
    }, [filters, formOptions])

    const handleExport = useCallback(async () => {
      setIsExporting(true)
      try {
        await downloadFilteredExport({ format, filters })
        onClose()
      } catch (error) {
        /* toast already handled in service */
      } finally {
        setIsExporting(false)
      }
    }, [format, filters, onClose])

    return (
      <Dialog
        open={isOpen}
        onOpenChange={(open) => !isExporting && !open && onClose()}
      >
        <DialogContent className="sm:max-w-md">
          <SimpleDialogHeader>
            <SimpleDialogTitle>Konfirmasi Ekspor Data</SimpleDialogTitle>
            <DialogDescription>
              Data yang diekspor akan sesuai dengan filter yang sedang aktif.
            </DialogDescription>
          </SimpleDialogHeader>
          <div className="py-4 space-y-4">
            {activeFiltersSummary.length > 0 ? (
              <div className="space-y-2">
                <Label className="font-semibold">Filter Aktif:</Label>
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md space-y-1">
                  {activeFiltersSummary.map((s) => (
                    <p key={s.label}>
                      - <strong>{s.label}:</strong> {s.value}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tidak ada filter aktif. Semua data akan diekspor.
              </p>
            )}
            <div className="space-y-3">
              <Label className="font-semibold">Pilih Format File</Label>
              <RadioGroup
                value={format}
                onValueChange={(v) => setFormat(v as 'xlsx' | 'csv')}
                className="flex items-center space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="xlsx" id="xlsx" />
                  <Label htmlFor="xlsx" className="cursor-pointer">
                    Excel (.xlsx)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="cursor-pointer">
                    CSV (.csv)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <SimpleDialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Batal
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isExporting ? 'Memproses...' : 'Ekspor Sekarang'}
            </Button>
          </SimpleDialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
)
InteractiveExportModal.displayName = 'InteractiveExportModal'

type DataTableProps = {
  data: HKIEntry[]
  totalCount: number
  formOptions: FormOptions
  onEdit: (id: number) => void
  onOpenCreateModal: () => void
  onViewDetails: (entry: HKIEntry) => void
  onStatusUpdate: (entryId: number, newStatusId: number) => void
  onDelete: (ids: number[]) => void
  isDeleting: boolean
  isLoading: boolean
}

export function DataTable({
  data,
  totalCount,
  formOptions,
  onEdit,
  onOpenCreateModal,
  onViewDetails,
  onStatusUpdate,
  onDelete,
  isDeleting,
  isLoading,
}: DataTableProps) {
  const tableState = useDataTable(totalCount)
  const [deleteAlert, setDeleteAlert] = useState<{
    open: boolean
    entry?: HKIEntry
    isBulk: boolean
  }>({ open: false, isBulk: false })
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [selectionModeActive, setSelectionModeActive] = useState(false)

  const isFiltered = useMemo(() => {
    const { search, jenisId, statusId, year, pengusulId } = tableState.filters
    return Boolean(search || jenisId || statusId || year || pengusulId)
  }, [tableState.filters])

  const toggleSelectionMode = useCallback(() => {
    setSelectionModeActive((prev) => {
      if (prev) tableState.setSelectedRows(new Set())
      return !prev
    })
  }, [tableState])

  const handleDelete = useCallback(() => {
    const itemsToDelete = deleteAlert.isBulk
      ? Array.from(tableState.selectedRows)
      : deleteAlert.entry
        ? [deleteAlert.entry.id_hki]
        : []

    if (itemsToDelete.length > 0) {
      onDelete(itemsToDelete)
    }

    setDeleteAlert({ open: false, isBulk: false })

    if (deleteAlert.isBulk) {
      tableState.setSelectedRows(new Set())
      setSelectionModeActive(false)
    }
  }, [deleteAlert, tableState, onDelete])

  const handleDeleteSingle = useCallback(
    (entry: HKIEntry) => setDeleteAlert({ open: true, entry, isBulk: false }),
    []
  )

  const handleBulkDelete = useCallback(() => {
    if (tableState.selectedRows.size === 0) {
      toast.warning('Tidak ada data yang dipilih.')
      return
    }
    setDeleteAlert({ open: true, isBulk: true })
  }, [tableState.selectedRows])

  const handleSelectRow = useCallback(
    (id: number, checked: boolean) => {
      tableState.setSelectedRows((prevRows) => {
        const newRows = new Set(prevRows)
        if (checked) {
          newRows.add(id)
        } else {
          newRows.delete(id)
        }
        return newRows
      })
    },
    [tableState.setSelectedRows]
  )

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allRowIds = new Set(data.map((row) => row.id_hki))
        tableState.setSelectedRows(allRowIds)
      } else {
        tableState.setSelectedRows(new Set())
      }
    },
    [data, tableState.setSelectedRows]
  )

  const showCheckboxColumn = selectionModeActive
  const columnsCount = 9 + (showCheckboxColumn ? 1 : 0)

  return (
    <div className="space-y-4">
      <DataTableToolbar
        tableState={tableState}
        formOptions={formOptions}
        onBulkDelete={handleBulkDelete}
        onOpenCreateModal={onOpenCreateModal}
        selectionModeActive={selectionModeActive}
        toggleSelectionMode={toggleSelectionMode}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />
      <div className="rounded-lg border dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50 hidden md:table-header-group">
              <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                {showCheckboxColumn && (
                  <TableHead className="w-12 sticky left-0 bg-inherit z-20 p-2 border-r dark:border-slate-800">
                    <Checkbox
                      checked={
                        !isLoading &&
                        data.length > 0 &&
                        tableState.selectedRows.size === data.length
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Pilih semua baris"
                      disabled={isLoading || data.length === 0}
                    />
                  </TableHead>
                )}
                <TableHead className="w-[50px] text-center font-medium p-2">
                  No
                </TableHead>
                <SortableHeader
                  columnId="nama_hki"
                  sort={tableState.sort}
                  onSort={tableState.handleSort}
                  className="w-60"
                >
                  Nama HKI & Produk
                </SortableHeader>
                <TableHead className="w-52 font-medium p-2">Pemohon</TableHead>
                <TableHead className="w-44 font-medium p-2">
                  Jenis & Kelas
                </TableHead>
                <TableHead className="w-52 font-medium p-2">
                  Pengusul (OPD)
                </TableHead>
                <SortableHeader
                  columnId="tahun_fasilitasi"
                  sort={tableState.sort}
                  onSort={tableState.handleSort}
                  className="w-24 text-center"
                >
                  Tahun
                </SortableHeader>
                <TableHead className="w-64 font-medium p-2">
                  Keterangan
                </TableHead>
                <TableHead className="w-40 font-medium p-2">Status</TableHead>
                <TableHead className="w-20 text-right sticky right-0 bg-inherit z-20 p-2 border-l dark:border-slate-800 font-medium">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow
                    key={`skeleton-${i}`}
                    className="dark:border-slate-800 hidden md:table-row"
                  >
                    {showCheckboxColumn && (
                      <TableCell className="sticky left-0 bg-inherit z-10 p-2 border-r dark:border-slate-800">
                        <div className="h-5 w-5 rounded bg-muted animate-pulse" />
                      </TableCell>
                    )}
                    {Array.from({ length: 9 }).map((__, j) => (
                      <TableCell key={j} className="p-2 align-middle">
                        <div
                          className={cn(
                            'h-5 w-full rounded-md bg-muted animate-pulse',
                            (j === 0 || j === 5) && 'w-1/2 mx-auto',
                            (j === 3 || j === 2) && 'h-10'
                          )}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length > 0 ? (
                data.map((entry: HKIEntry, index: number) => (
                  <DataTableRow
                    key={entry.id_hki}
                    entry={entry}
                    index={index}
                    pagination={tableState.pagination}
                    isSelected={tableState.selectedRows.has(entry.id_hki)}
                    onSelectRow={handleSelectRow}
                    onEdit={onEdit}
                    onDelete={handleDeleteSingle}
                    onViewDetails={onViewDetails}
                    statusOptions={formOptions.statusOptions}
                    onStatusUpdate={onStatusUpdate}
                    showCheckboxColumn={showCheckboxColumn}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columnsCount}
                    className="h-64 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-4">
                      <FolderOpen className="h-16 w-16 text-slate-300 dark:text-slate-700" />
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {isFiltered
                            ? 'Data Tidak Ditemukan'
                            : 'Belum Ada Data'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {isFiltered
                            ? 'Coba kata kunci atau filter lain.'
                            : 'Mulai dengan menambahkan data baru.'}
                        </p>
                      </div>
                      {isFiltered ? (
                        <Button
                          onClick={tableState.clearFilters}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" /> Reset Filter
                        </Button>
                      ) : (
                        <Button onClick={onOpenCreateModal} className="gap-2">
                          <Plus className="h-4 w-4" /> Tambah Data Baru
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {!isLoading && totalCount > 0 && (
          <DataTablePagination
            totalCount={totalCount}
            selectedCount={tableState.selectedRows.size}
            pagination={tableState.pagination}
            totalPages={tableState.totalPages}
            setPagination={tableState.setPagination}
            showSelectionCount={selectionModeActive}
          />
        )}
      </div>
      <AlertDialog
        open={deleteAlert.open}
        onOpenChange={(isOpen) =>
          !isOpen &&
          !isDeleting &&
          setDeleteAlert({ open: false, isBulk: false })
        }
      >
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
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn(
                buttonVariants({ variant: 'destructive' }),
                'gap-2'
              )}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <InteractiveExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        filters={tableState.filters}
        formOptions={formOptions}
      />
    </div>
  )
}
