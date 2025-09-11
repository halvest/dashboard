'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';

// Type for the table filters
export interface HKIFilters {
  search: string;
  jenisId: string;
  statusId: string;
  year: string;
  pengusulId: string;
}

// Default values for state
const DEFAULTS = {
  page: 1,
  pageSize: 10,
  sortBy: 'created_at',
  sortOrder: 'desc' as 'asc' | 'desc',
};

/**
 * A custom hook to manage the entire state and logic of a complex data table.
 * It handles filtering, pagination, sorting, and synchronization with URL search params.
 */
export function useDataTable(totalCount: number) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for filters
  const [filters, setFilters] = useState<HKIFilters>({
    search: searchParams.get('search') || '',
    jenisId: searchParams.get('jenisId') || '',
    statusId: searchParams.get('statusId') || '',
    year: searchParams.get('year') || '',
    pengusulId: searchParams.get('pengusulId') || '',
  });

  // State for pagination
  const [pagination, setPagination] = useState({
    page: Number(searchParams.get('page')) || DEFAULTS.page,
    pageSize: Number(searchParams.get('pageSize')) || DEFAULTS.pageSize,
  });

  // State for sorting
  const [sort, setSort] = useState({
    sortBy: searchParams.get('sortBy') || DEFAULTS.sortBy,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || DEFAULTS.sortOrder,
  });

  // State for selected rows (bulk actions)
  const [selectedRows, setSelectedRows] = useState(new Set<number>());
  
  const debouncedSearch = useDebounce(filters.search, 500);

  // Effect to sync state with the URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Helper function to build the URL parameters
    const updateParam = (key: string, value: any, defaultValue: any) => {
      if (value && value !== defaultValue) {
        params.set(key, String(value));
      } else {
        params.delete(key);
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
    
    // Only push to router if the query string has actually changed
    if (params.toString() !== searchParams.toString()) {
      router.push(`?${params.toString()}`, { scroll: false });
    }
  }, [debouncedSearch, filters, pagination, sort, router, searchParams]);

  // Memoized handlers for performance
  const handleSort = useCallback((columnId: string) => {
    if (!['created_at', 'nama_hki', 'tahun_fasilitasi'].includes(columnId)) return;
    setSort(s => ({
      sortBy: columnId,
      sortOrder: s.sortBy === columnId && s.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
    setPagination(p => ({ ...p, page: 1 }));
  }, []);

  const handleFilterChange = useCallback((filterName: keyof HKIFilters, value: string) => {
    setFilters(f => ({ ...f, [filterName]: value }));
    setPagination(p => ({ ...p, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', jenisId: '', statusId: '', year: '', pengusulId: '' });
    setPagination(p => ({ ...p, page: 1 }));
    setSort({ sortBy: DEFAULTS.sortBy, sortOrder: DEFAULTS.sortOrder });
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pagination.pageSize)), [
    totalCount,
    pagination.pageSize,
  ]);

  // Use useCallback to stabilize the setSelectedRows function reference
  const stableSetSelectedRows = useCallback(setSelectedRows, []);

  return {
    filters,
    pagination,
    sort,
    selectedRows,
    totalPages,
    setPagination,
    setSelectedRows: stableSetSelectedRows,
    handleSort,
    handleFilterChange,
    clearFilters,
  };
}