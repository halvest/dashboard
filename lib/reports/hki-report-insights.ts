// lib/reports/hki-report-insights.ts
import type {
  HKIReportSummary,
  ReportFilters,
  ReportInsights,
  ByYearItem,
} from './hki-report-types'

/** Helper: ambil item dengan nilai total tertinggi */
export function getTopItem<T extends { total: number }>(
  items: T[]
): T | null {
  if (!items || items.length === 0) return null
  return items.reduce((top, item) => (item.total > top.total ? item : top), items[0])
}

/** Format angka dalam format Bahasa Indonesia */
function formatNumber(n: number): string {
  return n.toLocaleString('id-ID')
}

/** Hitung tren: apakah pengajuan naik atau turun di tahun terakhir */
function getTrend(byYear: ByYearItem[]): 'naik' | 'turun' | 'stabil' | 'tidak_cukup' {
  if (byYear.length < 2) return 'tidak_cukup'
  const sorted = [...byYear].sort((a, b) => a.tahun - b.tahun)
  const last = sorted[sorted.length - 1]
  const prev = sorted[sorted.length - 2]
  if (last.total > prev.total) return 'naik'
  if (last.total < prev.total) return 'turun'
  return 'stabil'
}

export function generateTrendInsight(summary: HKIReportSummary, filters: ReportFilters): string {
  const { by_year, total_pengajuan } = summary

  if (by_year.length === 0) {
    return 'Tidak terdapat data pengajuan HKI untuk periode yang dipilih.'
  }

  const topYear = getTopItem(by_year)
  const filterDesc = filters.year ? `tahun ${filters.year}` : 'seluruh periode'
  const trend = getTrend(by_year)

  let trendText = ''
  if (trend === 'naik') {
    const sorted = [...by_year].sort((a, b) => a.tahun - b.tahun)
    const last = sorted[sorted.length - 1]
    const prev = sorted[sorted.length - 2]
    const selisih = last.total - prev.total
    trendText = ` Terdapat peningkatan sebesar ${formatNumber(selisih)} pengajuan dari tahun ${prev.tahun} ke tahun ${last.tahun}.`
  } else if (trend === 'turun') {
    const sorted = [...by_year].sort((a, b) => a.tahun - b.tahun)
    const last = sorted[sorted.length - 1]
    const prev = sorted[sorted.length - 2]
    const selisih = prev.total - last.total
    trendText = ` Terdapat penurunan sebesar ${formatNumber(selisih)} pengajuan dari tahun ${prev.tahun} ke tahun ${last.tahun}.`
  } else if (trend === 'stabil') {
    trendText = ' Jumlah pengajuan relatif stabil dibandingkan tahun sebelumnya.'
  }

  return `Total ${formatNumber(total_pengajuan)} pengajuan HKI tercatat untuk ${filterDesc}.${topYear ? ` Tahun dengan pengajuan terbanyak adalah ${topYear.tahun} dengan ${formatNumber(topYear.total)} data.` : ''}${trendText}`
}

export function generateStatusInsight(summary: HKIReportSummary): string {
  const { by_status } = summary
  const topStatus = getTopItem(by_status)
  if (!topStatus || topStatus.total === 0) {
    return 'Belum terdapat data distribusi status pengajuan HKI.'
  }
  const total = by_status.reduce((s, i) => s + i.total, 0)
  const persen = total > 0 ? Math.round((topStatus.total / total) * 100) : 0
  return `Status yang paling dominan adalah "${topStatus.nama_status}" dengan ${formatNumber(topStatus.total)} pengajuan (${persen}% dari total). ${
    topStatus.nama_status.toLowerCase().includes('proses') ||
    topStatus.nama_status.toLowerCase().includes('diajukan')
      ? 'Masih terdapat pengajuan yang sedang dalam proses dan membutuhkan tindak lanjut segera.'
      : 'Sebagian besar pengajuan telah mencapai tahap akhir penyelesaian.'
  }`
}

export function generateJenisInsight(summary: HKIReportSummary): string {
  const { by_jenis_hki } = summary
  const topJenis = getTopItem(by_jenis_hki)
  if (!topJenis || topJenis.total === 0) {
    return 'Belum terdapat data distribusi jenis HKI.'
  }
  return `Jenis HKI yang paling banyak diajukan adalah "${topJenis.nama_jenis_hki}" dengan ${formatNumber(topJenis.total)} pengajuan. Hal ini mengindikasikan fokus utama kegiatan fasilitasi HKI di Kabupaten Sleman.`
}

export function generatePengusulInsight(summary: HKIReportSummary): string {
  const { by_pengusul } = summary
  const topPengusul = getTopItem(by_pengusul)
  if (!topPengusul || topPengusul.total === 0) {
    return 'Belum terdapat data pengusul HKI.'
  }
  const activeCount = by_pengusul.filter((p) => p.total > 0).length
  return `Pengusul paling aktif adalah "${topPengusul.nama_opd}" dengan ${formatNumber(topPengusul.total)} pengajuan. Dari ${by_pengusul.length} pengusul yang terdaftar, sebanyak ${activeCount} pengusul memiliki data pengajuan aktif.`
}

export function generateConclusion(summary: HKIReportSummary, filters: ReportFilters): string {
  const { total_pengajuan, by_status, by_year } = summary
  const topStatus = getTopItem(by_status)
  const topYear = getTopItem(by_year)
  const filterDesc = filters.year ? `tahun ${filters.year}` : 'seluruh periode yang tercatat'
  const statusDesc = topStatus && topStatus.total > 0 ? `Status yang paling dominan adalah "${topStatus.nama_status}"` : 'belum terdapat data status yang signifikan'
  const tahunDesc = topYear ? `pengajuan terbanyak terjadi pada tahun ${topYear.tahun} dengan ${formatNumber(topYear.total)} entri` : 'data tahunan belum tersedia'

  const belumSelesaiCount = by_status
    .filter((s) => s.nama_status.toLowerCase().includes('proses') || s.nama_status.toLowerCase().includes('diajukan'))
    .reduce((sum, s) => sum + s.total, 0)

  const monitoringNote =
    belumSelesaiCount > 0
      ? ` Terdapat ${formatNumber(belumSelesaiCount)} pengajuan yang masih dalam proses dan memerlukan pemantauan berkelanjutan agar dapat ditindaklanjuti secara tepat waktu.`
      : ' Seluruh pengajuan yang tercatat telah diproses dengan baik.'

  return `Berdasarkan data pengajuan HKI yang dianalisis untuk ${filterDesc}, jumlah pengajuan tercatat sebanyak ${formatNumber(total_pengajuan)} data. ${statusDesc}, sementara ${tahunDesc}. Hal ini menunjukkan bahwa kegiatan fasilitasi Hak Kekayaan Intelektual di Kabupaten Sleman telah berjalan dengan cukup aktif.${monitoringNote}`
}

export function generateRecommendations(summary: HKIReportSummary): string[] {
  const recommendations: string[] = []
  const { by_status, by_pengusul, by_year, total_pengajuan } = summary

  const belumSelesai = by_status.filter(
    (s) => s.nama_status.toLowerCase().includes('proses') || s.nama_status.toLowerCase().includes('diajukan')
  )
  if (belumSelesai.length > 0 && belumSelesai.reduce((s, i) => s + i.total, 0) > 0) {
    recommendations.push('Melakukan monitoring berkala dan tindak lanjut terhadap pengajuan HKI yang masih berstatus dalam proses atau belum selesai.')
  }

  const activePengusul = by_pengusul.filter((p) => p.total > 0)
  const inactivePengusul = by_pengusul.filter((p) => p.total === 0)
  if (inactivePengusul.length > 0) {
    recommendations.push(`Mengoptimalkan sosialisasi dan pendampingan kepada ${inactivePengusul.length} pengusul/OPD yang belum memiliki pengajuan HKI agar partisipasi lebih merata.`)
  } else if (activePengusul.length > 1) {
    const topPengusul = getTopItem(by_pengusul)
    const totalPengusulSubmissions = by_pengusul.reduce((s, p) => s + p.total, 0)
    if (topPengusul && totalPengusulSubmissions > 0 && topPengusul.total / totalPengusulSubmissions > 0.5) {
      recommendations.push(`Mendorong pemerataan pengajuan HKI ke seluruh OPD karena saat ini pengajuan masih didominasi oleh satu pengusul (${topPengusul.nama_opd}).`)
    }
  }

  if (by_year.length >= 2) {
    recommendations.push('Melakukan evaluasi tren tahunan pengajuan HKI sebagai dasar perencanaan program fasilitasi pada tahun-tahun berikutnya.')
  }

  if (total_pengajuan < 50) {
    recommendations.push('Meningkatkan program pendampingan dan sosialisasi pengajuan HKI kepada masyarakat dan pelaku usaha di Kabupaten Sleman untuk mendorong pertumbuhan jumlah pengajuan.')
  }

  recommendations.push('Menyusun rekap laporan berkala (bulanan/triwulanan) sebagai bahan pelaporan kepada pimpinan dan mendukung fungsi koordinasi Bidang Litbang dan Inovasi.')

  return recommendations
}

export function generateAllInsights(
  summary: HKIReportSummary,
  filters: ReportFilters
): ReportInsights {
  return {
    trendInsight: generateTrendInsight(summary, filters),
    statusInsight: generateStatusInsight(summary),
    jenisInsight: generateJenisInsight(summary),
    pengusulInsight: generatePengusulInsight(summary),
    conclusion: generateConclusion(summary, filters),
    recommendations: generateRecommendations(summary),
  }
}
