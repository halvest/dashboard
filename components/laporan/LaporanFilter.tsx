'use client'

// components/laporan/LaporanFilter.tsx
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CalendarDays, BookCheck, X } from 'lucide-react'
import type { ReportFilterOptions } from '@/lib/reports/hki-report-types'

interface LaporanFilterProps {
  options: ReportFilterOptions
  currentYear: string
  currentStatusId: string
}

export function LaporanFilter({
  options,
  currentYear,
  currentStatusId,
}: LaporanFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isFiltered = currentYear !== 'all' || currentStatusId !== 'all'

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const resetFilters = useCallback(() => {
    router.push(pathname)
  }, [router, pathname])

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Filter Tahun */}
      <Select
        value={currentYear}
        onValueChange={(v) => updateFilter('year', v)}
      >
        <SelectTrigger className="h-10 w-full sm:w-[180px]">
          <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Semua Tahun" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Tahun</SelectItem>
          {options.tahunOptions.map((tahun) => (
            <SelectItem key={tahun} value={String(tahun)}>
              {tahun}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filter Status */}
      <Select
        value={currentStatusId}
        onValueChange={(v) => updateFilter('status', v)}
      >
        <SelectTrigger className="h-10 w-full sm:w-[200px]">
          <BookCheck className="mr-2 h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Semua Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          {options.statusOptions.map((s) => (
            <SelectItem key={s.id_status} value={String(s.id_status)}>
              {s.nama_status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tombol Reset */}
      {isFiltered && (
        <Button
          variant="ghost"
          onClick={resetFilters}
          className="gap-2 text-muted-foreground hover:text-foreground h-10"
        >
          <X className="h-4 w-4" />
          Reset Filter
        </Button>
      )}
    </div>
  )
}
