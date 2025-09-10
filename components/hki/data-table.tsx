// app/components/hki/data-table.tsx
'use client'

/* =================================================================================================
* KOMPONEN DATA TABLE HKI (VERSI OPTIMAL)
* =================================================================================================
* Tujuan: Menampilkan, memfilter, dan mengelola data HKI dengan performa tinggi dan UX yang superior.
*
* Fitur & Optimalisasi Utama:
* 1. Bug Fix Kritis: Error 'Select.Item value cannot be empty' telah diperbaiki dengan benar.
* 2. UX Proaktif: Menampilkan tombol "Tambah Data" pada state kosong untuk alur kerja yang lancar.
* 3. Layout Modern & Responsif: Toolbar, filter, dan tabel beradaptasi dengan mulus dari desktop ke mobile.
* 4. Performa Tinggi: Menggunakan React.memo, useCallback, dan useMemo untuk mencegah re-render yang tidak perlu.
* 5. Mode Seleksi Dinamis: Fitur bulk-action yang hanya muncul saat dibutuhkan, menjaga UI tetap bersih.
* 6. Umpan Balik Visual: Memberikan highlight "flash" pada baris yang berhasil diupdate statusnya.
* 7. Penanganan Kesalahan: Memberikan notifikasi yang jelas kepada pengguna saat terjadi kesalahan.
* =================================================================================================*/

/* ======================== IMPORTS: REACT & NEXT.JS ======================== */
import React, { useState, useEffect, useCallback, useMemo, useTransition, memo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/* ======================== IMPORTS: THIRD-PARTY LIBS ======================== */
import { toast } from 'sonner'
import {
  ArrowDown, ArrowUp, ArrowUpDown, BookCheck, Building, CalendarDays, CheckCircle,
  ChevronLeft, ChevronRight, Clock, Copyright, Download, Edit, Eye, FolderOpen,
  Loader2, MoreHorizontal, Plus, Search, SlidersHorizontal, Trash2, Upload, X, XCircle,
  type LucideIcon,
} from 'lucide-react'

/* ======================== IMPORTS: SHADCN/UI COMPONENTS ======================== */
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Combobox } from '@/components/ui/combobox'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/* ======================== IMPORTS: LOCAL PROJECT FILES ======================== */
import { useDebounce } from '@/hooks/use-debounce'
import { HKIEntry, JenisHKI, StatusHKI } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ExportModal } from './export-modal'


/* ======================== TYPES & CONSTANTS ======================== */
type KnownStatus = 'Diterima' | 'Didaftar' | 'Ditolak' | 'Dalam Proses';
const STATUS_STYLES: Record<KnownStatus | 'Default', { className: string; icon: LucideIcon }> = {
  'Diterima': { className: 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle },
  'Didaftar': { className: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: BookCheck },
  'Ditolak': { className: 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
  'Dalam Proses': { className: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock },
  'Default': { className: 'border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300', icon: Clock }
}
export const getStatusStyle = (statusName?: string) => {
    return STATUS_STYLES[statusName as KnownStatus] || STATUS_STYLES['Default'];
};

interface HKIFilters {
  search: string;
  jenisId: string;
  statusId: string;
  year: string;
  pengusulId: string;
}

const DEFAULTS = { page: 1, pageSize: 10, sortBy: 'created_at', sortOrder: 'desc' as 'asc' | 'desc' }
const clamp = (num: number, min: number, max: number) => Math.max(min, Math.min(num, max));

const buildPageItems = (current: number, total: number) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current < 5) return [1, 2, 3, 4, '…', total]
  if (current > total - 4) return [1, '…', total - 3, total - 2, total - 1, total]
  return [1, '…', current - 1, current, current + 1, '…', total]
}

/* ======================== CUSTOM HOOK FOR DATA TABLE LOGIC ======================== */
function useDataTable(totalCount: number) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<HKIFilters>({ 
    search: searchParams.get('search') || '', 
    jenisId: searchParams.get('jenisId') || '', 
    statusId: searchParams.get('statusId') || '', 
    year: searchParams.get('year') || '', 
    pengusulId: searchParams.get('pengusulId') || '' 
  });
  const [pagination, setPagination] = useState({ page: Number(searchParams.get('page')) || DEFAULTS.page, pageSize: Number(searchParams.get('pageSize')) || DEFAULTS.pageSize });
  const [sort, setSort] = useState({ sortBy: searchParams.get('sortBy') || DEFAULTS.sortBy, sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || DEFAULTS.sortOrder });
  const [selectedRows, setSelectedRows] = useState(new Set<number>());
  const debouncedSearch = useDebounce(filters.search, 500);

  useEffect(() => {
    const params = new URLSearchParams();
    const updateParam = (key: string, value: any, defaultValue: any) => { 
      if (value && value !== defaultValue) {
        params.set(key, String(value));
      }
    };
    updateParam('search', debouncedSearch, '');
    updateParam('jenisId', filters.jenisId, '');
    updateParam('statusId', filters.statusId, '');
    updateParam('year', filters.year, '');
    updateParam('pengusulId', filters.pengusulId, '');
    updateParam('page', pagination.page, DEFAULTS.page);
    updateParam('pageSize', pagination.pageSize, DEFAULTS.pageSize);
    updateParam('sortBy', sort.sortBy, DEFAULTS.sortBy);
    updateParam('sortOrder', sort.sortOrder, DEFAULTS.sortOrder);

    // Hanya push jika parameter benar-benar berubah untuk mencegah re-render loop
    const newQueryString = params.toString();
    const currentQueryString = new URLSearchParams(Array.from(searchParams.entries())).toString();
    
    if (newQueryString !== currentQueryString) {
      router.push(`?${newQueryString}`, { scroll: false });
    }
  }, [debouncedSearch, filters, pagination, sort, router, searchParams]);

  const handleSort = useCallback((columnId: string) => { if (!['created_at', 'nama_hki', 'tahun_fasilitasi'].includes(columnId)) return; setSort(s => ({ sortBy: columnId, sortOrder: s.sortBy === columnId && s.sortOrder === 'asc' ? 'desc' : 'asc' })); setPagination(p => ({ ...p, page: 1 })); }, []);
  const handleFilterChange = useCallback((filterName: keyof HKIFilters, value: string) => { setFilters(f => ({ ...f, [filterName]: value })); setPagination(p => ({ ...p, page: 1 })); }, []);
  const clearFilters = useCallback(() => { setFilters({ search: '', jenisId: '', statusId: '', year: '', pengusulId: '' }); setPagination(p => ({ ...p, page: 1 })); setSort({ sortBy: DEFAULTS.sortBy, sortOrder: DEFAULTS.sortOrder }); }, []);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pagination.pageSize)), [totalCount, pagination.pageSize]);
  
  const stableSetSelectedRows = useCallback(setSelectedRows, []);
  
  return { filters, pagination, sort, selectedRows, totalPages, setPagination, setSelectedRows: stableSetSelectedRows, handleSort, handleFilterChange, clearFilters };
}

/* ======================== PROPS ======================== */
type ComboboxOption = { value: string; label: string };
interface DataTableProps {
  data: HKIEntry[];
  totalCount: number;
  formOptions: Readonly<{
    jenisOptions: JenisHKI[];
    statusOptions: StatusHKI[];
    tahunOptions: { tahun: number }[];
    pengusulOptions: ComboboxOption[];
    kelasOptions: ComboboxOption[];
  }>;
  onEdit: (id: number) => void;
  onOpenCreateModal: () => void;
  onViewDetails: (entry: HKIEntry) => void;
  isLoading?: boolean;
  enableBulkActions?: boolean;
}

/* ======================== MAIN COMPONENT ======================== */
export function DataTable({
  data, totalCount, formOptions, onEdit, isLoading = false, onOpenCreateModal, onViewDetails,
  enableBulkActions = true
}: DataTableProps) {
  const router = useRouter();
  const tableState = useDataTable(totalCount);
  const [deleteAlert, setDeleteAlert] = useState<{ open: boolean; entry?: HKIEntry; isBulk?: boolean }>({ open: false });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectionModeActive, setSelectionModeActive] = useState(false);
  const [flashingRowId, setFlashingRowId] = useState<number | null>(null);

  const toggleSelectionMode = useCallback(() => {
    setSelectionModeActive(prev => {
      if (prev) { tableState.setSelectedRows(new Set()); }
      return !prev;
    });
  }, [tableState]); 

  const showCheckboxColumn = enableBulkActions && selectionModeActive;
  const columnsCount = showCheckboxColumn ? 10 : 9;

  const handleDelete = async () => {
    setIsDeleting(true);
    const itemsToDelete = deleteAlert.isBulk ? Array.from(tableState.selectedRows) : (deleteAlert.entry ? [deleteAlert.entry.id_hki] : []);
    if (itemsToDelete.length === 0) { setIsDeleting(false); return; }
    const toastId = toast.loading(`Menghapus ${itemsToDelete.length} entri...`);
    try {
      const response = await fetch(`/api/hki/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: itemsToDelete }) });
      if (!response.ok) { 
        const errorData = await response.json(); 
        throw new Error(errorData.error || `Gagal menghapus (status: ${response.status}).`); 
      }
      toast.success('Entri berhasil dihapus.', { id: toastId });
      setDeleteAlert({ open: false });
      tableState.setSelectedRows(new Set());
      router.refresh(); 
      if (deleteAlert.isBulk) { setSelectionModeActive(false); }
    } catch (error: any) { 
      toast.error(error.message, { id: toastId });
    } finally { 
      setIsDeleting(false); 
    }
  };
  const handleDeleteSingle = useCallback((entry: HKIEntry) => setDeleteAlert({ open: true, entry, isBulk: false }), []);
  const handleBulkDelete = useCallback(() => setDeleteAlert({ open: true, isBulk: true }), []);

  const handleStatusUpdate = useCallback(async (entryId: number, newStatusId: number) => {
    const promise = fetch(`/api/hki/${entryId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statusId: newStatusId }) })
      .then(async (res) => { if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Gagal update.'); } return res.json(); });
    
    toast.promise(promise, { 
      loading: 'Memperbarui status...', 
      success: (data) => { 
        router.refresh(); 
        setFlashingRowId(entryId);
        setTimeout(() => setFlashingRowId(null), 1500);
        return data.message; 
      }, 
      error: (err) => err.message 
    });
  }, [router]);

  const displayData = isLoading ? [] : data;
  const displayTotalCount = isLoading ? 0 : totalCount;
  
  return (
    <div className="space-y-4">
      <DataTableToolbar
        tableState={tableState}
        formOptions={formOptions}
        onBulkDelete={handleBulkDelete}
        onOpenCreateModal={onOpenCreateModal}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        enableBulkActions={enableBulkActions}
        selectionModeActive={selectionModeActive}
        toggleSelectionMode={toggleSelectionMode}
      />

      <div className="rounded-lg border dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed">
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow className='hover:bg-slate-50 dark:hover:bg-slate-900/50'>
                {showCheckboxColumn && (
                  <TableHead className="w-12 sticky left-0 bg-inherit z-20 px-4 py-2 border-r dark:border-slate-800">
                    <Checkbox checked={!isLoading && displayData.length > 0 && tableState.selectedRows.size === displayData.length} onCheckedChange={(checked) => { const newRows = new Set<number>(); if (checked) displayData.forEach(row => newRows.add(row.id_hki)); tableState.setSelectedRows(newRows) }} aria-label="Pilih semua baris" disabled={isLoading || displayData.length === 0} />
                  </TableHead>
                )}
                <TableHead className="w-[60px] text-center font-medium py-2 px-4">No</TableHead>
                <SortableHeader columnId="nama_hki" sort={tableState.sort} onSort={tableState.handleSort} className="w-64 py-2">Nama HKI & Produk</SortableHeader>
                <TableHead className="w-56 font-medium py-2 px-4">Pemohon</TableHead>
                <TableHead className="w-48 font-medium py-2 px-4">Jenis & Kelas</TableHead>
                <TableHead className="w-56 font-medium py-2 px-4">Pengusul (OPD)</TableHead>
                <SortableHeader columnId="tahun_fasilitasi" sort={tableState.sort} onSort={tableState.handleSort} className="w-24 text-center py-2">Tahun</SortableHeader>
                <TableHead className="w-80 font-medium py-2 px-4">Keterangan</TableHead>
                <TableHead className="w-48 font-medium py-2 px-4">Status</TableHead>
                <TableHead className="w-24 text-right sticky right-0 bg-inherit z-20 px-4 py-2 border-l dark:border-slate-800 font-medium">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: tableState.pagination.pageSize }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`} className="dark:border-slate-800">
                    {Array.from({ length: columnsCount }).map((__, j) => (
                      <TableCell key={j} className={cn('py-2 px-4', showCheckboxColumn && j === 0 && 'sticky left-0 bg-white dark:bg-slate-950 border-r dark:border-slate-800', j === (columnsCount - 1) && 'sticky right-0 bg-white dark:bg-slate-950 border-l dark:border-slate-800')}>
                        <div className="h-4 w-full rounded bg-muted animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayData.length > 0 ? (
                displayData.map((entry, index) => (
                  <DataTableRow
                    key={entry.id_hki}
                    entry={entry}
                    index={index}
                    pagination={tableState.pagination}
                    isSelected={tableState.selectedRows.has(entry.id_hki)}
                    onSelectRow={(id, checked) => { const newRows = new Set(tableState.selectedRows); checked ? newRows.add(id) : newRows.delete(id); tableState.setSelectedRows(newRows); }}
                    onEdit={onEdit}
                    onDelete={handleDeleteSingle}
                    onViewDetails={onViewDetails}
                    statusOptions={formOptions.statusOptions}
                    onStatusUpdate={handleStatusUpdate}
                    showCheckboxColumn={showCheckboxColumn}
                    flashingRowId={flashingRowId}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columnsCount} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <FolderOpen className="h-16 w-16 text-slate-300 dark:text-slate-700" />
                      <div className='space-y-1'>
                        <h3 className="text-lg font-semibold text-foreground">Tidak Ada Data Ditemukan</h3>
                        <p className="text-sm text-muted-foreground">Coba ubah filter atau buat data baru.</p>
                      </div>
                      {/* ✅ UX: Tombol aksi pada state kosong */}
                      <Button onClick={onOpenCreateModal} variant="primary" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Tambah Data Baru
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {!isLoading && displayTotalCount > 0 && (
          <DataTablePagination
            totalCount={displayTotalCount}
            selectedCount={tableState.selectedRows.size}
            pagination={tableState.pagination}
            totalPages={tableState.totalPages}
            setPagination={tableState.setPagination}
            showSelectionCount={showCheckboxColumn}
          />
        )}
      </div>

      <AlertDialog open={deleteAlert.open} onOpenChange={(isOpen) => !isOpen && !isDeleting && setDeleteAlert({ open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
            <AlertDialogDescription>{deleteAlert.isBulk ? `Anda yakin ingin menghapus ${tableState.selectedRows.size} entri yang dipilih?` : `Anda yakin ingin menghapus "${deleteAlert.entry?.nama_hki}"?`}<br />Tindakan ini tidak dapat diurungkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className={cn(buttonVariants({ variant: 'destructive' }), 'gap-2')}>{isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} filters={tableState.filters} />
    </div>
  )
}

/* ======================== SUB-KOMPONEN TOOLBAR ======================== */

const FilterTrigger = memo(({ icon: Icon, label, placeholder }: { icon: LucideIcon, label?: string, placeholder: string }) => {
  return (
    <div className='flex items-center gap-2 text-sm font-normal'>
      <Icon className="h-4 w-4 text-muted-foreground"/>
      <span className={cn("truncate", !label && "text-muted-foreground")}>{label || placeholder}</span>
    </div>
  );
});
FilterTrigger.displayName = 'FilterTrigger';

function DataTableToolbar({
  tableState, formOptions, onBulkDelete, onOpenCreateModal, onOpenExportModal, 
  enableBulkActions, selectionModeActive, toggleSelectionMode
}: {
  tableState: ReturnType<typeof useDataTable>,
  formOptions: DataTableProps['formOptions'],
  onBulkDelete: () => void,
  onOpenCreateModal: () => void,
  onOpenExportModal: () => void,
  enableBulkActions: boolean,
  selectionModeActive: boolean,
  toggleSelectionMode: () => void
}) {
  const { filters, selectedRows, handleFilterChange, clearFilters } = tableState;
  const activeFiltersCount = Object.values(filters).filter(val => !!val && val !== '').length;

  const selectedJenisLabel = formOptions.jenisOptions.find(o => o.id_jenis.toString() === filters.jenisId)?.nama_jenis;
  const selectedStatusLabel = formOptions.statusOptions.find(o => o.id_status.toString() === filters.statusId)?.nama_status;
  
  const shouldShowBottomBar = selectionModeActive || activeFiltersCount > 0;

  return (
    <Card className="border shadow-sm dark:border-slate-800">
      <CardHeader className="border-b dark:border-slate-800 p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Cari HKI, produk, atau nama pemohon..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} className="pl-11 pr-10 h-10 rounded-lg text-base md:text-sm" />
            {filters.search && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => handleFilterChange('search', '')}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {/* ✅ UX: Layout tombol responsif */}
          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center justify-end gap-3">
            {enableBulkActions && (
              <Button variant={selectionModeActive ? "destructive" : "outline"} className="gap-2 w-full sm:w-auto h-10" onClick={toggleSelectionMode}>
                {selectionModeActive ? <X className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                <span className="font-medium text-base md:text-sm">{selectionModeActive ? "Batal" : "Pilih Data"}</span>
              </Button>
            )}
            <Button variant="outline" className="gap-2 w-full sm:w-auto h-10" onClick={onOpenExportModal}><Upload className="h-4 w-4" /><span className="font-medium text-base md:text-sm">Ekspor</span></Button>
            <Button variant="primary" className="gap-2 w-full sm:w-auto shadow-sm h-10" onClick={onOpenCreateModal}><Plus className="h-5 w-5" /><span className="font-semibold text-base md:text-sm">Tambah Data</span></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filter Lanjutan</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="px-2 py-0.5 text-xs">{activeFiltersCount} Aktif</Badge>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* ✅ BUG FIX: value kini menggunakan 'all' dan diterjemahkan di onValueChange */}
            <Select value={filters.jenisId || 'all'} onValueChange={(v) => handleFilterChange('jenisId', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-10 truncate"><FilterTrigger icon={Copyright} label={selectedJenisLabel} placeholder='Semua Jenis HKI' /></SelectTrigger>
              <SelectContent><SelectItem value="all">Semua Jenis HKI</SelectItem>{formOptions.jenisOptions.map((opt) => <SelectItem key={opt.id_jenis} value={String(opt.id_jenis)}>{opt.nama_jenis}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filters.statusId || 'all'} onValueChange={(v) => handleFilterChange('statusId', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-10 truncate"><FilterTrigger icon={BookCheck} label={selectedStatusLabel} placeholder='Semua Status' /></SelectTrigger>
              <SelectContent><SelectItem value="all">Semua Status</SelectItem>{formOptions.statusOptions.map((opt) => <SelectItem key={opt.id_status} value={String(opt.id_status)}>{opt.nama_status}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filters.year || 'all'} onValueChange={(v) => handleFilterChange('year', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-10"><FilterTrigger icon={CalendarDays} label={filters.year} placeholder='Semua Tahun' /></SelectTrigger>
              <SelectContent><SelectItem value="all">Semua Tahun</SelectItem>{formOptions.tahunOptions.map((opt) => <SelectItem key={opt.tahun} value={String(opt.tahun)}>{String(opt.tahun)}</SelectItem>)}</SelectContent>
            </Select>
            <Combobox options={[{ value: '', label: 'Semua Pengusul (OPD)' }, ...formOptions.pengusulOptions]} value={filters.pengusulId} onChange={(v) => handleFilterChange('pengusulId', v)} placeholder={<FilterTrigger icon={Building} label={undefined} placeholder="Semua Pengusul"/>} searchPlaceholder="Cari OPD..." />
          </div>
          {shouldShowBottomBar ? (
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {enableBulkActions && selectionModeActive && selectedRows.size > 0 && (
                <Button variant="outline" size="sm" className="gap-2 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300" onClick={onBulkDelete}>
                  <Trash2 className="h-4 w-4" /> Hapus ({selectedRows.size}) Pilihan
                </Button>
              )}
              {activeFiltersCount > 0 && (
                <Button variant="ghost" onClick={clearFilters} className="gap-2 text-muted-foreground hover:text-foreground h-auto p-2 text-sm font-medium">
                  <X className="h-4 w-4" /> Bersihkan Semua Filter ({activeFiltersCount})
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}


/* ======================== SUB-KOMPONEN DATA ROW (MEMOIZED) ======================== */
const DataTableRow = memo(({
  entry, index, pagination, isSelected, onSelectRow, onEdit, onDelete, onViewDetails, statusOptions, onStatusUpdate, 
  showCheckboxColumn, flashingRowId
}: {
  entry: HKIEntry, index: number, pagination: { page: number, pageSize: number }, isSelected: boolean, onSelectRow: (id: number, checked: boolean) => void, 
  onEdit: (id: number) => void,
  onDelete: (entry: HKIEntry) => void,
  onViewDetails: (entry: HKIEntry) => void,
  statusOptions: StatusHKI[], 
  onStatusUpdate: (entryId: number, newStatusId: number) => void,
  showCheckboxColumn: boolean,
  flashingRowId: number | null
}) => {
  const [isPending, startTransition] = useTransition();
  
  const handleDownloadPDF = useCallback(() => { 
    if (!entry.sertifikat_pdf) { toast.error('File tidak tersedia.'); return; }
    const toastId = toast.loading('Mempersiapkan...'); 
    fetch(`/api/hki/${entry.id_hki}/signed-url`)
      .then(res => { if (!res.ok) throw new Error('Gagal mendapatkan URL.'); return res.json(); })
      .then(({ signedUrl }) => { window.open(signedUrl, '_blank'); toast.success('Unduhan dimulai.', { id: toastId }); })
      .catch(error => { toast.error(error.message || 'Gagal mengunduh.', { id: toastId }); });
  }, [entry.id_hki, entry.sertifikat_pdf]);

  const handleSelectStatus = useCallback((newStatusId: string) => { 
    const numericId = Number(newStatusId); 
    if (numericId === entry.status_hki?.id_status) return; 
    startTransition(() => { onStatusUpdate(entry.id_hki, numericId); }); 
  }, [entry.id_hki, entry.status_hki?.id_status, onStatusUpdate]);

  const handleEditClick = useCallback(() => onEdit(entry.id_hki), [onEdit, entry.id_hki]);
  const handleViewClick = useCallback(() => onViewDetails(entry), [onViewDetails, entry]);
  const handleDeleteClick = useCallback(() => onDelete(entry), [onDelete, entry]);
  
  const statusStyle = useMemo(() => getStatusStyle(entry.status_hki?.nama_status), [entry.status_hki?.nama_status]);
  
  const isFlashing = entry.id_hki === flashingRowId;

  return (
    <TableRow data-state={isSelected ? 'selected' : ''} className={cn("dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 data-[state=selected]:bg-primary/5 dark:data-[state=selected]:bg-primary/10", "transition-colors duration-1000 ease-out", isFlashing && "bg-emerald-50 dark:bg-emerald-900/30")}>
      {showCheckboxColumn && (
        <TableCell className="sticky left-0 bg-inherit z-10 px-4 py-2 border-r dark:border-slate-800 align-top">
          <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelectRow(entry.id_hki, !!checked)} aria-label={`Pilih baris ${entry.nama_hki}`} />
        </TableCell>
      )}
      <TableCell className="text-center font-mono text-sm text-muted-foreground py-2 px-4 align-top">{(pagination.page - 1) * pagination.pageSize + index + 1}</TableCell>
      <TableCell className='py-2 px-4 align-top'><div className="flex flex-col"><span className="font-semibold text-foreground leading-snug break-words">{entry.nama_hki}</span><span className="text-sm text-muted-foreground break-words">{entry.jenis_produk || '-'}</span></div></TableCell>
      <TableCell className='py-2 px-4 align-top'><div className="flex flex-col"><span className="font-medium text-foreground leading-snug break-words">{entry.pemohon?.nama_pemohon || '-'}</span><TooltipProvider><Tooltip><TooltipTrigger asChild><span className="text-sm text-muted-foreground line-clamp-2 break-words">{entry.pemohon?.alamat || ''}</span></TooltipTrigger>{entry.pemohon?.alamat && <TooltipContent align="start" className="max-w-xs whitespace-pre-line"><p>{entry.pemohon.alamat}</p></TooltipContent>}</Tooltip></TooltipProvider></div></TableCell>
      <TableCell className='py-2 px-4 align-top'><div className="flex flex-col gap-1 items-start"><Badge variant="outline" className="font-medium bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">{entry.jenis?.nama_jenis || '-'}</Badge>{entry.kelas ? (<TooltipProvider><Tooltip><TooltipTrigger asChild><Badge variant="secondary" className="cursor-default font-normal bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 line-clamp-1">Kelas {entry.kelas.id_kelas}: {entry.kelas.tipe}</Badge></TooltipTrigger><TooltipContent align="start"><p className="max-w-xs">{entry.kelas.nama_kelas}</p></TooltipContent></Tooltip></TooltipProvider>) : (<span className="text-sm text-muted-foreground/70 italic px-2.5 py-0.5">-</span>)}</div></TableCell>
      <TableCell className="text-sm text-muted-foreground break-words py-2 px-4 align-top">{entry.pengusul?.nama_pengusul || '-'}</TableCell>
      <TableCell className="text-center font-mono text-sm text-foreground py-2 px-4 align-top">{entry.tahun_fasilitasi || '-'}</TableCell>
      <TableCell className="py-2 px-4 align-top"><TooltipProvider><Tooltip><TooltipTrigger asChild><p className="line-clamp-3 text-sm text-muted-foreground break-words">{entry.keterangan || '-'}</p></TooltipTrigger>{entry.keterangan && <TooltipContent align="start" className="max-w-sm whitespace-pre-line"><p>{entry.keterangan}</p></TooltipContent>}</Tooltip></TooltipProvider></TableCell>
      <TableCell className='py-2 px-4 align-top'><DropdownMenu><DropdownMenuTrigger asChild disabled={isPending}><Button variant="outline" className={cn("h-auto px-2 py-1 text-sm font-medium disabled:opacity-100 w-full justify-start gap-2 disabled:cursor-wait", statusStyle.className)} >{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <statusStyle.icon className="h-4 w-4" />}<span className="truncate">{entry.status_hki?.nama_status || 'N/A'}</span></Button></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuLabel>Ubah Status</DropdownMenuLabel><DropdownMenuRadioGroup value={String(entry.status_hki?.id_status)} onValueChange={handleSelectStatus}>{statusOptions.map((status) => { const Icon = getStatusStyle(status.nama_status).icon; return (<DropdownMenuRadioItem key={status.id_status} value={String(status.id_status)} className="gap-2 text-sm" disabled={isPending}><Icon className="h-4 w-4" /><span>{status.nama_status}</span></DropdownMenuRadioItem>)})}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu></TableCell>
      <TableCell className="text-right sticky right-0 bg-inherit z-10 px-4 py-2 border-l dark:border-slate-800 align-top"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 data-[state=open]:bg-muted"><span className="sr-only">Menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={handleViewClick}><Eye className="mr-2 h-4 w-4" /> Detail</DropdownMenuItem><DropdownMenuItem onClick={handleEditClick}><Edit className="mr-2 h-4 w-4" /> Edit Data</DropdownMenuItem>{entry.sertifikat_pdf && (<DropdownMenuItem onClick={handleDownloadPDF}><Download className="mr-2 h-4 w-4" /> Unduh Sertifikat</DropdownMenuItem>)}<DropdownMenuSeparator /><DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20" onClick={handleDeleteClick}><Trash2 className="mr-2 h-4 w-4" /> Hapus Entri</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
    </TableRow>
  )
});
DataTableRow.displayName = 'DataTableRow';

/* ======================== SUB-KOMPONEN PAGINATION ======================== */
function DataTablePagination({
  totalCount, pagination, totalPages, setPagination, selectedCount, showSelectionCount
}: {
  totalCount: number, pagination: { page: number }, totalPages: number, setPagination: (fn: (p: any) => any) => void, selectedCount: number, showSelectionCount: boolean
}) {
  const pages = useMemo(() => buildPageItems(pagination.page, totalPages), [pagination.page, totalPages]);
  const setPage = (page: number) => setPagination((p: any) => ({ ...p, page: clamp(page, 1, totalPages) }));

  return (
    <div className="p-4 flex items-center justify-between flex-wrap gap-4 border-t dark:border-slate-800">
      <div className="text-sm text-muted-foreground flex-1 min-w-[150px]">
        {showSelectionCount && selectedCount > 0 ? (
          <span><strong className="text-foreground">{selectedCount}</strong> dari <strong className="text-foreground">{totalCount}</strong> baris dipilih.</span>
        ) : (
          <span>Total <strong className="text-foreground">{totalCount}</strong> entri data.</span>
        )}
      </div>
      <Pagination className="flex-shrink-0">
        <PaginationContent>
          <PaginationItem><Button variant="outline" size="icon" onClick={() => setPage(pagination.page - 1)} disabled={pagination.page <= 1} className='h-9 w-9'><span className="sr-only">Sebelumnya</span><ChevronLeft className="h-5 w-5" /></Button></PaginationItem>
          {pages.map((p, idx) => (<PaginationItem key={`${p}-${idx}`} className="hidden md:flex">{p === '…' ? (<span className="flex items-center justify-center h-9 w-9 text-sm text-muted-foreground">…</span>) : (
            <Button variant={p === pagination.page ? 'default' : 'ghost'} size="icon" className="h-9 w-9 text-sm font-semibold" onClick={() => setPage(Number(p))} aria-current={p === pagination.page ? "page" : undefined}>{p}</Button>
          )}</PaginationItem>))}
          <PaginationItem><Button variant="outline" size="icon" onClick={() => setPage(pagination.page + 1)} disabled={pagination.page >= totalPages} className='h-9 w-9'><span className="sr-only">Berikutnya</span><ChevronRight className="h-5 w-5" /></Button></PaginationItem>
        </PaginationContent>
      </Pagination>
      <div className="text-sm font-medium text-muted-foreground hidden lg:flex flex-1 justify-end min-w-[150px]">Halaman <strong>{pagination.page}</strong> / <strong>{totalPages}</strong></div>
    </div>
  )
}

function SortableHeader({ columnId, children, sort, onSort, className }: { columnId: string, children: React.ReactNode, sort: { sortBy: string, sortOrder: 'asc' | 'desc' }, onSort: (columnId: string) => void, className?: string }) {
  const isSorted = sort.sortBy === columnId;
  const SortIcon = isSorted ? (sort.sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (<TableHead onClick={() => onSort(columnId)} className={cn("cursor-pointer select-none group whitespace-nowrap font-medium px-4", className)} role="columnheader" aria-sort={isSorted ? (sort.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
    <div className={cn("flex items-center gap-2", className?.includes('text-center') ? 'justify-center' : 'justify-start')}>
      {children}<SortIcon className={cn("h-4 w-4 text-muted-foreground/50", isSorted && "text-foreground")} />
    </div>
  </TableHead>)
}