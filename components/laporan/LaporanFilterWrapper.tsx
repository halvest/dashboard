// components/laporan/LaporanFilterWrapper.tsx
import { getReportFilterOptions } from '@/lib/reports/hki-report-service'
import { LaporanFilter } from './LaporanFilter'

interface LaporanFilterWrapperProps {
  rawYear: string | undefined
  rawStatus: string | undefined
}

export async function LaporanFilterWrapper({ rawYear, rawStatus }: LaporanFilterWrapperProps) {
  let filterOptions

  try {
    filterOptions = await getReportFilterOptions()
  } catch (err) {
    // Fallback if fetch fails
    filterOptions = { tahunOptions: [], statusOptions: [] }
  }

  return (
    <LaporanFilter
      options={filterOptions}
      currentYear={rawYear ?? 'all'}
      currentStatusId={rawStatus ?? 'all'}
    />
  )
}
