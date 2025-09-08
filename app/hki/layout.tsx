import { Metadata } from 'next'
import { AdminLayout } from '@/components/layout/admin-layout'

export const metadata: Metadata = {
  title: 'Manajemen Pengajuan Data HKI | Dashboard',
  description: 'Manajemen Pengajuan Data Hak Kekayaan Intelektual',
}

export default function HKILayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  )
}
