// lib/reports/hki-report-pdf.tsx
import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { HKIReportSummary, ReportFilters, ReportInsights } from './hki-report-types'
import { getTopItem } from './hki-report-insights'

// Gunakan font bawaan tanpa registrasi eksternal agar kompatibel dengan serverless
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  // --- Header ---
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    borderBottomStyle: 'solid',
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#374151',
    marginTop: 2,
  },
  headerDate: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 4,
  },
  // --- Section ---
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
    borderBottomStyle: 'solid',
  },
  // --- Filter Info ---
  filterRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 4,
  },
  filterItem: {
    flexDirection: 'row',
    gap: 4,
  },
  filterLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  filterValue: {
    color: '#1d4ed8',
  },
  // --- Stats Grid ---
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '18%',
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderStyle: 'solid',
  },
  statLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
  },
  statSub: {
    fontSize: 8,
    color: '#374151',
    marginTop: 1,
  },
  // --- Table ---
  table: {
    width: '100%',
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    padding: '5 8',
    borderRadius: 2,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '4 8',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  // --- Text ---
  bodyText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#374151',
    textAlign: 'justify',
  },
  insightItem: {
    marginBottom: 6,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#3b82f6',
    borderLeftStyle: 'solid',
  },
  recommendation: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 4,
  },
  recNumber: {
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    minWidth: 16,
  },
  recText: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  colNo: { width: '6%' },
  colNama: { flex: 1 },
  colTotal: { width: '20%', textAlign: 'right' },
})

interface HKIReportPDFProps {
  summary: HKIReportSummary
  insights: ReportInsights
  filters: ReportFilters
  generatedAt: string
}

function formatIDN(n: number): string {
  return n.toLocaleString('id-ID')
}

export function HKIReportPDF({
  summary,
  insights,
  filters,
  generatedAt,
}: HKIReportPDFProps) {
  const topStatus = getTopItem(summary.by_status)
  const topYear = getTopItem(summary.by_year)
  const topJenis = getTopItem(summary.by_jenis_hki)

  return (
    <Document
      title="Laporan Data Pengajuan HKI"
      author="Dashboard Admin Internal Bappeda Kabupaten Sleman"
      creator="Sistem Manajemen HKI"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Laporan Data Pengajuan Hak Kekayaan Intelektual
          </Text>
          <Text style={styles.headerSubtitle}>
            Dashboard Admin Internal – Bappeda Kabupaten Sleman
          </Text>
          <Text style={styles.headerDate}>Digenerate pada: {generatedAt}</Text>
        </View>

        {/* Filter Aktif */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Filter Laporan</Text>
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Tahun Fasilitasi:</Text>
              <Text style={styles.filterValue}>
                {filters.year ? String(filters.year) : 'Semua Tahun'}
              </Text>
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Status HKI:</Text>
              <Text style={styles.filterValue}>
                {filters.statusName ?? 'Semua Status'}
              </Text>
            </View>
          </View>
        </View>

        {/* Ringkasan Statistik */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Statistik</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Pengajuan</Text>
              <Text style={styles.statValue}>{formatIDN(summary.total_pengajuan)}</Text>
              <Text style={styles.statSub}>Entri data</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Status Dominan</Text>
              <Text style={[styles.statValue, { fontSize: 10 }]}>
                {topStatus?.nama_status ?? '-'}
              </Text>
              <Text style={styles.statSub}>{topStatus ? formatIDN(topStatus.total) + ' pengajuan' : ''}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Tahun Terbanyak</Text>
              <Text style={styles.statValue}>{topYear?.tahun ?? '-'}</Text>
              <Text style={styles.statSub}>{topYear ? formatIDN(topYear.total) + ' pengajuan' : ''}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Jenis Terbanyak</Text>
              <Text style={[styles.statValue, { fontSize: 9 }]}>
                {topJenis?.nama_jenis_hki ?? '-'}
              </Text>
              <Text style={styles.statSub}>{topJenis ? formatIDN(topJenis.total) + ' pengajuan' : ''}</Text>
            </View>
          </View>
        </View>

        {/* Tabel Per Tahun */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribusi Pengajuan per Tahun</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colNo]}>No</Text>
              <Text style={[styles.tableHeaderCell, styles.colNama]}>Tahun Fasilitasi</Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>Jumlah</Text>
            </View>
            {summary.by_year.sort((a, b) => b.tahun - a.tahun).map((row, i) => (
              <View
                key={row.tahun}
                style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCell, styles.colNo]}>{i + 1}</Text>
                <Text style={[styles.tableCell, styles.colNama]}>{row.tahun}</Text>
                <Text style={[styles.tableCellBold, styles.colTotal]}>{formatIDN(row.total)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tabel Per Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribusi Pengajuan per Status</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colNo]}>No</Text>
              <Text style={[styles.tableHeaderCell, styles.colNama]}>Status HKI</Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>Jumlah</Text>
            </View>
            {summary.by_status.map((row, i) => (
              <View
                key={row.id_status}
                style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCell, styles.colNo]}>{i + 1}</Text>
                <Text style={[styles.tableCell, styles.colNama]}>{row.nama_status}</Text>
                <Text style={[styles.tableCellBold, styles.colTotal]}>{formatIDN(row.total)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tabel Per Jenis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribusi Pengajuan per Jenis HKI</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colNo]}>No</Text>
              <Text style={[styles.tableHeaderCell, styles.colNama]}>Jenis HKI</Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>Jumlah</Text>
            </View>
            {summary.by_jenis_hki.map((row, i) => (
              <View
                key={row.id_jenis_hki}
                style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCell, styles.colNo]}>{i + 1}</Text>
                <Text style={[styles.tableCell, styles.colNama]}>{row.nama_jenis_hki}</Text>
                <Text style={[styles.tableCellBold, styles.colTotal]}>{formatIDN(row.total)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Laporan HKI – Bappeda Kabupaten Sleman
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Halaman ${pageNumber} dari ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* Halaman 2: Pengusul & Insight */}
      <Page size="A4" style={styles.page}>
        {/* Tabel Per Pengusul */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribusi Pengajuan per Pengusul (OPD)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colNo]}>No</Text>
              <Text style={[styles.tableHeaderCell, styles.colNama]}>Nama OPD / Pengusul</Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>Jumlah</Text>
            </View>
            {summary.by_pengusul.filter((p) => p.total > 0).map((row, i) => (
              <View
                key={row.id_pengusul}
                style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCell, styles.colNo]}>{i + 1}</Text>
                <Text style={[styles.tableCell, styles.colNama]}>{row.nama_opd}</Text>
                <Text style={[styles.tableCellBold, styles.colTotal]}>{formatIDN(row.total)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Insight Otomatis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insight Analitis Otomatis</Text>
          <View style={[styles.insightItem, { marginBottom: 8 }]}>
            <Text style={styles.bodyText}>{insights.trendInsight}</Text>
          </View>
          <View style={[styles.insightItem, { marginBottom: 8 }]}>
            <Text style={styles.bodyText}>{insights.statusInsight}</Text>
          </View>
          <View style={[styles.insightItem, { marginBottom: 8 }]}>
            <Text style={styles.bodyText}>{insights.jenisInsight}</Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.bodyText}>{insights.pengusulInsight}</Text>
          </View>
        </View>

        {/* Kesimpulan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kesimpulan</Text>
          <Text style={styles.bodyText}>{insights.conclusion}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Laporan HKI – Bappeda Kabupaten Sleman
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Halaman ${pageNumber} dari ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
