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
    return 'Tidak terdapat akumulasi data pengajuan HKI pada periode yang ditinjau.'
  }

  const topYear = getTopItem(by_year)
  const filterDesc = filters.year ? `Tahun Anggaran ${filters.year}` : 'akumulasi seluruh periode'
  const trend = getTrend(by_year)

  let trendText = ''
  if (trend === 'naik') {
    const sorted = [...by_year].sort((a, b) => a.tahun - b.tahun)
    const last = sorted[sorted.length - 1]
    const prev = sorted[sorted.length - 2]
    const selisih = last.total - prev.total
    trendText = ` Terpantau adanya eskalasi capaian sebesar ${formatNumber(selisih)} pengajuan dari tahun ${prev.tahun} ke tahun ${last.tahun}.`
  } else if (trend === 'turun') {
    const sorted = [...by_year].sort((a, b) => a.tahun - b.tahun)
    const last = sorted[sorted.length - 1]
    const prev = sorted[sorted.length - 2]
    const selisih = prev.total - last.total
    trendText = ` Terpantau adanya penurunan capaian sebesar ${formatNumber(selisih)} pengajuan dari tahun ${prev.tahun} ke tahun ${last.tahun}.`
  } else if (trend === 'stabil') {
    trendText = ' Tingkat pengajuan terpantau stabil secara fluktuatif dibandingkan tahun sebelumnya.'
  }

  return `Secara kumulatif, tercatat ${formatNumber(total_pengajuan)} pengajuan HKI untuk ${filterDesc}.${topYear ? ` Puncak intensitas pengajuan direpresentasikan pada tahun ${topYear.tahun} dengan total capaian ${formatNumber(topYear.total)} berkas.` : ''}${trendText}`
}

export function generateStatusInsight(summary: HKIReportSummary): string {
  const { by_status } = summary
  const topStatus = getTopItem(by_status)
  if (!topStatus || topStatus.total === 0) {
    return 'Belum terdapat data rekapitulasi distribusi status pengajuan HKI.'
  }
  const total = by_status.reduce((s, i) => s + i.total, 0)
  const persen = total > 0 ? Math.round((topStatus.total / total) * 100) : 0
  return `Status administrasi yang mendominasi portofolio adalah "${topStatus.nama_status}" dengan proporsi ${formatNumber(topStatus.total)} pengajuan (${persen}% dari total). ${
    topStatus.nama_status.toLowerCase().includes('proses') ||
    topStatus.nama_status.toLowerCase().includes('diajukan')
      ? 'Hal ini mengindikasikan terdapat residu pengajuan yang masih dalam proses evaluasi dan menuntut akselerasi tindak lanjut segera.'
      : 'Hal ini merepresentasikan bahwa mayoritas berkas pengajuan telah tuntas hingga tahap finalisasi.'
  }`
}

export function generateJenisInsight(summary: HKIReportSummary): string {
  const { by_jenis_hki } = summary
  const topJenis = getTopItem(by_jenis_hki)
  if (!topJenis || topJenis.total === 0) {
    return 'Belum terdapat data distribusi jenis HKI pada database.'
  }
  return `Kategori HKI dengan tingkat urgensi tertinggi yang diajukan adalah "${topJenis.nama_jenis_hki}" mencapai ${formatNumber(topJenis.total)} pengajuan. Indikator ini mendefinisikan fokus arah kegiatan fasilitasi kekayaan intelektual di lingkup Pemerintah Kabupaten Sleman.`
}

export function generatePengusulInsight(summary: HKIReportSummary): string {
  const { by_pengusul } = summary
  const topPengusul = getTopItem(by_pengusul)
  if (!topPengusul || topPengusul.total === 0) {
    return 'Belum terdapat data entitas pengusul HKI.'
  }
  const activeCount = by_pengusul.filter((p) => p.total > 0).length
  return `Entitas pengusul paling proaktif pada periode ini dipegang oleh "${topPengusul.nama_opd}" dengan volume ${formatNumber(topPengusul.total)} pengajuan. Dari total ${by_pengusul.length} entitas (OPD/Instansi) yang terekapitulasi, sebanyak ${activeCount} entitas tercatat menorehkan partisipasi aktif.`
}

export function generateConclusion(summary: HKIReportSummary, filters: ReportFilters): string {
  const { total_pengajuan, by_status, by_year } = summary
  const topStatus = getTopItem(by_status)
  const topYear = getTopItem(by_year)
  const filterDesc = filters.year ? `Tahun Anggaran ${filters.year}` : 'keseluruhan tahun pelaporan'
  const statusDesc = topStatus && topStatus.total > 0 ? `Status administratif pengajuan terpusat secara signifikan pada tahap "${topStatus.nama_status}"` : 'belum terdapat kecenderungan status yang signifikan'
  const tahunDesc = topYear ? `fluktuasi tertinggi tercatat pada tahun ${topYear.tahun} (mengakomodir ${formatNumber(topYear.total)} entri)` : 'rekapitulasi data historis tahunan belum memadai'

  const belumSelesaiCount = by_status
    .filter((s) => s.nama_status.toLowerCase().includes('proses') || s.nama_status.toLowerCase().includes('diajukan'))
    .reduce((sum, s) => sum + s.total, 0)

  const monitoringNote =
    belumSelesaiCount > 0
      ? ` Terdapat sisa beban kerja (backlog) sebanyak ${formatNumber(belumSelesaiCount)} pengajuan yang berada pada fase progresif dan sangat memerlukan pengawasan (monitoring) komprehensif agar tahapan penyelesaian dapat diakselerasi sesuai standar waktu yang ditetapkan.`
      : ' Secara keseluruhan, instrumen pelayanan fasilitasi yang masuk telah dieksekusi dengan tingkat penyelesaian yang optimal.'

  return `Berdasarkan hasil rekapitulasi data analitik fasilitasi HKI untuk ${filterDesc}, telah direkam capaian kumulatif sebanyak ${formatNumber(total_pengajuan)} data pengajuan. ${statusDesc}, sementara dari sisi temporalitas, ${tahunDesc}. Konklusi logis dari indikator-indikator tersebut menunjukan bahwa implementasi program fasilitasi Hak Kekayaan Intelektual di wilayah Kabupaten Sleman telah terlaksana dengan determinasi tinggi dan performa yang proaktif.${monitoringNote}`
}

export function generateRecommendations(summary: HKIReportSummary): string[] {
  const recommendations: string[] = []
  const { by_status, by_pengusul, by_year, total_pengajuan } = summary

  const belumSelesai = by_status.filter(
    (s) => s.nama_status.toLowerCase().includes('proses') || s.nama_status.toLowerCase().includes('diajukan')
  )
  if (belumSelesai.length > 0 && belumSelesai.reduce((s, i) => s + i.total, 0) > 0) {
    recommendations.push('Menyelenggarakan fungsi pengawasan (monitoring) berkelanjutan dan mengeksekusi percepatan tindak lanjut administratif terhadap berkas HKI yang saat ini masih terhambat dalam proses pendaftaran.')
  }

  const activePengusul = by_pengusul.filter((p) => p.total > 0)
  const inactivePengusul = by_pengusul.filter((p) => p.total === 0)
  if (inactivePengusul.length > 0) {
    recommendations.push(`Mengintensifkan upaya sosialisasi, advokasi, dan pendampingan teknis secara persuasif kepada ${inactivePengusul.length} entitas OPD/Instansi yang belum mendaftarkan diri guna mewujudkan asas pemerataan inovasi daerah.`)
  } else if (activePengusul.length > 1) {
    const topPengusul = getTopItem(by_pengusul)
    const totalPengusulSubmissions = by_pengusul.reduce((s, p) => s + p.total, 0)
    if (topPengusul && totalPengusulSubmissions > 0 && topPengusul.total / totalPengusulSubmissions > 0.5) {
      recommendations.push(`Mendorong distribusi kuota fasilitasi HKI secara lebih proporsional ke seluruh OPD terkait, menimbang bahwasanya realisasi pengajuan pada periode saat ini masih didominasi kuat oleh partisipasi tunggal dari ${topPengusul.nama_opd}.`)
    }
  }

  if (by_year.length >= 2) {
    recommendations.push('Melaksanakan kajian dan evaluasi tren fluktuasi tahunan sebagai landasan empiris dalam merumuskan kebijakan serta penyusunan Rencana Kerja Anggaran (RKA) program fasilitasi di tahun-tahun berikutnya.')
  }

  if (total_pengajuan < 50) {
    recommendations.push('Memperluas cakupan program diseminasi informasi dan bimbingan teknis HKI secara komprehensif kepada target masyarakat dan elemen pelaku bisnis lokal guna mendongkrak capaian kuantitas pengajuan.')
  }

  recommendations.push('Menyusun rekapitulasi laporan progres secara periodik (bulanan/triwulanan) sebagai instrumen pelaporan formal kepada Pimpinan Daerah dan fasilitasi fungsi koordinasi strategis di Bidang Penelitian, Pengembangan, dan Inovasi.')

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
