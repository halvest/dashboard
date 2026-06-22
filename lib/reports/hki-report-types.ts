// lib/reports/hki-report-types.ts

/**
 * Tipe untuk satu item agregat (misal: per tahun, per status, dll)
 */
export interface AggregateItem {
  total: number
}

export interface ByYearItem extends AggregateItem {
  tahun: number
}

export interface ByStatusItem extends AggregateItem {
  id_status: number
  nama_status: string
}

export interface ByJenisItem extends AggregateItem {
  id_jenis_hki: number
  nama_jenis_hki: string
}

export interface ByPengusulItem extends AggregateItem {
  id_pengusul: number
  nama_opd: string
}

/**
 * Tipe utama untuk data ringkasan laporan yang dikembalikan oleh RPC
 */
export interface HKIReportSummary {
  total_pengajuan: number
  by_year: ByYearItem[]
  by_status: ByStatusItem[]
  by_jenis_hki: ByJenisItem[]
  by_pengusul: ByPengusulItem[]
}

/**
 * Tipe untuk filter aktif yang digunakan di halaman laporan
 */
export interface ReportFilters {
  year: number | null
  statusId: number | null
  statusName: string | null
}

/**
 * Tipe untuk teks insight yang di-generate otomatis
 */
export interface ReportInsights {
  trendInsight: string
  statusInsight: string
  jenisInsight: string
  pengusulInsight: string
  conclusion: string
  recommendations: string[]
}

/**
 * Tipe untuk opsi filter yang ditampilkan di UI
 */
export interface ReportFilterOptions {
  tahunOptions: number[]
  statusOptions: { id_status: number; nama_status: string }[]
}
