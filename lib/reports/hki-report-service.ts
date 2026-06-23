// lib/reports/hki-report-service.ts
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import type { HKIReportSummary, ReportFilterOptions } from './hki-report-types'

/**
 * Mengambil data ringkasan laporan dari RPC Supabase.
 * Semua agregasi dilakukan di level database untuk efisiensi maksimal.
 */
export async function getHKIReportSummary(
  year: number | null,
  statusId: number | null
): Promise<HKIReportSummary> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_hki_report_summary', {
    p_year: year,
    p_status_id: statusId,
  })

  if (error) {
    throw new Error(`Gagal memuat data laporan: ${error.message}`)
  }

  if (!data) {
    throw new Error('RPC tidak mengembalikan data laporan.')
  }

  // RPC mengembalikan JSON, kita cast dengan aman
  const result = data as unknown as HKIReportSummary

  return {
    total_pengajuan: result.total_pengajuan ?? 0,
    by_year: result.by_year ?? [],
    by_status: result.by_status ?? [],
    by_jenis_hki: result.by_jenis_hki ?? [],
    by_pengusul: result.by_pengusul ?? [],
  }
}

/**
 * Mengambil opsi filter (tahun dan status) untuk ditampilkan di UI.
 * Data ini tidak bergantung pada filter aktif.
 */
export async function getReportFilterOptions(): Promise<ReportFilterOptions> {
  const supabase = await createClient()

  const [yearsResult, statusResult] = await Promise.all([
    supabase
      .from('hki')
      .select('tahun_fasilitasi')
      .not('tahun_fasilitasi', 'is', null)
      .order('tahun_fasilitasi', { ascending: false }),
    supabase.from('status_hki').select('id_status, nama_status').order('nama_status'),
  ])

  // Deduplikasi tahun karena query select biasa bisa return banyak baris
  const allYears = yearsResult.data
    ?.map((row: { tahun_fasilitasi: number | null }) => row.tahun_fasilitasi)
    .filter((t): t is number => t !== null) ?? []

  const tahunOptions: number[] = [...new Set(allYears)].sort((a, b) => b - a)

  const statusOptions = statusResult.data ?? []

  return { tahunOptions, statusOptions }
}
