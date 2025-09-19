// app/components/hki/export-modal.tsx
'use client'

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HKIEntry, JenisHKI, StatusHKI } from '@/lib/types'
import {
  BookCheck,
  Building,
  CalendarDays,
  Loader2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

import { downloadFilteredExport } from '@/app/services/hki-service'
import { Combobox } from '@/components/ui/combobox'

type ComboboxOption = { value: string; label: string }
type FilterType = 'year' | 'pengusul' | 'status'
type ExportFormat = 'csv' | 'xlsx'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  formOptions: {
    tahunOptions: { tahun: number }[]
    pengusulOptions: ComboboxOption[]
    statusOptions: StatusHKI[]
  }
}

export function ExportModal({
  isOpen,
  onClose,
  formOptions,
}: ExportModalProps) {
  const [filterBy, setFilterBy] = useState<FilterType>('year')
  const [filterValue, setFilterValue] = useState<string>('')
  const [format, setFormat] = useState<ExportFormat>('xlsx')
  const [isExporting, setIsExporting] = useState(false)

  const pengusulOptions = useMemo(
    () => formOptions.pengusulOptions,
    [formOptions.pengusulOptions]
  )
  const statusOptions = useMemo(
    () => formOptions.statusOptions,
    [formOptions.statusOptions]
  )
  const tahunOptions = useMemo(
    () =>
      formOptions.tahunOptions.map((y) => ({
        value: String(y.tahun),
        label: String(y.tahun),
      })),
    [formOptions.tahunOptions]
  )

  const handleFilterTypeChange = (value: FilterType) => {
    setFilterBy(value)
    setFilterValue('')
  }

  const canExport = filterValue !== ''
  const handleExport = async () => {
    if (!canExport) return
    setIsExporting(true)

    const filters = {
      search: '',
      jenisId: '',
      statusId: filterBy === 'status' ? filterValue : '',
      year: filterBy === 'year' ? filterValue : '',
      pengusulId: filterBy === 'pengusul' ? filterValue : '',
    }

    const exportPromise = downloadFilteredExport({
      format,
      filters, 
    })

    toast.promise(exportPromise, {
      loading: 'Membuat file ekspor, mohon tunggu...',
      success: 'File berhasil diunduh! Proses dimulai di browser Anda.',
      error: (err) => err.message || 'Gagal mengekspor data.',
    })

    try {
      await exportPromise
      onClose()
    } catch (e) {
    } finally {
      setIsExporting(false)
    }
  }

  const renderFilterInput = () => {
    switch (filterBy) {
      case 'year':
        return (
          <Select value={filterValue} onValueChange={setFilterValue}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih tahun..." />
            </SelectTrigger>
            <SelectContent>
              {tahunOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'pengusul':
        return (
          <Combobox
            options={pengusulOptions}
            value={filterValue}
            onChange={setFilterValue}
            placeholder="Pilih OPD pengusul..."
            searchPlaceholder="Cari OPD..."
          />
        )
      case 'status':
        return (
          <Select value={filterValue} onValueChange={setFilterValue}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih status HKI..." />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.id_status} value={String(opt.id_status)}>
                  {opt.nama_status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Ekspor Data HKI</DialogTitle>
          <DialogDescription>
            Pilih kriteria dan format untuk mengunduh data.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="space-y-3">
            <Label className="font-semibold">1. Ekspor Berdasarkan</Label>
            <RadioGroup
              value={filterBy}
              onValueChange={(v: string) =>
                handleFilterTypeChange(v as FilterType)
              }
              className="grid grid-cols-3 gap-2"
            >
              {[
                { value: 'year', label: 'Tahun', icon: CalendarDays },
                { value: 'pengusul', label: 'Pengusul (OPD)', icon: Building },
                { value: 'status', label: 'Status', icon: BookCheck },
              ].map(({ value, label, icon: Icon }) => (
                <div key={value}>
                  <RadioGroupItem
                    value={value}
                    id={value}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={value}
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Icon className="mb-2 h-6 w-6" />
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label htmlFor="filter-value" className="font-semibold">
              2. Pilih Nilai Filter
            </Label>
            {renderFilterInput()}
          </div>

          <div className="space-y-3">
            <Label className="font-semibold">3. Pilih Format File</Label>
            <RadioGroup
              defaultValue="xlsx"
              value={format}
              onValueChange={(v: string) => setFormat(v as ExportFormat)}
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

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Batal
          </Button>
          <Button onClick={handleExport} disabled={!canExport || isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isExporting ? 'Memproses...' : 'Ekspor Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
