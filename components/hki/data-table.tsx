'use client'

// React & Next.js Hooks
import { useState, useReducer, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// UI Components from shadcn/ui & Lucide Icons
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
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination'
import { 
  Plus, MoreHorizontal, Trash2, Eye, Edit, Download, FolderOpen, X, ArrowUpDown, FileDown
} from 'lucide-react'

// Other Libraries
import { toast } from 'sonner'

// Types (Pastikan path ini sesuai dengan struktur proyek Anda)
import { HKIEntry, JenisHKI, StatusHKI, FasilitasiTahun } from '@/lib/types'


// --- SEBAIKNYA DIPISAH KE FILE SENDIRI: /hooks/use-debounce.ts ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// --- STATE MANAGEMENT LOGIC (Reducer) ---
interface State {
  filters: {
    search: string;
    jenis: string;
    status: string;
    year: string;
  };
  pagination: {
    page: number;
    pageSize: number;
  };
  sort: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  selectedRows: Set<string>;
  deleteAlert: {
    open: boolean;
    entry: HKIEntry | null;
    isBulk: boolean;
  };
}

type Action =
  | { type: 'SET_FILTER'; payload: { filterName: keyof State['filters']; value: string } }
  | { type: 'SET_PAGE_SIZE'; payload: { pageSize: number } }
  | { type: 'SET_PAGE'; payload: { page: number } }
  | { type: 'SET_SORT'; payload: { columnId: string } }
  | { type: 'TOGGLE_ROW_SELECTION'; payload: { id: string; checked: boolean } }
  | { type: 'TOGGLE_ALL_ROWS'; payload: { data: HKIEntry[]; checked: boolean } }
  | { type: 'SHOW_DELETE_ALERT'; payload: { entry?: HKIEntry | null; isBulk: boolean } }
  | { type: 'HIDE_DELETE_ALERT' }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'RESET_SELECTION' };

function dataTableReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.payload.filterName]: action.payload.value },
        pagination: { ...state.pagination, page: 1 },
      };
    case 'SET_PAGE_SIZE':
        return {
            ...state,
            pagination: { page: 1, pageSize: action.payload.pageSize }
        }
    case 'SET_PAGE':
        return {
            ...state,
            pagination: { ...state.pagination, page: action.payload.page }
        }
    case 'SET_SORT':
      return {
        ...state,
        sort: {
          sortBy: action.payload.columnId,
          sortOrder: state.sort.sortBy === action.payload.columnId && state.sort.sortOrder === 'asc' ? 'desc' : 'asc',
        },
      };
    case 'TOGGLE_ROW_SELECTION': {
      const newSelectedRows = new Set(state.selectedRows);
      action.payload.checked ? newSelectedRows.add(action.payload.id) : newSelectedRows.delete(action.payload.id);
      return { ...state, selectedRows: newSelectedRows };
    }
    case 'TOGGLE_ALL_ROWS': {
      const newSelectedRows = new Set<string>();
      if (action.payload.checked) {
        action.payload.data.forEach(row => newSelectedRows.add(row.id));
      }
      return { ...state, selectedRows: newSelectedRows };
    }
    case 'SHOW_DELETE_ALERT':
      return {
        ...state,
        deleteAlert: { open: true, entry: action.payload.entry ?? null, isBulk: action.payload.isBulk },
      };
    case 'HIDE_DELETE_ALERT':
      return { ...state, deleteAlert: { ...state.deleteAlert, open: false } };
    case 'CLEAR_FILTERS':
        return {
            ...state,
            filters: { search: '', jenis: '', status: '', year: '' },
            pagination: { ...state.pagination, page: 1 },
        };
    case 'RESET_SELECTION':
        return { ...state, selectedRows: new Set() }
    default:
      return state;
  }
}

// --- SEBAIKNYA DIPISAH KE FILE SENDIRI: /hooks/use-query-state-sync.ts ---
function useQueryStateSync(state: State, debouncedSearch: string) {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        
        const setOrDelete = (key: string, value: string | number | undefined | null) => {
            if (value) {
                params.set(key, String(value));
            } else {
                params.delete(key);
            }
        };

        setOrDelete('search', debouncedSearch);
        setOrDelete('jenis', state.filters.jenis === 'all' ? null : state.filters.jenis);
        setOrDelete('status', state.filters.status === 'all' ? null : state.filters.status);
        setOrDelete('year', state.filters.year === 'all' ? null : state.filters.year);
        setOrDelete('page', state.pagination.page === 1 ? null : state.pagination.page);
        setOrDelete('pageSize', state.pagination.pageSize === 10 ? null : state.pagination.pageSize);
        setOrDelete('sortBy', state.sort.sortBy === 'createdAt' ? null : state.sort.sortBy);
        setOrDelete('sortOrder', state.sort.sortOrder === 'desc' ? null : state.sort.sortOrder);
        
        router.push(`/hki?${params.toString()}`);
    }, [debouncedSearch, state.filters, state.pagination, state.sort, router, searchParams]);
}

// --- SEBAIKNYA DIPISAH KE FILE SENDIRI: /hooks/use-hki-actions.ts ---
function useHKIActions(onSuccess: () => void) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = useCallback(async (itemsToDelete: string[]) => {
        setIsDeleting(true);
        const toastId = toast.loading(`Menghapus ${itemsToDelete.length} entri...`);

        try {
            const results = await Promise.all(
                itemsToDelete.map(id => fetch(`/api/hki/${id}`, { method: 'DELETE' }))
            );

            const failed = results.filter(res => !res.ok);
            if (failed.length > 0) {
                throw new Error(`${failed.length} dari ${itemsToDelete.length} entri gagal dihapus.`);
            }

            toast.success('Entri HKI berhasil dihapus', { id: toastId });
            onSuccess();
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Gagal menghapus entri HKI', { id: toastId });
        } finally {
            setIsDeleting(false);
        }
    }, [onSuccess, router]);
    
    const handleDownloadPDF = async (id: string) => {
        const toastId = toast.loading("Membuat tautan unduhan...")
        try {
            const response = await fetch(`/api/hki/${id}/signed-url`)
            const data = await response.json()
            if (response.ok && data.signedUrl) {
                window.open(data.signedUrl, '_blank')
                toast.success("Tautan berhasil dibuat!", { id: toastId })
            } else {
                throw new Error(data.error || 'Sertifikat tidak tersedia.')
            }
        } catch (error: any) {
            toast.error(error.message, { id: toastId })
        }
    }

    return { isDeleting, handleDelete, handleDownloadPDF };
}

// --- PROPS INTERFACE ---
interface DataTableProps {
  data: HKIEntry[];
  totalCount: number;
  isLoading: boolean;
  formOptions: {
    jenisOptions: JenisHKI[];
    statusOptions: StatusHKI[];
    tahunOptions: FasilitasiTahun[];
  };
}


// --- MAIN COMPONENT ---
export function DataTable({ data, totalCount, isLoading, formOptions }: DataTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialState: State = {
    filters: {
      search: searchParams.get('search') || '',
      jenis: searchParams.get('jenis') || '',
      status: searchParams.get('status') || '',
      year: searchParams.get('year') || '',
    },
    pagination: {
      page: Number(searchParams.get('page')) || 1,
      pageSize: Number(searchParams.get('pageSize')) || 10,
    },
    sort: {
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    },
    selectedRows: new Set(),
    deleteAlert: { open: false, entry: null, isBulk: false },
  };

  const [state, dispatch] = useReducer(dataTableReducer, initialState);
  const debouncedSearch = useDebounce(state.filters.search, 500);

  useQueryStateSync(state, debouncedSearch);

  const { isDeleting, handleDelete, handleDownloadPDF } = useHKIActions(() => {
    dispatch({ type: 'HIDE_DELETE_ALERT' });
    dispatch({ type: 'RESET_SELECTION' });
  });

  const confirmDelete = useCallback(() => {
    const itemsToDelete = state.deleteAlert.isBulk 
        ? Array.from(state.selectedRows) 
        : [state.deleteAlert.entry?.id].filter(Boolean) as string[];
    handleDelete(itemsToDelete);
  }, [state.deleteAlert, state.selectedRows, handleDelete]);
  
  const totalPages = useMemo(() => Math.ceil(totalCount / state.pagination.pageSize), [totalCount, state.pagination.pageSize]);

  if (isLoading) return <DataTableSkeleton />;

  return (
    <div className="space-y-4">
      <DataTableToolbar state={state} dispatch={dispatch} formOptions={formOptions} data={data} />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead className="w-12 sticky left-0 bg-white z-10">
                        <Checkbox
                            checked={data.length > 0 && state.selectedRows.size === data.length}
                            onCheckedChange={(checked) => dispatch({ type: 'TOGGLE_ALL_ROWS', payload: { data, checked: !!checked }})}
                        />
                  </TableHead>
                  <TableHead className="w-[50px]">No</TableHead>
                  <SortableHeader columnId="pemohon.nama" state={state} dispatch={dispatch}>Nama Pemohon</SortableHeader>
                  <TableHead>Alamat</TableHead>
                  <SortableHeader columnId="nama_hki" state={state} dispatch={dispatch}>Nama HKI</SortableHeader>
                  <TableHead>Jenis Produk</TableHead>
                  <SortableHeader columnId="jenis_hki.nama" state={state} dispatch={dispatch}>Jenis HKI</SortableHeader>
                  <SortableHeader columnId="status_hki.nama" state={state} dispatch={dispatch}>Status</SortableHeader>
                  <SortableHeader columnId="fasilitasi_tahun.tahun" state={state} dispatch={dispatch}>Tahun</SortableHeader>
                  <TableHead>Sertifikat</TableHead>
                  <SortableHeader columnId="pengusul.nama" state={state} dispatch={dispatch}>Pengusul</SortableHeader>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right sticky right-0 bg-white z-10">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length > 0 ? (
                  data.map((entry, index) => (
                    <DataTableRow 
                      key={entry.id}
                      entry={entry}
                      index={index}
                      state={state}
                      dispatch={dispatch}
                      onDownloadPDF={handleDownloadPDF}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={13} className="h-48 text-center">
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
        {totalPages > 0 && <DataTablePagination state={state} dispatch={dispatch} totalPages={totalPages} />}
      </Card>
      
      <AlertDialog open={state.deleteAlert.open} onOpenChange={() => dispatch({ type: 'HIDE_DELETE_ALERT' })}>
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
              <AlertDialogDescription>
                {state.deleteAlert.isBulk
                  ? `Anda yakin ingin menghapus ${state.selectedRows.size} entri HKI yang dipilih secara permanen? Aksi ini tidak dapat dibatalkan.`
                  : `Anda yakin ingin menghapus entri HKI untuk "${state.deleteAlert.entry?.nama_hki}" secara permanen? Aksi ini tidak dapat dibatalkan.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- SUB-COMPONENTS ---
// Sebaiknya semua sub-komponen di bawah ini dipisah ke file masing-masing
// Contoh: /components/data-table/toolbar.tsx

const getStatusBadge = (statusName?: string) => {
    const variants: Record<string, string> = {
      'Diterima': 'bg-green-100 text-green-800 border-green-200',
      'Didaftar': 'bg-blue-100 text-blue-800 border-blue-200',
      'Ditolak': 'bg-red-100 text-red-800 border-red-200',
      'Dalam Proses': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    }
    return variants[statusName ?? ''] || 'bg-gray-100 text-gray-800 border-gray-200'
}

function DataTableToolbar({ state, dispatch, formOptions, data }) {
    const router = useRouter();

    const handleFilterChange = (filterName: keyof State['filters'], value: string) => {
        dispatch({ type: 'SET_FILTER', payload: { filterName, value } });
    }

    const handleExportCSV = useCallback(() => {
        const headers = ["No", "Nama Pemohon", "Alamat", "Nama HKI", "Jenis Produk", "Jenis HKI", "Status", "Tahun", "Pengusul", "Keterangan"];
        const csvContent = [
          headers.join(','),
          ...data.map((entry, index) => [
            (state.pagination.page - 1) * state.pagination.pageSize + index + 1,
            `"${entry.pemohon?.nama || '-'}"`,
            `"${entry.pemohon?.alamat || '-'}"`,
            `"${entry.nama_hki}"`,
            `"${entry.jenis_produk || '-'}"`,
            `"${entry.jenis_hki?.nama || '-'}"`,
            `"${entry.status_hki?.nama || 'N/A'}"`,
            entry.fasilitasi_tahun?.tahun || '-',
            `"${entry.pengusul?.nama || '-'}"`,
            `"${entry.keterangan || '-'}"`
          ].join(','))
        ].join('\n');
     
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `hki_data_page_${state.pagination.page}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [data, state.pagination]);

    const activeFilters = useMemo(() => Object.entries(state.filters)
        .filter(([, value]) => value && value !== 'all')
        .map(([key, value]) => ({ key, value })), [state.filters]);
        
    return (
        <div className="p-4 bg-white rounded-lg border space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                    placeholder="Cari HKI, pemohon..."
                    value={state.filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="lg:col-span-2"
                />
                <Select value={state.filters.jenis} onValueChange={(v) => handleFilterChange('jenis', v)}>
                    <SelectTrigger><SelectValue placeholder="Semua Jenis HKI" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Jenis HKI</SelectItem>
                        {formOptions.jenisOptions.map(opt => <SelectItem key={opt.id} value={opt.nama}>{opt.nama}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={state.filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                    <SelectTrigger><SelectValue placeholder="Semua Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        {formOptions.statusOptions.map(opt => <SelectItem key={opt.id} value={opt.nama}>{opt.nama}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={state.filters.year} onValueChange={(v) => handleFilterChange('year', v)}>
                    <SelectTrigger><SelectValue placeholder="Semua Tahun" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Tahun</SelectItem>
                        {formOptions.tahunOptions.map(opt => <SelectItem key={opt.id} value={String(opt.tahun)}>{opt.tahun}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {state.selectedRows.size > 0 ? (
                        <>
                            <span className="text-sm text-muted-foreground">{state.selectedRows.size} dipilih</span>
                            <Button variant="destructive" size="sm" className="gap-2" onClick={() => dispatch({ type: 'SHOW_DELETE_ALERT', payload: { isBulk: true } })}>
                                <Trash2 className="h-4 w-4" /> Hapus Pilihan
                            </Button>
                        </>
                    ) : (
                        <Button variant="ghost" onClick={() => dispatch({ type: 'CLEAR_FILTERS' })} className="gap-2" disabled={activeFilters.length === 0}><X className="h-4 w-4" /> Bersihkan Filter</Button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV} disabled={data.length === 0}><FileDown className="h-4 w-4" /> Ekspor CSV</Button>
                    <Button className="gap-2" onClick={() => router.push('/hki/create')}><Plus className="h-4 w-4" /> Tambah</Button>
                </div>
            </div>
            {activeFilters.length > 0 && !state.selectedRows.size && (
                <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
                    <span className="text-sm font-medium">Filter Aktif:</span>
                    {activeFilters.map(({ key, value }) => (
                        <Badge key={key} variant="secondary" className="pl-2">
                            {value}
                            <button onClick={() => handleFilterChange(key as keyof State['filters'], '')} className="ml-1 p-0.5 rounded-full hover:bg-muted-foreground/20">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

function DataTableRow({ entry, index, state, dispatch, onDownloadPDF }) {
    return (
        <TableRow data-state={state.selectedRows.has(entry.id) ? "selected" : ""}>
            <TableCell className="sticky left-0 bg-white z-10">
                <Checkbox
                    checked={state.selectedRows.has(entry.id)}
                    onCheckedChange={(checked) => dispatch({ type: 'TOGGLE_ROW_SELECTION', payload: { id: entry.id, checked: !!checked } })}
                />
            </TableCell>
            <TableCell>{(state.pagination.page - 1) * state.pagination.pageSize + index + 1}</TableCell>
            <TableCell className="font-medium">{entry.pemohon?.nama || '-'}</TableCell>
            <TableCell>
                <TooltipProvider><Tooltip>
                    <TooltipTrigger asChild><p className="max-w-[200px] truncate">{entry.pemohon?.alamat || '-'}</p></TooltipTrigger>
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
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => onDownloadPDF(entry.id)}>
                        <Download className="h-3 w-3" /> Unduh
                    </Button>
                ) : (<span className="text-xs text-muted-foreground">Tidak ada</span>)}
            </TableCell>
            <TableCell>{entry.pengusul?.nama || '-'}</TableCell>
            <TableCell>
                <TooltipProvider><Tooltip>
                    <TooltipTrigger asChild><p className="max-w-[200px] truncate">{entry.keterangan || '-'}</p></TooltipTrigger>
                    <TooltipContent className="max-w-xs"><p>{entry.keterangan}</p></TooltipContent>
                </Tooltip></TooltipProvider>
            </TableCell>
            <TableCell className="text-right sticky right-0 bg-white z-10">
                <DataTableRowActions entry={entry} dispatch={dispatch} />
            </TableCell>
        </TableRow>
    )
}


function DataTableRowActions({ entry, dispatch }) {
    const router = useRouter();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/hki/${entry.id}`)}><Eye className="mr-2 h-4 w-4" /> Detail</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/hki/${entry.id}/edit`)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => dispatch({ type: 'SHOW_DELETE_ALERT', payload: { entry, isBulk: false } })}>
                    <Trash2 className="mr-2 h-4 w-4" /> Hapus
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function DataTablePagination({ state, dispatch, totalPages }) {
    return (
        <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Item per halaman:</p>
                <Select
                    value={String(state.pagination.pageSize)}
                    onValueChange={(value) => dispatch({ type: 'SET_PAGE_SIZE', payload: { pageSize: Number(value) }})}
                >
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {[10, 25, 50, 100].map(size => (
                            <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <p className="text-sm text-muted-foreground">Halaman {state.pagination.page} dari {totalPages}</p>
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious 
                            onClick={() => dispatch({ type: 'SET_PAGE', payload: { page: state.pagination.page - 1 }})}
                            className={state.pagination.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                        />
                    </PaginationItem>
                    <PaginationItem><span className="font-medium text-sm p-2">{state.pagination.page}</span></PaginationItem>
                    <PaginationItem>
                        <PaginationNext 
                            onClick={() => dispatch({ type: 'SET_PAGE', payload: { page: state.pagination.page + 1 }})}
                            className={state.pagination.page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </CardFooter>
    );
}

function SortableHeader({ columnId, children, state, dispatch }) {
    const isSorted = state.sort.sortBy === columnId;
    return (
        <TableHead onClick={() => dispatch({ type: 'SET_SORT', payload: { columnId }})} className="cursor-pointer select-none">
            <div className="flex items-center gap-2">
                {children}
                {isSorted ? (
                    state.sort.sortOrder === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4 transform rotate-180" />
                ) : <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />}
            </div>
        </TableHead>
    )
}

const DataTableSkeleton = () => (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded-lg border space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-10 lg:col-span-2" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(12)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(10)].map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {[...Array(12)].map((_, cellIndex) => (
                    <TableCell key={cellIndex}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="p-4 border-t flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-20" />
          </div>
        </CardFooter>
      </Card>
    </div>
);